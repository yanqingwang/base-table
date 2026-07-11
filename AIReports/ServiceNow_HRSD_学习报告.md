# ServiceNow HR Service Delivery (HRSD) 学习报告

> **学习日期**: 2026-05-10  
> **信息来源**: ServiceNow 官方产品页面、社区博客、文档中心、新闻稿  
> **重点关注**: AI 能力、知识管理、集成管理、Agent 功能

---

## 一、产品概述

ServiceNow HR Service Delivery (HRSD) 是 ServiceNow 平台上的一个核心应用，专门用于**数字化和简化所有 HR 流程与活动**。它提供现代的员工自助服务体验，涵盖从入职到离职的全生命周期管理。

### 核心价值主张
- **统一平台**: HR 案例管理、知识管理、员工自助门户集成在一个平台
- **AI 原生**: 生成式 AI + Agentic AI 深度嵌入 HR 工作流
- **跨部门协同**: 与 IT、法律、设施等部门实现端到端自动化
- **可扩展性**: 支持从标准版到企业级的灵活配置

### 产品模块
| 模块                               | 说明                       |
| -------------------------------- | ------------------------ |
| **Case & Knowledge Management**  | HR 案例管理和知识库系统            |
| **Employee Journey Management**  | 员工旅程自动化（入职、转岗、离职等）       |
| **Employee Document Management** | 员工文档集中管理                 |
| **Employee Service Center**      | 员工自助服务门户                 |
| **HR Agent Workspace**           | HR 代理的专业工作空间             |
| **Virtual Agent**                | AI 虚拟代理（聊天机器人）           |
| **Now Assist for HR**            | 生成式 AI + Agentic AI 能力套件 |
| **Predictive Intelligence**      | 预测性智能                    |
| **Manager Hub**                  | 管理者工作台                   |

---

## 二、AI 部分（重点）

### 2.1 Now Assist for HR —— 生成式 AI

Now Assist 是 ServiceNow 的**内置生成式 AI 能力**，专为 HR 场景优化。

#### 核心能力
1. **案例摘要生成（Case Summarization）**
   - 自动汇总 HR 案例的完整历史
   - 提取关键信息：问题描述、处理步骤、解决方案
   - 减少 HR 代理阅读和理解案例的时间

2. **对话摘要（Conversation Summarization）**
   - 汇总 Virtual Agent 与员工的聊天历史
   - 为人工代理提供上下文概览
   - 加速问题理解和解决

3. **解决方案注释自动生成（Resolution Notes Generation）**
   - 案例关闭时自动生成解决备注
   - 记录事件摘要和已采取的步骤
   - 便于未来参考和知识沉淀

4. **知识文章生成（KB Article Generation）**
   - 基于已解决的案例自动创建知识文章
   - 减少手动文档编写工作量
   - 持续丰富知识库

5. **搜索增强（Now Assist in AI Search）**
   - 基于 RAG（检索增强生成）架构
   - 从知识库中检索相关内容并生成精准答案
   - 支持知识块（Knowledge Blocks）和附件搜索（PDF、DOC、HTML、TXT、PPT）

#### Now Assist 架构
```
用户查询 → AI Search 检索（RAG） → Now LLM 生成答案 → Genius Result Card
```

**RAG 工作流**:
1. **检索（Retrieval）**: 按用户访问权限过滤 ServiceNow 知识库中的索引文章
2. **增强（Augmentation）**: 将查询 + 知识文章 HTML 内容传递给 ServiceNow LLM
3. **生成（Generation）**: Now LLM 基于检索内容生成精准答案

#### 关键特点
- **可信 AI**: 降低幻觉风险，回答基于用户有权限访问的实际内容
- **Responsible AI**: 透明、可审计、安全
- **多语言支持**: 法语、德语、日语、荷兰语、西班牙语、意大利语、巴西葡萄牙语
- **管理员控制**: 可配置"Approved for Now Assist"字段控制 AI 使用的知识内容

### 2.2 Agentic AI —— 自主 AI 代理

Agentic AI 是 ServiceNow HRSD 的**革命性能力**，实现端到端工作流自动化。

#### 核心概念
- **AI Agent**: 能够理解上下文、做出决策、执行动作的智能代理
- **Agentic Workflow**: 由多个 AI Agent 协作完成复杂任务的自动化流程
- **Human-in-the-Loop**: 关键决策点保留人工干预能力

#### 🤖 AI Agent 类型（HRSD 专属）

| Agent | 角色 | 功能 | 引入时间 |
|-------|------|------|----------|
| **Record Field Value Predictor** | 员工/Predict & Transfer | 预测正确的 HR Service | v3 (2025) |
| **HR Case Transfer AI Agent** | 员工/Predict & Transfer | 将案例路由到正确的 HR Service | v3 (2025) |
| **HR Criticality Detection Agent** | 系统/Resolve Non-Critical | 评估案例关键性（关键/非关键） | May 2025 |
| **HR Search & Notify AI Agent** | 系统/Resolve Non-Critical | 检索相关知识文章和目录项，通知员工 | Dec 2025 合并 |
| **HR Notification Agent** | 系统/通知 | 更新案例并发送通知（邮件/VA） | Dec 2025 合并 |
| **HR Case Planner AI Agent** | HR 代理/Resolve Critical | 基于策略/指导/FAQ 生成解决计划 | v3 (2025) |
| **Next Best Action Recommender** | HR 代理/Resolve Critical | 基于类似历史案例推荐解决步骤 | Dec 2025 (Agent Zero) |
| **Employee Feedback Collection** | 管理者 | 收集和汇总员工反馈 | Mar 2026 v2 |
| **Growth Conversation Helper** | 管理者 | 辅助成长对话准备 | Mar 2026 |
| **Interview Summarizer** | ER 代理 | 结构化面试记录摘要 | Mar 2026 |

#### 三个核心 Agentic Workflow（v3）

##### Workflow 1: Predict Service and Transfer HR Cases
```
员工提交请求 → Record Field Value Predictor 预测服务 → HR Case Transfer Agent 路由案例
→ 分配给正确的 HR 服务团队
```
- **目标**: 自动分类和路由，消除人工分诊
- **触发方式**: AI Studio 触发，案例创建时自动执行

##### Workflow 2: Resolve Non-Critical HR Cases
```
案例创建 → Criticality Detection Agent 评估关键性
→ [非关键] → Search & Notify Agent 检索知识库 + 目录 → AI 生成响应 → 员工自助解决
→ [关键] → 转 Workflow 3
```
- **目标**: 自动解决常规查询，释放 HR 代理时间
- **技术**: RAG + 知识库 + 服务目录

##### Workflow 3: Resolve Critical HR Cases
```
HR 代理点击"Generate Plan" → Case Planner Agent 生成解决计划
→ [有指导文件] → 基于 Fulfillment Instructions + KB + FAQ + 政策
→ [无指导文件] → Next Best Action Recommender 基于历史案例
→ HR 代理审查 → 细化 → 执行
```
- **目标**: 赋能 HR 代理处理复杂案例
- **人机协作**: 代理审查、修正和批准 AI 生成的计划

### 2.3 AI Voice Agents（语音代理）

#### 核心能力
- **24/7 语音自助服务**: 员工通过电话获取 HR 支持
- **自然语言交互**: 理解口语化请求
- **多语言支持**: 英语、西班牙语、德语、法语、日语、巴西葡萄牙语、加拿大法语、中文普通话、荷兰语
- **身份验证**: Soft PIN、验证码、Okta Push、知识因素（Knowledge Factors）、语音输入、来电识别

#### 支持的用例
| 用例 | 说明 |
|------|------|
| 创建新案例 | 语音提交 HR 请求 |
| 查询案例状态 | 跟踪处理进度 |
| PTO 查询 | 查询休假余额和提交请求 |
| 差旅费用 | 查询和处理报销 |
| 更新个人信息 | 修改个人资料 |
| 入职引导 | 新员工指导 |
| 政策问答 | HR 政策查询 |

#### 技术集成
- **CCaaS 集成**: 原生支持 Genesys Cloud 和 Twilio
- **软电话**: HR Agent Workspace 内嵌软电话
- **WebRTC**: 支持移动端
- **上下文保留**: 通话会话中的上下文保持

#### 配置路径
```
AI Agent Studio → Settings → Voice Service → 选择 AI Agent → 选择语音 → 配置电话号码 → 设置认证方式 → 配置通话参数
```

### 2.4 AI Control Tower（AI 控制塔）

企业级 AI 治理和管理平台：
- **AI 资产清单**: CMDB 和 CSDM 中的 AI 资产集中管理
- **风险管理**: 偏见、漂移、安全等风险集中追踪
- **合规治理**: 内置 EU AI Act 和 NIST AI RMF 支持
- **生命周期管理**: 从引入到退役的全生命周期编排
- **模型选择**: 可以控制和路由到特定 AI 模型提供商（AWS Anthropic、Azure OpenAI、Google Gemini）
- **性能监控**: AI 代理使用率、质量和价值的分析仪表板

### 2.5 AI Agent Studio（AI 代理工作室）

**无代码/低代码** AI 代理创建平台：
- **自然语言创建**: 用自然语言描述即可创建 AI Agent
- **角色定义**: 为 Agent 分配角色，提供业务上下文
- **工具配置**: 多种内置工具（记录操作、聊天、案例管理、知识检索等）
- **编排器（Orchestrator）**: 协调多个 Agent 协作完成复杂任务
- **生命周期管理**: 创建 → 测试 → 部署 → 监控 → 退役

### 2.6 AI Agent Fabric（代理织物）

**代理间通信基础设施**:
- **MCP（Model Context Protocol）**: Agent 与外部工具/系统交互的标准协议
  - ServiceNow 既是 MCP 客户端（使用外部工具）也是 MCP 服务端（暴露能力）
  - 内置 MCP Server Console
- **A2A（Agent2Agent Protocol）**: Agent 之间直接通信和协作
  - 基于 Google 开发的开放协议（v0.3）
  - 支持 OAuth2 联合令牌认证
  - 支持跨平台 Agent 发现、调用和协作
- **合作伙伴集成**: Accenture、Adobe、Box、Cisco、Google Cloud、IBM、Jit、Microsoft、Moonhub、RADCOM、UKG、Zoom

---

## 三、知识管理部分（重点）

### 3.1 知识管理系统架构

ServiceNow HRSD 的知识管理基于**三层体系**：

```
┌─────────────────────────────────────────┐
│          员工自助门户                     │  ← 搜索 + Now Assist 生成答案
├─────────────────────────────────────────┤
│          Now Assist AI Search            │  ← RAG 检索 + 生成
├─────────────────────────────────────────┤
│       知识库 (Knowledge Base)             │  ← 结构化知识存储
│  - 知识文章 (Knowledge Articles)         │
│  - 服务目录 (Service Catalog)             │
│  - 知识块 (Knowledge Blocks)              │
│  - 附件 (Attachments)                    │
└─────────────────────────────────────────┘
```

### 3.2 知识文章管理

#### 文章结构
- **富文本内容**: 支持 HTML 编辑，包括文字、图片、视频、附件
- **知识块（Knowledge Blocks）**: 可重用的内容片段，嵌入到多篇文章中
  - 引入时间: Nov 2024
  - 支持 PDF、DOC、HTML、TXT、PPT 附件搜索
- **分类和标签**: 基于主题、受众的元数据标签
- **摘要和章节标题**: 改善 AI 和人工可读性

#### 内容治理最佳实践
1. **定期内容审计**: 删除重复内容、清理格式、淘汰过时文章
2. **创建高聚焦文章**: 减少跨文章链接
3. **文本+多媒体**: 同时提供文字和图片/视频说明
4. **明确的所有者分配**: 每篇文章有负责人保持更新
5. **元数据标记**: 清晰的 topic 和 audience 标签
6. **定期刷新**: 建立定期审查和更新知识库的时间表

#### AI 搜索优化
- **编码查询字符串（Encoded Query）**: 预过滤内容，控制发送给 LLM 的内容
- **"Approved for Now Assist"字段**: 标记哪些文章可供 AI 使用
- **结果改进规则（RIR）**: 提升相关内容排名
- **性能分析**: 监控采纳率、缺陷率等指标

### 3.3 知识图谱（Knowledge Graph）

#### 概念
- **个性化知识图谱**: 由管理员创建的个性化知识结构
- **连接数据源**: 将常见的 HRSD 表连接成图结构
- **虚拟代理主题集成**: 启用 VA 主题时，提供更具上下文感知和个性化的响应

#### HR 专用知识图谱
- 开箱即用的 HR 知识图谱模式
- 连接常用 HRSD 表（如员工信息、案例、服务等）
- 支持 VA 场景下的智能查询（如签证申请场景自动调取已知信息）

### 3.4 Virtual Agent 主题中的知识利用

- **LLM Topics for HRSD**: 基于 LLM 的虚拟代理主题
- 支持与 **Workday、SuccessFactors、Oracle HCM** 第三方系统集成
- 通过决策表和子流程简化集成体验
- 员工可在 VA 中完成第三方系统中的操作

---

## 四、集成管理部分（重点）

### 4.1 HCM 平台集成

ServiceNow HRSD 支持与主流 HCM 系统的深度集成：

| 集成平台                   | 能力                       | 方式                                                           |
| ---------------------- | ------------------------ | ------------------------------------------------------------ |
| **Workday**            | 员工数据同步、入职/离职自动化、表单验证、PTO | REST API、Webhook（CreateUser、Offboarding、LeaveOfAbsence）、SOAP |
| **SAP SuccessFactors** | 员工信息同步、HR 服务交付           | SuccessFactors Spoke、HRSD 插件                                 |
| **Oracle HCM**         | 人才获取、劳动力规划、薪酬管理          | Oracle HCM Spoke                                             |

#### 集成架构原则
- **Straight-Through Processing (STP)**: 无需人工干预的自动化端到端处理
- **双向数据同步**: HCM 和 ServiceNow 之间的变更自动传播
- **单一参与点**: 面向员工的统一入口，隐藏后端复杂性
- **数据权威性**: HCM 作为人员数据的事实来源，ServiceNow 处理服务交互

#### Workday 集成详细配置
1. **安装 Workday HR Spoke**（通过 Store 应用自动安装）
2. **配置认证**: Workday 租户基础 URL、API 版本、用户名/密码
3. **主流程配置**: 设置运行频率和要拉取的对象
4. **子流程**: Get Workers、Get Job Profiles、Get Department、Get Locations
5. **Webhook 配置**: CreateUser、Offboarding、LeaveOfAbsence
6. **自定义字段**: 在 HR Profile Staging 和 HR Job Staging 表中创建

### 4.2 通信和协作集成

| 集成 | 用途 |
|------|------|
| **Microsoft 365 / Viva Connections / Teams** | 工作流中的请求处理 |
| **Slack** | 工作流通知和操作 |
| **Genesys Cloud** | 语音集成（CCaaS） |
| **Twilio** | 语音集成（CCaaS） |

### 4.3 学习和人才集成

| 集成 | 用途 |
|------|------|
| **Cornerstone** | 培训任务同步 |
| **Pluralsight** | 在 ServiceNow 中访问和完成培训 |
| **Udemy** | 在 ServiceNow 中访问课程 |
| **Sumtotal / Saba** | 学习管理集成 |
| **Workday Learning** | 学习记录同步 |

### 4.4 安全和身份集成

| 集成 | 用途 |
|------|------|
| **Microsoft Azure AD** | HR 应用自动配置 |
| **Okta** | HR 应用自动配置 |
| **Sailpoint** | HR 应用自动配置 |
| **Adobe Sign** | 电子签名 |
| **DocuSign** | 电子签名 |

### 4.5 外部内容连接器（AI 搜索）

- **SharePoint Online**: 索引和搜索 SharePoint 内容
- **Confluence Cloud**: 索引和搜索 Confluence 内容
- **管理界面**: AI Agent Studio 中的内容爬取管理
- **工作原理**: 爬取外部内容 → 索引 → 纳入 AI 搜索范围 → 员工通过 VA 获取

### 4.6 AI Agent Fabric 集成（新）

- **MCP Server**: 暴露 ServiceNow 能力给外部 AI Agent
- **A2A 协议**: 与其他厂商 AI Agent 直接协作
- **合作伙伴生态**: Accenture、Adobe、Box、Cisco、Google Cloud、IBM 等

### 4.7 Integration Hub

ServiceNow Integration Hub 提供通用集成能力：
- 支持 REST、SOAP、JDBC、PowerShell 等协议
- 标准化 Workday API 调用
- 流程自动化和外部平台集成
- 无需单独 IntegrationHub 许可即可添加自定义字段（特定场景）

---

## 五、Agent 功能部分（重点）

### 5.1 HR Agent Workspace

专为 HR 代理设计的**统一工作环境**：

#### 核心功能
- **多标签单窗格视图**: 案例详情、活动流、侧边栏集成
- **Agent Assist**: AI 辅助建议
- **附件管理**: 直接在工作空间内处理
- **Checklists**: 标准化流程检查
- **富文本编辑器**: 日记字段支持富文本
- **内联编辑**: 列表中的快速编辑
- **个性化设置**: 主题（深色/浅色）、布局自定义、偏好设置
- **可配置工作空间**: 基于 UI Builder 的灵活布局

#### 版本演进
| 版本 | 关键改进 |
|------|----------|
| 经典工作空间 | 基础案例管理 |
| 可配置工作空间 (San Diego+) | UI Builder 驱动、深色主题、内联编辑 |
| v4.3 (Dec 2025) | CCaaS 集成（Genesys）、通话管理 |

### 5.2 AI Agent Studio —— Agent 创建和管理

#### 创建流程
1. **定义用例（Use Case）**: 描述业务目标和 Agent 团队
2. **创建 Agent**: 指定角色、说明、指令
3. **配置工具**: 选择 Agent 可用的工具和能力
4. **构建子流程**: 定义 Agent 执行的具体自动化步骤
5. **配置触发器**: 设置何时何地激活 Agent
6. **测试**: 使用测试数据验证行为
7. **部署**: 激活到生产环境

#### Agent 配置要素
| 要素 | 说明 |
|------|------|
| **Name** | Agent 的目的描述 |
| **Description** | Agent 的高级摘要 |
| **Instructions** | Agent 如何完成工作的具体指南 |
| **Role** | Agent 的角色（影响理解和行为方式） |
| **Tools** | Agent 可用的工具和能力 |
| **Trigger** | 何时激活 Agent 的条件 |
| **Channel** | Agent 工作的渠道（邮件、门户、聊天等） |

#### 管理功能
- **监控仪表板**: Agent 使用率、质量、价值的可视化
- **KPI 关联**: Agentic AI 工作流与业务 KPI 绑定
- **ROI 追踪**: 管理员可追踪 AI Agent 的投资回报
- **生命周期管理**: 退役、更新、版本控制

### 5.3 Update Set 管理

AI Agent 的制品可通过 Update Set 进行版本控制和迁移：

**包含的制品**:
| 制品类型 | 说明 |
|----------|------|
| `sn_aia_agent` | Agent 定义（指令、工具、工作流） |
| `sn_aia_agent_config` | 激活/配置记录 |
| `sn_aia_trigger_configuration` | 触发配置 |
| `sn_aia_trigger_agent_usecase_m2m` | 触发器-工作流关联 |
| `sys_hub_flow` | 支持的流程 |
| `sys_script_client` | 客户端 UI 逻辑 |
| `sn_aia_usecase` | Agentic Workflow（顶层容器） |

**迁移最佳实践**:
- 在同一应用范围和 Update Set 中构建所有 AI Agent 制品
- 导入后验证 Agent 激活状态
- 检查 Agent-工具关系和触发器适用性
- 端到端执行用例测试

### 5.4 Agent 部署模型 —— "The Autonomous Workforce"

ServiceNow 定义的**自主劳动力**模型：

```
┌──────────────────────────────────────────────────┐
│              自主劳动力 (Autonomous Workforce)     │
├──────────────────────────────────────────────────┤
│  AI Specialist 被分配到角色                       │
│  具有业务上下文和权限                             │
│  能够处理完整的端到端工作流                        │
├──────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐           │
│  │ HR      │  │ IT      │  │ Customer│  ...       │
│  │ Agents  │  │ Agents  │  │ Agents  │           │
│  └────┬────┘  └────┬────┘  └────┬────┘           │
│       │             │             │                │
│  ┌────▼─────────────▼─────────────▼────┐          │
│  │     ServiceNow AI Platform           │          │
│  │  (Control Tower + Data + Workflows)  │          │
│  └──────────────────────────────────────┘          │
└──────────────────────────────────────────────────┘
```

#### 关键特性
- **角色化**: Agent 被分配特定业务角色
- **上下文感知**: 自动访问相关业务数据
- **受控治理**: 通过 AI Control Tower 统一管理
- **可观测性**: 完整的审计追踪和性能监控

---

## 八、HRSD 与主系统集成及第三方功能承接（补充）

### 8.1 集成架构总览

ServiceNow HRSD 采用**分层集成架构**：

```
┌─────────────────────────────────────────────────────────┐
│                    第三方系统/外部工具                      │
│   Workday | SuccessFactors | Oracle | SAP | AD/Okta     │
│   Slack | Teams | Meta | Cornerstone | DocuSign ...     │
├─────────────────────────────────────────────────────────┤
│              Integration Hub + Spoke 架构                 │
│   Workday HR Spoke | SF Spoke | Oracle Spoke | IH API   │
├─────────────────────────────────────────────────────────┤
│                  ServiceNow HRSD 平台                      │
│   Case Mgmt | Knowledge | Journeys | Virtual Agent       │
│   Now Assist (GenAI) | Agentic AI | HR Agent Workspace   │
├─────────────────────────────────────────────────────────┤
│                  AI Agent Fabric (MCP + A2A)               │
│   第三方 AI Agent 互通 | 跨平台协作                          │
└─────────────────────────────────────────────────────────┘
```

### 8.2 HCM 集成详解

#### 8.2.1 Workday 集成（三种方式）

| 集成方式 | 适用场景 | 数据方向 | 技术基础 | 是否需要 HRSD 许可 |
|----------|----------|----------|----------|-------------------|
| **HR Service Delivery Integration** (Store App) | 快速部署标准同步 | Workday → ServiceNow（单向拉取） | SOAP API + 导入集 | 需要 HRSD |
| **HR Service Delivery Advanced Integration** (Store App) | 高级 HR 功能集成 | 双向（ServiceNow ↔ Workday） | SOAP + 表单动作 | 需要 HRSD + HSDI 插件 |
| **Workday HR Spoke** (Integration Hub) | 灵活自定义集成 | 双向 | SOAP + REST + Flow Designer | 仅需 Integration Hub 许可 |

**Workday HR Spoke 详细结构**：
```
主流程 (Run Workday Integration Flow)
├── 配置项：运行频率、需拉取的对象
├── 子流程：Get Workers / Get Effective Workers / Get Future Workers
├── 子流程：Get Job Profiles
├── 子流程：Get Departments
├── 子流程：Get Locations
└── Look Up Actions（SOAP 请求 + XML 解析 + 写入 Staging 表）
    └── Transform Maps（Staging → HR Profile / HR Job 等目标表）
```

**高级集成 (HSDI) 附加功能**：
- Total Rewards 微件（薪酬概览）
- Holiday Calendar 微件（假期日历同步）
- Payroll Discrepancy（薪资差异检测）
- Time Off Request（休假请求处理）
- Legal Name Change（法定姓名变更流程）

#### 8.2.2 SAP SuccessFactors 集成

- **Spoke 架构**：SuccessFactors Spoke + SF HRSD 插件
- **标准对象映射**：

| SuccessFactors 对象         | ServiceNow 目标表                    |
| ------------------------- | --------------------------------- |
| Job Profile               | `sn_hr_core_job_profile`          |
| Worker Profiles           | `sn_hr_core_profile`              |
| Employee Job Info/History | `sn_hr_core_job`                  |
| Inbound Todos             | `sn_hr_integrations_todo_inbound` |

- **数据流**：SF → Spoke → Staging 表 → Transform Maps → HR Profile 表
- **高级特性**：自定义字段扩展、API 调用覆盖

#### 8.2.3 Oracle HCM 集成

- 类似 Spoke 架构，Store 中有标准集成应用
- 支持基本 HR 资料同步
- **高级集成版本**提供更深入的薪酬、福利集成

### 8.3 Integration Hub 技术细节

#### 核心能力
- **Flow Designer 集成**：在业务流程中直接调用第三方 API
- **Spoke 市场**：200+ 预建连接器（Workday、SAP、Oracle、Salesforce 等）
- **自定义连接器**：支持 REST、SOAP、JDBC、PowerShell 等协议
- **事件驱动**：Webhook 支持实现近实时数据同步
- **中间件无关**：直接调用目标系统 API，不依赖第三方中间件

#### 关键配置点
```
Integration Hub → Flow Designer → 选择触发器/动作
├── Spoke Actions（预建连接器动作）
├── Custom Actions（自定义脚本动作）
├── Subflows（子流程编排）
└── Flow Actions（标准流程动作）
```

### 8.4 承接第三方功能的策略

#### "Best of Breed" 策略
ServiceNow HRSD 明确采用"集大成者"策略：
```
HCM（人员数据权威源: Workday/SF/Oracle）
    ↓ 实时同步
ServiceNow HRSD（服务交互层: 案例/知识/自助门户）
    ↓ AI + 自动化
统一员工体验
```

#### 第三方功能承接模式

| 模式              | 描述                        | 示例                                |
| --------------- | ------------------------- | --------------------------------- |
| **数据拉取**        | 从外部系统获取数据用于 ServiceNow 流程 | 从 Workday 拉取薪酬数据用于休假审批            |
| **动作触发**        | ServiceNow 流程触发外部系统操作     | 案例关闭后触发 Workday 更新员工状态            |
| **嵌入式体验**       | 在 ServiceNow 中嵌入外部系统功能    | 在 HR Agent Workspace 中嵌入 SAP 薪酬查询 |
| **虚拟代理扩展**      | VA 与第三方系统交互完成员工请求         | 通过 VA 在 SuccessFactors 中提交休假申请    |
| **AI Agent 工具** | AI Agent 调用外部工具           | AI Agent 通过 MCP 调用 Jira 创建任务      |

### 8.5 HR Multi-Instance Integration (HR MII)

- **用途**：跨 ServiceNow 实例的 HR 服务通信
- **架构**：集中式共享模型，提供者实例发布记录生产者
- **场景**：多实例组织（如跨国企业）的 HR 服务集中管理
- **数据同步**：员工请求从消费实例同步到提供实例，HR 案例在提供实例中创建

### 8.6 AI Agent Fabric 集成

#### MCP（Model Context Protocol）
- **角色**：ServiceNow 作为 MCP 客户端和服务端
- **MCP Server Console**：AI Agent Studio 内置管理界面
- **能力**：暴露 Now Assist Skills 作为外部 AI Agent 的工具
- **认证**：OAuth 2.0

#### A2A（Agent2Agent Protocol）
- **版本**：v0.3（2025.12 引入）
- **支持**：Google Vertex AI、AWS Bedrock、Microsoft Azure AI Foundry
- **认证**：OAuth2 联合令牌
- **用例**：跨平台 AI Agent 发现、调用、协作

#### 合作伙伴生态
Accenture、Adobe、Box、Cisco、Google Cloud、IBM、Jit、Microsoft、Moonhub、RADCOM、UKG、Zoom — 首批 AI Agent Fabric 集成合作伙伴

---

## 九、学习 Roadmap 与策略（补充）

### 9.1 分阶段学习路径

#### 🟢 第一阶段：基础入门（4-6 周）
**目标**：理解 HRSD 产品定位和基本操作

| 主题              | 内容                                                     | 资源                                                            | 时长    |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------- | ----- |
| ServiceNow 平台概览 | 实例导航、基本概念                                              | ServiceNow University: ServiceNow Administration Fundamentals | 2 周   |
| HRSD 核心模块       | Case Management, Knowledge Management, Employee Center | 官方文档 + HRSD Welcome Guide                                     | 1 周   |
| 认证路径规划          | CSA → CIS-HRSD 路线图                                     | ServiceNow Learning Paths                                     | 0.5 周 |
| 实操练习            | 创建案例、管理知识文章、配置 HR 服务                                   | 个人/公司沙盒实例                                                     | 1.5 周 |

**里程碑**：
- [ ] 完成 CSA 认证
- [ ] 熟悉 HRSD 基本导航和功能
- [ ] 能在沙盒中创建和配置 HR 服务

#### 🟡 第二阶段：核心进阶（6-8 周）
**目标**：深入 HRSD 配置和集成能力

| 主题 | 内容 | 资源 | 时长 |
|------|------|------|------|
| HR 案例管理高级配置 | 分配规则、SLA、工作流 | HRSD Implementation On Demand | 2 周 |
| 知识管理 | 内容设计、治理策略、分类体系 | Knowledge Management Implementation | 1.5 周 |
| Journey Designer | 入职/离职旅程设计 | Employee Journey Management 系列课程 | 1.5 周 |
| HCM 集成 | Workday/SF/Oracle 集成配置 | Integration Hub 文档 + 社区文章 | 2 周 |

**里程碑**：
- [ ] 通过 CIS-HRSD (CIS-HR) 认证
- [ ] 完成至少 1 个 HCM 集成项目
- [ ] 能独立配置 Journey 和 HR 服务

#### 🔵 第三阶段：AI 能力专精（6-8 周）
**目标**：掌握 Now Assist 和 Agentic AI

| 主题 | 内容 | 资源 | 时长 |
|------|------|------|------|
| Now Assist for HR | 生成式 AI 技能配置、管理策略 | Now Assist for HRSD Essentials 课程 | 2 周 |
| AI Agent Studio | Agent 创建、配置、编排 | AI Agent Studio 文档 + 社区教程 | 2 周 |
| Agentic Workflow | Resolve HR Case 流程实现 | Resolve HR Case 文章系列 | 1.5 周 |
| AI Voice Agents | 语音代理配置和多语言支持 | Voice Agents 文档 | 1 周 |
| AI 治理 | AI Control Tower 配置 | AI Control Tower 文档 | 0.5 周 |

**里程碑**：
- [ ] Now Assist for HR 官方认证
- [ ] 成功创建并部署至少 2 个 AI Agent
- [ ] 完成 Agentic Workflow 端到端实现

#### 🟣 第四阶段：架构师级别（8-12 周）
**目标**：企业级架构设计和治理

| 主题 | 内容 | 资源 | 时长 |
|------|------|------|------|
| 高级集成 | AI Agent Fabric、MCP、A2A | AI Agent Fabric 文档 + 社区 PoC | 2 周 |
| 系统治理 | HR MII、多实例管理、CMDB 集成 | Architecture 设计文档 | 2 周 |
| 性能优化 | 数据流优化、RAG 搜索调优 | 性能分析工具 + 社区最佳实践 | 2 周 |
| 安全合规 | AI 治理、EU AI Act 合规 | AI Control Tower 治理功能 | 1 周 |
| 行业解决方案 | 电信、金融、医疗行业 HRSD 方案 | 案例研究 + 客户故事 | 1 周 |

**里程碑**：
- [ ] CTA (Certified Technical Architect) 或 CMA 认证
- [ ] 完成完整的企业级 HRSD 架构设计文档
- [ ] 跨系统集成 PoC 验证

### 9.2 认证体系路线图

```
CSA (Certified System Administrator)
    ↓ (建议 3-6 个月经验)
CAD (Certified Application Developer)  ← 可选但推荐
    ↓ (建议参与 1-2 个 HRSD 项目)
CIS-HRSD (Certified Implementation Specialist - HR)
    ↓ (建议 Now Assist 实践经验)
Now Assist for HRSD 实施认证 (Bootcamp Accreditation)
    ↓ (建议架构师方向)
CTA / CMA (Certified Technical/Master Architect)
```

### 9.3 针对不同角色的学习策略

#### 👤 HR 管理员/专员（业务侧）
- **重点**：自助门户使用、案例管理、知识库利用
- **跳过**：开发、API 集成、代码
- **推荐**：HRSD Fundamentals On Demand + Now Assist Essentials
- **时间投入**：约 40-60 小时

#### 💻 ServiceNow 开发者/顾问（技术侧）
- **重点**：Flow Designer、Spoke 配置、API 集成、AI Agent 创建
- **必须掌握**：Integration Hub、Workday Spoke、AI Agent Studio
- **推荐**：CSA + CAD + CIS-HRSD + Now Assist Bootcamp
- **时间投入**：约 200-300 小时

#### 📋 项目经理（管理侧）
- **重点**：项目方法论、利益相关者管理、变更管理
- **了解技术**：不需要深入编码，但需理解架构和限制
- **推荐**：HRSD Fundamentals + ServiceNow Credentialing Program Guide
- **附加**：Scrum/Agile 认证 + 服务管理最佳实践
- **时间投入**：约 60-80 小时

#### 🏗️ 架构师（架构侧）
- **重点**：系统架构设计、数据流规划、集成策略、治理框架
- **必须掌握**：CSDM、Integration Hub 高级配置、AI Agent Fabric、AI 治理
- **推荐**：CTA 认证路径 + 多个跨域实施经验
- **附加**：安全认证 (SIR/GRC) + 数据管理最佳实践
- **时间投入**：约 300-500 小时

### 9.4 持续学习策略

| 途径                            | 频率               | 价值               |
| ----------------------------- | ---------------- | ---------------- |
| **Knowledge 年度大会**            | 每年（通常 5 月）       | 最新产品发布、专家交流、认证考试 |
| **World Forum 区域会议**          | 每年（各地时间不同）       | 本地网络、实践分享        |
| **ServiceNow 社区论坛**           | 每周               | 问题解答、技巧分享、行业动态   |
| **每月 HRSD Academy 直播**        | 每月第二个周三          | 产品专家深度讲解         |
| **Release Deep Dive 博客**      | 每个 Store Release | 功能详解、配置指南        |
| **ServiceNow University 新课程** | 持续更新             | 系统化学习路径          |
| **LinkedIn / YouTube**        | 持续               | 行业洞察、专家观点        |
| **NowBen 等分析网站**              | 持续               | 市场趋势、人才动态        |

### 9.5 常见坑与避坑指南

| 坑 | 描述 | 避坑策略 |
|----|------|----------|
| **过度自定义** | 修改核心 HR 表单/字段导致 AI 功能失效 | 尽量使用配置而非自定义；测试前确认影响范围 |
| **知识库质量差** | 过时/重复/标记不当的文章导致 AI 回答不准确 | 启动前进行内容审计，建立治理流程 |
| **集成选择错误** | 在 Spoke/Store App/自定义间选择不当 | 使用 ServiceNow Integration Pattern Decision Tree 评估 |
| **忽略升级影响** | 自定义修改在升级后被覆盖 | 使用 Update Set 管理变更；关注 Release Notes |
| **数据权限问题** | HRSD 与 HCM 间数据权限不一致 | 提前规划 ACL 和用户权限策略 |
| **AI Agent 过度承诺** | 对 AI Agent 能力期望过高 | 从小范围试点开始；建立 Human-in-the-Loop 机制 |
| **跨系统集成延迟** | 实时性要求高的场景集成延迟 | 评估 Webhook vs 定时同步；监控性能指标 |
| **许可证不足** | 功能升级后需要额外许可 | 提前确认许可需求与预算；联系客户经理 |
| **变更管理不足** | 员工抵触新系统 | 建立 OCM 计划；分阶段推出；收集用户反馈 |
| **忽略移动端** | 只关注桌面体验 | 确保 Employee Center 和 VA 的移动端适配 |