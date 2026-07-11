以下是第一批官方插件的完整需求与验收规范。先说明三个我做出的**解释性假设**（如有偏差请纠正，我会修订）：

1. **"diagram" 解释为 Mermaid 语法生态**（Obsidian 中最主流的图表方案）。如果你指的是 Excalidraw（手绘白板）或 draw.io，那是完全不同量级的项目，需要单独立项
2. **"Copilot" 解释为社区插件 obsidian-copilot**（logancyang 版，聊天面板 + 本地文件读取 + Vault 问答），而非 GitHub Copilot 代码补全
3. **90% 门槛按"单插件、使用率加权"计算**，方法论见 §1（这是本文档的地基，请重点审阅）

---

# NoteForge 第一批官方插件 需求设计与验收规范

> 版本：v1.0-draft | 隶属：NoteForge 主需求文档 附录 C
> 前置依赖：主应用 M4（插件系统）完成 | 技术约束：WASM Component Model 插件，纯 Rust 优先

---

## 1. 对等度（Parity）验证方法论 —— 90% 门槛的定义

"支持原产品 90% 以上能力"必须先变成可测量的定义，否则无法作为退出条件。

### 1.1 能力矩阵（Capability Matrix）

每个插件建立一份能力清单，来源三方面：**官方文档全量条目 + 原插件源码功能点扫描 + 社区高频用法采样**（GitHub issues / 论坛 top 帖）。每条能力标注：

| 字段 | 说明 |
|------|------|
| 层级 | T1 核心（权重 3）/ T2 常用（权重 2）/ T3 边缘（权重 1） |
| 实现状态 | full（1.0）/ partial（0.5，须注明缺口）/ none（0） |
| 证据 | 指向通过的自动化测试用例 ID（**无测试证据不得计 full**） |

**对等分 = Σ(权重 × 状态) / Σ权重 ≥ 90%**，按插件独立计算。

### 1.2 分层定级规则（防止自欺）

- T1/T2/T3 划分在需求评审时**冻结**，实现过程中不得为凑分下调未实现项的层级
- 明确声明为"不对等项"的能力（如依赖 Obsidian 私有 API、付费功能）**不移出分母**，除非本文档 §内明确豁免并经你确认
- partial 状态必须附缺口描述，连续两个迭代 partial 不动的项自动升级为风险项

### 1.3 预言机（Oracle）与证据体系

| 插件 | 真值来源 |
|------|---------|
| Dataview | **对照捕获法**：在真实 Obsidian + Dataview 中对固定 fixture vault 执行查询语料，捕获输出为期望值（捕获过程脚本化、版本化）；表达式层直接移植 Dataview 官方测试套件（MIT 许可允许） |
| Copilot | **Mock LLM 服务器**：确定性响应，验证请求构造/上下文注入/流式处理的正确性；真实 provider 仅做每日 smoke |
| Mermaid | mermaid.js 官方 demo/测试语料 + **语义等价渲染**判定（见 §5.5，像素级对等不可行也无必要） |
| Remotely Save | **互操作测试**：原插件与本插件对同一远端交叉读写（加密格式兼容是硬性要求）+ 双设备同步收敛属性测试 |

### 1.4 迭代闭环（不达标时的流程）

```
评分 < 90% ──► 输出缺口报告（未达项清单 + 根因分类：需求缺口/宿主API缺口/技术不可行）
           ──► 需求文件修订（版本递增）──► 下一迭代 ──► 重新评分
技术不可行项 ──► 升级至你决策：豁免（移出分母，需书面确认）或 更换技术路线
```

### 1.5 测试数据

在 nf-vaultgen 中新增 `plugin-compat` profile 族：`dataview-fixture`（含 inline fields / 任务元数据 / 多类型 frontmatter 的 500 笔记 vault，manifest 扩展记录字段真值）、`sync-fixture`（含二进制附件、深目录、Unicode 文件名的 300 文件 vault）。

---

## 2. 宿主 API 缺口分析（前置依赖，主文档 §5 插件系统需扩展）

这四个插件对宿主能力的需求超出主文档 M4 的基础 WIT 接口，以下扩展必须先行排期：

| ID | 扩展 | 驱动方 | 要点 |
|----|------|--------|------|
| H-EXT-1 | 代码块处理器注册 | Dataview, Diagram | 插件认领 ` ```dataview ` 等围栏语言，返回渲染树；编辑器在阅读/实时模式调用，**必须异步 + 可取消**（滚动出视口即取消） |
| H-EXT-2 | 网络能力 | Copilot, RemoteSync | HTTP(S) 请求，**按域名白名单授权**（manifest 声明 + 安装时用户确认）；支持流式响应（SSE/chunked）供 LLM 输出 |
| H-EXT-3 | 密钥存储 | Copilot, RemoteSync | API key / token 存 OS keychain（macOS Keychain / Windows Credential Manager / Secret Service），**禁止落明文配置文件** |
| H-EXT-4 | 元数据索引查询 | Dataview | 宿主暴露 nf-index 的结构化查询：按标签/路径/链接关系取文件集，取单文件 frontmatter/tasks/headings/lists；**避免插件重复解析全库** |
| H-EXT-5 | 声明式 UI 面板 | Copilot, RemoteSync | 插件以声明式 widget 树（文本/输入框/按钮/下拉/列表/Markdown 渲染区/进度条）描述侧边栏面板，宿主原生渲染；支持增量更新（流式聊天需要） |
| H-EXT-6 | 后台任务与定时器 | RemoteSync, Copilot | 注册周期任务；宿主管理生命周期，退出前给予收尾窗口 |
| H-EXT-7 | 全库文件读写（含二进制）+ 变更订阅 | RemoteSync, Copilot | 附件级 bytes 读写；文件事件流订阅（复用主文档 FR-103 事件） |
| H-EXT-8 | OAuth 辅助 | RemoteSync | 打开系统浏览器 + 本地回环端口捕获回调（或手动粘贴 code 的降级路径） |
| H-EXT-9 | 插件私有存储 | Copilot, Dataview | KV + blob 存储（向量索引、查询缓存），随插件卸载清理 |
| H-EXT-10 | 状态栏/命令/设置页注册 | 全部 | 命令面板项、状态栏图标、设置 UI（声明式 schema） |

**验收**：每个 H-EXT 有独立 AC 与示例插件测试，随对应插件里程碑交付。

---

## 3. P1：nf-dataquery（对标 Dataview）

### 3.1 原产品能力清单（矩阵摘要）

| 能力域 | 层级 | 内容 |
|--------|------|------|
| DQL 查询类型 | T1 | LIST / TABLE / TASK；CALENDAR 为 T2 |
| 数据源 | T1 | `#tag`、`"folder"`、`[[]]` 出入链、`and/or/-` 组合；`csv(...)` 为 T3 |
| 数据命令 | T1 | FROM / WHERE / SORT / GROUP BY / FLATTEN / LIMIT |
| 隐式字段 | T1 | `file.name/path/folder/link/size/ctime/mtime/cday/mday/tags/etags/aliases/inlinks/outlinks/tasks/lists/day` 全量 |
| 内联字段 | T1 | `Key:: Value` 行级与括号内 `(Key:: Value)` 形态、字段名规范化（小写、空格转连字符） |
| 任务元数据 | T2 | emoji 简写（🗓️due ✅completion ➕created 🛫start ⏳scheduled）、自定义 `[key:: value]`、完成状态/嵌套任务 |
| 表达式语言 | T1 | 算术/比较/索引/lambda；类型系统：date、duration、link、list、object、null 语义 |
| 函数库 | T1/T2 | 约 60 个：日期（`date/dur/dateformat`）、聚合（`sum/min/max/average/length`）、列表（`map/filter/sort/reverse/flat/slice/all/any`）、字符串（`regexreplace/regexmatch/split/lower/...`）、元（`typeof/default/choice/meta/link/embed`）——逐函数入矩阵，官方文档全列 |
| 内联查询 | T2 | 行内 `` `= expr` `` 实时求值渲染 |
| DataviewJS | T2 | ` ```dataviewjs ` 代码块与行内 `$=`；`dv.pages/current/table/list/taskList/el/header/paragraph/io.load/query` API |
| 设置项 | T3 | 刷新间隔、日期显示格式、null 显示值、结果上限 |

### 3.2 关键范围决策

**D-1（DataviewJS，需你确认）**：DataviewJS 是 JS API，纯 Rust 无法直接执行。方案：插件内嵌 **Boa（纯 Rust JS 引擎）编译进 WASM**，实现 `dv.*` API 垫片，覆盖文档列明的核心 API（非完整 Obsidian DOM 环境——`dv.el` 输出映射为声明式 widget 而非任意 HTML）。按此方案 DataviewJS 计入分母、目标 partial-to-full；若你选择豁免 DataviewJS，DQL 层对等目标提高到 95% 作为补偿。

**D-2**：查询结果为**实时视图**——索引更新后 2s 内自动刷新（对标原插件行为）。

### 3.3 功能需求（摘）

- FR-DQ-01：完整实现 §3.1 T1 域的 DQL 文法（附独立 EBNF 文档，作为实现与测试共同依据）
- FR-DQ-02：内联字段解析注册到宿主索引扩展点（H-EXT-4 的写侧），使字段可被其他插件复用
- FR-DQ-03：类型语义与 Dataview 对齐：date 运算产生 duration、null 传播规则、跨类型比较排序规则——以移植的官方测试套件为准绳
- FR-DQ-04：错误呈现：语法错误显示位置与建议，禁止静默空结果
- FR-DQ-05：性能：standard-10k vault 上典型查询（单 tag FROM + WHERE + SORT）P95 < 100ms；全库无 FROM 查询 < 500ms

### 3.4 对等验证协议

1. **表达式层**：移植 Dataview 仓库测试套件（MIT），通过率计入矩阵对应项
2. **查询层**：`dataview-fixture` vault + ≥300 条 DQL 语料（官方文档示例全量 + 社区采样），对照捕获法比对结果集（行集合 + 排序 + 分组结构 + 渲染值格式化）
3. **DataviewJS 层**：30 个代表性脚本语料，比对输出结构
4. 评分报告自动生成：`parity-report-dataquery.md`（矩阵逐项状态 + 证据链接）

### 3.5 验收标准（摘）

```
AC-DQ-01 [int] DQL 语料对照：≥300 条语料结果与 oracle 一致率 ≥ 95%（不一致项逐条归因）
AC-DQ-02 [unit] 表达式套件：移植测试通过率 100%（豁免项白名单化）
AC-DQ-03 [bench] FR-DQ-05 性能达标
AC-DQ-04 [int] 实时性：修改笔记 frontmatter 后 2s 内打开中的查询视图刷新
AC-DQ-05 [int] 恶意/病理查询（深递归表达式、超大结果集）不冻结 UI、不使插件宿主崩溃
AC-DQ-EXIT 对等分 ≥ 90%
```

**风险**：R-DQ-1 Boa 性能与兼容性不确定（缓解：DataviewJS 语料前置 spike，M 阶段第 1 周出可行性结论）。

---

## 4. P2：nf-copilot（对标 obsidian-copilot 免费层）

### 4.1 原产品能力清单（矩阵摘要）

| 能力域 | 层级 | 内容 |
|--------|------|------|
| 聊天面板 | T1 | 侧边栏对话 UI、流式输出、停止生成、多轮上下文、会话历史、**会话保存为笔记** |
| Provider 矩阵 | T1 | OpenAI / Anthropic / Gemini / OpenRouter / **Ollama（本地）** / LM Studio / 任意 OpenAI 兼容端点（自定义 base URL + model）；Azure OpenAI 为 T2 |
| 上下文注入 | T1 | 当前笔记全文、选中文本、`@笔记名` 引用任意笔记（多选）；URL 内容注入为 T3 |
| 快捷命令 | T2 | 对选区：总结、翻译（多语言）、修正语法、简化、扩写/缩写、变换语气、生成大纲；结果插入/替换/复制三种落地方式 |
| 自定义提示词 | T2 | 用户提示词模板库，变量占位（`{selection}` `{activeNote}` 等），命令面板触发 |
| Vault 问答（RAG） | T1 | 本地嵌入索引（embedding provider 可选，含 Ollama 本地嵌入）、相似度检索、**引用来源标注（可点击跳转）**、索引增量更新与手动重建 |
| 参数设置 | T2 | 温度、max tokens、系统提示词、按功能选模型 |
| Plus 付费/agentic 功能 | — | **明确豁免**（依赖厂商私有后端，移出分母；需你确认） |

### 4.2 功能需求（摘）

- FR-CP-01：Provider 抽象层——统一 chat/embedding 接口 + 各厂商适配器；新增 provider 只需实现适配器（为国产模型预留：**OpenAI 兼容端点必须一等公民**，DeepSeek/Qwen/智谱经此路径接入并纳入测试矩阵）
- FR-CP-02：本地文件读取权限模型——读取任何笔记内容进入 LLM 上下文前，遵循能力授权（H-EXT-7）；设置中提供**排除目录/标签**（敏感笔记不进入 RAG 索引与上下文）
- FR-CP-03：RAG 管线——分块策略（按标题层级 + 定长回退，块 512-1024 token 可配）、嵌入缓存（内容哈希去重，H-EXT-9 blob 存储）、检索 top-k + 相关度阈值、上下文组装含来源路径
- FR-CP-04：流式渲染——token 级增量更新聊天面板（H-EXT-5 增量协议），首 token 延迟只受网络约束，UI 侧开销 < 16ms/帧
- FR-CP-05：密钥经 H-EXT-3 keychain 存取；任何日志/错误上报**不得含密钥与笔记内容**
- FR-CP-06：网络域白名单 = 所配 provider 域，安装与新增端点时用户确认

### 4.3 对等验证协议

- Mock LLM 服务器（确定性脚本响应 + 可注入延迟/错误/流中断）验证：请求体构造正确性（逐 provider 快照测试）、上下文注入内容精确性、流式与中断处理、重试逻辑
- RAG 质量：`dataview-fixture` vault + 30 组种植问答对（答案仅存在于特定笔记），检索命中率 = 含答案笔记进入 top-5 的比例 ≥ 90%
- 真实 provider 每日 smoke（OpenAI 兼容端点 ×1、Anthropic ×1、Ollama 本地 ×1）

### 4.4 验收标准（摘）

```
AC-CP-01 [int] Provider 矩阵：全部 T1 provider 经 mock 快照测试；Ollama 真实本地端到端通过
AC-CP-02 [int] 上下文精确性：@引用 3 篇笔记 + 选区时，请求体包含且仅包含声明内容（无泄漏其他笔记）
AC-CP-03 [int] RAG 命中率 ≥ 90%（种植问答集）；来源引用可点击跳转到对应笔记
AC-CP-04 [int] 排除目录中的笔记：不出现在 RAG 索引、@补全、任何请求体中（安全红线，专项测试）
AC-CP-05 [int] 网络中断/超时/429：友好错误 + 可重试，不丢已生成内容
AC-CP-06 [manual] 流式体验：肉眼无卡顿，停止按钮 500ms 内生效
AC-CP-EXIT 对等分 ≥ 90%（Plus 层豁免后）
```

**风险**：R-CP-1 嵌入索引在 10k+ vault 的构建时长与存储体积（缓解：增量 + 后台限速构建，基准入 AC）；R-CP-2 原插件为 AGPL——**清洁室纪律，见 §8**。

---

## 5. P3：nf-diagram（对标 Mermaid 生态）

### 5.1 技术路线（关键决策）

mermaid.js 深度依赖浏览器 DOM，无 WebView 前提下**不可复用**，必须纯 Rust 重实现"Mermaid 语法兼容渲染器"：`语法解析 → 布局引擎（分层/力导向/时序专用）→ SVG 生成 → 宿主矢量渲染`。这是四个插件中技术风险最高者，按图表类型分期。

### 5.2 能力清单（按真实使用率加权）

| 图表类型 | 层级 | 语法覆盖要点 |
|---------|------|-------------|
| flowchart | T1 | 全方向、全节点形状、子图、边样式/标签、`classDef`/`style`、`click` 超链接（JS 回调豁免） |
| sequenceDiagram | T1 | participant/actor、激活条、loop/alt/opt/par/critical、note、autonumber、box 分组 |
| classDiagram | T2 | 类成员/可见性、六种关系、泛型、注解 |
| stateDiagram-v2 | T2 | 复合状态、并行区、choice/fork/join、note |
| erDiagram | T2 | 实体属性、关系基数标记 |
| pie / gantt | T2 | gantt：section、依赖、里程碑、日期轴、excludes |
| mindmap / timeline / gitGraph | T3 | |
| journey / quadrant / requirement / C4 / sankey / xychart / block | T3 | 允许 partial/none，靠 T1/T2 满覆盖撑 90% |
| 通用能力 | T1 | `%%{init}%%` 主题指令、深浅色主题跟随、错误定位提示、`%%注释%%` |

加权说明：flowchart + sequence 占实际使用 ~65%（社区语料统计口径写入矩阵附录），两者 full + T2 五类 full 即可越过 90% 线；T3 全 none 时对等分约 91%——**因此 T1/T2 的语法覆盖深度是成败关键**，每类内部再建子矩阵（如 flowchart 拆 ~40 个语法特性逐项计分）。

### 5.3 功能需求（摘）

- FR-DG-01：认领 ` ```mermaid ` 代码块（H-EXT-1），阅读模式与实时预览模式均渲染
- FR-DG-02：渲染为矢量（缩放不糊），支持导出 SVG/PNG
- FR-DG-03：语法错误显示行列号 + 错误说明，渲染失败降级为代码块原文展示
- FR-DG-04：单图渲染 P95 < 50ms（100 节点 flowchart）；病理输入（1 万节点）超时熔断不冻结 UI
- FR-DG-05：布局质量硬约束——节点零重叠、边标签不遮挡节点、文本不溢出节点边界（自动扩容）

### 5.4 语义等价渲染判定（替代像素对等）

对每个语料图，自动断言结构等价：**节点集合、边集合、标签文本、方向性、分组归属**与 mermaid.js 解析结果一致（通过对照运行 mermaid CLI 提取其内部模型作为 oracle）；布局美学由人工评审面板抽检（每类型 20 图，3 人评分，均分 ≥ 4/5 视为通过）。

### 5.5 验收标准（摘）

```
AC-DG-01 [int] mermaid 官方语料（T1/T2 类型子集，≥400 图）结构等价通过率 ≥ 95%
AC-DG-02 [unit] 解析器 fuzz 1 小时无 panic 无超时（复用 deep-nest 思路的病理语料）
AC-DG-03 [bench] FR-DG-04 性能达标
AC-DG-04 [manual] 布局美学评审 ≥ 4/5；深浅主题下可读性检查
AC-DG-05 [int] 同文档 20 个图表混排：渲染相互隔离，单图错误不影响其他
AC-DG-EXIT 对等分 ≥ 90%
```

**风险**：R-DG-1 布局引擎工作量易被低估（Sugiyama 分层布局 + 时序图专用布局是两套独立引擎；缓解：优先调研 `layout-rs` 等现有 crate 的可复用度，spike 先行）。

---

## 6. P4：nf-remotesync（对标 Remotely Save）

### 6.1 能力清单（矩阵摘要）

| 能力域 | 层级 | 内容 |
|--------|------|------|
| 后端：S3 兼容 | T1 | AWS S3 / Cloudflare R2 / MinIO（自定义 endpoint、region、path-style） |
| 后端：WebDAV | T1 | 标准 WebDAV（Nextcloud / 坚果云——**国内用户主力**，注意其请求频率限制） |
| 后端：Dropbox / OneDrive | T2 | OAuth 流程（H-EXT-8） |
| 后端：Google Drive / Box / pCloud 等 | T3 | 允许 none |
| 同步算法 | T1 | 双向增量同步：本地/远端状态对比 + 上次同步基线三方合并；删除传播；重命名处理；**并发修改冲突策略**（较新者胜 / 保留双副本可配） |
| E2E 加密 | T1 | **RClone Crypt 格式**（文件名 + 内容加密，与原插件互操作）；旧版 OpenSSL AES-256-CBC 格式为 T2（仅解密迁移用） |
| 触发方式 | T1 | 手动 / 定时 / 启动时；命令面板 + 状态栏入口 |
| 过滤规则 | T2 | 忽略路径/正则、跳过超大文件阈值、是否同步隐藏文件与插件配置目录 |
| 可观测性 | T2 | 同步日志、进度显示、dry-run 预览待传清单 |

### 6.2 功能需求（摘）

- FR-RS-01：同步引擎为独立状态机，**每一步可崩溃恢复**（断电/杀进程后重跑收敛到一致，不产生半文件——远端上传完成前不更新基线）
- FR-RS-02：与主应用文件监听协作：同步写入的本地变更须正确触发索引更新且不引发回环同步
- FR-RS-03：加密互操作硬性要求——原 Remotely Save 加密上传的库，本插件配同一密码可完整拉取解密；反向亦然（这是用户迁移的生命线）
- FR-RS-04：网络健壮性：断点续传（分块上传）、指数退避重试、单文件失败不中断整体同步（失败清单汇总）
- FR-RS-05：凭证经 H-EXT-3；OAuth 经 H-EXT-8，提供手动粘贴 code 降级路径

### 6.3 对等验证协议

- **互操作矩阵**（核心证据）：{原插件写 → 本插件读} × {本插件写 → 原插件读} × {明文, RClone Crypt} × {S3(MinIO), WebDAV}，全组合字节级校验（sync-fixture vault，含二进制附件与 Unicode 文件名）
- **双设备收敛属性测试**：两个实例 + 本地 MinIO/WebDAV 容器，随机操作序列（复用 nf-vaultgen churn driver）交替同步，断言最终收敛且无数据丢失；含冲突场景专项（同文件双端修改、单端删除对端修改）
- 弱网注入：随机断流/延迟/限速下的正确性

### 6.4 验收标准（摘）

```
AC-RS-01 [int] 互操作矩阵全组合通过（字节级一致）
AC-RS-02 [int] 双设备 churn 收敛测试：1000 操作 × 10 轮同步后两端一致，零丢失
AC-RS-03 [int] 冲突场景：策略行为符合配置（较新者胜时间容差定义 ±2s；双副本模式命名规则与原插件一致）
AC-RS-04 [int] 同步中途 kill -9，重启后重跑收敛，远端与本地无半文件
AC-RS-05 [int] 坚果云 WebDAV 真实账号 smoke（限频场景退避正确）
AC-RS-06 [bench] sync-fixture（300 文件/50MB）全量初次同步 < 120s@100Mbps；增量（10 文件变更）< 10s
AC-RS-EXIT 对等分 ≥ 90%
```

**风险**：R-RS-1 RClone Crypt 格式细节（文件名混淆、EME 加密）实现偏差导致互操作失败（缓解：直接依赖 Rust 社区已有 rclone crypt 实现或以 rclone 测试向量为准绳）；R-RS-2 OneDrive/Dropbox 应用注册与 CI 凭证管理。

---

## 7. 里程碑与依赖排序

```
MP-0  宿主扩展（H-EXT-1..10）+ plugin-compat fixture profiles     ── 4-6 周
MP-1  nf-diagram T1（flowchart + sequence）    ← 最先验证 H-EXT-1 渲染管线
MP-2  nf-dataquery DQL 层                       ← 验证 H-EXT-4 索引 API
MP-3  nf-remotesync（S3 + WebDAV + Crypt）      ← 验证 H-EXT-2/3/6/7/8
MP-4  nf-copilot                                ← 宿主面最广，最后集成
MP-5  nf-diagram T2 补全 + nf-dataquery DataviewJS(Boa) + 二线后端
GATE  四插件各自 parity-report ≥ 90% → 批次关闭；任一 < 90% → §1.4 闭环继续
```

两个 spike 前置（MP-0 期间并行）：Boa 运行 dataviewjs 语料可行性；Rust 布局引擎选型。

## 8. 许可证与清洁室纪律

| 原插件 | 许可 | 允许动作 |
|--------|------|---------|
| Dataview | MIT | 可移植测试套件与文法定义，注明出处 |
| obsidian-copilot | **AGPL-3.0** | **禁止阅读其源码后编写对应模块**——仅从官方文档与黑盒行为重建需求（本文档 §4 即依据此写成）；实现者签署清洁室声明 |
| mermaid | MIT | 可复用语法文档与测试语料 |
| Remotely Save | Apache-2.0 | 可参考协议与格式实现，保留 NOTICE |

## 9. 开放问题（需你决策）

1. **"diagram" 的指向确认**：Mermaid 假设是否成立？是否还需要 Excalidraw 类白板（若是，建议列入第二批单独立项）
2. **DataviewJS 路线**（§3.2 D-1）：Boa 内嵌方案 vs 豁免——影响 90% 的分母构成
3. **Copilot Plus 付费功能豁免**是否接受（§4.1）
4. **RemoteSync 后端优先级**：国内用户为主则坚果云 WebDAV/S3 提到最优先，OneDrive/Dropbox 可降级——请给出目标用户画像
5. CI 需要长期维护的**真实云账号凭证**（坚果云/Dropbox/OneDrive），需确认由谁提供与轮换

---

确认开放问题（尤其 1、2、4）后，我可以继续展开任一插件的完整版：逐函数/逐语法特性的全量能力矩阵表（对等评分的正式分母）、DQL 的 EBNF 文法、或 RClone Crypt 互操作的测试向量清单。