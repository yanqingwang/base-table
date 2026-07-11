以下是两部分完整报告：**Part A** 布局状态机详细设计（附录 E，R-UI-1 的解药）；**Part B** 全里程碑 AI 代理任务分解清单（M0–M8，可直接开工）。

---

# Part A · 附录 E：标签页/分屏布局状态机 详细设计规格

> 版本 v1.0 | 实现语言：TypeScript（100% 前端纯函数）| 消费方：M3 全部 UI 任务
> 核心思想：**布局 = 一棵可序列化的树 + 一个纯 reducer + 一组不变量**。所有 UI 只是树的投影，所有交互只是 action。

## A1. 架构原则

1. **纯函数 reducer**：`(state, action) → state`，无副作用，可表驱动测试、可 fuzz、可时间旅行调试
2. **规范形（canonical form）**：每次转移后强制 `normalize()`，不变量由构造保证而非散落在各处 if
3. **状态机在前端**：布局是纯 UI 关注点，放前端零 IPC 延迟；Rust 侧只做 workspace.json 读写 + 文件事件推送
4. **序列化即真值**：内存态与磁盘态同构，崩溃恢复 = 反序列化

## A2. 数据模型

```typescript
type NodeId = string;                        // nanoid(10)

interface WorkspaceState {
  version: 1;
  main: LayoutNode;                          // 主区域布局树
  leftSidebar: SidebarState;
  rightSidebar: SidebarState;
  focusedGroupId: NodeId;
  closedTabHistory: ClosedTabRecord[];       // 栈，上限 50（I8）
}

type LayoutNode = SplitNode | TabGroupNode;

interface SplitNode {
  type: 'split';
  id: NodeId;
  direction: 'row' | 'column';               // row=水平排列（垂直分割线）
  children: LayoutNode[];                    // 长度 ≥ 2（I2）
  weights: number[];                         // 与 children 等长，和=1（I4）
}

interface TabGroupNode {
  type: 'group';
  id: NodeId;
  tabs: Tab[];
  activeIndex: number;                       // 空组时 -1（I5）
}

interface Tab { id: NodeId; view: ViewState; pinned: boolean; }

type ViewState =
  | { kind: 'markdown'; path: string; mode: 'source'|'live'|'reading';
      scroll: number; cursor: { line: number; ch: number } | null }
  | { kind: 'missing-file'; originalPath: string }   // 文件被删后的占位
  | { kind: 'graph'; scope: 'global'|'local'; filters: unknown }
  | { kind: 'plugin'; pluginId: string; viewType: string; state: unknown }
  | { kind: 'empty' };                                // 新标签页占位

interface SidebarState {
  collapsed: boolean;
  widthPx: number;                           // clamp [200, 600]
  activePanel: string;                       // 面板注册 id
}

interface ClosedTabRecord {
  tab: Tab;
  groupPath: number[];                       // 原组在树中的位置路径（child index 序列）
  tabIndex: number;
  closedAt: number;
}
```

## A3. 不变量（每次转移后 normalize 强制恢复）

| ID | 不变量 | 违反时的修复动作 |
|----|--------|-----------------|
| I1 | `main` 恒存在，且树中至少有一个 group | 全空 → 重置为单个空 group（`kind:'empty'` 占位 tab 可选） |
| I2 | 每个 split 的 `children.length ≥ 2` | 仅剩 1 → 子节点上提替换该 split；为 0 → 移除该 split |
| I3 | **无同向嵌套**：split 的子 split 方向必不同于父 | 同向 → 展平：子 split 的 children 按其权重 × 父槽位权重并入父 |
| I4 | `weights` 与 children 等长、每项 ≥ MIN_WEIGHT（由 `MIN_PANE_PX=200` 折算）、和 = 1（容差 1e-6） | 长度错 → 均分重建；越界 → clamp 后重归一 |
| I5 | `0 ≤ activeIndex < tabs.length`；空组（tabs=[]）只允许作为树中唯一的 group 存在 | 越界 → clamp 到最近合法值；非唯一空组 → 从树中移除（触发 I2 级联） |
| I6 | `focusedGroupId` 指向存在的 group | 失效 → 指向最近使用组，兜底第一个 group（前序遍历） |
| I7 | 全树 NodeId 与 Tab.id 唯一 | 冲突 → 重新生成 id 并记日志（只应出现在损坏文件恢复时） |
| I8 | `closedTabHistory.length ≤ 50` | 超限 → 丢弃最旧 |

## A4. 动作集与转移规格

| # | Action | 前置/参数 | 转移语义 | 边界规则 |
|---|--------|----------|----------|----------|
| A1 | `OPEN_VIEW` | `{target: groupId\|'focused', view, mode: 'replace-active'\|'new-tab'\|'new-tab-bg', dedupe: bool}` | 打开视图 | `dedupe` 且同 path 已存在于目标组 → 激活既有 tab；`replace-active` 且当前 tab **pinned → 自动降级为 new-tab**（Obsidian 行为）；`new-tab-bg` 不改 activeIndex |
| A2 | `CLOSE_TAB` | `{groupId, tabId, force?}` | 关闭并压入 closedTabHistory（含 groupPath 定位） | pinned 且非 force → **NOOP** + 发 `ui:pinned-close-blocked` 事件；关闭后组空 → normalize 折叠（非唯一组）或保留空组（唯一组）；activeIndex 移向左邻 |
| A3 | `CLOSE_GROUP` | `{groupId, force?}` | 关闭组内全部 tab | 含 pinned 且非 force → 返回 `needs-confirm` 状态码，UI 弹确认 |
| A4 | `CLOSE_OTHERS` / `CLOSE_TO_RIGHT` | `{groupId, tabId}` | 批量关闭 | **跳过 pinned**；被关 tab 逐个入历史 |
| A5 | `ACTIVATE_TAB` | `{groupId, tabId}` | 置 activeIndex + `focusedGroupId = groupId` | — |
| A6 | `REORDER_TAB` | `{groupId, from, to}` | 组内移动 | index clamp；activeIndex 跟随移动的 tab |
| A7 | `TRANSFER_TAB` | `{srcGroupId, tabId, dstGroupId, dstIndex, activate=true}` | 跨组移动 | 源组转空 → normalize 折叠；`dstIndex` clamp 到 `[0, len]` |
| A8 | `SPLIT_GROUP` | `{groupId, direction, position:'before'\|'after', payload: {moveTabId} \| {duplicateActive}}` | 该组节点替换为 `split[原组, 新组]`（或反序），权重 0.5/0.5 | `moveTabId` 模式且源组仅 1 tab → **NOOP**（否则产生空组，结构等价于没分）；`duplicateActive` 复制 active 的 ViewState（深拷贝，新 tab id）；父 split 同向 → I3 展平接管 |
| A9 | `DROP_TAB` | `{tabId, srcGroupId, target:{groupId, zone}}`，`zone ∈ center\|left\|right\|top\|bottom\|tabbar(index)` | 复合动作：center → A7 至末尾；edge → A8(方向映射) + A7；tabbar(i) → 同组则 A6，异组则 A7 | 拖到自身所在组的 edge 且源组仅 1 tab → NOOP；一切结果经 normalize 收敛，**禁止特判补丁** |
| A10 | `RESIZE_SPLIT` | `{splitId, dividerIndex, deltaPx, containerPx}` | 相邻两 child 间权重转移 `delta = deltaPx/containerPx` | 双方均受 MIN_WEIGHT 约束，先 clamp 再转移 |
| A11 | `FOCUS_GROUP` / `FOCUS_DIRECTION` | `{groupId}` / `{dir: left\|right\|up\|down}` | 空间导航：以当前 focused 组的几何矩形为原点，找该方向最近重叠组 | 无候选 → NOOP；几何由布局树 + 容器尺寸纯计算得出（可测） |
| A12 | `PIN_TAB` / `UNPIN_TAB` | `{groupId, tabId}` | 翻转 pinned | 不改变位置（对齐 Obsidian，非 VS Code 前缀式） |
| A13 | `REOPEN_CLOSED` | — | pop 历史；按 `groupPath` 定位原组：存在 → 插回 `min(tabIndex, len)` 并激活；不存在 → 插入 focused 组末尾 | 历史空 → NOOP |
| A14 | `SET_SIDEBAR` | `{side, collapsed?/widthPx?/activePanel?}` | 侧栏状态 | width clamp [200,600] |
| A15 | `UPDATE_VIEW_STATE` | `{tabId, patch}` | scroll/cursor/mode 增量更新 | 高频动作，**不触发持久化 debounce 之外的任何副作用** |
| A16 | `FILE_RENAMED` | `{from, to}` | 全树扫描：`markdown.path === from` → 重写为 `to` | 多 tab 同文件全部更新 |
| A17 | `FILE_DELETED` | `{path}` | 命中 tab 的 view 变为 `missing-file`（**不自动关闭**，用户可见可关） | — |
| A18 | `HYDRATE` | `{persisted}` | 反序列化 + A6 校验修复管线 → 整树替换 | 见 A6 节 |

## A5. 归一化算法

```
normalize(node) -> node':
  if node is group:
    clamp activeIndex to [-1 if empty else 0, len-1]; return
  children ← children.map(normalize)
  children ← children.filter(非空组 或 全树唯一组豁免)          # I5
  for child in children where child.type=='split'
                          and child.direction==node.direction:  # I3
    以 child.weights[i] × 该child槽位weight 展开并入本层
  if len(children) == 1: return 上提 children[0]                # I2
  if len(children) == 0: return 移除信号（由父层处理）           # I2
  weights ← clamp(MIN_WEIGHT) 后重归一                           # I4
```

- 复杂度 O(n)，实际树 n < 100，每 action 后全树执行，无性能顾虑
- **性质**：`normalize` 幂等（`normalize(normalize(x)) ≡ normalize(x)`）——这是 fuzz 的核心断言之一

## A6. 序列化、恢复与迁移

| 项 | 规格 |
|----|------|
| 存储位置 | `<vault>/.noteforge/workspace.json`，每 vault 独立 |
| Schema 校验 | Zod schema，version 字段 + 迁移链 `v1→…→vN`（每版一个纯迁移函数，链式） |
| **分级修复** | ① 字段级：clamp/默认值填补 → ② 节点级：无法修复的子树整体丢弃 + 日志 → ③ 整体级：解析彻底失败 → 原文件转存 `.bak-<ts>` + 重置为默认布局，UI toast 告知 |
| 持久化时机 | 结构性 action → debounce 500ms 写盘；`UPDATE_VIEW_STATE` → 5s 节流；窗口关闭/`beforeunload`/Tauri close hook → 同步 flush |
| 路径失效 | HYDRATE 时对全部 markdown view 批量 stat（单次 IPC），缺失者转 `missing-file` |

## A7. 拖拽交互规格

```
组区域五分命中（先命中 tabbar 带，再判定主体区）：
┌─────[tabbar：按 tab 中点扫描得插入 index]─────┐
│ ↖  ______________top(25%)______________  ↗ │
│ left│                                │right│
│(25%)│      center（内缩后矩形）        │(25%)│
│ ↙  ‾‾‾‾‾‾‾‾‾‾‾‾‾bottom(25%)‾‾‾‾‾‾‾‾‾‾  ↘ │
└──────────────────────────────────────────────┘
```

- **判定算法**：命中点到四边的归一化距离取最小者定 edge；落在内缩 50% 矩形内 → center。纯函数 `hitTest(rect, point) → zone`，单测覆盖
- 视觉反馈：半透明 tab 幽灵跟随光标 + 目标 zone 高亮遮罩（颜色走 design token，150ms fade-in）
- 启动阈值：按下后位移 > 4px 才进入拖拽态（防误触）；Esc / 拖出窗口 → 取消（NOOP）
- 拖拽源扩展：文件树条目 → 落入编辑区 = `OPEN_VIEW`；Alt+落入编辑器文本 = 插入嵌入语法（对接 FR-UI-04）
- **键盘等价**：全部拖拽结果均有命令面板命令（split right/move tab to group N/…），满足 FR-UI-03
- 拖出成独立 OS 窗口：T2，本期豁免

## A8. 技术落位

- Store：Zustand（或等价 `useSyncExternalStore` 外部 store），reducer 纯函数独立于 React 存在于 `src/workspace/reducer.ts`
- 渲染：split 递归组件 + CSS Grid（`grid-template-columns: weights` 直译）；divider 为 6px 命中带的绝对定位元素
- 组内容懒挂载：非激活 tab 的编辑器实例**保留但 `display:none`**（保 scroll/undo 栈）；组数 > 8 时最久未用组降级为快照占位（防 CM6 实例爆炸）

## A9. 验收标准

```
AC-WS-01 [unit]     reducer 表驱动 ≥ 120 用例（18 action × 主路径+边界）
AC-WS-02 [property] fuzz：100 seed × 10^5 随机动作序列，每步断言 I1–I8 全成立；
                    normalize 幂等；serialize→deserialize→serialize 结构相等
AC-WS-03 [unit]     损坏 workspace.json 语料 30 份（截断/类型错/未知版本/超深嵌套/
                    重复id/循环引用）→ 分级修复全部成功，零 panic 零白屏
AC-WS-04 [e2e]      Playwright：拖成分屏（五 zone 各验）、3 层嵌套、Ctrl+Shift+T
                    跨组还原、重启后布局+scroll+cursor 完整恢复
AC-WS-05 [e2e]      pinned：关闭被阻、replace-active 自动降级 new-tab、批量关闭跳过
AC-WS-06 [bench]    100 tabs/10 组：任意 action→渲染提交 < 16ms；HYDRATE < 100ms
AC-WS-07 [e2e]      重命名/删除联动（含同文件多 tab）；missing-file 占位可关可见
AC-WS-08 [manual]   vs Obsidian 15 个分屏操作脚本并排走查，行为一致
```

## A10. 待拍板项（默认值已给，T-M3-01 开工前确认）

1. 同文件多 tab：**默认允许**（Obsidian 行为），dedupe 仅作用于快速切换器路径
2. Linked panes（分屏滚动联动）：T2 豁免
3. 空组占位 tab 的形态：**默认显示"新标签页"页面**（含最近文件快捷入口）

---

# Part B · 全里程碑 AI 代理任务分解清单（M0–M8）

## B0. 任务卡规范（全部任务共用）

| 字段 | 约定 |
|------|------|
| 规模 | S ≤ 0.5 人日 / M ≤ 2 / L ≤ 5；> 5 必须拆分 |
| 通用 DoD | ① 附单元测试且 CI 三平台绿 ② 引用的 AC 全过 ③ 无 `unwrap()` 落入生产路径（Rust）/ 无 `any`（TS）④ 一任务一 PR，PR 描述引用任务 ID |
| 依赖记法 | `←` 表示硬依赖（未完成不可开工） |

**示范：一张完整任务卡**（其余任务按表格压缩，字段同构）：

> **T-M3-01 布局状态机 reducer**（L）
> 依赖：←T-M0-01 | 交付：`src/workspace/{types,reducer,normalize,invariants}.ts`
> 范围：附录 E A2–A5 全量实现，18 action + normalize + 不变量断言（dev 模式每步校验）
> 明确排除：任何 React 组件、持久化、拖拽几何
> DoD：AC-WS-01 通过；normalize 幂等性单测；覆盖率 ≥ 95%
> 输入规格：附录 E 本文 | 开放决策 A10 已按默认值锁定

## B1. M0 骨架（2 周，串行为主）

| ID | 任务 | 依赖 | 规模 | DoD 要点 |
|----|------|:-:|:-:|----------|
| T-M0-01 | 仓库脚手架：cargo workspace（nf-app/render/core/index/search/plugin 空 crate）+ Vite React TS + Tauri 2 init + CI 三平台矩阵（fmt/clippy/test/build） | — | M | CI 全绿，三平台产物可启动空窗口 |
| T-M0-02 | IPC 类型管线：specta/ts-rs 集成，echo 示例命令，TS 类型自动生成 + CI diff 门禁（手改即红） | ←01 | M | AC-IPC-01 骨架就位 |
| T-M0-03 | nf-render：comrak 封装（附录 D §3.1 冻结配置为常量）、`render_note`/`render_fragment` 命令（裸 HTML） | ←02 | M | CommonMark spec 100%（AC-MD-01） |
| T-M0-04 | 前端壳：阅读视图容器 + HTML 注入 + CSS reset + design token 骨架（`:root` 变量文件） | ←02 | M | 打开笔记可见渲染结果 |
| T-M0-05 | vault 打开流程：目录选择对话框、nf-core 挂接、`read_note`/`write_note` + hash 乐观锁 | ←02 | M | AC-IPC-02 |
| T-M0-06 | 基建：Rust tracing 日志、前端 ErrorBoundary、IPC 错误类型规范（错误码枚举） | ←02 | S | 错误旅程 e2e 一条 |
| T-M0-07 | nf-vaultgen 最小版：standard-10k 预设 CLI（附录 B 裁剪） | ←01 | M | 生成可复现（seed 固定 hash 一致） |
| T-M0-08 | 性能基准骨架：criterion + 前端计时上报，预算门禁接 CI（§8 表，回归 >15% 红） | ←03,07 | M | 基线数据入库 |

## B2. M1 阅读视图（4 周，P-pass 可 4 路并行）

| ID | 任务 | 依赖 | 规模 | DoD 要点 |
|----|------|:-:|:-:|----------|
| T-M1-01 | P1 wikilink 解析 pass（nf-index 打桩接口先行） | ←M0-03 | M | 存在/不存在/别名/heading 锚全覆盖 |
| T-M1-02 | P2 嵌入转写 + **深度上限 3 + 环检测**（DFS 路径栈，环 → 警告块） | ←01 | M | 环用例：自嵌/互嵌/三角 |
| T-M1-03 | P3 callout（13 内置 type 映射表 + fold 语法 + 未知 type 降级） | ←M0-03 | M | 快照测试全 type |
| T-M1-04 | P4 标签识别（文法与 nf-vaultgen §3 同源——提取共享 crate `nf-syntax`） | ←M0-03 | S | 文法单测双向复用 |
| T-M1-05 | P5 任务标注 + P6 资源重写（asset 协议 + **远程图片三档**：click 默认/auto 白名单/never） | ←M0-03 | M | AC-RD-06 |
| T-M1-06 | P7 消毒：ammonia 白名单 + **HTML 默认渲染**（D6）+ `render-html` 设置项（config 文件层） | ←M0-03 | M | 白名单表格化入文档 |
| T-M1-07 | P8 插件代码块占位 div | ←M0-03 | S | 占位契约快照 |
| T-M1-08 | 管线编排器：P1–P8 顺序执行框架 + 每 pass 独立开关（测试用） | ←01..07 | S | 全管线集成快照 |
| T-M1-09 | HTML 契约固化：sourcepos/toc/meta 输出 + schema 快照测试（契约变更即红） | ←08 | S | AC-IPC-01 |
| T-M1-10 | 前端水合：internal-link 跳转/unresolved 创建、task toggle（乐观锁旅程）、callout 折叠、embed IntersectionObserver 懒加载、外链走 shell.open | ←09 | L | FR-RD-01..05 各一条 e2e |
| T-M1-11 | KaTeX 集成（math 节点原文直传，错误公式优雅降级为代码样式） | ←09 | S | — |
| T-M1-12 | Shiki 高亮 + 代码块复制按钮/语言角标 | ←09 | M | — |
| T-M1-13 | **XSS 语料 200 条**（HTML 块/内联/属性注入/SVG/`javascript:` URL）+ Playwright 断言零执行零外联 | ←06,10 | M | AC-SEC-02R |
| T-M1-14 | CSP 与 Tauri capabilities 最小化收口（SEC-01/03/04，含 `../` 穿越用例） | ←10 | M | AC-SEC 全过 |

## B3. M2 编辑器（5 周，03/04 为关键路径）

| ID | 任务 | 依赖 | 规模 | DoD 要点 |
|----|------|:-:|:-:|----------|
| T-M2-01 | CM6 基座：加载/保存/乐观锁/外部变更合流（文件事件 → 无编辑则重载，有编辑则冲突条） | ←M1-09 | M | 冲突旅程 e2e |
| T-M2-02 | Lezer markdown + 即时样式（标题/粗斜/行内码/引用/列表导线） | ←01 | M | FR-ED-02 |
| T-M2-03 | **语法标记显隐引擎**（光标行显源码，离行渲染，Decoration 增量更新） | ←02 | L | AC-ED-01 帧录制断言 |
| T-M2-04 | Widget 装饰：图片/行内 KaTeX/嵌入块（走 render_fragment）/hr/可点任务框 | ←03 | L | FR-ED-03 |
| T-M2-05 | 补全：`[[` 链接（模糊+别名）、`#` 标签（依赖 nf-index IPC，P95<30ms） | ←02 | M | FR-ED-04 |
| T-M2-06 | 粘贴/拖拽图片入库（命名规则可配 + 插链） | ←01 | M | AC-ED-03 |
| T-M2-07 | 三模式切换 + 光标/滚动精确保持（sourcepos 双向映射） | ←03, M1-10 | L | AC-ED-04 往返 50 次零偏移 |
| T-M2-08 | IME 专项（CJK 组合输入不触发装饰重建）+ 撤销跨装饰安全测试套 | ←03,04 | M | AC-ED-01 IME 项 |
| T-M2-09 | 双解析器一致性 CI：语料双跑比对 + 白名单机制 + 可感知度字段 | ←02, M1-08 | M | AC-MD-02 |
| T-M2-10 | 性能：5MB 打开 <1s、输入 P95<16ms、增量重解析 <2ms 入基准 | ←04 | M | AC-ED-02 / AC-MD-03 |

## B4. M3 工作区骨架（4 周，与 M2 后半并行）

| ID | 任务 | 依赖 | 规模 | DoD 要点 |
|----|------|:-:|:-:|----------|
| T-M3-01 | 布局 reducer（见 B0 示范卡） | ←M0-01 | L | AC-WS-01 |
| T-M3-02 | fuzz/property 套件 + 30 份损坏语料 | ←01 | M | AC-WS-02/03 |
| T-M3-03 | 序列化/HYDRATE/迁移链/持久化时机（A6，含 Tauri close hook flush） | ←01 | M | 重启恢复 e2e |
| T-M3-04 | 布局渲染：split 递归组件 + Grid 权重直译 + divider resize + MIN_PANE | ←01 | M | AC-WS-06 |
| T-M3-05 | 标签栏：渲染/激活/关闭/pin/溢出滚动/右键菜单（A4 全菜单项） | ←04 | M | AC-WS-05 |
| T-M3-06 | 拖拽系统：hitTest 纯函数 + 幽灵 + zone 高亮 + tabbar 插入 + 4px 阈值 + Esc 取消 | ←05 | L | AC-WS-04 拖拽项 |
| T-M3-07 | 关闭历史/Ctrl+Shift+T/FOCUS_DIRECTION 空间导航（几何算法单测） | ←04 | M | AC-WS-04 |
| T-M3-08 | 文件管理器：虚拟化树 + CRUD（删除进回收站）+ 拖拽移动 + 右键 + 排序 + 折叠持久化 + **重命名全库反链更新**（nf-index 事务 + 进度条） | ←M0-05 | L | §8 文件树预算；反链更新 e2e |
| T-M3-09 | 快速切换器 Ctrl+O（文件名/别名/路径模糊，不存在回车创建，最近优先） | ←M0-05 | M | P95<50ms |
| T-M3-10 | 命令面板 Ctrl+P + **命令注册表基建**（id/名称/快捷键/回调，插件将复用） | ←01 | M | 全功能可达审计脚本 |
| T-M3-11 | 快捷键系统：默认表（对齐 Obsidian）+ 重绑定存储 + 冲突检测（UI 挂账 M4-08） | ←10 | M | 冲突用例表 |
| T-M3-12 | 文件事件联动：A16/A17 接入（重命名/删除 → tab 更新/missing-file） | ←03, M0-05 | S | AC-WS-07 |
| T-M3-13 | M3 e2e 总装：AC-WS-04/05/07 全套 Playwright | ←06,07,12 | M | 全绿入 CI |

## B5. M4 面板/搜索/设置/主题（4 周，高度并行）

| ID | 任务 | 依赖 | 规模 | DoD 要点 |
|----|------|:-:|:-:|----------|
| T-M4-01 | 侧栏面板框架：面板注册协议/切换/折叠/宽度记忆（左右通用，插件将复用） | ←M3-04 | M | — |
| T-M4-02 | 反向链接面板（分组+摘录+跳转，nf-index 契约冻结点①） | ←01 | M | 跳转定位到行 |
| T-M4-03 | Unlinked mentions（纯文本提及扫描+一键转链）〔T2〕 | ←02 | M | 转链幂等 |
| T-M4-04 | 大纲面板 + 滚动联动高亮（sourcepos 映射复用 M2-07） | ←01 | M | — |
| T-M4-05 | 标签面板：嵌套树/计数/点击即搜索 | ←01,07 | S | — |
| T-M4-06 | 属性面板：frontmatter 类型化控件 + **YAML 稳定写回**（保注释保顺序，round-trip 测试） | ←01 | L | round-trip 语料 50 份 |
| T-M4-07 | 全局搜索：操作符解析器（`path:/file:/tag:/line:/section://regex/`/OR/-/引号）+ 结果 UI（分组/高亮/上下文/历史） | ←01 | L | 10k vault 首批 <200ms |
| T-M4-08 | 设置窗口：分类导航框架 + 编辑器/外观/文件链接/快捷键（含 M3-11 UI、M1 挂账的 render-html 与远程图片白名单 UI）/核心功能页 | ←M3-11 | L | 全设置项持久化 e2e |
| T-M4-09 | 状态栏：字数/字符（选区感知）/反链数 + 插件注册区占位 | ←M3-04 | S | — |
| T-M4-10 | 悬浮预览 Ctrl+hover（render_fragment + 嵌套一层） | ←M1-10 | M | FR-RD-02 |
| T-M4-11 | 主题完成：token 全量 + 亮暗 + 跟随系统 + **CSS snippets 加载**（消毒） | ←M0-04 | M | AC-TY-03 切换 <100ms |
| T-M4-12 | 截图基线全套（全 Markdown 元素 × 亮暗）+ CI 像素回归 | ←11 | M | AC-TY-01 |
| T-M4-13 | Ribbon 竖条 + lucide 图标接入 | ←M3-10 | S | — |

## B6. M5 加固（2 周）

| ID | 任务 | 依赖 | 规模 | DoD |
|----|------|:-:|:-:|-----|
| T-M5-01 | 超长文档分块渲染（顶层块切片 + 视口外惰性挂载） | ←M1-10 | L | 1MB+ 文档满帧滚动 |
| T-M5-02 | IPC payload 切片流式（>5MB 自动分片） | ←01 | M | — |
| T-M5-03 | 三平台内存实测 + 优化回合（§8 预算达标） | ←全 | M | AC-PF-01 |
| T-M5-04 | 一致性白名单评审 + 语料扩容（nf-vaultgen 边界集并入） | ←M2-09 | S | <0.5% |
| T-M5-05 | 20 篇真实笔记 vs Obsidian 排版评审（AC-TY-02） | ←M4-12 | S | ≥4/5 |

## B7. M6 UI 对等迭代（N×2 周）

| ID | 任务 | 规模 | 说明 |
|----|------|:-:|------|
| T-M6-00 | 走查基建：Obsidian 版本固定装置 + §3.2 矩阵评分表工具 + 差距报告模板 | M | 一次性 |
| T-M6-R*n* | 每轮三件套：走查出《差距报告 rN》→ 按报告生成修复任务批次（继承本清单编号规则 T-M6-R*n*-xx）→ 回归评分 | /轮 | 报告版本化入库 |
| T-M6-GATE | 20 任务脚本定稿 + 5 评审员执行 + GATE-UI 判定 | M | §7.3，两轮增益 <1% 触发升级决策 |

## B8. M7 插件宿主（4–6 周）

| ID | 任务 | 依赖 | 规模 | DoD |
|----|------|:-:|:-:|-----|
| T-M7-01 | WIT 世界定义 + wasmtime 宿主骨架（实例池/资源限额/超时熔断） | ←M0-01 | L | 资源滥用用例 |
| T-M7-02 | manifest/权限声明/安装-启用-禁用-卸载生命周期 | ←01 | M | — |
| T-M7-03 | H-EXT-1 代码块处理器桥（P8 占位 → 插件渲染回填，异步+错误隔离） | ←01, M1-07 | M | 插件 panic 不伤宿主 |
| T-M7-04 | 沙箱 iframe 面板 API：独立 CSP + postMessage 桥 + 能力按 manifest 授权 | ←02, M4-01 | L | 逃逸测试套 |
| T-M7-05 | 命令/Ribbon/状态栏/设置页注册 API（复用 M3-10/M4-09/M4-08 基建） | ←02 | M | — |
| T-M7-06 | vault 读写 API + 事件订阅（权限作用域强制） | ←02 | M | 越界读写全拒 |
| T-M7-07 | 索引查询 API（字段/标签/链接/任务查询面——nf-dataquery 的地基，契约与附录 C 对齐） | ←02 | L | 查询契约快照 |
| T-M7-08 | 插件管理器 UI（浏览/安装/权限展示/更新） | ←02, M4-08 | M | — |
| T-M7-09 | 恶意插件测试套：沙箱逃逸/CPU 炸弹/内存炸弹/权限越界 20 用例 | ←01..07 | M | 全拦截 |
| T-M7-10 | 插件 SDK + 项目模板 + 文档站首版 | ←03..07 | L | 模板一键出 hello-world |

## B9. M8 第一批插件（按附录 C，四线并行）

| 线 | 任务序列（每项一任务，规模 M–L） | 关闭条件 |
|----|--------------------------------|----------|
| nf-dataquery | D1 DQL 词法/语法解析器 → D2 执行引擎（对接 M7-07）→ D3 表格/列表/任务视图渲染 → D4 内联字段 → D5 前端 JS 沙箱垫片（DataviewJS）→ D6 能力矩阵评分+差距迭代 | parity ≥ 90% |
| nf-copilot | C1 provider 抽象（OpenAI 兼容/本地）→ C2 聊天 iframe 面板 → C3 RAG 索引管线 → C4 命令集 → C5 评分迭代 | parity ≥ 90%（清洁室纪律） |
| nf-diagram | G1 mermaid.js 封装 + 代码块桥 → G2 主题 token 桥接 → G3 导出 PNG/SVG → G4 评分 | parity ≥ 95%（D9 上调） |
| nf-remotesync | S1 rclone crypt 互操作层（测试向量先行）→ S2 增量同步引擎 → S3 冲突解决 UI → S4 状态栏集成 → S5 评分 | parity ≥ 90% |

## B10. 关键路径与并行泳道

```
关键路径：M0-01→02→03 → M1-08→09→10 → M2-03→04→07 → M6-GATE
最大并行窗口：
  泳道① M2（编辑器）    ┐
  泳道② M3-01..07（布局）├─ M1-09 契约冻结后即可三线并行
  泳道③ M3-08..11（文管/面板基建）┘
  M4 全部任务依赖 M3-04/M0 契约，内部 13 任务几乎全并行
风险提示：M3-01/02（状态机+fuzz）必须先于一切布局 UI——
          这是 R-UI-1 的结构性缓解，不接受"先写 UI 后补状态机"的顺序
```

**统计**：任务总数 ~95（M6 迭代批次与 M8 细分另计），关键路径约 18–20 周，双泳道并行下 M0–M5 约 14 周可达。
