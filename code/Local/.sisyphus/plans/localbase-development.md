# LocalBase 开发执行规划

## TL;DR

> **项目**：LocalBase - 本地 No-code 数据库管理工具（类 NocoDB）
>
> **核心特性**：电子表格界面 + 表单分享 + QR 码 + 多语言
>
> **技术栈**：Tauri v2 + Leptos + Axum + SQLite (rusqlite)
>
> **交付物**：可运行的二进制应用 + 完整源码
>
> **预估工期**：13 周（MVP 9 周）
>
> **并行度**：可 3 人协作，按模块划分

---

## Context

### 项目背景

用户希望构建一个本地运行的 No-code 数据库工具，参考 NocoDB 的电子表格式数据管理体验。需支持 Windows 和 Arch Linux，数据存储使用 SQLite。

**新增核心功能**：表单分享 + QR 码 + 多语言支持

### 约束条件

- 目标平台：Windows 10/11 (x64), Arch Linux (x64)
- 技术栈：Rust (Tauri + Leptos + Axum)
- 数据存储：SQLite
- 部署方式：单机运行，自带 Web 服务器
- HTTP 端口：7777（默认）
- 分享端口：7778（可选）
- 数据目录：`~/.localbase/`

### 多语言支持

| 语言 | 代码 | 状态 |
|------|------|------|
| 中文 (简体) | zh-CN | ✅ |
| 中文 (繁体) | zh-TW | ✅ |
| 泰文 | th | ✅ |
| 马来文 | ms | ✅ |
| 菲律宾文 | fil | ✅ |
| 英文 | en | ✅ |

---

## Work Objectives

### 核心交付物

1. 可运行的 Tauri 应用（.exe / 二进制）
2. Leptos 前端界面（Grid 视图）
3. Axum Web 服务器（表单分享）
4. SQLite 数据存储层
5. 表管理功能（CRUD）
6. 记录管理功能（增删改查）
7. **表单分享 + QR 码生成**
8. **多语言系统（界面 + 表单）**
9. CSV 导入导出

### 定义完成标准

- [ ] `cargo tauri build` 成功编译
- [ ] 应用启动无崩溃
- [ ] 可创建表并添加字段
- [ ] Grid 视图正常显示数据
- [ ] 可编辑单元格数据
- [ ] **可生成表单 QR 码**
- **扫码后打开表单页面，可填写并提交**
- **表单支持 6 种语言**
- **提交数据实时写入 SQLite**
- CSV 导入导出功能正常
- Windows 和 Linux 均测试通过

---

## Execution Strategy

### 总体策略

采用 **增量迭代** 方式开发：

1. 先跑通最小闭环（框架 + 空 Grid + Web 服务器）
2. 实现多语言基础框架
3. 实现表单分享功能
4. 逐步添加其他功能
5. 每个阶段可独立测试
6. 最终集成

### 并行化设计

```
Wave 1 (基础建设 - 可并行):
├── T1: 项目初始化 + 基础配置
├── T2: 数据库层封装
├── T3: 前端基础布局
├── T4: Web 服务器 (Axum)

Wave 2 (核心功能 - 串行依赖 Wave1):
├── T5: Grid 视图组件
├── T6: 表管理功能
├── T7: 记录 CRUD

Wave 3 (多语言 + 分享 - 核心新增):
├── T8: 多语言系统框架
├── T9: 翻译文件准备 (6种语言)
├── T10: 表单分享功能
├── T11: QR 码生成

Wave 4 (增强功能):
├── T12: 排序筛选
├── T13: 扩展字段类型
├── T14: 导入导出 (CSV)

Wave 5 (系统集成):
├── T15: 系统托盘
├── T16: 打包发布
```

### 依赖矩阵

```
T1  (项目初始化)     → T5, T6, T7, T15
T2  (数据库层)      → T5, T6, T7, T14
T3  (前端基础)       → T5, T8
T4  (Web 服务器)     → T10, T11
T5  (Grid 视图)     → T12, T14
T6  (表管理)        → T14
T7  (记录 CRUD)     → T10, T12
T8  (多语言框架)     → T9, T10
T9  (翻译文件)       → T10
T10 (表单分享)       → T11
T11 (QR 码生成)      →
T12 (排序筛选)      →
T13 (字段扩展)      →
T14 (导入导出)       → T16
T15 (系统托盘)      → T16
T16 (打包发布)       → 终点
```

---

## TODOs

- [ ] 1. 项目初始化 - Tauri + Leptos + Axum 基础项目

  **What to do**:
  - 创建 Tauri v2 项目
  - 集成 Leptos 前端框架
  - 集成 Axum Web 服务器
  - 配置 TailwindCSS
  - 设置日志系统 (tracing)
  - 验证空壳可编译运行

  **Must NOT do**:
  - 不添加任何业务逻辑
  - 不引入不必要的依赖

  **Recommended Agent Profile**:
  > **Category**: `deep`
  > - Reason: 涉及多框架集成，需要理解 Tauri + Leptos + Axum 的集成方式
  > **Skills**: `leptos`, `tauri`
  > - `leptos`: Leptos 框架集成配置
  > - `tauri`: Tauri v2 配置和命令

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T5, T6, T7, T8, T15
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `https://github.com/leptoshq/leptos/tree/main/examples/todo_app_tauri` - Leptos + Tauri 集成示例
  - `https://github.com/tokio-rs/axum/tree/main/examples` - Axum 示例

  **External References**:
  - Tauri v2 官方文档: `https://tauri.app/v2/`
  - Leptos 官方文档: `https://leptos-rs.github.io/leptos/`
  - Axum 官方文档: `https://docs.rs/axum/latest/axum/`

  **Acceptance Criteria**:
  - [ ] `cargo create-tauri-app` 成功创建项目
  - [ ] Leptos 页面可正常渲染
  - [ ] Axum 服务器可启动
  - [ ] `cargo tauri dev` 启动无报错
  - [ ] 浏览器访问 localhost:7777 显示页面
  - [ ] `curl http://localhost:7777/api/health` 返回 200

  **QA Scenarios**:

  ```
  Scenario: 应用启动验证
    Tool: Bash
    Preconditions: Rust 环境已安装
    Steps:
      1. cd /path/to/localbase
      2. cargo tauri dev
      3. 等待编译完成
      4. 检查进程运行状态
      5. curl http://localhost:7777
      6. curl http://localhost:7777/api/health
    Expected Result: HTTP 200, 返回 HTML 页面, health 返回 200
    Failure Indicators: 编译错误、端口占用、应用崩溃
    Evidence: .sisyphus/evidence/t1-startup.{ext}
  ```

  **Commit**: YES
  - Message: `feat: initialize Tauri + Leptos + Axum project`
  - Files: `Cargo.toml`, `tauri.conf.json`, `src-ui/**`, `src/web/**`

---

- [ ] 2. 数据库层封装

  **What to do**:
  - 集成 rusqlite
  - 设计数据库 Schema（表、字段、记录的元数据表）
  - 设计分享配置表（share_configs）
  - 设计多语言配置表（i18n_settings）
  - 实现连接管理
  - 实现基础 CRUD 操作
  - 数据库初始化（首次运行时创建）

  **Must NOT do**:
  - 不实现复杂的关联查询
  - 不实现事务管理（MVP 范围外）

  **Recommended Agent Profile**:
  > **Category**: `deep`
  > - Reason: 数据库设计需要考虑 Schema 演进和性能
  > **Skills**: `rust`, `sqlite`
  > - `rust`: Rust 异步/错误处理
  > - `sqlite`: 数据库设计和 SQL 优化

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T1, T3, T4 并行)
  - **Blocks**: T5, T6, T7, T14
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - `rusqlite` 官方文档 - SQLite Rust 绑定
  - 常见设计模式：Repository Pattern

  **External References**:
  - rusqlite 文档: `https://docs.rs/rusqlite/`
  - SQLite 数据类型: `https://www.sqlite.org/datatype3.html`

  **Acceptance Criteria**:
  - [ ] 数据库文件创建成功
  - [ ] 可创建用户表
  - [ ] 可插入/查询/更新/删除记录
  - [ ] 元数据结构正确
  - [ ] 分享配置表正确创建

  **QA Scenarios**:

  ```
  Scenario: 数据库初始化
    Tool: Bash
    Preconditions: 项目已初始化
    Steps:
      1. 启动应用
      2. 检查 ~/.localbase/ 目录
      3. 验证 data.db 存在
      4. 查询 sqlite_master 表
      5. 检查 share_configs 表存在
    Expected Result: 数据库文件存在，Schema 正确
    Failure Indicators: 目录未创建、Schema 错误
    Evidence: .sisyphus/evidence/t2-db-init.{ext}

  Scenario: 基础 CRUD 测试
    Tool: Bash (sqlite3)
    Preconditions: 数据库已初始化
    Steps:
      1. 启动应用
      2. 创建测试表
      3. 插入测试数据
      4. 查询验证
      5. 更新数据
      6. 删除数据
    Expected Result: 所有操作成功
    Failure Indicators: SQL 错误、数据丢失
    Evidence: .sisyphus/evidence/t2-db-crud.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement SQLite database layer`
  - Files: `src/db/**`

---

- [ ] 3. 前端基础布局

  **What to do**:
  - 设计整体布局结构（侧边栏 + 主内容区）
  - 实现路由系统
  - 创建页面骨架（首页、表视图、分享设置）
  - 集成 TailwindCSS
  - 基础状态管理
  - 语言切换器 UI

  **Must NOT do**:
  - 不实现具体业务逻辑
  - 不处理数据请求

  **Recommended Agent Profile**:
  > **Category**: `visual-engineering`
  > - Reason: 前端 UI 布局和样式设计
  > **Skills**: `leptos`, `frontend-design`
  > - `leptos`: Leptos 组件开发
  > - `frontend-design`: TailwindCSS 样式设计

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T1, T2, T4 并行)
  - **Blocks**: T5, T8
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - Leptos 官方示例: todo_app_tauri
  - TailwindCSS 组件设计

  **External References**:
  - TailwindCSS 文档: `https://tailwindcss.com/docs`
  - Leptos 路由: `https://leptos-rs.github.io/leptos/router.html`

  **Acceptance Criteria**:
  - [ ] 首页显示表列表（静态数据）
  - [ ] 侧边栏正常显示
  - [ ] 页面间可切换
  - [ ] 语言切换器 UI 存在
  - [ ] 样式符合预期

  **QA Scenarios**:

  ```
  Scenario: 前端布局验证
    Tool: Playwright
    Preconditions: 应用已启动
    Steps:
      1. 打开浏览器访问 localhost:7777
      2. 截图保存初始页面
      3. 检查侧边栏元素存在
      4. 检查主内容区存在
      5. 检查语言切换器存在
    Expected Result: 页面结构正确，样式完整
    Failure Indicators: 布局错乱、样式丢失
    Evidence: .sisyphus/evidence/t3-layout.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement frontend basic layout`
  - Files: `src-ui/src/**`

---

- [ ] 4. Web 服务器 (Axum)

  **What to do**:
  - 配置 Axum 服务器
  - 路由设置（健康检查、表单 API）
  - 静态文件服务
  - CORS 配置
  - 表单页面 HTML 模板
  - 多语言表单支持

  **Must NOT do**:
  - 不实现完整的 REST API（MVP 范围外）

  **Recommended Agent Profile**:
  > **Category**: `deep`
  > - Reason: Web 服务器需要处理多种请求类型
  > **Skills**: `rust`, `web`
  > - `rust`: Rust 异步编程
  > - `web`: HTTP 服务器配置

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T1, T2, T3 并行)
  - **Blocks**: T10, T11
  - **Blocked By**: None

  **References**:

  **Pattern References**:
  - Axum 官方示例
  - Tower HTTP 中间件使用

  **External References**:
  - Axum 文档: `https://docs.rs/axum/latest/axum/`

  **Acceptance Criteria**:
  - [ ] Axum 服务器正常启动
  - [ ] `/api/health` 返回 200
  - [ ] 静态文件可访问
  - [ ] `/form/{id}` 返回表单页面
  - [ ] CORS 配置正确

  **QA Scenarios**:

  ```
  Scenario: Web 服务器验证
    Tool: Bash
    Preconditions: 应用已启动
    Steps:
      1. curl http://localhost:7777/api/health
      2. curl http://localhost:7777/ -I
      3. curl http://localhost:7777/form/test -I
    Expected Result: 所有端点正常响应
    Failure Indicators: 404、500 错误
    Evidence: .sisyphus/evidence/t4-websrv.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement Axum web server`
  - Files: `src/web/**`, `public/**`

---

- [ ] 5. Grid 视图组件

  **What to do**:
  - 实现表格组件（表头 + 数据行）
  - 单元格渲染
  - 单元格编辑（双击进入编辑模式）
  - 列宽拖拽调整
  - 行高设置
  - 分页加载

  **Must NOT do**:
  - 不实现复杂的单元格合并
  - 不实现 Excel 公式

  **Recommended Agent Profile**:
  > **Category**: `visual-engineering`
  > - Reason: Grid 组件是核心 UI 组件，需要精细设计
  > **Skills**: `leptos`, `frontend-design`
  > - `leptos`: 响应式组件开发
  > - `frontend-design`: 表格样式和交互设计

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T12, T14
  - **Blocked By**: T1, T3

  **References**:

  **Pattern References**:
  - Leptos 数据展示示例
  - 类似 AG-Grid 的交互模式

  **External References**:
  - Leptos 信号系统: `https://leptos-rs.github.io/leptos/signals.html`

  **Acceptance Criteria**:
  - [ ] 表格正常渲染 100 条数据
  - [ ] 双击单元格可编辑
  - [ ] 表头点击可排序
  - [ ] 列宽可拖拽调整
  - [ ] 分页切换正常

  **QA Scenarios**:

  ```
  Scenario: Grid 视图基本渲染
    Tool: Playwright
    Preconditions: 应用已启动，表有数据
    Steps:
      1. 点击进入某个表
      2. 等待 Grid 渲染完成
      3. 检查表头显示正确
      4. 检查数据行显示正确
      5. 截图保存
    Expected Result: Grid 正常渲染，数据显示正确
    Failure Indicators: 表格错乱、数据缺失
    Evidence: .sisyphus/evidence/t5-grid-render.{ext}

  Scenario: 单元格编辑
    Tool: Playwright
    Preconditions: Grid 有数据
    Steps:
      1. 双击某个单元格
      2. 输入新内容 "test_value"
      3. 按 Enter 确认
      4. 刷新页面
      5. 检查数据是否保存
    Expected Result: 编辑成功，数据持久化
    Failure Indicators: 编辑失败、数据未保存
    Evidence: .sisyphus/evidence/t5-cell-edit.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement Grid view component`
  - Files: `src-ui/src/components/grid.rs`

---

- [ ] 6. 表管理功能

  **What to do**:
  - 表创建 UI + 后端
  - 表列表显示
  - 表删除功能（含确认对话框）
  - 表重命名
  - 字段管理（添加/删除/修改字段）
  - 表结构查看

  **Must NOT do**:
  - 不实现表关联（第二阶段）
  - 不实现字段类型转换

  **Recommended Agent Profile**:
  > **Category**: `deep`
  > - Reason: 涉及数据库 Schema 变更，需要谨慎处理
  > **Skills**: `rust`, `sqlite`
  > - `rust`: Rust 后端逻辑
  > - `sqlite`: ALTER TABLE 等 Schema 操作

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T14
  - **Blocked By**: T1, T2

  **References**:

  **Pattern References**:
  - 数据库 Schema 管理最佳实践
  - Rust 错误处理模式

  **External References**:
  - SQLite ALTER TABLE: `https://www.sqlite.org/lang_altertable.html`

  **Acceptance Criteria**:
  - [ ] 可创建新表（含字段定义）
  - [ ] 表列表正确显示
  - [ ] 可删除表（需确认）
  - [ ] 可重命名表
  - [ ] 可添加/删除字段

  **QA Scenarios**:

  ```
  Scenario: 创建新表
    Tool: Playwright
    Preconditions: 首页
    Steps:
      1. 点击 "新建表" 按钮
      2. 输入表名 "test_table"
      3. 添加字段：id (Number), name (Text)
      4. 点击 "创建"
      5. 验证新表出现在列表
      6. 验证可进入表查看结构
    Expected Result: 表创建成功，结构正确
    Failure Indicators: 创建失败、结构错误
    Evidence: .sisyphus/evidence/t6-create-table.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement table management`
  - Files: `src/commands/tables.rs`, `src-ui/src/pages/tables/**`

---

- [ ] 7. 记录 CRUD

  **What to do**:
  - 创建记录（添加新行）
  - 读取记录（显示数据）
  - 更新记录（单元格编辑）
  - 删除记录（单行/批量）
  - 撤销/重做功能

  **Must NOT do**:
  - 不实现记录版本历史
  - 不实现冲突解决

  **Recommended Agent Profile**:
  > **Category**: `deep`
  > - Reason: 数据一致性要求高，需要正确处理状态
  > **Skills**: `rust`, `leptos`
  > - `rust`: 后端 CRUD 逻辑
  > - `leptos`: 前端状态管理

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T10, T12
  - **Blocked By**: T1, T2

  **References**:

  **Pattern References**:
  - RESTful CRUD 设计
  - Leptos 状态管理

  **External References**:
  - Tauri 命令设计: `https://tauri.app/v2/develop/building-communication/`

  **Acceptance Criteria**:
  - [ ] 可添加新记录
  - [ ] 可编辑现有记录
  - [ ] 可删除单条记录
  - [ ] 可批量删除记录
  - [ ] Undo/Redo 工作正常

  **QA Scenarios**:

  ```
  Scenario: 创建记录
    Tool: Playwright
    Preconditions: 已进入某个表
    Steps:
      1. 点击最后一行 "+" 按钮
      2. 输入字段值
      3. 点击保存
      4. 验证新记录出现
    Expected Result: 记录创建成功
    Failure Indicators: 创建失败、数据不显示
    Evidence: .sisyphus/evidence/t7-create-record.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement record CRUD operations`
  - Files: `src/commands/records.rs`, `src-ui/src/components/grid.rs`

---

- [ ] 8. 多语言系统框架

  **What to do**:
  - 集成 fluent-rs 或 rust-i18n
  - 设计翻译资源文件格式
  - 实现语言切换逻辑
  - 前端翻译组件
  - 语言偏好持久化

  **Must NOT do**:
  - 不翻译所有字符串（由 T9 完成）

  **Recommended Agent Profile**:
  > **Category**: `deep`
  > - Reason: i18n 框架需要正确集成到前后端
  > **Skills**: `rust`, `leptos`
  > - `rust`: Rust i18n 库
  > - `leptos`: 前端国际化

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T9, T10
  - **Blocked By**: T3

  **References**:

  **Pattern References**:
  - Fluent 官方示例
  - React i18n 最佳实践（可参考）

  **External References**:
  - fluent-rs: `https://docs.rs/fluent-rs/latest/fluent_rs/`
  - rust-i18n: `https://github.com/langel/rtl-support`

  **Acceptance Criteria**:
  - [ ] 可加载翻译文件
  - [ ] 可切换语言
  - [ ] 翻译字符串正确替换
  - [ ] 语言偏好持久化
  - [ ] 6 种语言文件结构正确

  **QA Scenarios**:

  ```
  Scenario: 语言切换
    Tool: Playwright
    Preconditions: 应用已启动
    Steps:
      1. 检查默认语言（应为系统语言或英文）
      2. 点击语言切换器
      3. 选择 "中文 (简体)"
      4. 验证界面文字变为中文
      5. 切换到 "泰文"
      6. 验证界面文字变为泰文
    Expected Result: 语言切换正常，所有可见字符串翻译
    Failure Indicators: 切换失败、部分未翻译
    Evidence: .sisyphus/evidence/t8-i18n.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement i18n framework`
  - Files: `src/i18n/**`, `src-ui/src/i18n.rs`, `locales/**`

---

- [ ] 9. 翻译文件准备

  **What to do**:
  - 准备 en.ftl（英文，基准）
  - 准备 zh-CN.ftl（中文简体）
  - 准备 zh-TW.ftl（中文繁体）
  - 准备 th.ftl（泰文）
  - 准备 ms.ftl（马来文）
  - 准备 fil.ftl（菲律宾文）
  - 表单页面翻译

  **Must NOT do**:
  - 不翻译用户数据内容

  **Recommended Agent Profile**:
  > **Category**: `writing`
  > - Reason: 主要工作是翻译和文案整理
  > **Skills**: None (翻译工作)
  > - 可以使用翻译工具辅助

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T8 并行准备)
  - **Blocks**: T10
  - **Blocked By**: T8

  **References**:

  **Pattern References**:
  - Fluent 格式文档
  - ICU 消息格式

  **External References**:
  - Fluent 语法: `https://projectfluent.org/fluent/guide/`

  **Acceptance Criteria**:
  - [ ] 所有 6 种语言文件存在
  - [ ] 格式正确（通过 fluent-rs 解析）
  - [ ] 关键 UI 字符串已翻译
  - [ ] 表单相关字符串已翻译

  **QA Scenarios**:

  ```
  Scenario: 翻译文件验证
    Tool: Bash
    Preconditions: 翻译文件已准备
    Steps:
      1. 检查 locales/ 目录下 6 个文件存在
      2. 运行解析测试
      3. 检查关键 key 存在（app.name, table.create, form.submit 等）
      4. 切换语言验证
    Expected Result: 所有语言文件可用
    Failure Indicators: 文件缺失、格式错误、key 缺失
    Evidence: .sisyphus/evidence/t9-translations.{ext}
  ```

  **Commit**: YES
  - Message: `feat: add translations for 6 languages`
  - Files: `locales/*.ftl`

---

- [ ] 10. 表单分享功能

  **What to do**:
  - 分享设置页面 UI
  - 分享配置存储（数据库）
  - 表单页面渲染（根据配置动态生成）
  - 表单验证逻辑
  - 提交数据写入 SQLite
  - 密码保护功能（可选）
  - 分享链接生成

  **Must NOT do**:
  - 不实现邮件发送
  - 不实现复杂权限

  **Recommended Agent Profile**:
  > **Category**: `deep`
  > - Reason: 表单分享涉及前后端多个组件
  > **Skills**: `rust`, `leptos`, `web`
  > - `rust`: 后端 API
  > - `leptos`: 前端设置页面
  > - `web`: 表单页面模板

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T11
  - **Blocked By**: T4, T7, T8, T9

  **References**:

  **Pattern References**:
  - 表单设计最佳实践
  - 响应式表单布局

  **External References**:
  - Axum 表单处理: `https://docs.rs/axum/latest/axum/`
  - 响应式表单: `https://getbootstrap.com/docs/5.3/forms/`

  **Acceptance Criteria**:
  - [ ] 可创建分享链接
  - [ ] 分享页面可访问
  - [ ] 表单字段正确渲染
  - [ ] 表单验证正常
  - [ ] 提交后数据写入数据库
  - [ ] 多语言表单标签正确

  **QA Scenarios**:

  ```
  Scenario: 表单分享完整流程
    Tool: Playwright
    Preconditions: 有表结构
    Steps:
      1. 进入表设置
      2. 点击 "分享设置"
      3. 选择要公开的字段
      4. 设置必填字段
      5. 点击 "生成分享链接"
      6. 复制分享链接
      7. 新浏览器打开链接
      8. 填写表单
      9. 点击提交
      10. 验证提交成功
      11. 回到应用检查数据是否写入
    Expected Result: 完整流程正常，数据写入成功
    Failure Indicators: 链接打不开、表单无法提交、数据未写入
    Evidence: .sisyphus/evidence/t10-share-flow.{ext}

  Scenario: 多语言表单
    Tool: Playwright
    Preconditions: 分享链接已生成
    Steps:
      1. 打开分享链接
      2. 设置浏览器语言为泰文
      3. 刷新页面
      4. 检查表单标签是否为泰文
      5. 切换到中文
      6. 刷新页面
      7. 检查表单标签是否为中文
    Expected Result: 表单标签正确显示对应语言
    Failure Indicators: 语言未切换、语言显示错误
    Evidence: .sisyphus/evidence/t10-form-i18n.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement form sharing functionality`
  - Files: `src/commands/share.rs`, `src-ui/src/pages/share.rs`, `public/form/**`

---

- [ ] 11. QR 码生成

  **What to do**:
  - 集成 qrcode crate
  - 生成 QR 码图片
  - Base64 编码返回
  - UI 展示 QR 码
  - 下载 QR 码功能
  - 复制链接功能

  **Must NOT do**:
  - 不实现自定义 QR 码样式（颜色、Logo）

  **Recommended Agent Profile**:
  > **Category**: `unspecified-high`
  > - Reason: QR 码生成相对独立
  > **Skills**: `rust`, `leptos`
  > - `rust`: QR 码库使用
  > - `leptos`: UI 组件开发

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T10 并行)
  - **Blocks**: None
  - **Blocked By**: T4

  **References**:

  **Pattern References**:
  - qrcode crate 使用示例
  - QR 码尺寸选择 UI

  **External References**:
  - qrcode crate: `https://docs.rs/qrcode/latest/qrcode/`
  - image crate: `https://docs.rs/image/latest/image/`

  **Acceptance Criteria**:
  - [ ] 可生成 QR 码图片
  - [ ] QR 码可被微信扫码
  - [ ] QR 码可被 WhatsApp 扫码
  - [ ] QR 码可被 Line 扫码
  - [ ] QR 码可下载
  - [ ] 链接可复制

  **QA Scenarios**:

  ```
  Scenario: QR 码生成
    Tool: Playwright
    Preconditions: 分享链接已生成
    Steps:
      1. 进入分享设置
      2. 点击 "生成 QR 码"
      3. 验证 QR 码图片显示
      4. 截图保存
      5. 用手机微信扫码
      6. 验证跳转正确
    Expected Result: QR 码生成正常，可被社交应用扫码
    Failure Indicators: QR 码无法生成、扫码失败
    Evidence: .sisyphus/evidence/t11-qrcode.{ext}

  Scenario: QR 码多平台测试
    Tool: Playwright + 实际设备测试
    Preconditions: QR 码已生成
    Steps:
      1. 微信扫码测试
      2. WhatsApp 扫码测试
      3. Line 扫码测试
    Expected Result: 所有平台均可扫码打开
    Failure Indicators: 某个平台无法扫码
    Evidence: .sisyphus/evidence/t11-qr-multiplatform.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement QR code generation`
  - Files: `src/qr/**`, `src-ui/src/components/qrcode.rs`

---

- [ ] 12. 排序和筛选

  **What to do**:
  - 单字段排序
  - 多字段排序
  - 简单条件筛选
  - 组合筛选（AND/OR）
  - 筛选器 UI
  - 排序状态持久化

  **Must NOT do**:
  - 不实现高级公式筛选
  - 不实现自定义筛选器保存

  **Recommended Agent Profile**:
  > **Category**: `unspecified-high`
  > - Reason: 筛选逻辑需要处理多种条件组合
  > **Skills**: `rust`, `leptos`
  > - `rust`: SQL WHERE 子句构建
  > - `leptos`: 动态 UI 渲染

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T13, T14, T15 并行)
  - **Blocks**: None
  - **Blocked By**: T5, T7

  **References**:

  **Pattern References**:
  - SQL 动态查询构建
  - 前端筛选器组件设计

  **External References**:
  - SQLite 条件查询: `https://www.sqlite.org/lang_select.html`

  **Acceptance Criteria**:
  - [ ] 点击表头可切换升序/降序
  - [ ] 可设置多字段排序
  - [ ] 可添加筛选条件
  - [ ] AND/OR 组合筛选正确
  - [ ] 筛选结果正确显示

  **QA Scenarios**:

  ```
  Scenario: 多字段排序
    Tool: Playwright
    Preconditions: 表有多条记录
    Steps:
      1. 点击 id 表头排序
      2. 按住 Shift 点击 name 表头
      3. 验证排序结果
    Expected Result: 按 id 主排序，name 次排序
    Failure Indicators: 排序错误
    Evidence: .sisyphus/evidence/t12-sort.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement sorting and filtering`
  - Files: `src/commands/query.rs`, `src-ui/src/components/toolbar.rs`

---

- [ ] 13. 扩展字段类型

  **What to do**:
  - LongText（多行文本）
  - SingleSelect（下拉选择）
  - MultiSelect（多选）
  - Email（带验证）
  - URL

  **Must NOT do**:
  - 不实现 Link/Relation（第三阶段）
  - 不实现 Formula/Lookup/Rollup（第三阶段）

  **Recommended Agent Profile**:
  > **Category**: `unspecified-high`
  > - Reason: 需要为不同字段类型设计不同的 UI 和验证
  > **Skills**: `rust`, `leptos`, `frontend-design`
  > - `rust`: 数据库类型映射
  > - `leptos`: 动态组件渲染
  > - `frontend-design`: 表单组件设计

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T12, T14, T15 并行)
  - **Blocks**: None
  - **Blocked By**: T6

  **References**:

  **Pattern References**:
  - 字段类型工厂模式
  - 动态表单组件

  **External References**:
  - Leptos 动态组件: `https://leptos-rs.github.io/leptos/view.html#dynamic-components`

  **Acceptance Criteria**:
  - [ ] 可创建 LongText 字段
  - [ ] LongText 显示为 textarea
  - [ ] 可创建 SingleSelect 字段
  - [ ] SingleSelect 显示为下拉框
  - [ ] Email 字段有格式验证
  - [ ] 所有类型可正确保存和读取

  **QA Scenarios**:

  ```
  Scenario: SingleSelect 字段
    Tool: Playwright
    Preconditions: 无
    Steps:
      1. 创建表
      2. 添加 SingleSelect 字段 "status"
      3. 设置选项：["待处理", "进行中", "已完成"]
      4. 添加记录
      5. 验证下拉框显示选项
    Expected Result: SingleSelect 正常工作
    Failure Indicators: 下拉框不显示、选项缺失
    Evidence: .sisyphus/evidence/t13-single-select.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement extended field types`
  - Files: `src/db/schema.rs`, `src-ui/src/components/fields/**`

---

- [ ] 14. CSV 导入导出

  **What to do**:
  - CSV 解析器实现
  - CSV 导出生成器
  - 文件选择对话框集成
  - 导入进度显示
  - 导入映射（CSV 列 → 表字段）
  - 导出字段选择

  **Must NOT do**:
  - 不实现 Excel 格式（MVP 范围外）

  **Recommended Agent Profile**:
  > **Category**: `unspecified-high`
  > - Reason: CSV 解析需要处理边界情况
  > **Skills**: `rust`, `leptos`
  > - `rust`: csv crate 使用
  > - `leptos`: 文件交互 UI

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T12, T13, T15 并行)
  - **Blocks**: T16
  - **Blocked By**: T2, T5, T6

  **References**:

  **Pattern References**:
  - `csv` crate 使用示例
  - 文件导入导出最佳实践

  **External References**:
  - csv crate: `https://crates.io/crates/csv`
  - Tauri 文件对话框: `https://tauri.app/v2/develop/api/fs/`

  **Acceptance Criteria**:
  - [ ] 可选择本地 CSV 文件
  - [ ] CSV 数据正确导入到表
  - [ ] 表数据可导出为 CSV
  - [ ] 中文编码处理正确
  - [ ] 大文件（10000行）可正常处理

  **QA Scenarios**:

  ```
  Scenario: CSV 导入
    Tool: Playwright
    Preconditions: 有表结构，存在 CSV 文件
    Steps:
      1. 进入目标表
      2. 点击 "导入" 按钮
      3. 选择 CSV 文件
      4. 确认字段映射
      5. 点击 "导入"
      6. 验证数据导入成功
    Expected Result: CSV 数据完整导入
    Failure Indicators: 数据丢失、编码错误
    Evidence: .sisyphus/evidence/t14-csv-import.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement CSV import/export`
  - Files: `src/commands/import_export.rs`, `src-ui/src/components/import/**`

---

- [ ] 15. 系统托盘

  **What to do**:
  - 系统托盘图标
  - 托盘菜单（打开/退出）
  - 后台运行
  - 启动时最小化到托盘（可选）

  **Must NOT do**:
  - 不实现通知功能
  - 不实现快捷方式

  **Recommended Agent Profile**:
  > **Category**: `unspecified-high`
  > - Reason: 涉及操作系统集成
  > **Skills**: `tauri`
  > - `tauri`: 系统托盘 API

  **Parallelization**:
  - **Can Run In Parallel**: YES (与 T12, T13, T14 并行)
  - **Blocks**: T16
  - **Blocked By**: T1

  **References**:

  **Pattern References**:
  - Tauri 系统托盘示例
  - 托盘菜单设计

  **External References**:
  - Tauri System Tray: `https://tauri.app/v2/develop/api/tray/`

  **Acceptance Criteria**:
  - [ ] 应用最小化到系统托盘
  - [ ] 托盘图标显示正确
  - [ ] 右键菜单可打开/退出
  - [ ] 点击托盘图标恢复窗口

  **QA Scenarios**:

  ```
  Scenario: 系统托盘功能
    Tool: Playwright + 系统交互
    Preconditions: 应用运行中
    Steps:
      1. 点击窗口最小化按钮
      2. 验证窗口消失
      3. 检查系统托盘是否有图标
      4. 右键托盘图标
      5. 选择 "打开 LocalBase"
      6. 验证窗口恢复
      7. 选择 "退出"
      8. 验证应用关闭
    Expected Result: 托盘功能正常
    Failure Indicators: 托盘图标不显示、菜单无反应
    Evidence: .sisyphus/evidence/t15-tray.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement system tray`
  - Files: `src/lib.rs` (托盘相关代码)

---

- [ ] 16. 打包发布

  **What to do**:
  - Windows 打包（.exe / .msi）
  - Linux 打包（.deb / .AppImage）
  - 应用图标设置
  - 版本号配置
  - 发布前测试

  **Must NOT do**:
  - 不实现自动更新（MVP 范围外）

  **Recommended Agent Profile**:
  > **Category**: `quick`
  > - Reason: 主要是配置和测试工作
  > **Skills**: `tauri`
  > - `tauri`: 打包配置

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: 终点
  - **Blocked By**: T14, T15

  **References**:

  **Pattern References**:
  - Tauri 打包配置
  - 应用图标设计规范

  **External References**:
  - Tauri Bundle: `https://tauri.app/v2/develop/bundle/`

  **Acceptance Criteria**:
  - [ ] `cargo tauri build` 成功
  - [ ] Windows .exe 可运行
  - [ ] Linux AppImage 可运行
  - [ ] 应用图标正确显示
  - [ ] 版本号正确显示

  **QA Scenarios**:

  ```
  Scenario: Windows 打包测试
    Tool: Bash
    Preconditions: Windows 环境
    Steps:
      1. 运行 cargo tauri build
      2. 等待打包完成
      3. 进入 target/release/bundle/
      4. 执行 .exe 文件
      5. 验证应用启动
    Expected Result: 打包成功，应用可运行
    Failure Indicators: 打包失败、启动报错
    Evidence: .sisyphus/evidence/t16-windows-build.{ext}

  Scenario: Linux 打包测试
    Tool: Bash
    Preconditions: Arch Linux 环境
    Steps:
      1. 运行 cargo tauri build
      2. 进入 target/release/bundle/
      3. 执行 AppImage
      4. 验证应用启动
    Expected Result: 打包成功，应用可运行
    Failure Indicators: 打包失败、启动报错
    Evidence: .sisyphus/evidence/t16-linux-build.{ext}
  ```

  **Commit**: YES
  - Message: `chore: prepare for release v1.0`
  - Files: `tauri.conf.json`, 图标文件

---

## Final Verification Wave

> 4 个验证任务并行运行，全部通过后交付

- [ ] F1. **编译验证** — `quick`

  运行 `cargo build` 和 `cargo tauri build`，验证：
  - 无编译错误
  - 无警告（尽量消除）
  - Windows 和 Linux 均可编译

  Output: `Build [PASS/FAIL] | Warnings [N]`

- [ ] F2. **功能验证** — `unspecified-high`

  按阶段执行所有 QA Scenarios：
  - T1-T16 的关键场景
  - 验证数据持久化
  - 验证跨平台一致性
  - **重点验证表单分享 + QR 码 + 多语言**

  Output: `Scenarios [N/N pass] | VERDICT`

- [ ] F3. **多语言验证** — `unspecified-high`

  专项验证多语言功能：
  - 6 种语言切换
  - 表单标签翻译
  - 错误消息翻译
  - RTL 支持（泰文、马来文）

  Output: `Languages [6/6 pass] | VERDICT`

- [ ] F4. **跨平台验证** — `unspecified-high`

  模拟用户验收流程：
  - 创建数据库
  - 创建表
  - 添加数据
  - 生成分享链接
  - QR 码扫码测试（微信/WhatsApp/Line）
  - 表单填写并提交
  - 整体体验评估

  Output: `UX [Good/Acceptable/Poor] | Issues [N]`

---

## Commit Strategy

按阶段提交：

| 阶段 | Message | 触发条件 |
|------|---------|----------|
| 1 | `feat: initialize Tauri + Leptos + Axum project` | T1 完成 |
| 2 | `feat: implement SQLite database layer` | T2 完成 |
| 3 | `feat: implement frontend basic layout` | T3 完成 |
| 4 | `feat: implement Axum web server` | T4 完成 |
| 5 | `feat: implement Grid view component` | T5 完成 |
| 6 | `feat: implement table management` | T6 完成 |
| 7 | `feat: implement record CRUD` | T7 完成 |
| 8 | `feat: implement i18n framework` | T8 完成 |
| 9 | `feat: add translations for 6 languages` | T9 完成 |
| 10 | `feat: implement form sharing` | T10 完成 |
| 11 | `feat: implement QR code generation` | T11 完成 |
| 12 | `feat: implement sorting and filtering` | T12 完成 |
| 13 | `feat: implement extended field types` | T13 完成 |
| 14 | `feat: implement CSV import/export` | T14 完成 |
| 15 | `feat: implement system tray` | T15 完成 |
| 16 | `chore: prepare for release v1.0` | T16 完成 |

---

## Success Criteria

### 编译成功
```bash
cargo build          # 无错误
cargo tauri build    # 生成可执行文件
```

### 功能完整
- [ ] 表管理（创建/删除/重命名）
- [ ] 字段管理（添加/删除字段）
- [ ] 记录 CRUD（增删改查）
- [ ] Grid 视图（展示/编辑）
- **表单分享 + QR 码生成**
- **扫码后打开表单，可填写并提交**
- **6 种语言支持**
- CSV 导入导出
- 排序筛选

### 多语言支持
- [ ] 界面 UI 支持 6 种语言切换
- [ ] 表单标签支持多语言
- [ ] QR 码可被微信/WhatsApp/Line 扫码

### 跨平台
- [ ] Windows 10/11 测试通过
- [ ] Arch Linux 测试通过

### 用户体验
- [ ] 启动时间 < 3 秒
- [ ] 响应流畅（无明显卡顿）
- [ ] 错误提示友好
- [ ] 表单页面响应式（手机可填）

---

**文档版本**：v3.0
**生成日期**：2026-04-11
**执行者**：Sisyphus
**规划者**：Prometheus