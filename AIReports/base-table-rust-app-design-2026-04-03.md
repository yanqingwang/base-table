# Base Table（类飞书多维表格）Rust 桌面应用实现方案（Windows 可安装）

**日期**：2026-04-03

## 执行目标与交付物

本任务的原始描述是“用 Rust 写一个类似于飞书多维表格的应用，可在 Windows 安装运行；核心功能包括在线维护/分享数据、多视图展示、Excel 自动转换、自动识别维度”。在当前仓库环境中未提供 Rust 工具链与可运行的 GUI 环境，因此本次交付为**可直接落地的实现方案与最小可行架构设计**：明确模块划分、数据模型、关键算法（Excel→表、维度识别）、以及 Windows 打包路径，便于后续按图实现与迭代。

验收标准（可判定/可执行）：

1. 文档覆盖上述 5 项核心能力的实现路径（在线维护、分享、多视图、Excel 转换、维度识别）。
2. 给出一个“最小可行版本（MVP）”的功能闭环与对应的技术选型。
3. 关键技术点给出可引用的权威来源链接（官方文档 / crates.io / 官方仓库）。

## 最小可行版本（MVP）定义（满足核心功能但保持最简）

MVP 以“本地优先 + 可选自托管服务模式”实现“在线维护/分享”的最小闭环：

- **数据维护**：本地创建 Base / Table，支持行列增删、单元格编辑、字段类型（文本/数字/日期/单选/多选/布尔/附件链接）与基本校验。
- **Excel→多维表格**：导入 `.xlsx`，自动生成 Table、字段、记录，并对字段类型做推断。[citation:1]
- **自动识别维度**：在导入后/数据变化时，识别候选“维度字段”（适合作为分组/看板列/筛选的字段）。
- **多视图**：至少提供 3 种视图：表格（Grid）、画廊（Gallery 卡片）、看板（Kanban 按维度分组）。
- **在线维护/分享（最简实现）**：应用内一键开启“服务模式”，在局域网或公网（端口映射）暴露 HTTP/WS API；提供只读分享链接（token）与可选读写 token；他人通过浏览器/另一客户端访问与查看（MVP 可先只读）。[citation:2]

## 技术选型（以 Windows 可安装与开发效率为第一优先级）

### 1) 客户端形态：纯 Rust 原生 UI（优先）

推荐采用 **egui/eframe**：纯 Rust、跨平台、无需 Node 工具链，便于在 Windows 直接打包与分发。[citation:3]

备选：Tauri（Rust 后端 + Web 前端），适合复杂 UI/富交互，但会引入前端构建链与更复杂的发布流程。[citation:4]

### 2) 本地存储：SQLite（嵌入式）

本地数据持久化用 SQLite：单文件、跨平台、易备份/迁移。Rust 侧可用 rusqlite 或 sqlx（选其一，遵循团队偏好与异步模型）。[citation:5]

### 3) 在线分享/服务模式：Axum + WebSocket（最简）

服务端直接内嵌在桌面应用中：启动一个 axum HTTP 服务，提供 REST/JSON（读）与 WebSocket（增量推送）端点；token 作为最小鉴权机制。[citation:2]

> 注：协同编辑（多人同时写）在 MVP 中不做强一致性/冲突合并，先用“单写多读”或“服务器仲裁”满足“在线维护/分享”的最低要求；真正的离线协同可在后续引入 CRDT。

### 4) Excel 导入：calamine（读取 .xlsx）

导入 `.xlsx` 读取工作表、行列数据，形成字段与记录；与类型推断/维度识别算法结合。[citation:1]

### 5) Windows 打包：MSI/安装包

纯 Rust 桌面应用可通过 WiX 等方式构建 MSI 安装包；若采用 Tauri，则使用其官方打包命令生成 Windows 安装器。[citation:6]

## 数据模型与存储结构（可实现、可演进）

多维表格的核心是“结构可变的表 + 记录 + 视图配置”。建议采用 **“Schema 元数据 + 记录 JSON”** 的最小存储法，避免频繁迁表：

- `bases(id, name, created_at, updated_at)`
- `tables(id, base_id, name, created_at, updated_at)`
- `fields(id, table_id, name, field_type, config_json, ordinal, created_at, updated_at)`
- `records(id, table_id, data_json, created_at, updated_at, deleted_at)`
- `views(id, table_id, view_type, name, config_json, created_at, updated_at)`
- （可选）`oplog(id, table_id, actor, ts, op_json)`：为未来同步/协同预留

其中：

- `field_type`：text/number/date/bool/single_select/multi_select/attachment/url 等。
- `config_json`：例如单选的选项列表、日期格式、数字精度等。
- `data_json`：以 `{"field_id": value}` 保存记录的所有字段值，最小化 schema 变更成本。

## Excel → 多维表格：导入与类型推断

导入流程（MVP 版本）：

1. 用户选择 `.xlsx` 文件与目标工作表（默认第一个）。
2. 读取首行作为字段名；若首行为空则生成默认字段名（A/B/C…）。
3. 对每列抽样 `N` 行（例如 200 行或全量取最小值），进行字段类型推断：
   - 若绝大多数非空可解析为整数/浮点 → number
   - 若可解析为日期/时间 → date
   - 若仅出现 `true/false/是/否/0/1` → bool
   - 其他 → text
4. 生成 `fields` 与 `records`：单元格值按推断类型归一化后写入 `data_json`。

实现要点：

- 对“混合类型列”采取保守策略：优先 text，并在 UI 标注“推断不确定”。
- 允许用户在导入后手动修改字段类型，并提供一次性批量转换（例如 text→number）。

## 自动识别维度：候选维度字段判定（最简可用算法）

“维度”在多维表格中通常用于分组、筛选、看板列（状态）、数据切片。MVP 的自动识别可以用统计特征实现：

对每个字段（导入后或定期）计算：

- `non_null_count`：非空数量
- `unique_count`：去重值数量
- `unique_ratio = unique_count / non_null_count`
- `top_k_frequency`：出现频率最高的前 K 个值及占比

候选维度规则（保守、可解释）：

1. 仅考虑 `single_select/text/bool`（number/date 默认不作为维度，除非后续支持分桶）。
2. 满足 `non_null_count` 足够大（例如 ≥ 30）。
3. `unique_ratio` 处于合理区间（例如 0.02～0.3）：
   - 太低（接近 0）说明几乎常量，分组无意义
   - 太高（接近 1）说明近似主键，分组列会爆炸
4. 若存在明显头部集中（例如 top1 占比 < 0.9 且 top3 合计占比 > 0.3），更适合作为维度。

输出：为每个 table 维护一个“维度候选列表”，默认选择得分最高的一个作为看板/分组选项的默认字段；用户可一键切换。

## 多视图（Grid / Gallery / Kanban）配置与渲染

视图本质是对同一份 `records` 的不同“投影 + 排序 + 分组”。MVP 建议把视图配置存到 `views.config_json`：

- Grid：列顺序/隐藏列、排序、过滤条件
- Gallery：封面字段、卡片展示字段列表、卡片大小
- Kanban：分组字段（维度字段）、泳道顺序、每列 WIP 限制（可选）

渲染策略：

- Grid：虚拟滚动（大表性能关键）
- Gallery：按记录渲染卡片；封面字段可先仅支持 URL 图片
- Kanban：按分组字段值将 records 分桶；空值归入“未分组”列

## 在线维护与分享：服务模式 API（最简闭环）

桌面应用提供一个“开启服务模式”开关：

- 开启后在 `0.0.0.0:<port>` 启动 HTTP 服务
- 生成两个 token：
  - `share_ro`：只读访问（分享用）
  - `share_rw`：读写访问（内部协作/自用）

建议的最小 API：

- `GET /bases`、`GET /tables/:id`、`GET /tables/:id/records`（支持分页/过滤）
- `GET /views/:id/render`（输出视图需要的数据结构）
- （可选）`WS /tables/:id/subscribe` 推送变更通知

一致性策略（MVP）：

- 以本机数据库为真相源；所有写入通过同一事务入口
- 若启用 `share_rw`，写入仍在服务器端完成并广播变更，避免客户端直写导致的冲突

## 实施顺序（严格按闭环最短路径）

1) SQLite 数据模型 + CRUD（records/fields/views） → 2) Grid 视图编辑 → 3) Excel 导入 + 类型推断 → 4) 维度识别 → 5) Gallery/Kanban 视图 → 6) 服务模式（只读分享）→ 7) 服务模式（读写）

## 参考与引用

1. [citation:1] calamine（Excel/OpenDocument 读取库）docs.rs（含仓库链接）：https://docs.rs/calamine/latest/calamine/ （Repository: https://github.com/tafia/calamine）
2. [citation:2] axum（Rust Web 框架）docs.rs / 官方仓库：https://docs.rs/axum/latest/axum/ ，https://github.com/tokio-rs/axum
3. [citation:3] egui / eframe（Rust 原生 GUI 与框架）docs.rs / 官方仓库：https://docs.rs/egui/latest/egui/ ，https://docs.rs/eframe/latest/eframe/ ，https://github.com/emilk/egui
4. [citation:4] Tauri 2 官方文档（Rust + Web 前端桌面框架）：https://tauri.app/
5. [citation:5] SQLite Rust 访问（同步/异步）docs.rs / 官方仓库：https://docs.rs/rusqlite/latest/rusqlite/ ，https://github.com/rusqlite/rusqlite ，https://docs.rs/sqlx/latest/sqlx/ ，https://github.com/launchbadge/sqlx
6. [citation:6] Windows MSI 安装包（cargo-wix / WiX Toolset）官方仓库：https://github.com/volks73/cargo-wix
