# ServiceNow HRSD 学习提纲

> 📍 **实操手册位于** → **[[00-Index]]**  
> 全部 9 章已升级为【实操手册】格式 ✅ 含逐步配置路径、插件 ID、常见坑、动手练习

---

## 📋 学习目标
全面掌握 ServiceNow HR Service Delivery (HRSD) 平台的核心架构，重点理解 AI 能力、知识管理、集成管理和 Agent 功能。

---

## 第一部分：产品基础 → [[01-产品基础|实操手册]]
- [ ] **1.1 HRSD 产品定位** — 服务交付理念、Employee Center、核心模块概览
- [ ] **1.2 产品模块组成** — Case Management、Knowledge Management、Journey Management、Virtual Agent、Employee Document Management
- [ ] **1.3 SKU 与版本体系** — Standard / Professional / Enterprise Plus 功能差异
- [ ] **1.4 产品演进认知** — Vancouver (2023.9) → Dec 2025 → Mar 2026 关键里程碑

## 第二部分：AI 能力（核心重点） → [[02-AI能力|实操手册]]
- [ ] **2.1 Now Assist for HR 概述** — 生成式 AI 在 HR 场景的应用
  - 案例摘要生成（Case Summarization）
  - 对话摘要（Conversation Summarization）
  - 解决备注自动生成（Resolution Notes）
  - 知识文章生成（KB Generation）
- [ ] **2.2 RAG 检索增强生成** — AI Search 工作原理（检索 → 增强 → 生成）
  - 知识块 (Knowledge Blocks) 与附件搜索
  - 编码查询字符串与 Approved 标记
  - 混合搜索（关键词 + 语义向量）
- [ ] **2.3 Agentic AI 架构** — 自主 AI Agent 概念、Human-in-the-Loop 模式
  - AI Agent Studio（无代码创建）
  - AI Agent Orchestrator（编排器）
  - AI Control Tower（治理控制台）
- [ ] **2.4 关键 Agent 详解**
  - Predict Service and Transfer Workflow（Record Predictor + Transfer Agent）
  - Resolve Non-Critical HR Case Workflow（Criticality Detection + Search & Notify）
  - Resolve Critical HR Case Workflow（Case Planner + Next Best Action Recommender）
  - 语音 Agent（PTO、差旅、案例查询等）
  - Growth Experience Agent（反馈收集、成长对话）
  - Hiring Experience Agent（面试安排、职位创建）
- [ ] **2.5 AI Voice Agents** — 语音自助服务、CCaaS 集成（Genesys/Twilio）、多语言支持
- [ ] **2.6 AI Agent Fabric** — Agent 间通信（MCP + A2A 协议）

## 第三部分：知识管理（重点） → [[03-知识管理|实操手册]]
- [ ] **3.1 知识库结构** — 文章、目录、知识块、附件的组织方式
- [ ] **3.2 知识内容治理** — 内容审计、标签策略、所有者分配、定期刷新
- [ ] **3.3 AI 搜索优化** — 编码查询、Approved 标记、结果改进规则（RIR）
- [ ] **3.4 Knowledge Graph** — 知识图谱概念与 HR 应用场景
- [ ] **3.5 Virtual Agent 主题知识** — LLM Topics 与 HCM 集成的知识访问
- [ ] **3.6 外部内容连接器** — SharePoint、Confluence 爬取与索引

## 第四部分：集成管理（重点） → [[04-集成管理]]
- [ ] **4.1 HCM 集成总览** — "HCM 为事实源，HRSD 为交互层" 架构
- [ ] **4.2 Workday 集成**
  - HR Service Delivery Integration（标准 Store App）
  - HR Service Delivery Advanced Integration（薪酬/日历/PTO）
  - Workday HR Spoke（Integration Hub，SOAP + REST + Webhook）
  - Transform Maps 与 Staging 表机制
- [ ] **4.3 SAP SuccessFactors 集成** — Spoke + 映射表 + LLM Topics
- [ ] **4.4 Oracle HCM 集成** — 标准集成 + Advanced Integration
- [ ] **4.5 Integration Hub 深度** — Spoke 市场、Flow Designer、事件驱动架构
- [ ] **4.6 HR Multi-Instance Integration (HR MII)** — 跨实例 HR 服务通信
- [ ] **4.7 通信集成** — Microsoft 365、Slack、Teams、Meta Workplace
- [ ] **4.8 学习/人才集成** — Cornerstone、Pluralsight、Udemy、Workday Learning
- [ ] **4.9 安全与身份集成** — Azure AD、Okta、Sailpoint、Adobe Sign、DocuSign
- [ ] **4.10 CCaaS 集成** — Genesys Cloud 软电话 + 通话同步 + Wrap-Up
- [ ] **4.11 AI Agent Fabric** — MCP Server（暴露能力）+ A2A（Agent 间协作）
- [ ] **4.12 第三方合作伙伴生态** — Accenture、IBM、Microsoft、Google Cloud 等

## 第五部分：Agent 功能（重点） → [[05-Agent功能]]
- [ ] **5.1 HR Agent Workspace** — 多标签视图、Agent Assist、可配置界面（UI Builder）
- [ ] **5.2 AI Agent Studio** — Agent 创建流程（用例→角色→工具→触发器→测试→部署）
- [ ] **5.3 Agent 生命周期管理** — Update Set 迁移、审计追踪、版本控制
- [ ] **5.4 自主劳动力模型 (Autonomous Workforce)** — Agent 角色化、上下文感知、治理框架
- [ ] **5.5 编排器 (Orchestrator)** — 多 Agent 协作、任务分配与协调

## 第六部分：AI Agent 生态集成 → [[AIReports/SNOW/06-AI-Agent生态集成]]
- [ ] **6.1 MCP（Model Context Protocol）** — Agent ↔ 工具/数据源的标准协议
  - ServiceNow 双重角色（客户端 + 服务端）
  - MCP Server Console 内置管理界面
  - OAuth 认证 + 技能暴露为工具
- [ ] **6.2 A2A（Agent2Agent Protocol）** — Agent ↔ Agent 的协作协议
  - Agent Card 发现机制
  - 同步/异步调用模式
  - Google Vertex AI / AWS Bedrock / Azure AI Foundry 支持
- [ ] **6.3 AI Agent Fabric 架构** — 跨厂商 Agent 互通的通信骨干
- [ ] **6.4 典型跨域场景**
  - IT Agent 发现漏洞 → SecOps Agent 处理 → HR Agent 通知员工
  - HR Agent 创建入职 → IT Agent 配置设备 → Facilities Agent 分配工位

## 第七部分：实施与最佳实践 → [[07-实施与最佳实践]]
- [ ] **7.1 部署准备** — 插件依赖检查（HRSD Core、GAF、AI Search、Now Assist）
- [ ] **7.2 知识准备** — 内容审计先行、元数据标准化、"Approved for Now Assist" 标记
- [ ] **7.3 Agent 部署** — 测试环境验证、Update Set 管理、Human-in-the-Loop 设计
- [ ] **7.4 集成策略** — HCM 为事实源、STP 直通处理、Webhook 事件驱动
- [ ] **7.5 治理模型** — AI 所有权定义、审查周期、EU AI Act / NIST AI RMF 合规
- [ ] **7.6 持续优化** — AI 效果评估（采纳率/缺陷率）、知识库迭代、技能培训
- [ ] **7.7 常见坑与避坑**
  - 避免直接修改核心 HR 表（破坏 AI 功能）
  - 知识库质量差 → AI 回答不准确
  - 集成模式选择错误（Spoke vs 自定义）
  - 忽略升级对自定义代码的影响
  - 变更管理不足导致员工抵触

## 第八部分：全球人才市场与人才分布 → [[08-全球人才市场]]

### 8.1 全球人才供需概况
| 指标 | 数据 |
|------|------|
| 全球 ServiceNow 相关岗位 | 31,000+ 个活跃职位 |
| 美国岗位数量 | 14,000+ |
| 市场增速 | 年均 20%+ |
| 人才缺口 | 70% 招聘经理认为存在技能缺口 |
| 合格人才供给 | 严重不足（平台年轻、认证门槛高） |

### 8.2 地理分布
| 区域 | 特征 | 薪资水平 |
|------|------|----------|
| **北美（美国为主）** | 最大市场，总部所在地，60%+ 收入占比 | 中级 $110K-155K，架构师 $150K-220K+ |
| **西欧（英国、德国、荷兰等）** | 强监管环境，GDPR 驱动需求 | 中级 £70K-110K，每日 £500-800 |
| **亚太（中国、日本、韩国、澳大利亚）** | 快速增长，日本/澳大利亚最成熟 | 中国中端 ¥300K-600K，日本/澳较高 |
| **印度** | 最大交付中心，增长最快（15-20% YoY） | $25K-50K（本地），远程可达 80-90% 美薪 |
| **拉美（墨西哥、哥伦比亚、巴西）** | 近岸外包兴起中 | 介于印度和美国之间 |
| **中东（UAE、沙特）** | Vision 2030 驱动，数字化需求大 | 税优，薪资有竞争力 |

### 8.3 HRSD 专项人才
| 维度 | 说明 |
|------|------|
| **认证体系** | CIS-HRSD（主认证）、Now Assist Bootcamp 认证、AI Agent 交付认证 |
| **热门城市** | 纽约、旧金山、亚特兰大、伦敦、班加罗尔、海得拉巴、悉尼、多伦多 |
| **主要雇主** | 大型咨询公司（Accenture/Deloitte/IBM/Capgemini）、企业内部 IT 团队 |
| **招聘趋势** | "HRSD + AI" 复合型需求增长最快，纯管理岗需求平稳 |
| **薪资溢价** | 持有 CIS-HRSD + Now Assist 认证的人才比仅持 CSA 高 15-25% |

### 8.4 人才市场洞察
- **供需失衡**：仅 40% 组织开始部署 AI Agent，需求远大于供给
- **HRSD 专项**：约 1,000+ 个 HR 特定 ServiceNow 岗位，需求持续增长
- **最佳组合**：CIS-HRSD + 安全认证（GRC/SecOps）是最高薪组合
- **Knowledge 2026 效应**：大会前后（5-7 月）人才流动最活跃，是求职/招聘黄金窗口
- **远程工作**：越来越多美国公司招聘海外 ServiceNow 人才，支付 80-90% 美国薪资

---

## 📚 学习资源
| 类型 | 资源 |
|------|------|
| 官方文档 | ServiceNow Docs（HRSD、AI Agent Studio、AI Search、AI Agent Fabric） |
| 学习平台 | ServiceNow University（University → Learning Paths） |
| 社区博客 | HRSD Blog、Now Assist 文章、Workflow® 杂志 |
| 实践资源 | HRSD Academy 月度会议（每月第2个周三）、Release Deep Dive |
| 认证路径 | CSA → CAD → CIS-HRSD → Now Assist Bootcamp → CTA/CMA |
| 市场分析 | SNTrends.com（实时人才市场数据）、NowBen、Lucky X Salary Guide |
| 白皮书 | 2025 Workforce Skills Forecast（ServiceNow × Pearson） |

## ⏰ 学习计划建议 → [[09-学习计划]]

### 🟢 第一阶段：基础入门（4-6 周）
| 目标 | 内容 | 资源 | 时长 |
|------|------|------|------|
| 平台认知 | ServiceNow 平台导航、基本概念 | ServiceNow Administration Fundamentals | 2 周 |
| HRSD 核心 | Case Mgmt、Knowledge Mgmt、Employee Center | HRSD Fundamentals（On Demand） | 1.5 周 |
| 认证准备 | CSA 考试 | 官方 Practice Test + University 课程 | 1.5 周 |
| 实操 | 沙盒中创建案例/知识文章/HR 服务 | 个人沙盒实例 | 持续 |

**里程碑**：通过 CSA 认证，熟悉 HRSD 基本功能

### 🟡 第二阶段：核心进阶（6-8 周）
| 目标 | 内容 | 资源 | 时长 |
|------|------|------|------|
| 案例管理深度 | SLA、分配规则、工作流高级配置 | HRSD Implementation On Demand | 2 周 |
| 知识管理 | 治理策略、内容设计 | Knowledge Management Implementation | 1.5 周 |
| 旅程设计 | 入职/离职旅程 | Employee Journey Management 系列 | 1.5 周 |
| HCM 集成 | Workday/SF/Oracle 集成实战 | Integration Hub 文档 + 社区文章 | 2 周 |

**里程碑**：通过 CIS-HRSD (CIS-HR) 认证，完成至少 1 个集成项目

### 🔵 第三阶段：AI 能力专精（6-8 周）
| 目标 | 内容 | 资源 | 时长 |
|------|------|------|------|
| Now Assist | 生成式 AI 技能配置与管理 | Now Assist for HRSD Essentials 课程 | 2 周 |
| AI Agent Studio | Agent 创建、配置、编排实战 | AI Agent Studio 文档 + 社区教程 | 2 周 |
| Agentic Workflow | Resolve HR Case 流程实现 | Resolve HR Case 文章系列 + 实操 | 1.5 周 |
| 语音 Agent | 语音代理配置 | Voice Agents 文档 | 1 周 |

**里程碑**：Now Assist 实施认证，部署至少 2 个 AI Agent

### 🟣 第四阶段：架构师级别（8-12 周）
| 目标 | 内容 | 资源 | 时长 |
|------|------|------|------|
| 高级集成 | AI Agent Fabric、MCP、A2A 实现 | AI Agent Fabric 文档 + 社区 PoC | 2 周 |
| 系统架构 | 多实例管理、数据流设计 | Architecture 文档 + 行业案例 | 2 周 |
| AI 治理 | Control Tower、全面合规 | AI Control Tower + NIST AI RMF | 1 周 |
| 认证冲刺 | CTA / CMA 考试准备 | University + 官方 Practice Test | 2-3 周 |

**里程碑**：CTA/CMA 认证，完成企业级架构设计

---

### 📌 持续学习方法
| 途径 | 频率 | 价值 |
|------|------|------|
| Knowledge 年度大会 | 每年 5 月 | 最新发布、专家交流、认证考试 |
| HRSD Academy 直播 | 每月第 2 周三 | 产品专家深度讲解 |
| Release Deep Dive 博客 | 每个 Store Release | 功能详解、配置指南 |
| ServiceNow 社区论坛 | 每日 | 问题解答、技巧分享 |
| LinkedIn / Twitter | 每日 | 行业洞察、人脉拓展 |

### ⚠️ 常见坑与避坑
| 坑 | 避坑策略 |
|----|----------|
| 过度自定义核心表导致 AI 失效 | 配置优先，自定义前评估影响 |
| 知识库脏数据导致 AI 胡说八道 | 启动前先做内容审计 |
| 集成模式选择错误 | 用 Integration Pattern Decision Tree 评估 |
| 忽略版本升级影响 | Update Set 管变更，关注 Release Notes |
| AI Agent 期望过高 | 小范围试点，建立 Human-in-the-Loop |
| 变更管理缺失 | 建立 OCM 计划，分阶段推出 |

---

> 学习报告完整版：`/home/wang/wk/Reports/ServiceNow_HRSD_学习报告.md`  
> 实操手册（逐步配置 + 验证题）：**`Reports/SNOW/`** 文件夹  
> 📍 在 Obsidian 中打开 `AITasks/` 为 Vault，通过 `[[SNOW/XX-xxx]]` 双链导航  
> 本提纲包含可勾选项，支持逐项跟踪学习进度。