
# NoteForge 需求设计与验收标准文档

> 一个纯 Rust 实现的本地优先知识管理应用（Obsidian 功能对标）
> 版本：v1.0-draft | 状态：待评审

---

## 0. 决策记录（Architecture Decision Records 摘要）

| 编号 | 决策 | 结论 | 理由 |
|------|------|------|------|
| ADR-01 | GUI 框架 | **纯 Rust**，候选 GPUI / Slint / iced，由 Phase 0 验证后锁定 | 低内存、高性能是核心诉求；放弃 WebView |
| ADR-02 | 插件运行时 | **WASM（wasmtime + Component Model / WIT）** | 沙箱安全、语言无关（Rust/Go/JS-via-Javy 均可编写插件）、Zed 已验证可行 |
| ADR-03 | Obsidian 插件兼容 | **不兼容**，仅概念对齐（Vault/Workspace/MetadataCache/Command） | 无 DOM，兼容层不可行；未来提供插件迁移指南 |
| ADR-04 | 数据存储 | **本地 Markdown 文件为唯一真实数据源**，索引可重建 | 对齐 Obsidian "文件优先" 哲学，无厂商锁定 |
| ADR-05 | 目标平台 | V1：Windows / macOS / Linux 桌面；移动端 V2+ | 控制范围 |
| ADR-06 | 编辑器 | **自研**，rope 数据结构 + tree-sitter 增量解析 | 纯 Rust 下无现成 Live Preview 编辑器 |
| ADR-07 | 许可证 | 核心库 Apache-2.0 / MIT 双许可，应用层待定（默认 AGPL-3.0） | 待确认商业化意图 |

---

## 1. 项目概述

### 1.1 产品定位

本地优先（local-first）的 Markdown 知识管理桌面应用。用户的知识库（Vault）是一个普通的本地文件夹，所有笔记为纯文本 `.md` 文件。应用提供双向链接、图谱、全文搜索、实时预览编辑等能力，并通过 WASM 插件体系支持深度扩展。

### 1.2 设计原则（按优先级排序）

1. **数据主权**：文件是唯一真实数据源；应用删除后数据完整可读；不产生私有格式锁定
2. **性能**：启动快、输入零感知延迟、大 Vault（10 万文件）不卡顿
3. **可扩展**：核心功能尽量以"内置插件"形式实现（dogfooding 插件 API）
4. **安全**：插件默认沙箱化，权限显式声明和授权

### 1.3 非目标（V1 明确不做）

- Obsidian 插件二进制兼容
- Canvas 白板、端到端加密同步、发布服务（列入 V2 Backlog）
- 移动端
- 协作编辑（CRDT 预留架构位，不实现）

---

## 2. 系统架构

### 2.1 Crate 划分

```
noteforge/
├── crates/
│   ├── nf-core          # 领域模型：Vault、Note、Link、Tag，无 IO 依赖
│   ├── nf-vault         # 文件系统层：文件监听(notify)、原子写入、冲突检测
│   ├── nf-markdown      # Markdown 解析：tree-sitter 增量解析 + AST + 方言扩展
│   ├── nf-index         # 元数据缓存(SQLite/redb) + 全文搜索(tantivy) + 链接图
│   ├── nf-editor        # 编辑器引擎：rope(ropey)、多光标、撤销栈、装饰层
│   ├── nf-render        # Live Preview 渲染：AST → 富文本布局树
│   ├── nf-plugin        # 插件宿主：wasmtime 运行时、WIT 绑定、权限管理
│   ├── nf-ui            # GUI 层（依赖 Phase 0 选定框架）：面板、主题、组件库
│   └── nf-app           # 主程序：组装、窗口管理、生命周期
├── plugins/             # 内置插件（用官方 API 实现，验证 API 完备性）
│   ├── daily-notes/
│   ├── templates/
│   ├── outline/
│   └── word-count/
└── docs/api/            # 插件开发者文档 + WIT 接口定义
```

### 2.2 关键技术选型

| 领域 | 选型 | 备选 |
|------|------|------|
| Rope 文本结构 | `ropey` | `crop` |
| 增量解析 | `tree-sitter` + tree-sitter-markdown 定制 fork | 自研增量解析器 |
| 全文搜索 | `tantivy`（含中文分词 jieba-rs） | — |
| 元数据缓存 | `redb`（纯 Rust 嵌入式 KV） | `rusqlite` |
| 文件监听 | `notify` | — |
| WASM 运行时 | `wasmtime` + Component Model | `wasmer` |
| 代码高亮 | tree-sitter highlights | `syntect` |
| 数学公式 | Typst 数学引擎渲染为矢量 | MathML、自研 |
| 图谱渲染 | GPU 实例化渲染（框架自带绘图 API），力导向布局自研 | — |

### 2.3 线程模型

- **UI 线程**：只做布局与渲染，任何操作不得阻塞 > 4ms
- **索引线程池**：解析、tantivy 写入、链接图更新
- **IO 线程**：文件读写、监听事件去抖（debounce 100ms）
- **插件线程池**：每个插件调用独立执行，带超时熔断（默认 5s）
- 通信：`tokio` mpsc / watch channel；UI 状态用不可变快照 + 版本号

---

## 3. Phase 0：技术验证门禁（Go/No-Go）

> **这是整个项目最高风险所在，必须先行验证，未通过则重选框架。**

对 GPUI、Slint、iced 各实现同一个最小原型（约 1-2 周/个，可并行）：

### 验证项与硬性标准

| 编号 | 验证项 | 通过标准 |
|------|--------|----------|
| P0-1 | **中文 IME** | Win/macOS/Linux 三平台：候选词窗口跟随光标、支持拼音长句、无丢字/重复、支持 Shift 切换，输入 200 字连续文本零异常 |
| P0-2 | 文本渲染 | 中英混排、emoji、连字正确；字体 fallback 正常 |
| P0-3 | 编辑性能 | 加载 5MB Markdown 文件，任意位置输入延迟 p99 < 16ms，滚动稳定 60fps |
| P0-4 | 富文本混排 | 同一视图内混排：不同字号标题、行内图片占位、可折叠区块 |
| P0-5 | 内存 | 原型 + 5MB 文件打开后 RSS < 120MB |
| P0-6 | 自定义绘制 | 可用 GPU API 绘制 2000 节点的力导向图 ≥ 30fps |
| P0-7 | 可访问性/高分屏 | HiDPI 缩放正常、系统深浅色跟随 |

**输出物**：选型报告 + 原型代码 + 各项实测数据。任一框架全部通过即锁定；均不通过则升级决策（考虑贡献上游修复或回退 Tauri）。

---

## 4. 功能需求（PRD）

> 优先级：P0 = V1 必须；P1 = V1 应有；P2 = V2

### 4.1 Vault 管理（P0）

- FR-101：打开任意本地文件夹作为 Vault；最近 Vault 列表；多 Vault 多窗口
- FR-102：文件树面板——新建/重命名/删除/移动/拖拽文件与文件夹，删除进系统回收站
- FR-103：外部修改实时感知（文件监听），已打开文件被外部修改时：无本地未保存修改则自动重载；有冲突则提示三选一（保留本地/加载外部/对比）
- FR-104：所有写入必须原子化（临时文件 + rename），任何崩溃不得损坏用户文件
- FR-105：配置存储于 `Vault/.noteforge/`（JSON），索引缓存存于该目录且**可随时删除重建**
- FR-106：支持非 Markdown 附件（图片/PDF/音频）的管理与预览

### 4.2 编辑器（P0，核心模块）

- FR-201：三种模式——**源码模式**、**实时预览（Live Preview）**、**阅读模式**，快捷键切换
- FR-202：Live Preview 行为对齐 Obsidian——光标所在行显示 Markdown 源码标记，其余行渲染为富文本；点击渲染元素光标定位准确
- FR-203：多光标、列选择、智能列表续行、Tab 缩进层级、自动配对括号/引号
- FR-204：撤销/重做栈（≥1000 步，按操作分组），跨会话不要求持久化
- FR-205：`[[` 触发链接自动补全（模糊匹配文件名/别名/标题）；`#` 触发标签补全
- FR-206：拖拽/粘贴图片自动保存到附件目录并插入嵌入语法
- FR-207：代码块语法高亮（≥ 30 种常用语言）
- FR-208：折叠——标题层级折叠、列表折叠、frontmatter 折叠
- FR-209：Vim 模式（P1）：normal/insert/visual、常用 motion/operator、`:w`、宏
- FR-210：查找与替换（当前文件），支持正则

### 4.3 Markdown 方言（P0）

必须支持：CommonMark + GFM（表格/任务列表/删除线/自动链接）+ 以下扩展：

| 语法 | 说明 |
|------|------|
| `[[笔记名]]`、`[[笔记名\|显示别名]]`、`[[笔记#标题]]`、`[[笔记#^块ID]]` | Wikilink 全形态 |
| `![[笔记名]]`、`![[图片.png]]`、`![[笔记#标题]]` | 嵌入（笔记/附件/局部），循环嵌入需检测并阻断 |
| `#标签`、`#嵌套/标签` | 行内标签 |
| YAML frontmatter | 含 `tags`、`aliases`、`cssclasses` 保留字段 |
| `> [!note]` 等 Callout | 13 种内置类型 + 可折叠 `[!note]-` |
| `$...$`、`$$...$$` | 行内/块级数学公式 |
| `%%注释%%` | 渲染时隐藏 |
| 脚注 `[^1]` | GFM 脚注 |
| `==高亮==` | 高亮标记 |

**要求**：解析器输出带精确源码位置（byte offset span）的 AST，供编辑器装饰与索引复用；增量解析——单字符输入只重解析受影响区块。

### 4.4 链接与元数据（P0）

- FR-401：MetadataCache——每个文件的标题树、链接、标签、frontmatter、块 ID 的结构化缓存，文件变更后 500ms 内更新
- FR-402：反向链接面板——显示"链接提及"（含上下文摘录）与"未链接提及"（纯文本匹配）
- FR-403：重命名文件/标题时，自动更新全 Vault 引用（事务性：全部成功或全部回滚，操作前预览受影响文件列表）
- FR-404：断链检测——指向不存在文件的链接以特殊样式显示，点击自动创建
- FR-405：出链面板、标签面板（含层级树与计数）

### 4.5 搜索（P0）

- FR-501：全文搜索——支持中英文分词、短语（`"..."`）、布尔（AND/OR/NOT）、限定符（`path:`、`file:`、`tag:`、`line:`）、正则（`/.../ `）
- FR-502：快速切换器（Quick Switcher，Ctrl/Cmd+O）——模糊匹配文件名/别名/标题，可创建不存在的笔记
- FR-503：命令面板（Ctrl/Cmd+P）——所有命令（含插件命令）模糊搜索并显示快捷键
- FR-504：搜索结果高亮匹配、上下文预览、支持全局替换（P1）

### 4.6 工作区（P0）

- FR-601：布局——左/右侧边栏（可折叠）+ 中央编辑区；编辑区支持标签页、水平/垂直分屏、拖拽重排
- FR-602：面板系统——文件树、搜索、反链、出链、标签、大纲均为可停靠面板（插件可注册新面板）
- FR-603：工作区布局持久化，重启完整恢复（含打开的文件、光标位置、分屏结构）
- FR-604：多窗口（P1）；窗口间状态同步（同一 Vault 索引共享）
- FR-605：钉住标签页、历史前进/后退导航

### 4.7 图谱视图（P1）

- FR-701：全局图谱——节点=笔记，边=链接；力导向布局、GPU 渲染、缩放平移
- FR-702：过滤（按标签/路径/搜索式）、着色分组、孤儿节点开关、节点大小按链接数
- FR-703：局部图谱面板（当前笔记 N 度邻居）
- 性能：10,000 节点 + 30,000 边 ≥ 30fps

### 4.8 插件系统（P0，详见 §5）

### 4.9 外观与主题（P1）

- FR-901：内置浅色/深色主题，跟随系统
- FR-902：主题 = 设计令牌（design token）JSON 包：颜色、字体、间距、圆角变量（**注意：无 CSS，主题能力以令牌系统为边界，需在文档中对用户明示**）
- FR-903：自定义字体、字号、行宽、行高
- FR-904：界面多语言（V1：中文/英文）

### 4.10 内置插件（P1，用官方插件 API 实现）

日记（Daily Notes）、模板（Templates，含 `{{date}}`/`{{title}}` 变量）、大纲（Outline）、字数统计、随机笔记、幻灯片（P2）

---

## 5. 插件 API 规范

### 5.1 总体设计

- 分发格式：`.nfplugin` = zip（`plugin.toml` manifest + `main.wasm` + 资源）
- 运行时：wasmtime，Component Model，接口以 **WIT** 定义并作为公开契约
- 版本策略：API 语义化版本；宿主对插件声明的 `api_version` 做兼容检查

### 5.2 Manifest（plugin.toml）

```toml
[plugin]
id = "com.example.kanban"
name = "Kanban"
version = "1.0.0"
api_version = "1.0"
min_app_version = "1.0.0"

[permissions]
vault_read = true          # 读 Vault 文件
vault_write = true         # 写 Vault 文件
network = ["api.example.com"]  # 网络白名单，默认禁止
clipboard = false
shell = false              # V1 一律禁止
```

安装时向用户展示权限清单，需显式确认；越权调用返回错误并记录审计日志。

### 5.3 宿主 API 能力面（WIT 接口分组）

| 接口组 | 能力（对标 Obsidian 概念） |
|--------|---------------------------|
| `vault` | 读/写/创建/删除/重命名文件、列目录、读附件二进制 |
| `metadata` | 查询任意文件的缓存元数据（标题/链接/标签/frontmatter）、查询反链、解析链接目标 |
| `workspace` | 打开文件、获取活动文件、注册面板/视图、管理标签页 |
| `editor` | 读取/替换选区、获取/设置光标、插入文本、逐行操作、注册自动补全源 |
| `commands` | 注册命令（进命令面板）、绑定默认快捷键 |
| `ui` | 声明式 UI（见 5.4）、模态框、通知（toast）、状态栏项、设置页 |
| `render` | 注册 Markdown **AST 转换器**（后处理器）与自定义代码块渲染器（如 `\`\`\`kanban`） |
| `events` | 订阅：file-created/modified/deleted/renamed、active-file-changed、editor-changed、layout-ready |
| `storage` | 插件私有 KV 存储（隔离于 `.noteforge/plugins/<id>/`） |
| `http` | 受白名单约束的 fetch |

### 5.4 插件 UI 模型（关键设计约束）

无 DOM，插件**不能任意绘制**。提供两层能力：

1. **声明式组件树**：插件返回 JSON 结构的 UI 描述（文本、按钮、输入框、列表、树、下拉、图标、布局容器），宿主渲染并回传事件——覆盖 80% 插件需求（设置页、面板、模态框）
2. **自定义画布**（P2）：受限绘图指令流（路径/文本/图片），用于图表类插件

此约束必须写入插件开发者文档首页。

### 5.5 生命周期与稳定性

- `on_load` / `on_unload` 钩子；支持热重载（开发模式监听 wasm 变更）
- 插件崩溃（trap）不得影响宿主：捕获、禁用、通知用户
- 单次调用超时默认 5s，可在 manifest 申请延长；内存上限默认 256MB/插件
- 官方提供：`nf-plugin-sdk`（Rust crate）+ 脚手架 CLI（`nf plugin new`）+ 示例插件 ≥ 3 个

---

## 6. 非功能需求与性能基准

> 基准环境：4 核 CPU / 16GB RAM / SSD；标准测试 Vault：10,000 笔记（均值 3KB，含 50,000 链接）；大型 Vault：100,000 笔记

| 编号 | 指标 | 目标 |
|------|------|------|
| NFR-01 | 冷启动至可交互（10k Vault，索引已建） | < 1.5s |
| NFR-02 | 空 Vault 启动 | < 500ms |
| NFR-03 | 输入延迟（按键→屏幕，Live Preview 模式，1MB 文件） | p50 < 8ms，p99 < 16ms |
| NFR-04 | 空闲内存（10k Vault，打开 3 个标签页） | RSS < 200MB |
| NFR-05 | 100k Vault 空闲内存 | RSS < 500MB |
| NFR-06 | 全文搜索响应（10k Vault） | p95 < 50ms |
| NFR-07 | 全量索引重建（10k Vault） | < 15s（后台，不阻塞 UI） |
| NFR-08 | 打开 10MB 单文件并滚动 | 60fps，无白屏 |
| NFR-09 | 安装包体积 | < 40MB |
| NFR-10 | 文件安全 | 任何崩溃/断电场景零字节损坏（原子写验证） |
| NFR-11 | 崩溃率 | < 0.1% 会话 |

**CI 门禁**：NFR-01/03/04/06 纳入基准测试流水线，回归超过 10% 阻断合并。

---

## 7. 里程碑

### 当前实现状态（截至 2026-07 验证）

| 里程碑 | 完成度 | 备注 |
|--------|--------|------|
| M0 Phase 0 门禁 | ❌ 0% | IME/渲染/性能/GPU 均未验证；Slint 已选但未验证 |
| M1 Vault + 文件树 | ✅ 80% | 文件监听(FR-103)、冲突处理(AC-VAULT-03)、回收站(AC-VAULT-04) 未实现 |
| M2 编辑器 + Markdown | ⚠️ 40% | 仅有源码模式(FR-201)；Live Preview/折叠/补全/30语言高亮 均未实现 |
| M3 索引 + 搜索 | ⚠️ 30% | 搜索为子串搜索(FR-501)；反链基础版(FR-402)；重命名同步/命令面板/快速切换器 未实现 |
| M4 工作区 | ⚠️ 50% | 基础布局(FR-601) + 持久化(FR-603)；面板系统/多窗口/标签页 未实现 |
| M5 插件系统 | ⚠️ 25% | Manifest/权限(§5.2) 已实现；WASM运行时(§5.3) 无 WIT 接口；无 SDK/示例 |
| M6 图谱/其他 | ✅ 60% | 力导向布局(FR-701) 已实现；Vim/多窗口/i18n/打包 未实现 |

### 已知差距（待修复）

1. **nf-vaultgen 缺少 5 个 profile**：search-oracle、edge-corpus、unicode-hell、deep-nest、churn-base
2. **无附件生成**：所有 profile 的 num_attachments 为 0
3. **语料库不足**：~200 词远低于规范要求的 20,000+10,000
4. **Block ID 未生成**：content 中 block_ids 始终为空
5. **缺失元素类型**：OrderedList/Table/Footnote/Comment/Highlight/Math 在生成管线中从未实例化
6. **无变更模拟驱动(churn driver)**：§8 完全缺失
7. **搜索为子串模式**：未集成 tantivy，无法满足 NFR-06
8. **无 WIT 接口定义**：插件宿主无 Component Model 绑定

---


| 阶段 | 内容 | 出口标准 |
|------|------|----------|
| **M0**（门禁） | 框架验证（§3） | Phase 0 全项通过，选型锁定 |
| **M1** | Vault + 文件树 + 源码模式编辑器 + 原子保存 + 配置系统 | 可当纯 Markdown 编辑器日常使用 |
| **M2** | 增量解析 + Live Preview + 语法高亮 + 折叠 | FR-2xx/3xx 验收通过 |
| **M3** | MetadataCache + wikilink 补全 + 反链 + 标签 + 全文搜索 + 快速切换器 + 重命名同步 | FR-4xx/5xx 验收通过 |
| **M4** | 工作区（分屏/面板/布局持久化）+ 命令面板 + 主题令牌 | FR-6xx 验收通过 |
| **M5** | 插件运行时 + API v1 + SDK + 3 个内置插件迁移到 API 实现 | 第三方可用 SDK 独立开发插件 |
| **M6** | 图谱 + Vim + 多窗口 + i18n + 打包/自动更新 + 性能冲刺 | 全部 NFR 达标，公开 Beta |
| **V2 Backlog** | Canvas、E2E 加密同步、发布、移动端、Obsidian 迁移工具（vault 导入 + 插件移植指南） | — |

---

## 8. 验收标准（校验文件）

### 8.1 格式约定

每条用 Given/When/Then 描述，标注自动化方式：`[unit]` 单元测试 / `[int]` 集成测试 / `[e2e]` UI 自动化 / `[bench]` 基准 / `[manual]` 人工。

### 8.2 文件安全（最高优先级）

```
AC-VAULT-01 [int] 原子写入
  Given 一个正在保存的 500KB 笔记
  When  保存过程中进程被 SIGKILL（注入 1000 次随机时点杀进程）
  Then  文件内容为"完整旧版本"或"完整新版本"，绝不出现半截内容

AC-VAULT-02 [int] 外部修改感知
  Given 应用打开笔记 A 且无未保存修改
  When  外部编辑器修改 A 并保存
  Then  1s 内编辑器内容自动更新，光标位置尽力保持

AC-VAULT-03 [int] 冲突处理
  Given 笔记 A 存在未保存的本地修改
  When  外部同时修改 A
  Then  弹出冲突对话框，三个选项行为均正确，任何选择不丢失两侧数据
        （被放弃一侧写入 .noteforge/conflicts/ 备份）

AC-VAULT-04 [unit] 删除进回收站
  Given 任意文件
  When  在文件树中删除
  Then  文件出现在系统回收站且可还原
```

### 8.3 编辑器与 Live Preview

```
AC-EDIT-01 [e2e] 中文输入
  Given Live Preview 模式空白笔记
  When  用系统拼音输入法连续输入 500 字中文（含标点、emoji、英文混排）
  Then  文本与预期完全一致，无丢字/重复/乱序；候选框始终跟随光标

AC-EDIT-02 [e2e] Live Preview 标记显隐
  Given 一行内容 "**粗体** 文字"，光标不在该行
  Then  显示为粗体渲染、"**"隐藏
  When  光标移入该行
  Then  显示 "**粗体** 文字" 源码，样式保留

AC-EDIT-03 [unit] 撤销分组
  Given 连续输入 "hello world"
  When  按一次 Ctrl+Z
  Then  按词/停顿分组撤销（非逐字符），且 1000 步深度内不丢失历史

AC-EDIT-04 [bench] 输入延迟
  Given 1MB Markdown 文件，Live Preview 模式
  When  以 15 字符/秒 连续输入 60s
  Then  按键到渲染 p99 < 16ms（自动化帧计时采集）

AC-EDIT-05 [int] 链接补全
  Given Vault 中存在笔记 "机器学习.md"（别名 "ML"）
  When  输入 "[[ml"
  Then  候选出现"机器学习"（经别名命中），回车后插入 [[机器学习|ML]] 或按设置格式
```

### 8.4 Markdown 解析

```
AC-MD-01 [unit] CommonMark 合规
  Then  通过 CommonMark spec 官方测试集 ≥ 99.5%（列出豁免条目及原因）

AC-MD-02 [unit] 方言全覆盖
  Then  §4.3 表中每种语法都有正/反用例（合计 ≥ 300 条快照测试），AST span 精确到字节

AC-MD-03 [unit] 增量解析一致性
  Given 任意文档（属性测试随机生成 10 万例）
  When  应用随机编辑后增量解析
  Then  AST 与全量重新解析结果完全一致

AC-MD-04 [int] 循环嵌入
  Given A 嵌入 B，B 嵌入 A
  Then  渲染在第二层显示"循环嵌入"占位符，不死循环、不崩溃
```

### 8.5 链接、元数据与搜索

```
AC-LINK-01 [int] 重命名同步
  Given 100 个文件共 500 处引用 [[目标笔记]]（含别名/标题/块引用形态）
  When  重命名"目标笔记"
  Then  500 处全部正确更新（含 ![[]] 嵌入），预览列表准确，中途取消则零修改

AC-LINK-02 [int] 反链上下文
  Given B 中两处引用 [[A]]
  When  打开 A 的反链面板
  Then  显示 B 的两条记录，各含所在段落摘录，点击跳转到精确位置

AC-SEARCH-01 [int] 中文搜索
  Given 含"机器学习是人工智能的分支"的笔记
  When  搜索 "机器学习 AND 人工智能"
  Then  命中且两词均高亮；搜索"深度学习"不误命中

AC-SEARCH-02 [bench] 搜索性能
  Given 10k 标准 Vault
  Then  任意三词布尔查询 p95 < 50ms

AC-SEARCH-03 [int] 限定符
  Then  path:/file:/tag:/正则 各限定符按文档定义工作，组合使用正确
```

### 8.6 插件系统

```
AC-PLUGIN-01 [int] 沙箱越权
  Given 插件 manifest 未声明 vault_write
  When  插件调用写文件 API
  Then  返回 PermissionDenied，文件未变化，审计日志留痕

AC-PLUGIN-02 [int] 崩溃隔离
  When  插件触发 wasm trap / 无限循环（超时）/ 内存超限
  Then  宿主不崩溃、UI 不卡顿，插件被禁用并通知用户

AC-PLUGIN-03 [e2e] 端到端插件开发
  Given 一名开发者按官方文档从脚手架开始
  Then  30 分钟内完成"注册命令 + 弹通知 + 读当前文件字数"的插件并热重载生效
        （由未参与开发的人员执行验证）

AC-PLUGIN-04 [int] API 完备性（dogfooding）
  Then  日记/模板/大纲三个内置插件完全通过公开 API 实现，无私有后门调用

AC-PLUGIN-05 [int] 网络白名单
  Given 插件声明 network=["api.a.com"]
  When  请求 api.b.com
  Then  被拒绝并留痕
```

### 8.7 工作区与图谱

```
AC-WS-01 [e2e] 布局恢复
  Given 三分屏 + 5 个标签页 + 特定光标位置
  When  重启应用
  Then  布局、文件、光标、滚动位置完全恢复

AC-GRAPH-01 [bench] 图谱性能
  Given 10,000 节点 / 30,000 边
  Then  布局收敛后交互（拖拽/缩放）≥ 30fps，进入图谱内存增量 < 150MB
```

### 8.8 非功能验收

NFR 表（§6）逐项对应 `[bench]` 自动化基准，CI 每日运行并出趋势报告；发布前在三平台真机人工复测 IME、HiDPI、深浅色切换、回收站行为。

### 8.9 发布检查清单（每次发布执行）

- [ ] 三平台安装包安装/卸载/自动更新链路可用，签名有效（macOS 公证、Windows 代码签名）
- [ ] 全部 P0 验收用例通过；P1 通过率 ≥ 95%
- [ ] 基准无 >10% 回归
- [ ] 用真实 Obsidian Vault（≥5k 笔记）导入烟测：打开、搜索、重命名、图谱各操作 30 分钟无异常
- [ ] 崩溃上报（opt-in）与日志脱敏验证

---

## 9. 风险登记

| 风险 | 等级 | 缓解 |
|------|------|------|
| 纯 Rust 框架 IME/文本渲染不达标 | 高 | Phase 0 硬门禁；备选路径：贡献上游 / 降级 Tauri |
| 自研编辑器工程量失控 | 高 | M1 先交付源码模式（价值即可用）；Live Preview 单独里程碑；持续参考 Zed/Helix 开源实现 |
| 插件生态冷启动 | 中 | SDK 体验作为一级需求（AC-PLUGIN-03）；官方移植 10 个高频 Obsidian 插件的等价物 |
| 声明式 UI 无法满足复杂插件 | 中 | V2 提供受限画布；收集插件作者需求驱动组件库扩展 |
| tree-sitter-markdown 与方言冲突 | 中 | 维护自有 fork，方言测试集回归保护 |
完成后，请生成工作日志和部署手册。

---

## 10. 待你确认的开放问题

1. **产品名**：文中暂用 "NoteForge"，请提供正式名称
2. **许可证**：默认核心 Apache-2.0/MIT、应用 AGPL-3.0——若有商业化计划（如未来收费同步服务），建议应用层保留双许可空间，请确认
3. **数学公式**：Typst 引擎方案渲染效果与 KaTeX 有差异，是否接受"不追求与 Obsidian 逐像素一致"？
4. **Vim 模式优先级**：目前定为 P1（M6），如果你是重度 Vim 用户可提前到 M2
5. **遥测**：崩溃上报默认关闭（opt-in），是否同意？
