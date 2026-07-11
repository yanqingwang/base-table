# 本地数据库管理工具 - 功能说明书 (开发版)

## 1. 产品定位

**产品名称**：LocalBase（暂定）

**产品描述**：本地运行的 No-code 数据库管理工具，提供类似 NocoDB 的电子表格界面，用户可以通过直观的表格形式管理本地 SQLite 数据库，无需编写 SQL 代码。

**核心目标**：让非技术人员也能像使用电子表格一样轻松管理本地数据。

**目标平台**：Windows 10/11 (x64), Arch Linux (x64)

**部署模式**：单机运行，自带 Web 服务器

---

## 2. 技术架构

### 2.1 技术选型

| 层级 | 技术选型 | 理由 |
|------|----------|------|
| 框架 | **Tauri v2** | 跨平台（Win/Linux），二进制小，内置 WebView，性能好 |
| 前端 UI | **Leptos** | Rust 原生，响应式，编译后 WASM，无需 JS 运行时 |
| 后端 | **Tauri 内置 Rust** | 与前端共享 Rust 代码，减少上下文切换 |
| 数据库 | **SQLite (rusqlite)** | 本地存储，无依赖，跨平台 |
| 序列化 | **serde + serde_json** | Rust 标准 |
| 前端组件库 | **TailwindCSS + 自建** | 轻量，可定制 |

### 2.2 系统架构图

```
┌────────────────────────────────────────────────────────────┐
│                      LocalBase 应用                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   Tauri Runtime                       │  │
│  │  ┌────────────────┐      ┌────────────────────────┐  │  │
│  │  │   Leptos UI    │      │   Rust Backend        │  │  │
│  │  │   (WASM)       │◄────►│   - HTTP Server       │  │  │
│  │  │                │      │   - Business Logic   │  │  │
│  │  │   - Grid View  │      │   - SQLite Access    │  │  │
│  │  │   - Forms      │      │   - File System      │  │  │
│  │  │   - Sidebar    │      │   - WebSocket        │  │  │
│  │  └────────────────┘      └────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                              │                              │
│  ┌───────────────────────────┴───────────────────────────┐  │
│  │              Data Layer (Rust)                        │  │
│  │  - SQLite (rusqlite) - 用户数据                       │  │
│  │  - App Metadata (表结构、视图配置)                    │  │
│  └───────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘

数据存储位置: {用户数据目录}/LocalBase/data.db
```

### 2.3 端口配置

| 配置项 | 默认值 | 说明 |
|--------|--------|------|
| HTTP 端口 | `7777` | Web 服务端口 |
| 数据目录 | `{用户家目录}/.localbase/` | SQLite 数据库位置 |

---

## 3. 模块划分 (可并行开发)

为支持多人协作开发或分阶段实现，将系统划分为独立模块：

### 模块清单

| 模块 | 描述 | 依赖 | 优先级 |
|------|------|------|--------|
| **M1: 基础框架** | Tauri 项目初始化、日志、配置 | 无 | P0 |
| **M2: 数据库层** | SQLite 封装、表结构管理、元数据存储 | M1 | P0 |
| **M3: Web 服务器** | HTTP 服务器、静态文件服务 | M1 | P0 |
| **M4: 前端基础** | 布局、路由、状态管理 | M1 | P0 |
| **M5: Grid 视图** | 表格组件、数据展示、单元格编辑 | M2,M4 | P0 |
| **M6: 表管理** | 创建/删除/修改表、字段管理 | M2 | P0 |
| **M7: 记录 CRUD** | 数据增删改查、批量操作 | M5 | P1 |
| **M8: 视图系统** | 多视图支持 (Gallery/Kanban/Calendar) | M5,M7 | P2 |
| **M9: 导入导出** | CSV/Excel/JSON 转换 | M2 | P1 |
| **M10: REST API** | 外部程序访问接口 | M2,M7 | P2 |
| **M11: 系统集成** | 系统托盘、快捷方式、文件关联 | M1 | P3 |

---

## 4. 功能规格

### 4.1 MVP 功能 (第一阶段)

#### 4.1.1 表管理

- [ ] 创建新表（表名、字段列表）
- [ ] 删除表（确认对话框）
- [ ] 重命名表
- [ ] 查看表结构（字段名、类型、约束）

#### 4.1.2 字段系统 (MVP 简化版)

| 字段类型 | 实现 | 说明 |
|----------|------|------|
| Text | ✅ | 单行文本 |
| Number | ✅ | 整数 |
| Decimal | ✅ | 浮点数 |
| Boolean | ✅ | true/false |
| Date | ✅ | 日期 (YYYY-MM-DD) |
| DateTime | ✅ | 日期时间 |

**MVP 暂不实现**：RichText, Email, URL, Phone, SingleSelect, MultiSelect, Link, Lookup, Rollup, Formula, Attachment, Currency, Barcode, QRCode, User

#### 4.1.3 记录管理

- [ ] 创建记录（添加新行）
- [ ] 读取记录（显示数据）
- [ ] 更新记录（单元格编辑）
- [ ] 删除记录（单行/批量）
- [ ] 撤销/重做 (Undo/Redo)

#### 4.1.4 Grid 视图

- [ ] 表格渲染（表头 + 数据行）
- [ ] 单元格双击编辑
- [ ] 列排序（点击表头）
- [ ] 列筛选（简单条件）
- [ ] 隐藏/显示列
- [ ] 分页加载（100 条/页）

#### 4.1.5 导入/导出

- [ ] CSV 导入
- [ ] CSV 导出

#### 4.1.6 系统功能

- [ ] 首次启动引导（创建第一个数据库）
- [ ] 数据目录选择
- [ ] 窗口管理（最小化、最大化、关闭）
- [ ] 系统托盘（后台运行）

### 4.2 扩展功能 (第二阶段)

#### 4.2.1 字段扩展

| 字段类型 | 说明 |
|----------|------|
| SingleLineText | 单行文本 |
| LongText | 多行文本 |
| Email | 邮箱（带验证） |
| URL | 网址 |
| Phone | 电话 |
| SingleSelect | 单选（下拉） |
| MultiSelect | 多选（标签） |

#### 4.2.2 视图扩展

- [ ] Gallery View（卡片式）
- [ ] Kanban View（看板）
- [ ] Calendar View（日历）
- [ ] Form View（表单）

#### 4.2.3 数据操作

- [ ] 高级过滤（AND/OR 组合）
- [ ] 分组 (Group By)
- [ ] 行拖拽排序

#### 4.2.4 导入导出

- [ ] Excel (.xlsx) 导入
- [ ] Excel (.xlsx) 导出
- [ ] JSON 导入/导出

#### 4.2.5 REST API

- [ ] 基础 CRUD API
- [ ] 认证（可选，简化为 token）

### 4.3 完整功能 (第三阶段)

- [ ] Link/Relation 字段（表关联）
- [ ] Lookup 字段
- [ ] Formula 字段（计算公式）
- [ ] Rollup 字段
- [ ] Attachment 字段（文件上传）
- [ ] 权限系统（用户角色）
- [ ] Webhook
- [ ] 模板系统
- [ ] 审计日志

---

## 5. 接口设计

### 5.1 前端-后端接口

通过 Tauri Command 通信：

```rust
// 示例：获取表列表
#[tauri::command]
fn get_tables() -> Result<Vec<Table>, String>;

// 示例：查询记录
#[tauri::command]
fn query_records(table_id: i64, offset: i64, limit: i64) -> Result<RecordsResponse, String>;

// 示例：创建记录
#[tauri::command]
fn create_record(table_id: i64, data: serde_json::Value) -> Result<Record, String>;
```

### 5.2 外部 API (可选)

如果需要外部程序访问：

```
GET  /api/v1/tables              # 获取表列表
GET  /api/v1/tables/:id/records  # 查询记录
POST /api/v1/tables/:id/records  # 创建记录
PUT  /api/v1/records/:id          # 更新记录
DELETE /api/v1/records/:id       # 删除记录
```

---

## 6. 项目结构

```
localbase/
├── src/                      # Rust 代码
│   ├── main.rs              # 入口
│   ├── lib.rs               # 库入口
│   ├── commands/            # Tauri 命令
│   │   ├── mod.rs
│   │   ├── tables.rs        # 表操作
│   │   ├── records.rs       # 记录操作
│   │   └── mod.rs
│   ├── db/                  # 数据库层
│   │   ├── mod.rs
│   │   ├── schema.rs        # 表结构
│   │   └── migrations.rs   # 迁移
│   ├── models/              # 数据模型
│   │   └── mod.rs
│   └── utils/               # 工具函数
├── src-ui/                   # Leptos 前端
│   ├── src/
│   │   ├── main.rs
│   │   ├── lib.rs
│   │   ├── app.rs           # 根组件
│   │   ├── pages/
│   │   │   ├── mod.rs
│   │   │   ├── home.rs      # 首页/表列表
│   │   │   └── table.rs     # 表视图
│   │   ├── components/
│   │   │   ├── mod.rs
│   │   │   ├── grid.rs      # 表格组件
│   │   │   ├── sidebar.rs   # 侧边栏
│   │   │   └── toolbar.rs   # 工具栏
│   │   └── styles/
│   │       └── main.css
│   ├── index.html
│   ├── Cargo.toml
│   └── leptos.toml
├── Cargo.toml               # 根 Cargo.toml
├── tauri.conf.json         # Tauri 配置
├── SPEC.md                 # 功能规格
└── README.md
```

---

## 7. 开发里程碑

### Milestone 1: 基础可运行 (Week 1-2)

**目标**：启动应用，显示空白界面

- [ ] Tauri 项目初始化
- [ ] Leptos 前端集成
- [ ] 窗口基本功能（最小化、关闭）
- [ ] SQLite 数据库初始化
- [ ] 系统托盘
- [ ] 首次启动引导页

**交付物**：可运行的空壳应用

### Milestone 2: 表管理 (Week 3-4)

**目标**：可以创建、查看、删除表

- [ ] 表创建 UI + 后端
- [ ] 表列表显示
- [ ] 表删除功能
- [ ] 表重命名

**交付物**：可管理数据表的基础功能

### Milestone 3: Grid 视图 (Week 5-6)

**目标**：表格数据显示与编辑

- [ ] Grid 组件渲染
- [ ] 单元格显示
- [ ] 单元格编辑
- [ ] 记录创建/删除
- [ ] 分页加载
- [ ] 简单排序/筛选

**交付物**：核心的电子表格体验

### Milestone 4: 导入导出 (Week 7-8)

**目标**：CSV 数据交换

- [ ] CSV 导入
- [ ] CSV 导出
- [ ] 文件选择对话框

**交付物**：数据可进可出

### Milestone 5: 扩展功能 (Week 9-12)

**目标**：多视图、多字段类型

- [ ] 扩展字段类型 (Text, Number, Date, Boolean, Select)
- [ ] Gallery View
- [ ] Kanban View
- [ ] Calendar View
- [ ] Form View
- [ ] Gant view

**交付物**：接近 NocoDB 体验

---

## 8. 验收标准

每个阶段完成后需满足：

1. **可编译**：代码无编译错误
2. **可运行**：应用启动不崩溃
3. **功能可用**：核心操作可完成
4. **跨平台**：Windows 和 Linux 测试通过

### 功能验收检查点

| 阶段 | 检查点 |
|------|--------|
| M1 | 应用启动显示窗口 |
| M2 | 创建表成功，列表显示 |
| M3 | Grid 显示数据，可编辑 |
| M4 | CSV 导入后数据正确 |
| M5 | Kanban 视图正常显示 |

---

## 9. 依赖版本 (建议)

```toml
[dependencies]
tauri = "2"
leptos = "0.7"
rusqlite = "0.32"
serde = "1.0"
serde_json = "1.0"
tokio = "1"
tracing = "0.1"
tracing-subscriber = "0.3"

[build-dependencies]
tauri-build = "2"
```

---

## 10. 后续规划

完成 MVP 后可考虑：

1. **REST API Server**：独立 Web 服务模式（后台运行）
2. **Docker 支持**：Linux 服务器部署
3. **插件系统**：扩展字段类型
4. **AI 辅助**：自然语言查询

---

**文档版本**：v2.0  
**生成日期**：2026-04-11  
**参考产品**：NocoDB (Airtable Alternative)  
**适用开发方式**：TDD / 敏捷迭代