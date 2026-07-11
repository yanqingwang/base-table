# 05 — Agent 功能实操手册

> 关联提纲：[[../Reports/ServiceNow_HRSD_学习提纲#第五部分：Agent 功能（重点）|第五部分：Agent 功能]]
> 前置学习：[[02-AI能力]]
> 关联章节：[[AIReports/SNOW/06-AI-Agent生态集成]] · [[07-实施与最佳实践#7.3 Agent 部署|07-实施 - Agent 部署]]

---

## 🎯 学习目标

1. 能在实例中实际配置 HR Agent Workspace
2. 能用 AI Agent Studio 完整创建一个 Agent 并部署
3. 能通过 Update Set 将 Agent 从开发迁移到生产
4. 能解释 Autonomous Workforce 的分层架构
5. 能描述 Orchestrator 的多 Agent 编排流程

---

## 5.1 HR Agent Workspace 配置实操

### 导航路径

```
All Menu → User Administration → Workspace → HR Agent Workspace
```

或用菜单搜索 `hr_agent_workspace`

### 插件 ID

```
插件名称: HR Agent Workspace
插件 ID: com.sn_hr_agent_workspace
版本依赖: San Diego 起可用
```

### 核心功能清单

| 功能 | 说明 | 配置入口 |
| --- | --- | --- |
| 多标签单窗格视图 | 案例详情、活动流、侧边栏合一 | UI Builder → HR Agent Workspace |
| Agent Assist | AI 辅助建议 | Now Assist 需另配 license |
| 附件管理 | 拖拽上传、预览 | 内置，无需配置 |
| Checklists | 标准化流程模板 | `sn_hr_sp_checklist_config` 表 |
| 富文本编辑 | 日记字段支持格式化 | 系统属性 `glide.ui.rich_text.enabled` |
| 内联编辑 | 列表中直接修改字段 | UI Builder → List View |
| 深色/浅色主题 | 个性化 | 用户首选项 → 主题 |
| CCaaS 软电话 | Genesys 电话集成 | Spoke → Genesys Cloud CX |

### 版本演进速查

| 版本 | 关键变化 | 注意 |
| --- | --- | --- |
| 经典工作空间 | 基础案例管理 | 已不推荐使用 |
| San Diego+ | UI Builder、深色主题、内联编辑 | 当前主流 |
| v4.3 (Dec 2025) | CCaaS 集成 Genesys、通话管理 | 需额外许可 |
| v5.0+ (Mar 2026) | AI Agent 面板、智能推荐 | 最新预览 |

### 升级 Workspace 版本

1. 导航到 `All Menu → Workspace → HR Agent Workspace`
2. 检查当前版本：右上角"关于"图标 → 查看版本号
3. 确认实例版本支持目标版本（查看 `sys_upgrade_history` 表）
4. 安装最新补丁：`System Applications → All Available Applications → HR Agent Workspace`
5. 刷新浏览器缓存（Ctrl+F5），验证新功能可见

### ⚠️ 常见坑

- ❌ **Workspace 升级后布局异常**：UI Builder 中主题可能覆盖了自定义修改，升级前先导出 JSON 备份
- ❌ **Agent Assist 不显示**：检查 Now Assist license 是否激活，且 `sn_aia_agent_assist_config` 表中是否配置了 HR profile
- ❌ **CCaaS 软电话按钮灰色**：需先配置 Genesys Spoke，且 OAuth 令牌有效

### ✅ 动手练习

> **练习 5.1a**：在 PDI 中打开 HR Agent Workspace，使用 UI Builder 将侧边栏默认 Tab 从"详细信息"改为"活动流"。
>
> **练习 5.1b**：创建一个 HR case，观察 Agent Assist 面板是否给出建议（如无 license，可跳过但记录观察）。

---

## 5.2 AI Agent Studio — 7 步创建流程

### 导航路径

```
All Menu → Process Automation → AI Agent Studio
```

或直接搜索 `AI Agent Studio`

### 前置检查清单

| 项目 | 检查方法 |
| --- | --- |
| AI Agent 插件已激活 | `sn_aia` 插件状态 = active |
| Now Assist 已配置 | `sys_properties` 中 `sn_aia.llm.provider` |
| AI Agent 角色已分配 | `sn_aia_agent` 表的 ACL |
| 开发范围已创建 | 建议在独立 scope 开发 |

### 第 1 步：定义用例 (Use Case)

**位置**：AI Agent Studio → Create New → Use Case

**操作步骤**：
1. 点击 `New` → 填写 Use Case Name（如"员工离职处理"）
2. 填写 Description：描述业务目标（如"自动化员工离职的端到端流程"）
3. 选择所属 Application Scope（建议保持和应用一致）
4. 点击 Submit

**字段说明**：

| 字段 | 要求 | 示例 |
| --- | --- | --- |
| Name | 唯一，业务易懂 | 员工离职自动处理 |
| Description | 清晰描述目标和边界 | 当员工提交离职请求后，自动创建 HR case、通知各部门、生成 checklist |
| Application | 和应用 scope 一致 | Global 或 HR scope |

```javascript
// 也可以通过 script 创建 Use Case
var uc = new sn_aia.UseCase();
uc.setName("员工离职自动处理");
uc.setDescription("自动化处理员工离职全流程");
uc.setApplication("sys_scope_xxx");
uc.create();
```

### 第 2 步：创建 Agent

**位置**：Use Case 详情页 → Agents Tab → New

**操作步骤**：
1. 填写 Agent Name（如"离职处理 Agent"）
2. 配置 Role：选择预定义角色或自定义（角色影响行为风格）
3. 填写 Instructions：这是最关键的部分——告诉 Agent 该做什么、不该做什么
4. 配置 Channel：选择 Agent 在哪些渠道工作（门户、邮件、聊天等）

**Instructions 编写模板**：

```
你是一名 HR 专家，负责处理员工离职流程。
当接收到离职请求时：
1. 验证请求信息完整性（部门、日期、原因）
2. 创建 HR case，状态设置为"待处理"
3. 根据离职类型（自愿/非自愿）生成不同的 checklist
4. 如果缺少必要信息，通过活动流留言请求补充
5. 不得自动批准任何涉及财务的步骤——必须等待人工审批
```

**角色类型速查**：

| 角色 | 适用场景 | 行为特点 |
| --- | --- | --- |
| HR Specialist | HR 流程处理 | 遵循 HR 合规规则 |
| IT Support | IT 请求 | 偏向技术检查 |
| General Agent | 简单问答 | 自由度较高 |
| Custom Role | 特定业务 | 需自行定义行为边界 |

### 第 3 步：配置工具

**位置**：Agent 详情页 → Tools Tab → Edit

**内置工具列表**：

| 工具名 | 用途 | 是否必配 |
| --- | --- | --- |
| Case Management | 创建/更新案例 | 是 |
| Knowledge Retrieval | 搜索知识库 | 推荐 |
| Task Management | 创建和分配任务 | 按需 |
| Notification | 发送通知 | 推荐 |
| Catalog Fulfillment | 处理服务目录 | 按需 |
| Checklist | 标准化检查 | 推荐 |
| Document Generation | 生成文档 | 按需 |

**操作步骤**：
1. 点击 `Add Tool`
2. 选择工具 → 配置工具的输入参数映射
3. 设置工具的执行条件（如：仅当 case 状态=新时才创建 checklist）
4. 测试工具连接：点击 `Test Tool` → 输入示例参数 → 验证返回

**参数映射示例**（Case Management 工具）：

```
Trigger Input: employee_name → Tool Input: short_description
Trigger Input: departure_date → Tool Input: expected_end_date
Trigger Input: case_type → Tool Input: case_type (默认值: 离职)
```

### 第 4 步：构建子流程

**位置**：Agent 详情页 → Subflows Tab → Create New

**操作步骤**：
1. 点击 `Create Subflow` → 进入 Flow Designer
2. 拖拽组件构建自动化逻辑
3. 配置每个组件的输入输出映射
4. 保存并发布子流程

**常用子流程模式**：

```
离职处理子流程:
  Start
    ↓
  验证离职信息 [Decision]
    ├── 信息完整 → 创建 HR Case [Action]
    │               ↓
    │              通知部门经理 [Action]
    │               ↓
    │              生成离职 Checklist [Action]
    │               ↓
    │              发送确认邮件给员工 [Action]
    │               ↓
    │              设置 Case 状态 = 处理中 [Action]
    │
    └── 信息缺失 → 留言活动流请求补充 [Action]
                    ↓
                   设置 Case 状态 = 等待信息 [Action]
    ↓
  End
```

### 第 5 步：配置触发器

**位置**：Agent 详情页 → Triggers Tab → New

**触发器类型**：

| 类型 | 触发条件 | 推荐场景 |
| --- | --- | --- |
| Record Created | 表中有新记录创建 | 新 HR case 创建 |
| Record Updated | 记录状态/字段变化 | case 状态变更 |
| Scheduled | 定时执行 | 每日检查过期离职单 |
| API | 外部系统调用 | 从 HRIS 系统接收入职数据 |

**操作步骤**：
1. 选择触发器类型（如 Record Created）
2. 指定表名（如 `sn_hr_core_case`）
3. 设置条件（如 `type = 离职` AND `active = true`）
4. 映射触发数据到 Agent 输入参数
5. 激活触发器

**条件表达式示例**：

```javascript
// 仅当离职类型为"自愿"且状态为"新建"时触发
current.type == "voluntary" && current.state == 1
```

### 第 6 步：测试

**位置**：Agent 详情页 → Test Tab

**操作步骤**：
1. 点击 `Open Test Console`
2. 选择沙盒环境（Sandbox scope）
3. 输入测试数据（模拟触发器的输入）
4. 点击 `Run Test`
5. 观察 Agent 执行轨迹（Trace Log）：
   - 每一步的输入/输出
   - 工具调用结果
   - 子流程执行路径
6. 修正问题 → 重新测试

**测试数据示例**：

```json
{
  "employee_name": "张三 (测试用)",
  "departure_date": "2026-05-15",
  "reason": "个人发展",
  "type": "voluntary",
  "test_mode": true
}
```

### 第 7 步：部署

**位置**：Agent 详情页 → Deploy → 选择目标环境

**操作步骤**：
1. 点击 `Publish to Update Set`
2. 确认所有制品被捕获（见 5.3 节制品清单）
3. 命名 Update Set（如 `AI Agent - 离职处理 v1.0`）
4. 导出 XML → 导入目标实例
5. 目标实例中验证 → 激活 Agent

### ⚠️ 常见坑

- ❌ **Instructions 过于模糊**：Agent 行为不可预测。必须具体到"什么条件下做什么"，并明确"不能做什么"
- ❌ **工具参数映射错误**：Trigger 输入和工具输入类型不匹配。测试前先检查参数数据类型
- ❌ **触发器条件太宽**：比如只写 `type = 离职` 没加 `active = true`，导致旧记录被重复触发
- ❌ **scope 不一致**：Use Case 和 Agent 在不同 Application Scope 创建，导致 Update Set 捕获不全
- ❌ **测试环境数据污染**：测试时用了生产数据或未清理，影响沙盒隔离

### ✅ 动手练习

> **练习 5.2a**：在 PDI 中打开 AI Agent Studio，创建一个名为"新员工入职处理"的 Use Case。
>
> **练习 5.2b**：在上述 Use Case 下创建一个 Agent，配置 Instructions 描述"当新员工提交入职表单后，自动创建 IT 账号申请 task 和工位安排 task"。
>
> **练习 5.2c**：为 Agent 添加 Case Management 工具，配置从触发器输入到工具输入的字段映射。
>
> **练习 5.2d**：配置一个 Record Created 触发器，在 `sn_hr_core_case` 表有新记录且 `type = 入职` 时触发。
>
> **练习 5.2e**：在沙盒中运行一次测试，用模拟数据验证 Agent 是否按预期创建了 task。

---

## 5.3 Agent 生命周期管理与 Update Set 迁移

### 迁移原则

```
开发实例 (构建 Agent) → 导出 Update Set
  ↓
测试实例 (导入 → 验证 → 修复)
  ↓ 导出修补后的 Update Set
预生产实例 (导入 → UAT)
  ↓
生产实例 (导入 → 最终验证 → 激活)
```

### 涉及制品清单

在 Update Set 中务必检查以下表是否包含：

| 表名 | 包含内容 | 是否必须 |
| --- | --- | --- |
| `sn_aia_usecase` | Use Case 定义（顶层容器） | 必须 |
| `sn_aia_agent` | Agent 定义（指令、工具、角色） | 必须 |
| `sn_aia_agent_config` | Agent 激活状态和配置参数 | 必须 |
| `sn_aia_trigger_configuration` | 触发器定义 | 必须 |
| `sn_aia_trigger_agent_usecase_m2m` | 触发器与 Use Case 关联 | 必须 |
| `sys_hub_flow` | 子流程定义 | 必须 |
| `sys_script_client` | 关联的客户端脚本 | 按需 |
| `sys_ui_message` | 界面消息文本 | 按需 |

### 迁移操作步骤

**导出端（开发实例）**：

1. 导航到 `All Menu → System Applications → Update Sets`
2. 创建新 Update Set：`New` → 命名（如 `AI Agent - 离职处理 v1.0`）
3. 设置为 Current
4. 回到 AI Agent Studio → 找到 Use Case → 点击 `Publish to Update Set`
5. 验证捕获内容：`Update Set → Capture → 查看 Captured Updates`
6. 确保所有表都已捕获（对照上面制品清单）
7. 导出 XML：右键 Update Set → `Export to XML`

**导入端（目标实例）**：

1. 导航到 `System Applications → Update Sets → Retrieved Update Sets`
2. 点击 `Import Update Set from XML` → 选择 XML 文件
3. 预览 Update Set → 检查冲突
4. 点击 `Preview Update Set` → 确认无错误
5. 点击 `Commit Update Set` → 提交
6. 导航到 AI Agent Studio → 找到导入的 Use Case
7. 验证 Agent 配置 → 激活 → 运行测试

### ⚠️ 常见坑

- ❌ **Update Set 遗漏制品**：特别是 `sn_aia_trigger_configuration` 和 M2M 表容易被漏掉。提交前一定要预览，核对制品清单
- ❌ **目标实例插件版本不匹配**：`sn_aia` 插件版本不同导致部分功能不可用。迁移前检查 `sys_plugins` 中的 `sn_aia` 版本
- ❌ **Agent 导入后默认 inactive**：迁移后 Agent 不会自动激活。手动打开每个 Agent → 激活
- ❌ **权限问题**：目标实例缺少 AI Agent 管理员角色。确保导入用户有 `sn_aia_admin` 或 Equivalent

### ✅ 动手练习

> **练习 5.3a**：在 PDI 中创建一个 Update Set，将练习 5.2 中创建的 Agent 制品捕获到 Update Set 中。
>
> **练习 5.3b**：导出 Update Set XML，检查 XML 中是否包含 `sn_aia_agent` 和 `sn_aia_trigger_configuration` 记录。
>
> **练习 5.3c**（如有多实例）：将 Update Set 导入另一实例，验证 Agent 是否正常工作。

---

## 5.4 自主劳动力模型 (Autonomous Workforce)

### 架构分层

```
┌──────────────────────────────────────────────────┐
│               Autonomous Workforce                │
│  ┌────────────────────────────────────────────┐  │
│  │        AI Specialist（角色化 Agent）         │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐   │  │
│  │  │ HR Agent │ │ IT Agent │ │ CS Agent │   │  │
│  │  │ 离职处理  │ │ 账号创建  │ │ 工单响应  │   │  │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘   │  │
│  └────────┼────────────┼────────────┼──────────┘  │
│           │            │            │              │
│  ┌────────▼────────────▼────────────▼──────────┐  │
│  │         ServiceNow AI Platform              │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────┐  │  │
│  │  │ AI Ctrl  │ │  Data    │ │  Workflow   │  │  │
│  │  │  Tower   │ │  Layer   │ │  Engine     │  │  │
│  │  └──────────┘ └──────────┘ └─────────────┘  │  │
│  └──────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────┘
```

### 四个核心概念

| 概念 | 说明 | 落地方式 |
| --- | --- | --- |
| 角色化 | Agent 被赋予明确的业务角色 | AI Agent Studio → Role |
| 上下文感知 | Agent 自动访问相关业务数据 | Record Permissions + Data Stream |
| 受控治理 | AI Control Tower 统一管理监控 | Control Tower Dashboard |
| 可观测性 | 审计追踪和性能监控 | Agent Performance Analytics |

### AI Control Tower 可观测指标

| 指标 | 查看位置 | 用途 |
| --- | --- | --- |
| Agent 执行次数 | `sn_aia_agent_execution_log` | 了解使用频率 |
| 成功率 | AI Agent Studio → Analytics | 监控 Agent 健康度 |
| 平均处理时长 | Metrics Dashboard | 性能优化 |
| 人工介入率 | Control Tower → Handoff | 评估自动化效果 |
| Token 消耗 | LLM Provider 日志 | 成本控制 |

### ⚠️ 常见坑

- ❌ **赋予太多 Agent 全局权限**： Autonomous Workforce 强调"角色化"，不要给 Agent admin 级别权限——只授予完成特定任务所需的最小权限
- ❌ **忽略监控**：部署后不设置 Control Tower 监控，导致 Agent 故障无人知晓
- ❌ **人工介入率过高**：如果 Agent 频繁转人工，说明 Instructions 不够精确或工具配置不完整

### ✅ 动手练习

> **练习 5.4a**：画出 Autonomous Workforce 架构图（手绘或 Mermaid），标注 AI Specialist、AI Control Tower、AI Platform 三层的关系。
>
> **练习 5.4b**：在 PDI 中找到 Control Tower Dashboard（搜索 `AI Control Tower`），截图记录当前的 Agent 运行状态——即使没有数据，熟悉界面位置。

---

## 5.5 编排器 (Orchestrator)

### 协作流程

Orchestrator 是多 Agent 协调的核心组件，负责：

1. **意图识别**：分析用户请求的核心目标
2. **任务分解**：将复杂请求拆分为多个子任务
3. **Agent 调度**：将子任务分派给最合适的 Specialist Agent
4. **结果聚合**：收集各 Agent 输出，合并为统一响应
5. **异常处理**：子任务失败时，尝试重试或转人工

### 典型离职场景编排流程

```
员工在门户提交: "我要办理离职"
        ↓
Orchestrator 接收请求
        ↓
  意图识别: [离职处理]
        ↓
  ┌── 任务分解 ──────────────────────────────┐
  │                                           │
  ├─ 子任务 1: 验证员工信息和离职类型           │
  │  → 调度: HR Agent (离职验证)              │
  │  → 输出: 员工信息确认、离职类型归类         │
  │                                           │
  ├─ 子任务 2: 创建 HR Case 和 Checklist      │
  │  → 调度: HR Agent (案例管理)              │
  │  → 输出: Case #HR0012345、5 步 checklist  │
  │                                           │
  ├─ 子任务 3: 发起 IT 资产回收               │
  │  → 调度: IT Agent (设备管理)              │
  │  → 输出: IT Task #IT006789                │
  │                                           │
  ├─ 子任务 4: 通知部门经理和财务              │
  │  → 调度: Notification Agent               │
  │  → 输出: 已发送 3 封通知                  │
  │                                           │
  └───────────────────────────────────────────┘
        ↓
  Orchestrator 聚合结果:
  "您的离职流程已启动。Case 编号 HR0012345，
   请配合 IT 部门在 5 月 15 日前归还设备。
   您将收到 3 封确认邮件。如有问题，请联系 HR。"
```

### 配置 Orchestrator 路径

```
AI Agent Studio → Orchestrator → 配置编排规则
```

### 编排规则配置要点

| 配置项 | 说明 | 推荐值 |
| --- | --- | --- |
| Intent Classification | 意图识别模型 | 使用预训练 HR 模型 |
| Task Decomposition | 分解策略 | 按部门拆分 |
| Agent Selection | 选择策略 | 基于角色和可用性 |
| Fallback Behavior | 失败处理 | 重试 1 次 → 转人工 |
| Timeout | 超时设置 | 每个子任务 30s |

### 入职场景自测题

如果员工提交"我要入职"，Orchestrator 应做何种分解？

```
参考思路:
├─ HR Agent: 创建入职 case，触发 onboarding checklist
├─ IT Agent: 创建账号申请（AD/LDAP）、申请硬件设备
├─ Facilities Agent: 分配工位、申请门禁卡
├─ Payroll Agent: 录入薪资系统、设置银行信息
└─ Buddy Agent: 分配入职引导人、发送欢迎邮件
```

### ⚠️ 常见坑

- ❌ **子任务间数据依赖未处理**：IT Agent 需要 HR 验证完成后的员工信息才能创建账号。用 Orchestrator 的 Condition Gate 控制执行顺序
- ❌ **超时设置不合理**：跨系统调用（如 Genesys CCaaS）可能耗时较长。适当放宽此类子任务的超时
- ❌ **没有人工兜底**：所有子任务都失败时，必须有一个"转人工"fallback，否则用户将无响应

### ✅ 动手练习

> **练习 5.5a**：在 AI Agent Studio 中创建一个 Orchestrator 配置，将"员工入职"请求分解为至少 3 个子任务，分配给不同的 Agent。
>
> **练习 5.5b**：画出"员工转岗"场景的 Orchestrator 编排流程图（HR Agent 处理合同更新、IT Agent 处理权限变更、Facilities Agent 处理工位变更）。

---

## 综合练习

> **综合练习 1**：设计一个完整的"员工离职自动化"方案，涵盖：
> - AI Agent Studio 中创建 Use Case + Agent
> - 配置至少 3 个工具和 1 个触发器
> - 导出到 Update Set
> - 画出 Orchestrator 编排图
>
> **综合练习 2**：假设公司有 10000 名员工，每月离职率 2%，每单离职处理需 HR 人工 45 分钟。
> - 如果 Agent 自动化 80% 的离职处理，每月节省多少小时？
> - 如果 HR 时薪 ¥80，每月节省多少成本？
> - 计算 ROI（假设年 license 成本 ¥200,000）。

---

## ✅ 验证题目

1. **AI Agent Studio 创建 Agent 的 7 步流程是什么？请用自己的话简述每一步的关键操作。**
2. **编写一段 Instructions，让 Agent 处理"员工请假审批"——要求：自动批准 <=3 天，>3 天转经理审批，年假需检查余额。**
3. **Update Set 迁移 AI Agent 时，需要包含至少哪 6 个关键制品？分别来自哪些表？**
4. **Autonomous Workforce 模型中，"角色化"和"受控治理"如何协同工作？**
5. **假设员工同时提交离职请求和转岗请求，Orchestrator 如何避免冲突（比如 IT 同时收到"回收设备"和"保留设备"的矛盾指令）？**

---

## 🔗 下一步

学习完 Agent 功能后，进入 [[AIReports/SNOW/06-AI-Agent生态集成]] 了解 Agent 如何跨平台协作。
