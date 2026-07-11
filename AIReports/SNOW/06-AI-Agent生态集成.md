# 06 — AI Agent 生态集成 · 实操手册

> 关联提纲：[[../Reports/ServiceNow_HRSD_学习提纲#第六部分：AI Agent 生态集成|第六部分：AI Agent 生态集成]]
> 前置学习：[[02-AI能力#2.6 AI Agent Fabric|02-AI能力 - AI Agent Fabric]] · [[05-Agent功能|05-Agent功能]]
> 关联章节：[[04-集成管理#4.11 AI Agent Fabric|04-集成管理 - AI Agent Fabric]]

---

**核心一句话**：MCP 让 Agent 用工具，A2A 让 Agent 间对话，Fabric 把一切粘起来。

---

## 6.1 MCP 协议 · 让 Agent 用上工具

### 它解决什么问题？

AI Agent 大模型本身不直接访问外部系统。MCP（Model Context Protocol）定义了一套标准接口，让 Agent 像调用函数一样调用外部工具。

> 类比：MCP = AI 世界的 USB 协议。没有它，每个外设都要专门接线；有了它，即插即用。

### ServiceNow 的双重角色（关键理解）

同一个 ServiceNow 平台，根据场景不同可以扮演两个角色：

| 角色 | 场景说明 | 流向 |
| --- | --- | --- |
| **MCP 客户端** | SNOW Agent 调用外部工具获取数据或执行操作 | SNOW Agent → MCP → 外部工具（Jira / Slack / DB） |
| **MCP 服务端** | 外部 Agent 调用 SNOW 的 Now Assist Skill | 外部 Agent → MCP → SNOW Now Assist Skill |

文字图：MCP 客户端模式

```
┌─ ServiceNow ──────────────────────┐
│                                    │
│  AI Agent（HR 事件处理）              │
│    │                                │
│    ├─ MCP → Jira（查工单）           │
│    ├─ MCP → Slack（发通知）          │
│    └─ MCP → 内部 DB（查员工信息）      │
│                                    │
└────────────────────────────────────┘
```

文字图：MCP 服务端模式

```
┌─ Google Vertex AI ────┐
│  Agent                │
│    │ MCP 调用          │
└────┼──────────────────┘
     ▼
┌─ ServiceNow ──────────────────────┐
│  MCP Server Console               │
│    │                               │
│    └─ Now Assist Skill（暴露为工具） │
│       · 创建 HR 事件               │
│       · 查询员工信息               │
│       · 提交审批请求               │
└────────────────────────────────────┘
```

### ⚠️ 常见坑

- **坑 1**：把 MCP 当成 Agent 通信协议。MCP 是 Agent ↔ 工具，不是 Agent ↔ Agent。
- **坑 2**：暴露太多 Skill 不做权限控制。每个暴露的 Skill 都是一个攻击面，最小化暴露。

### 实操配置路径

```
AI Agent Studio → MCP Server Console
  → 新建 MCP Server 配置
  → 选择要暴露的 Now Assist Skill（逐项勾选，别全选）
  → 配置 OAuth 2.0 认证（必须）
  → 发布 → 外部 Agent 通过发现机制获取可用工具列表
```

### 安全要点

| 机制 | 作用 |
| --- | --- |
| OAuth 2.0 | 每次调用都要认证，拒绝匿名请求 |
| 按技能暴露 | 粒度控制：暴露"查询员工"而不暴露"修改薪资" |
| 审计日志 | 所有 MCP 调用 → 审计表，可追溯谁在何时调了什么 |

---

## 6.2 A2A 协议 · 让 Agent 间对话

### 它解决什么问题？

A2A（Agent-to-Agent Protocol，Google 开放协议 v0.3）解决 **Agent 之间怎么找到对方、怎么说话、怎么传结果**的问题。

### MCP vs A2A 对比（Obsidian 安全表格）

| 维度 | MCP | A2A |
| --- | --- | --- |
| 通信双方 | Agent ↔ 工具/数据源 | Agent ↔ Agent |
| 核心目的 | 让 Agent 会用工具 | 让 Agent 能协作 |
| 标准组织 | Anthropic 发起 | Google 发起（与社区共建） |
| 发现机制 | 配置暴露 | Agent Card（元数据注册） |
| 认证方式 | OAuth 2.0 | OAuth 2.0 联合令牌 |
| SNOW 角色 | 客户端 + 服务端 | Agent 参与者 |
| 典型场景 | Agent 查 Jira 工单 | HR Agent 问 IT Agent 设备状态 |

### A2A 完整通信流程

```
Step 1: Agent A 上线 → 注册 Agent Card 到目录
         Agent Card 包含：能力描述、输入格式、输出格式、认证要求

Step 2: HR Agent（Agent A）需要员工设备信息
         → 查询 Agent Directory
         → 发现 IT Agent（Agent B）的 Agent Card
         → 确认 Agent B 能提供"设备状态查询"能力

Step 3: Agent A → A2A 协议请求 → Agent B
         请求体：{"action": "get_device_status", "employee_id": "E12345"}

Step 4: Agent B 处理 → 返回结果（同步/异步都支持）
         响应体：{"status": "assigned", "device": "ThinkPad X1", "eta": "2天"}

Step 5: Agent A 收到结果 → 继续自己的业务流程
```

### ⚠️ 关键提醒

- A2A 不要求双方同厂商 — ServiceNow Agent 可以和 Vertex AI Agent、AWS Bedrock Agent 直接对话。
- Agent Card 是纯元数据描述，不传输实际数据内容。

### 当前支持的平台

| 平台 | 支持程度 |
| --- | --- |
| Google Vertex AI | 原生支持 |
| AWS Bedrock | 支持 |
| Azure AI Foundry | 支持 |

---

## 6.3 AI Agent Fabric 架构 · 统一粘合层

### 它是什么？

AI Agent Fabric 不是一个新的协议，而是 ServiceNow 提供的一个**架构框架**，把 MCP、A2A、编排逻辑统一在一起。

文字图：Fabric 架构

```
                    AI Agent Fabric
                          │
     ┌────────────────────┼────────────────────┐
     │                    │                    │
     ▼                    ▼                    ▼
   MCP 协议            A2A 协议           合作伙伴扩展
 (工具集成)          (Agent 协作)       (Accenture/IBM/MS)
     │                    │                    │
     └────────────────────┼────────────────────┘
                          │
               ┌──────────┴──────────┐
               │  ServiceNow AI      │
               │  Platform           │
               │（控制塔 / 编排层）     │
               └─────────────────────┘
```

### 核心价值（面试经常问）

| 价值 | 解释 |
| --- | --- |
| 互操作性 | 不同厂商 Agent 能一起工作，不绑定单个供应商 |
| 去中心化 | 不需要一个中心编排器，Agent 通过协议自治协作 |
| 标准化 | MCP + A2A 都是开放协议，避免厂商锁定 |

### ⚠️ 常见坑

**坑**：以为 Fabric 是一个产品或者一个 UI 界面。
**正解**：Fabric 是架构概念，不是具体安装包。你在平台上看到的本质是 MCP Server Console + A2A 配置的组合。

---

## 6.4 跨域场景实操推演

### 场景 1：安全事件触发员工通知

**背景**：IT 监控发现高危漏洞，需要通知受影响员工立即更新设备。

```
Step 1: IT Agent（漏洞扫描系统）
          发现 CVE-2026-XXXX 高危漏洞
          → 影响范围：58 台设备

Step 2: IT Agent → A2A 协议 → SecOps Agent
          请求安全风险评估
          SecOps Agent 返回："风险等级 Critical，需 24h 内修复"

Step 3: SecOps Agent → A2A 协议 → HR Agent
          传递受影响设备列表
          HR Agent 匹配员工信息 → 获取 58 位员工联系方式

Step 4: HR Agent → MCP 协议 → Slack / Email 系统
          发送通知："请预约 IT 部门更新设备，安全团队要求 24h 内完成"

Step 5: 汇总结果返回给 SecOps Agent
          "已通知 58 位员工，48 人已预约，10 人待跟进"
```

**使用的协议链路**：

```
IT Agent ──A2A──→ SecOps Agent ──A2A──→ HR Agent ──MCP──→ Slack
                                                    └─MCP──→ Email
```

### 场景 2：新员工入职联动

**背景**：HR 创建一个新员工入职任务，自动触发 IT、Facilities、Security 三个部门协同。

```
Step 1: HR Agent 创建入职任务（员工张三，2026-06-01 入职）
          → 触发自动化入职流程

Step 2: HR Agent ──A2A──→ IT Agent
          请求：为张三配置 ThinkPad X1 + 开通 AD 账号
          IT Agent 响应："设备已分配，预计 5 月 28 日就绪"

Step 3: HR Agent ──A2A──→ Facilities Agent
          请求：分配工位
          Facilities Agent 响应："3F-A12 已分配"

Step 4: HR Agent ──A2A──→ Security Agent
          请求：开通门禁卡
          Security Agent 响应："请联系前台领取"

Step 5: HR Agent 汇总 → 发送入职确认邮件给 HRBP
          "入职流程已启动：
           ✓ IT设备：ThinkPad X1，预计 5/28 就绪
           ✓ 工位：3F-A12
           ✓ 门禁卡：请联系前台领取"
```

**关键点**：这里没有中心 Orchestrator。HR Agent 自己作为工作流发起者，A2A 协议让它可以同时并行询问三个 Agent。

### 什么场景该用 MCP vs A2A

| 你要做的事 | 用哪个 |
| --- | --- |
| Agent 要查数据库 | MCP（工具调用） |
| Agent 要发 Slack 消息 | MCP（工具调用） |
| Agent 要和另一个 Agent 交换信息 | A2A |
| 外部 Agent 要调用 SNOW 功能 | MCP（服务端模式） |
| HR 事件要通知 IT 去配设备 | A2A |

---

## 6.5 ✅ 动手练习

### 练习 1：协议判断

判断以下场景应该用 MCP 还是 A2A：

1. HR Agent 需要从 Workday 查询员工花名册：_____
2. IT Agent 需要告知 HR Agent 设备已就绪：_____
3. Security Agent 调用 CrowdStrike API 查询威胁：_____
4. 外部 Google Agent 调用 ServiceNow 创建事件：_____

（答案：MCP / A2A / MCP / MCP）

### 练习 2：流程图填空

补全以下 A2A 通信流程：

```
HR Agent 需要确认新员工设备状态：

Step 1: HR Agent → ___________ → 发现 IT Agent
Step 2: HR Agent 读取 IT Agent 的 ___________
Step 3: HR Agent → ___________ → IT Agent → 查询设备状态
Step 4: IT Agent 返回结果
```

（答案：Agent Directory / Agent Card / A2A 协议）

### 练习 3：场景设计

设计一个"员工离职"场景的 Agent 协作流程，至少涉及 3 个 Agent，标注每个步骤使用的协议（MCP / A2A）。

---

## 6.6 本章速查表

| 概念 | 一句话记法 |
| --- | --- |
| MCP | Agent 用工具的协议，SNOW 可做客户端或服务端 |
| A2A | Agent 间对话的协议，通过 Agent Card 发现彼此 |
| AI Agent Fabric | 架构框架，把 MCP + A2A + 生态统一在一起 |
| Agent Card | A2A 中描述 Agent 能力的元数据 |
| 跨域场景 | 离不开 MCP + A2A 的组合使用 |

---

## 🔗 下一步

学习完 Agent 生态集成后，进入 [[07-实施与最佳实践|07-实施与最佳实践]] 了解如何落地部署。
