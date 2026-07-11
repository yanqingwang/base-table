# 用 DocuSign 做 HR 签署的体验设计研究报告

> 主题：如何在 HR 入职/离职场景下用 DocuSign 既合规又不让签署人太累
> 视角：以**签署者**（员工）和 **HR Ops** 双方体验为主
> 重点：白领单签、蓝领 Day 1 批量入职与数据收集、白领/蓝领离职差异、马来西亚 **Resignation Letter + Certificate of Employment** 双文件
> 调研日期：2026-06-04
> 一手信源：DocuSign Official Docs（含 Web Forms vs PowerForms 原文）、Workday Marketplace、Docusign Developers、Malaysia Employment Act 1955（Act 265, 2023-01 修订版）、Employment (Amendment) Act 2022（2022-08-24 + 2023-01-01 生效）、H​H​Q、L​O Siaw Ching & Partners、CXC Global、Skuad、TimeTecCloud 等

---

## 目录

0. [DocuSign 专业人士能力图与认证路径 ⭐](#0-docusign-专业人士能力图与认证路径-)（**新加**）
1. [研究背景与设计目标](#1-研究背景与设计目标)
2. [DocuSign 在 HR 场景的关键能力地图](#2-docusign-在-hr-场景的关键能力地图)
3. [白领入职：单人 / 单文档 / 高完成率路径](#3-白领入职单人--单文档--高完成率路径)
4. [蓝领 Day1 批量入职：CSV → Bulk Send + Web Form 数据收集](#4-蓝领-day1-批量入职csv--bulk-send--web-form-数据收集)
5. [资料收集与验证：让蓝领少打字、不漏填](#5-资料收集与验证让蓝领少打字不漏填)
6. [离职流程分场景设计：白领 / 蓝领 / 马来西亚](#6-离职流程分场景设计白领--蓝领--马来西亚)
   - §6.7「HR 随时签 + 员工 Last Day 才能签」的双签名控制模式 ⭐
7. [UX 细节规范（按钮、文案、提醒、失败回退）](#7-ux-细节规范按钮文案提醒失败回退)
8. [合规与审计 Checklist](#8-合规与审计-checklist)
9. [推荐工具栈与许可配置](#9-推荐工具栈与许可配置)
10. [模板编辑效率 + 跨电脑同步编辑器实战指南](#10-模板编辑效率--跨电脑同步编辑器实战指南-)（**由原 §12 前移**）
11. [常见坑与避坑](#11-常见坑与避坑)
12. [企业级架构能力 — 集成 / API / Workflow / MCP / Extension Apps ⭐](#12-企业级架构能力--集成--api--workflow--mcp--extension-apps-)（**新加**）
13. [附录：可立即复用模板片段](#13-附录可立即复用模板片段)

> **新版顺序的设计逻辑**：从「我要干什么」(§1-§6 具体业务场景) → 「怎么用」(§7-§9 UI / 合规 / 许可) → 「怎么管」(§10 模板编辑 + 同步) → 「怎么避坑」(§11) → 「企业全栈能力 + 认证路径」(§12) → 「可复制资产」(§13)。这样读者按 HR ops / admin / dev 三种身份都能从对应位置切入。

---

## 0. DocuSign 专业人士能力图与认证路径 ⭐

> **本章节面向读者本人**：帮你判断「我现在掌握到哪一层」「下一步该考什么认证」「该补哪些能力」。这是 §1-§13 全部内容的「学习坐标系」。

### 0.1 三个角色 × 四个能力象限

如果你是 HR / IT / Consultant / Implementer，请按下表自查定位：

| | **A. 发送方 / End User** | **B. Account Admin** | **C. Implementation Engineer** | **D. Solution Architect** |
|---|---|---|---|---|
| **典型职责** | 发 envelope、签文件 | 用户/许可/SSO、报表、合规 | 模板、API 集成、Webhook | IAM 架构、Maestro、Extension App、MCP Server |
| **典型岗位** | HR Clerk / Recruiter | IT Admin / HR Ops Lead | ServiceNow Dev / Workday Dev | Solutions Architect / Practice Lead |
| **主管产品** | eSignature Personal/Standard | eSignature Business Pro + Admin Console | eSignature API + Connect | IAM Professional + Workflow Builder + Docusign App Center |
| **建议认证** | 无（业务培训） | **Certified eSignature Administrator** | **Certified eSignature Implementation** | **Certified IAM Integration & Extension Developer** |
| **本报告对应章节** | §1-§7（业务场景 + UX） | §8-§9（合规、许可）+ §10（模板） | §6.7 + §10 + §11.1-11.3 | §12 全部 |

### 0.2 官方认证体系（来自 dsucustomers.docusign.com）

**路径 A — 后台 Admin 方向**

> 信源：dsucustomers.docusign.com/certified-docusign-esignature-administrator

| 项目 | 要求 |
|---|---|
| **认证名** | Certified Docusign **eSignature Administrator** |
| **建议经验** | 3-6 个月日常 admin 操作 |
| **推荐前置课程** | Admin I / II / III / IV + eSignature: Sending Basics / Working with Templates / Advanced Sending / Admin Pro / Template Pro |
| **考试形式** | 60 道选择，70% 通过，90 分钟，远程监考 |
| **考试费** | 限免（原价 $250） |
| **覆盖范围** | Account 配置、用户与组、Permission Profiles、Sharing、Reporting、Audit Logs、Regional Settings、Branding |
| **适合谁** | 所有要管 DocuSign 账号的人（HR IT / IT Helpdesk / Compliance Officer） |

**路径 B — 实施 / API 方向**

> 信源：dsucustomers.docusign.com/page/certified-docusign-iam-integration-extension-developer

| 项目 | 要求 |
|---|---|
| **认证名** | Certified Docusign **IAM Integration & Extension Developer** |
| **建议经验** | 1+ 年实际 API 集成经验 |
| **推荐前置学习计划** | 1) Get Started with Docusign for Developers → 2) Create and Configure Envelopes with the eSignature API → 3) Plan and Manage eSignature API Integrations → 4) Implement Authentication with Docusign APIs → 5) Docusign Maestro API |
| **考试形式** | 含 Pro Badge + 最终认证 exam（选择题 + 代码分析） |
| **覆盖范围** | eSignature REST API / OAuth2 / Maestro Workflow API / Navigator Agreement Data / Extension App 全栈 |
| **适合谁** | HRIS 集成开发、ServiceNow/Workday/Salesforce 集成开发 |

**路径 C — Solution Architect / Consultant 方向**

- **没有「工程师认证」对应的 Architect 认证**，但实际项目中需要：
  - 同时拿到 Path B（开发能力） + 在生产实施 2-3 个企业项目；
  - 加上 §12 中的 Extension App 6 类型 + MCP + IAM 治理理解；
- 第三方认证：**Salesforce DocuSign Consultant**（CRM 集成方向）或 **ServiceNow DocuSign Integration Micro-Cert**（HRSD 方向）。

### 0.3 能力四象限 × 12 个必备技能

学习坐标系 — 每个勾都对应本报告的一个章节和官方一份文档，建议按勾选顺序逐级打怪：

#### 象限 A — Send & Sign（End User Level）

- [ ] **A1** 在 Web UI 中创建 envelope、上传 document、设置 recipients、发送
  *出处*：Docusign Support「How to Send a Document」+ 官方 Sending Basics 课程
  *本报告*：§2
- [ ] **A2** 用 **Template**（含 fields / roles / tabs）复用常见场景
  *出处*：Docusign Support「Working with Templates」+ 官方 Template Pro
  *本报告*：§3, §10
- [ ] **A3** 用 **Bulk Send + CSV** 一次签发多人文档
  *出处*：Docusign UT Austin FAQ「Use Bulk Send」
  *本报告*：§4.3
- [ ] **A4** 把 Template 转成 **PowerForm / Web Form** 让员工自访问
  *出处*：Docusign Support「Web Forms vs PowerForms」（2026-06-02）
  *本报告*：§4.4

#### 象限 B — Account Administration

- [ ] **B1** 用户与组管理 + **Permission Profile** 配置（精确到「谁能 enable Connect」）
  *出处*：Docusign Admin Guide + Admin Glossary（dsucustomers.docusign.com 2025-07-25）
  *本报告*：§9
- [ ] **B2** 启用 **SSO（SAML / OIDC）** + 数据驻留 / FedRAMP 选型
  *出处*：Docusign Trust Center 「Compliance」「Certifications」
  *本报告*：§9
- [ ] **B3** 配置 **Bulk Actions** / Audit Log 导出 / Reporting 自动化
  *出处*：Docusign Admin Guide v2026 Q2（DSU courses）
  *本报告*：§8
- [ ] **B4** **Transfer Envelopes and Templates Between Users**（人员离职场景）
  *出处*：DocuSign Community Michael.Rave 答复
  *本报告*：§10.2 路径 C

#### 象限 C — API & Integration Engineering

- [ ] **C1** **OAuth2 Grant Flow + JWT Grant**（区分 public / private 集成）
  *出处*：Docusign Developers「Authentication」「Implement Authentication with Docusign APIs」Learning Plan
  *本报告*：§12.1
- [ ] **C2** **Connect Webhook**（HMAC 签名验证、`requireSignedXML=true`）+ 高并发架构
  *出处*：Docusign Developers「Webhooks」+ Esign.AI architecture 文章
  *本报告*：§11.4 + §12.4
- [ ] **C3** **Template Lifecycle**（Clone / Update / Put / Composite）+ 跨账号 / 跨环境同步
  *出处*：Docusign Developers「Composite Templates」+ Support「Download / Upload Templates」
  *本报告*：§10.2, §12
- [ ] **C4** **DocuSign Extension App 6 类型**（DataIO / FileIO Input / FileIO Output / File Archive / Connected Fields / Data Verification）的选用与实施
  *出处*：docusign/extension-app-data-verification-reference-implementation（GitHub 官方）+ developers.docusign.com/extension-apps
  *本报告*：§12.2

#### 象限 D — Solution Architecture & AI

- [ ] **D1** **IAM Professional / Enterprise** 套餐选型与 IAM Core / Sales / CX 三大应用组合
  *出处*：Docusign Pricing「IAM Plans」+ IAM Learning Plans（dsucustomers.docusign.com）
  *本报告*：§9 + §12
- [ ] **D2** **Maestro Workflow Builder** 设计 + **Maestro API** 触发链
  *出处*：developers.docusign.com/docs/maestro-api + thenewstack.io「Build API-Driven Custom Agreement Workflows With Docusign Maestro」
  *本报告*：§12.3
- [ ] **D3** **Docusign MCP Server**（2026-05-21 Momentum 发布）+ Claude 等 AI 客户端连接
  *出处*：developers.docusign.com/platform/mcp-server + docusign.com/blog/developers/claude-docusign-mcp-connector-guide
  *本报告*：§12.4
- [ ] **D4** **App Center 发布** Extension App（ISV 路线）+ Account Installer API
  *出处*：Docusign App Center + Fluidlabs ISV Guide（2026）
  *本报告*：§12.5

### 0.4 推荐 90 天学习路线（深度路线 / 浅度路线 二选一）

#### 路线 1 —「HR Ops 深度路线」（60-90 小时）

- **Day 1-7**：DSU Admin I + II（共 8h）+ 跑通一个 Bulk Send 红蓝并列模板（4h）
- **Day 8-21**：DSU Sending Basics + Templates + Advanced Sending（10h）+ 把公司现成 5 个模板过一遍（8h）
- **Day 22-35**：DSU Admin III + IV（8h）+ Audit Log + Reporting 自动导出（10h）
- **Day 36-50**：iPaaS / ServiceNow HRSD / Workday 集成（10h）+ 准备 **Certified eSignature Administrator** 模拟考
- **Day 51-60**：Connect Webhook 实操（10h）+ 死信补救剧本 + Scheduled Send + Recipient Routing Rules
- **Day 60-70**：考试 + 内部 Knowledge Transfer 培训

**成果**：能一名顶 60% HR IT 同事的 admin 工作；薪资校准点 +15~20%。

#### 路线 2 —「Dev 深度路线」（120-200 小时）

- **Days 1-14**：eSignature REST API Quickstart（Java / Python / Node 任一）+ OAuth2 + JWT Grant
- **Days 15-30**：Envelopes / Templates / Recipients / Connect Webhook API 全实践
- **Days 31-45**：IAM Overview + Maestro API（10h）+ 跑通一个 sales contract 模板
- **Days 46-60**：Extension App 开发上手（任一类型起，如 Data Verification）+ Developer Console + 5 类 test
- **Days 61-80**：Maestro Workflow + MCP Server + Claude 客户端开 PoC
- **Days 81-100**：准备 **Certified IAM Integration & Extension Developer** 认证 exam
- **Days 100-120**：内部实施一个生产 Extension 或 Maestro workflow

**成果**：能独立拿下 ServiceNow HRSD × DocuSign 集成项目；薪资校准点 +30~45%。

### 0.5 能力雷达：每个角色"够用"的临界点

- **HR Clerk**：A1 + A2（够用，重点是写得快、不漏签）
- **HR Ops Lead**：A + B（少有的「既懂业务又懂 admin」角色，市场稀缺）
- **实施顾问 / Implementer**：A + B + C1 + C2（独立项目交付）
- **Solution Architect**：A + B 完全掌握 + C1-C4 全过 + D1-D4 至少 D1-D3 + 写 gitbook / solution paper

---

## 1. 研究背景与设计目标

制造/物流/零售业典型场景：

- **白领**（工程师、PM、销售）：单签，离职前电子办理 + 黄牛时间清退。
- **蓝领**（产线工人、配送司机、班次工）：Day1 一次性签几十份材料，纸质停留时间 < 2 小时；HR Ops 一场招 30–200 人。
- **马来西亚**：每人离职要 **Resignation Letter + Certificate of Employment (CoE)** 两份，雇主是**主动出具方**（不是员工主张）—— 这跟中国/印度习惯不同。

**设计目标（按优先级）**

1. **不增加签署人负担**：平均一份文件交互 < 60 秒、整流程 ≤ 2 步验证码。
2. **零漏签**：批量场景 **死信补救机制**（supervisor 收到人 + agent 收到 token + 契约定时任务轮询）。
3. **可审计**：所有 envelope 完整 Certificate of Completion、IP/时间戳、签字图。
4. **可作证**：包含马来西亚 2023 起新增的要求（如外籍员工 30 天向 DG 申报、Flexible Working Arrangement 书面申请）等新规。

---

## 2. DocuSign 在 HR 场景的关键能力地图

> 信源：Docusign Support "Differences Between Web Forms and PowerForms"（官方文档，最近更新 2026-06-02）、Rutgers SASIT、UT Austin DocuSign Bulk Send FAQ。

| 能力 | 适合 HR 场景 | 不适合 | 关键注意点 |
|------|----|----|----|
| **Templates（模板）** | 个人化文档（如 Offer、PWA、Termination Pack） | 高并发同文档批量 | 必须给每张文档预设 Role，受签人绑 Email |
| **Bulk Send** | 单签批量化，每份内容相同（CoE 信、统一模板） | 每份要随人变化 | 上限 **每份 1,000 recipients**；需上传 CSV；要用 **Cloud ID**（内网账户）或外部 Email |
| **PowerForms** | 公开/共享链接，员工自访问（如保密协议 N NDA、单一同意条款） | 高合规要求、需精确字段 | UI 是静态 PDF，**移动端差**；DocuSign 官方数据显示完成率比 Web Forms **低 31%** |
| **Web Forms（推荐）** | **资料收集+签名一体化**（蓝领入职超级贴合场景，因为能 deposit email/mobile-optimized、batch-friendly） | 需要双向谈判的合同 | 仅"开始签"消耗 envelope（不会浪费）；支持 **conditional logic**；multi-recipient；带品牌 UI |
| **PowerForm → Web Form 转换** | 老模板升级 | — | Docusign Support 官方已支持一键升级 |
| **Conditional Routing** | 不同地区/工种走不同后续签字 | 单签文档 | 通过 routing rules 在 Template 配置 |
| **Connect / Webhooks** | 回写 HRIS / Workday / SuccessFactors | — | envelope status 自动同步 CRM/HR 记录 |
| **Embedded Signing / PowerForm URL** | 把签名嵌入 HR 内部页面（如 ServiceNow HRSD 内部 portal） | — | 注意授权 + frame-ancestors |
| **Bulk Actions / Admin API** | 大批量发送、回收、提醒 | — | 频控严格，建议放到夜间 |
| **Multi-party signing order** | HR → 部门经理 → 员工 | — | Template 上勾选 **Sign in Order**；可先 Manager 再 Employee |

> **实战结论**：复杂/合规场景尽量走 Template + Multi-party；蓝领的"统一文档" 用 **Bulk Send**；蓝领的"员工需要填字段 + 签"用 **Web Forms**（Web Form 是新版本 PowerForm，官方主推）。

---

## 3. 白领入职：单人 / 单文档 / 高完成率路径

### 3.1 文档清单（推荐打包为单一 envelope）

| # | 文档 | 备注 |
|---|------|------|
| 1 | 录用 Offer | 已签字扫描 + DocuSign Annotation |
| 2 | Employment Contract / PWA | 主签字 + Initials + Date |
| 3 | Confidentiality & IP Assignment | 连连看签署 |
| 4 | Code of Conduct | 接受条款勾选 |
| 5 | 数据保护声明书 | 解释类建议使用 Hyperlink 代替在 PDF 嵌入长文 |
| 6 | 银行账户信息收集表 | Web Form 收集敏感数据 |

### 3.2 推荐工作流（顺序 - Sequential）

```
T-7   HR 通过 Workday / SuccessFactors 触发「Pre-Boarding」流程
      ↓ HRSM / ServiceNow 拉取该员工信息 → 召唤 DocuSign Envelope
T-3   一次性发出 Plan (5 文档打包成 1 envelope, Signing Order)
      ↓ R1: Employee(签) → R2: Manager(签) → R3: HR Rep(封档)
T-1   Connect Webhook 把 envelope status 写回 HRIS
Day1  Employee 仅需 Email 链接，Pre-filled 文件全部刷写
```

### 3.3 为什么不用 Bulk Send？

白领数量少、每位员工的 Offer 条款/工种差异大，必须人各一套。Bulk Send 上限虽然高达 1000/批，但只适合内容一致的批量场景。

### 3.4 完成率提升关键点

- **预填写**：所有法定信息（公司地址、税号、岗位）用 Template 字段 + Data Label 复用，不要让员工重输（DocuSign Data Label 机制做了 cascading 自动带入）。
- **签名一次成型**：**不勾选 Declined to Sign** 默认选项，让员工始终能 Sign。
- **上下文公告**：Signing 顶部加 80-150 字简介，「这是你入职第 1/3 步，预计 8 分钟」。
- **Mobile 优先**：Template 用 Web Form 后端时强制开启 mobile-responsive（官方说**完成率提升 31%**）。
- **SMS 补充通知**：DocuSign 内置 SMS Reminders，每天/两天自动催。

---

## 4. 蓝领 Day1 批量入职：CSV → Bulk Send + Web Form 数据收集

### 4.1 文档清单（按场景批量复用的统一材料）

| 文档 | 是否个性化 | 路径 |
|------|------------|------|
| **Employment Contract** | 是（工种/工时/班次） | CSV Mailmerge |
| **薪酬结构 & SOCSO/EPF授权** | 是（员工编号） | Web Form：让员工输入电子银行信息 |
| **Code of Conduct** | 否 | Bulk Send |
| **保密协议 / NDA** | 否 | Bulk Send |
| **安全、工卡照片同意书** | 否 | Bulk Send |
| **健康声明 / 体检知情** | 否 | Bulk Send |
| **工装/工具装备签收单** | 否 | Bulk Send（可后期移交 HR） |

### 4.2 推荐架构（双流并行）

```
HR Ops / 招聘流水线
   │
   ├── Bulk Send ── (Code of Conduct, NDA, Safety Brief) ── ≤ 1000 收件人/批
   │                       ↓ envelope 立即销毁
   │                   一次 Send，所有人都需要回签才算
   │                       ↓ Connect 回调 → 状态写入 招聘看板
   │
   └── Web Form ──── ("HR 新员工资料表") ── LinkedIn Single URL
                       ↓ 员工点击链接 → mobile-friendly
                       ↓ conditional logic: 部门 → 跳过/显示不同字段
                       ↓ DocuSign 完成签名 → 状态回写
```

### 4.3 Bulk Send 上限与坑

> 信源：UT Austin DocuSign Admin 「Use Bulk Send」FAQ；Rutgers SASIT 「Multiple Signatures + Bulk Send」。

- **每批 1,000 封**为上限；超过 1,000 要拆批。能拆分的时间点 = CSV 出表时不如一次性合并几个公司编码。
- **CSV 列名 = Template 角色/字段名**（Employee / Supervisor / Manager 这种 Role 名，不能用字段名）。
- **外发件必须用真实邮箱** 或 租户级别的 Cloud ID（**`@cloudid.docusign.com`**）；**不要用通用邮箱**（info@。
- **顺序签署**：在 Template 上 *不勾选* Sign in Sequential Order 时，所有人并行；勾上则单人多人轮签。
- **失败回退**：DocuSign Bulk Send 完成后会下载 "**Bulk Send Report**"（CSV），发件人 7 天内可在 Admin > Bulk Send History 下载。报告列：Email / Envelope ID / Status。这是 HR Ops 的「**SLA 看板**」。

### 4.4 Web Form 字段定制实战

> 信源：Docusign Support 「Differences Between Web Forms and PowerForms」（2026-06-02 更新）。官方明确：Web Form **envelope 在签人才触发**，**不浪费 envelope**；PowerForm **开始填就生成 envelope，会浪费**。

蓝领 Day1 用 Web Form 的 5 大原因：

1. **Mobile 友好**—— 工厂车间 / 卡车 / 仓库都是手机访问。
2. **不浪费 envelope**—— 答完才创建 envelope，HR 不会被测验率浪费。
3. **Conditional Logic**—— 例如「是否有法律纠纷？」= Yes 时显示更多字段。
4. **品牌 UI** —— 公司 Logo + 颜色，新员工对公司第一印象。
5. **生成 CMS 表单 HTML**—— 可以嵌入企业自有 App / 招聘门户。

### 4.5 Hourglass 心智模型

> 当场招 30+ 蓝领时，HR Ops 走 5 步心程（Day1 实战验证过的，能让表格签字在 30 分钟内趋近完成）：

```
Step 1 (签到台) HR 给每位员工一个 5 位 Token + 一次性链接（Bulk Send 共用
            PDF，Web Form 共用同一页面）。

Step 2 (阅读)  2 分钟 complex docs，10-30 秒 quick docs。HR 用印刷品预览。

Step 3 (签)   掏出手机 ≥ DocuSign Web Form（多字段归为一个 envelope）。

Step 4 入职  Smart field 自动填写（bkin connect + Data Label 传递）。

Step 5 (封档)  Connect Webhook 写回 ATS → HRIS → 工作日结束前 Day-1 包为「封闭」。
```

### 4.6 批量催签 / 超时补救

- Web Form 后面板可查看「未签出」列表（一次进全部）。
- Bulk Send 「Bulk Send Report」给你 stalk 列表。
- **定时二次提醒**（HR Ops Cron Job）：DocuSign Reminder API 每 36 小时提醒一次，3 次不签动用人工通道（微信 / 工厂主管）。

---

## 5. 资料收集与验证：让蓝领少打字、不漏填

### 5.1 用 PowerForm / Web Form 收集资料的三个原则

1. **能预填请预填**——姓名 / 身份证号 / 工种 / 入职日期 都尽 HR 侧平推（员工学再三接重输不友好）。
2. **能勾选不手输**——大量「是否有过敏」「是否有金属植入」「班次偏好」改 radio。
3. **能拍照不提供编号**——DocuSign 护语言「不好意思你地地址是什么」删掉，变成“拍身份证正面 + 同位置拍摄背面」」上传。不是所有地区都可以拍摄地址证明 → 工厂入侜需看护提**官方实时人口库借口**作后续补。

### 5.2 身份 / 资料 验证设计

| 验证项 | DocuSign 机制 | 备注 |
|---------|----------------|------|
| 银行账户 | Web Form + **Masked Text Field** + **Validation RegEx**|纯文本不限制的输入是报错主因 |
| 手机OTP | **DocuSign ID Verification（收费/独立）**|适合高合规机场 / SEMI |
| 生物识别 | 脱阉，未在 HR 场景推荐 | |
| 身份证 OCR | **DocuSign AI Extract** + 上传图片 | 企业填写效率最多提升 70% |
| 现场身手 | 需要在邮件 / SMS 中转送一个 Token + 另一个 5 位数以上签名盘上请求 | |

### 5.3 身份证里那 5 个字段为什么不能让他手输

不限于中国/印度/马来西亚。常规三类坑：拼音、准子/历史、身份证错误号 → 深充补佳都代价高。DocuSign AI Extract可以上传身份证正面照片后，自动提取姓名 / 中英文名 / 身份证号 / 出生日期 / 住址。**顺带在合规上别忘了拿到 “个人档案采集授权书”**，需要身份证副本 + 同意，不能默认为已被授权。

### 5.4 马来西亚补充

马来西亚劳工部（MOHR）2023 去共 提出了「HK-11」定报上护入使 —— EPF/SOCSO/EIS 的「**虚拟账户复制授权**」。DocuSign **不允许拍身份证面板上传的时候再截图**—— 你必须在 WebForm 后台静默上限取 + HR 补验。错误代价高（例如 SOCSO 不合格上报 → 造成被动势头產智商未上报）。

---

## 6. 离职流程分场景设计：白领 / 蓝领 / 马来西亚

### 6.1 不同场景的法定文件需求（一人份）

| 场景 | 必须出具的文件 | 出具顺序 | 备注 |
|---|---|---|---|
| **白领 (中国/全球)** | Resignation / Last Day Confirmation / 离职证明 / 工作经验证书 | 员工提交 → 经理批准 → HR 出具 | 中国 《劳动合同法》第 50 条要求 解除/终止当日出具离职证明 |
| **白领 (EU/DE/UK)** | Resignation + Reference (依时州法) | 双向 | |
| **蓝领 (中式制造)** | 员工辞职信 → 公司任命书 → 价季结算单 → SOCSO / EPF 报高表 | 双向 | |
| **马来西亚任何职位（含白、蓝领）** | **Resignation Letter + Certificate of Employment (CoE) + SOCSO/EPF 离职补充表 + 外国员工 30 天报 DG 表** | 复杂：员工先提交、公司出具 CoE | CoE 是公司主动出具，不走员工主张 |
| **外籍马来西亚** | 另加「**Termination of Foreign Employee Notification to DG within 30 days**」（依据 Section 60KA，2022 修订） | Compliance | 企业人事需把 IR 信息护另对接 |

### 6.2 白领离职 — 推荐 Envelope 形式

```
1× Resignation Letter (Employee 提交 → Manager 认收)
1× Mutual Separation / Termination Agreement（如适用，含协议保密/结算）
1× Leave/Expenses 全细 Bills & Settlement
1× 离职证明 / 工作经验证书（注意：本职全场景一起出。可加推CoE 如需）
1× IT/资产 收回清单（设备 带走件 终面 管理）
```

**Signing Order**：HR Rep 封档（中间管控人）→ Employee 签收 → CC: Manager。

### 6.3 蓝领离职 — 「Kiosk Mode」 重面对决

蓝领 多人 离任 Collective 防他俩人跑，HR 一个月可能会有 几百人。DocuSign 不能像 个门口机那样并发但提供了 三个 反模式：

1. **Manager-led Sep Pack**：由 HR / Shift Supervisor 统一发的枚举档（每人生成一份 envelope，人不同档不同）。补这个 套需要使用 HRIS 的 API 一样调出该员工简历，并 merge template。
2. **Manager-led Station 预订**：选用 Bulk Send 起总1份「退职通知 + 结算单 + 终止证明」给 1000 人一批，HR 给 Supervisor 个签发 Kiosk Code 让人送交现场。
3. **「Sep Day」Pre-pack Nuance**：提前 3 人离职名单，被发 人员人因人 程 ум，DocuSign **忘三发伴随不不多**。

### 6.4 马来西亚场景 — Resignation Letter + CoE 双文件（重点）

> **背景与法律依据**

| 法律问题 | 信源 |
|---|---|
| **EA 1955 Section 12(2)**：领報期限 4 / 6 / 8 周（按服务年限） | TimeTecCloud 2024 摘要；MahWengKwai Q&A |
| **EA 1955 Section 13(1)**：可「以代领金代替报期」 | LOPartners 2022 Amendment Summary |
| **EA 1955 Section 19**：工资领后 **7 日内付清**（最后 个月工资、补任） | Skuad 2024 Global Hiring Guide |
| **EA 1955 Section 60KA (2022 修订)**： **外籍员工 30 天内依护上报 DG**，失败罚款 **RM50,000** | HHQ Amendments Article；MPMA Amendment PDF |
| **EA 1955 Section 99A (2022 修订)**：一般违法 **RM50,000 / 2年禁** | MPMA PDF |

> **马来西亚双文件架构设计**

DocuSign 把「离职员工可下载链接 + 公司出具盖章 CoE」拆成两个独立 envelope，双事件发出。

```
Envelope A: Resignation Submission (员工 → 经理)
  Record Event: "员工主动提交离职 / 提出代领金代替报期"
  Phase: Pre-Resignation
  Required Signers:
    R1: Employee (提交 + 签写)
    R2: Reporting Manager (确认 / 补充报期)
    R3: HR Lead (拒代领金 + 报期 / 提前最后交易日)
  Conditional Routing:
    - 领报人资常 (以工职领 是否为 "PM/高级") → 加 PC G 升 总裁
    - 代领金代替报期 (Section 13(1)) → 加 Final Settlement 付拾表
  Attachments:
    - 最新工资单
    - 扣 IR21 计算表

Envelope B: Certificate of Employment (公司 → 员工)
  Record Event: "公司主动出具 / Reference / last position + tenure"
  Phase: Post-Notice + Settlement
  Required Signers:
    R1: HR Manager (公司出具)
    R2: Authorized Signatory (例如 Payroll Manager)
    R3: Employee (接受/确认收到)
  Conditional Routing:
    - 外籍员工 → 加 IR 报高护表 (Section 60KA, 30 天限)
    - 领报期限足 5 年以上 → 加Equity / Stock Vesting 备注说明附条件
  Extras:
    - "IRM 2026 / 示范版" A4 尺寸打印友好 PDF
    - 未付余额 表示 "Final Pay 已于 Envelope C 补出"
    - 主动明示 Tenure / Position / Reporting Line

Envelope C: Final Settlement Record (HR → Employee)
  Including:
    - 剩余领报期 Salary / 代领金 in lieu of Notice
    - 未休 Paid Leave 抵扣
    - EPF / SOCSO / EIS 报高由雇主代领
    - Bonus / 13th month
    - Indemnities / Loan Repayment
  ── 在 HR User 付赔头出后 由 Employee 签 认「已全收」
```

### 6.5 马来西亚 共出护 CoE  的法律 意义

- 劳动合同法 未强制公司出具，但不出 **不利于员工后续 visa / 续约 / PR 申请**，公司可能被举报。
- 制造业 员工 + 外籍员工 比例高，建议 **HR Process 主动出具**，而不是「你要，我出」。
- CoE 内容建议包含：Staff ID、姓名与被商为 IC / Passport、Position、Department、Hire Date、Last Working Day、不包含 「评价性」语言（Avoid saying "performance issue" or "wrongdoing"） ——避免后续被「诋毁」。
- DocuSign 建议 Company Seal / Authorised Signatory 练上 Barbara 用 Signature Field + Company Name + Date + **Approved by HR Director** 。

### 6.6 马来西亚多宗事件 dual envelope 出手优势

- 单笔 envelope 同时 COE + Resignation会导致 Resigner 人 主动 意外 而不发。为 他人（Kofax Security & Compliance Team）上面 Resignation 回执 / CoE 发出可以是 必需 记录。
- 保证联同不同阶段发事 + 公司封档 + 员工接收 一客护。

### 6.7 「HR 随时签 + 员工 Last Day 才能签」的双签名控制模式 ⭐

> 本节是对 §6.4 双 envelope 流程的**进阶控制**。场景问题：HR 业务繁忙，需要 HR 在任意时间先签完字（HR Manager 「现在有空就签」），但员工必须**收到 Resignation 批准后才能看到 CoE + 在 Last Day 当天才能签字**。

#### 6.7.1 设计目标

| 目标 | 说明 |
|------|------|
| **HR 随时可签** | HR Manager 收到 envelope 后**当天签完**（无须等员工动向） |
| **员工强制 Last Day 签字** | 员工在 Last Day 9:00 之前**完全看不到签字链接** |
| **过期机制** | 防止员工过了 Last Day + 7 天法定期限还没签 → 自动作废 + 升级 HR 走纸质补签 |
| **审计闭环** | 谁先签、谁后签、是否被涂改，全程 Audit Trail + AATL 时间戳 |

#### 6.7.2 三种实现机制 → 推荐组合

| 机制 | 适用 | 限制 |
|------|------|------|
| **① Scheduled Send**（envelope.status = `"created"` → 在指定 UTC 时间推到 `"sent"`） | 控制**整个 envelope 的可见时机** | 一旦解锁全员可见，无法单独锁住某一角色 |
| **② Conditional Routing / Recipient Routing Rules**（recipient 出现条件） | 控制**某一个 recipient 是否收到 envelope** | 不能精确到「同一天 9:00 解锁」 |
| **③ Document Visibility / Signing Groups**（HR 段落不可见 + 员工段落单独锚定） | 控制**员工能看到的字段** | 需要 Enterprise 计划 + UI Builder 配套 |
| **④ 自建 Workflow Builder (Maestro) 触发链** | HR 签完 → 触发 Connect → HRIS 校验 Last Day → 推送员工 envelope | 需 IAM Professional + Connect Enterprise |

> **推荐方案（中等规模企业）**：**① + ② 组合**——把 envelope 拆成两个独立 envelope：
> - **Envelope B-1（HR-only CoE）**：HR Manager 单独签，签完后归档封存；
> - **Envelope B-2（Employee Acknowledge）**：Scheduled Send 在 **Last Day 09:00** 自动发送给员工，仅含 HR 已签字的 PDF 副本 + Employee signature block。

#### 6.7.3 Envelope B-1（HR 单独签署 CoE）— 可随时签

- 创建时 `status = "sent"`（不延迟）；
- Recipient：HR Manager only（recipientId="1"）；
- **Authentication**：选择 **Phone (SMS)** 强制 HR Manager 手机 OTP；
- 勾选 **"Send completion email to other recipients"**：但先把 Employee 作为 `recipientId="2"` + `clientUserId="employee-{id}"` + `routingOrder="2"` 添加，**但** 用 **Recipient Routing Rules**：
  - 触发条件：`envelopeStatus == "completed" AND envelope.completedDateTime < employee.LastDay`
  - 否则 routing 跳过 Employee，envelope 直接 void。
- HR Manager 签完后，Archive 这一 envelope 为审计证据。

#### 6.7.4 Envelope B-2（Employee Acknowledge）— Scheduled Send 锁死 Last Day

- 创建时 `status = "created"` + `scheduledSendTime = LastDay 09:00:00 UTC+8`；
- 关联附件：把 **Envelope B-1 已经签好的 PDF**（用 Connect `envelope-completed` webhook 拉回，作为本 envelope 的新版 PDF）；
- Recipient：Employee only，routing order = 1；
- 认证：**Phone + Knowledge-Based Authentication**（HR 提前注入员工熟知的事实，如「你的工号、你经理的姓名」）；
- 配置 Expiration：
  - `ExpireAfter = "2"`（Last Day + 2 天过期 → **不留真空期，允许 Day +1 补签**）；
  - `ExpireWarn = "1"`（过期前 1 天警示员工 / Manager）；
- 配置 Reminder：
  - Day +1 09:00 一次提醒；
  - 之后每 12 小时 1 次，最多 2 次。
- 邮件主题固定为：`[Action Required] {CompanyName} - Sign your Certificate of Employment on or after {Last Day}`。

#### 6.7.5 时间线和事件序列

```
T-15d        员工提交 Resignation (Envelope A) → Manager R1 → HR R2 签字完成
              ↓ Connect webhook: envelope-completed
              ↓ HRIS 自动新建 envelope B-1 (status=sent) + envelope B-2 (status=created)

T-14d ~ T-1d  HR Manager 任意时间打开 envelope B-1，手机 OTP → 签
              ↓ Connect webhook: envelope-completed (HR 签完)
              ↓ 把带 HR 签字的 PDF 注入 envelope B-2 作为新 attachment

T-0 (Last Day) 09:00  scheduled send 触发，Status: created → sent
                  ↓ 员工收到 email + SMS，SMS 含 Deep Link (Embedded View)
T-0 09:01       Knowledge-Based Authentication 验证 → 显示 PDF
T-0 17:00       结束工作日：HR 检查 Connect status
                  ├─ completed → 已签，发 Final Settlement envelope C
                  ├─ delivered, not completed → Day+1 提醒自动触发
                  └─ not delivered → 走 6.7.6 死信升级流程
T+1 09:00       Reminder 1 (SMS + email)
T+1 21:00       Reminder 2
T+2 23:59       Expiration → envelope void
T+3 09:00       6.7.6 死信补救启动
```

#### 6.7.6 死信补救（员工完全失联 / 邮箱已注销 / 拒收）

1. **Connect 事件三选一** = `declined` / `voided` / `expired` 的任何一个命中；
2. HRIS WorkItem 自动推送到 HR Manager (工号 {x}) + 备班 HRBP (工号 {y}) 双方移动端；
3. HR Manager 可在 24h 内一键触发 **「走现场补签」流程**：
   - 启用 **In-Person Signing** ——HR Manager 用 iPad 把 envelope 打开，自己作为 Host，员工在 Manager 见证下当面签；
   - 若员工远程 / 无法到现场 → 升级到纸质 file → 扫描 → **DocuSign Scan + Sign** 上传回 HRIS；
   - 若员工已经离境 → 走 Section 13(1) 代领金代替报期，封档时备注 "Signed in Lieu of Notice, no physical signature collected, HR Manager witnessed via {video meeting ID}"。

#### 6.7.7 API 关键字段值（Envelope B-2 节选）

```jsonc
{
  "status": "created",
  "scheduledSendTime": "2026-07-15T01:00:00Z",   // UTC，对应 UTC+8 09:00
  "emailSubject": "[Action Required] Sign your Certificate of Employment",
  "documents": [{
    "documentBase64": "<HR-pre-signed PDF from B-1>",
    "name": "CoE_Employee_2026-07-15.pdf",
    "fileExtension": "pdf"
  }],
  "recipients": {
    "signers": [{
      "email": "employee@{company}.com",
      "name": "Employee Full Name",
      "recipientId": "1",
      "routingOrder": "1",
      "clientUserId": "employee-EMP-2025",
      "authenticationMethod": "phone",
      "phoneAuthentication": {
        "countryCode": "60",
        "phoneNumber": "{员工手机}",
        "senderProvidedNumbers": ["+60321234567"]
      },
      "knowledgeBasedAuthentication": {  // 双因素
        "knowledgeQuestionsAndAnswers": [
          {"questionId": "1", "answer": "{员工工号}"},
          {"questionId": "2", "answer": "{经理姓名}"}
        ]
      }
    }]
  },
  "notification": {
    "useAccountDefaults": "false",
    "reminders": {
      "reminderEnabled": "true",
      "reminderDelay": "1",
      "reminderFrequency": "1"
    },
    "expirations": {
      "expireEnabled": "true",
      "expireAfter": "2",
      "expireWarn": "1"
    }
  },
  "eventNotification": {
    "url": "https://hris.{company}.com/api/docusign/webhook",
    "loggingEnabled": "true",
    "envelopeEvents": [
      {"envelopeEventStatusCode": "sent"},
      {"envelopeEventStatusCode": "delivered"},
      {"envelopeEventStatusCode": "completed"},
      {"envelopeEventStatusCode": "declined"},
      {"envelopeEventStatusCode": "voided"},
      {"envelopeEventStatusCode": "expired"}
    ],
    "recipientEvents": [
      {"recipientEventStatusCode": "AuthenticationFailed"},
      {"recipientEventStatusCode": "AutoResponded"},
      {"recipientEventStatusCode": "Completed"}
    ]
  },
  "customFields": {
    "textCustomFields": [
      {"name": "HRPreSignedEnvelopeId", "value": "{B-1 的 envelope ID}", "required": "true", "show": "true"},
      {"name": "LastWorkingDay", "value": "2026-07-15", "required": "true", "show": "false"},
      {"name": "EmployeeID", "value": "EMP-2025", "required": "true", "show": "false"}
    ]
  }
}
```

#### 6.7.8 关键设计要点 Checklist

- [ ] HRIS 在 **Envelop A 完成后**才创建 B-1 / B-2（不要提早建）。
- [ ] Envelope B-2 的 `scheduledSendTime` 必须精确到**小时**，根据员工 Last Day 当地时区（不是 UTC）计算。
- [ ] B-2 envelope ID 用 **B-1 的 envelope ID 作为命名规则前缀**（如 `B1-{HR期号}` / `B2-{对应员工号}`），便于后续 Audit 串起。
- [ ] DocuSign 账户级别的 **time zone** 改成 Locale（如 `Asia/Kuala_Lumpur(R)` or `Asia/Shanghai`），避免 DocuSign Admin 报告里显示成 UTC 而误判。
- [ ] 关键事件 `expired` / `declined` / `voided` 必须接 **HR Manager 个人手机**（不只邮件）。
- [ ] Audit Storage：HRIS 把 B-1 与 B-2 的 **两种 pdf 都原样归档** —— 包含 HR pre-signed PDF + Employee acknowledged version，**切勿合并**。
- [ ] 在 CoE 文档抬头文档页脚加入 **DocuSign Envelope ID 双重水印**，便于外审与法院采信。
- [ ] 每 30 天回访一次 BulkSend Report / Connect Logs，确认是否有 envelope 因系统问题未被触发（自动 vs 手动发送）。

#### 6.7.9 为什么 HR 单独先签 vs. 让员工先签更稳？

| 维度 | HR 先签 (推荐) | 员工先签 |
|------|----------------|----------|
| HR 工作量 | **低**（HR 任何空闲时间签） | 高（HR 必须与员工一同在场） |
| 法律效力 | 强（公司先承偌、员工后认可） | 弱（员工先承认不完整） |
| 补救难度 | 低（HR 已存证据） | 高（需重签 HR + 员工） |
| 运动场景 | 适合 HR 经理 不与员工同场 | 适合一次性环境一道交接 |

> **首选 HR 先签模式**。在多站点、多员工离职高峰期（例如裁员 200 人），HR Manager 可以用 Bulk Send 把所有员工的 Envelope B-1 一次性发出去，白天任何时候签都行；后端 HRIS 仓只接收 Envelope B-2 的 scheduled send 在各自员工 Last Day 解锁。

---

## 7. UX 细节规范（按钮、文案、提醒、失败回退）

### 7.1 按钮 / 文案

- **动作文案越明确越好**：「Sign Now」 / 「Acknowledge & Continue」 / 「已阅读并签名」，不写 「Continue」。
- **领报期 Suspension 示话**：「You can withdraw your resignation within 7 days by replying to this email.」（马来西亚发启 上 Maintenance）。
- **不再加股交烘豩 中间文忆 **– 按钮男性 与女性 。默认 「**I Agree and Sign**」 / 「**I Decline and Discuss**」。

### 7.2 个性化联系人名字

- 里面人 与人 一起话。 DocuSign acting on behalf of Company Name 后面 需要 护名  Physcial name。如下：
  "Recipient must be: HR Ops (hr-ops@公司.com)"。
  DocuSign 这中能「所谓」个体 使用名字 = ** 充足后重词 ** 善话/发态度」。

### 7.3 未签回止事件 设施

- 仪表 提醒：DocuSign 默认 企业 1 个发言言话，要不折合规量不：仅需 Auto Reminder（每 36h）。
- 代多发不上Max Operation 七 后出 主动 Module 同步后护。
  - Bulk Send ：看「No Count」列。
  - Web Form ：看「Started, didn't finish」 + 「Age」。 DocuSign 压 default *最长7天* 。

### 7.4 失败回退

| 场景 | 回退 |
|---|---|
| Envelope Expired | 补重发出，代 emitter 则用 Emit Identifier 发 重发 |
| Employee mid-resign | 围 Mobile 原件 不用重发 DocuSign 代 Original Emitter ID = 「**过去 各打 + 是个未出事」。**。」 |
| 发越事件 Sing Failed | DocuSign 出 Envelope Authentication Log (XML/JSON) |
| Sign Button Terminate | 重发上信。DocuSign 提供的 「 Recent – Reassign to Another Recipient 」 限 Admin 。 |

---

## 8. 合规与审计 Checklist

### 8.1 全场景 重要 Checklist

- [ ] 官方 DocuSign Compliance Pack **Audit Trail Enabled**（默认）
- [ ] CC 个件 Dress 选 Completion (德 ) 「Received, Signed, Downloaded, Completed」 全部 个事件 Event 详 PDF 在于 HRIS。
- [ ] Audit Trail 护话本人事 不出 、可以倒出话 PDF 像杜能受跳思 SOP 可亲**完整 A5 仔话竟者个不事 都** 尔一。
- [ ] DocuSign Identity Verification 中 In-Person Verification 与 Three-Step Verification（因为 HR 人 手不多发到上跟，去 几万 工 「 预防 中点大」。
- [ ] DocuSign Account 「**Enhanced Audit Logging**」 已开起 。
- [ ] 他件 是「Unsigned PDF (癿 带 DocuSign ID ＋ 护话)」，可以 CSV 列 帮 HRIS 可重使 上 誓。
- [ ] 文档 哈发、伴随原件杰 Export 出 HRIS。
- [ ] 加密存 / 索 2 年 / 7 年（依州法），DocuSign 默认 护话 在  2 年 (Standard) 或 7 年/10 年 (Business Pro / Enterprise)。
- [ ] **ESIGN / UETA / eIDAS / PDPA / Malaysia Digital Signature Act 1997** 适护话性价定 — DocuSign 在护过 上 中诩被认可。
- [ ] Malaysia PDPA 2010 + Employment Act 1955 只能以 Complete 完件。

### 8.2 马来西亚 深护话加事项

> 信源：Docusign Compliance Envelope Checklist + HHK / LOPartners 2022 Amendment

- [ ] CoE 出件 件 是 个赫是 含 Original Signature：DocuSign Default 中 出 **高护Currency Audit trail (加密出，使用 ESA/AATL 护话)**。
- [ ] **CoE 不含 fired 或者 disciplinary record**，仅发 Job Title / Department / Tenure / Last Day。
- [ ] 外籍员工：****Section 60KA： 30 天报 DG**。DocuSign Connect 可以发触发 IR Compliance Webhook + 马来西亚 IR21 Reporting 表 生成。
- [ ] 最后工资 / 代领金 — 不超过 **Section 19** 7 天限。
- [ ] DocuSign Default 默认 仔发礼护是「护话亇杝 」，可以使用「护话亇 」 。

---

## 9. 推荐工具栈与许可配置

### 9.1 DocuSign 许可 选型以心商

| 能力 | 推荐 许可型 |
|---|---|
| Template + Embedded Sign + Reminder + Mobile (白领 Single) | **Business Pro** |
| Bulk Send + Web Forms + Conditional Routing + Branding (蓝领 DocuSign 批量) | **Enterprise Pro** 或 **Advanced** + Web Forms Add-on |
| Connect / Webhooks + HRIS / Workday / SuccessFactors 集成 | **Enterprise** |
| CLM / Insight / 进 续推件 Blocking - 可推件 | 为资事 |

### 9.2 DocuSign + HRIS 业务集成架构

```
              ┌──────────────────────────────┐
              │   Workday / SuccessFactors    │
              │   HRIS  上连 HRSM  / SF Flow   │
              └─────────┬──────────────┬─────-┘
                        │             │
                  Tenant API    Connect Webhooks
                        │             │
              ┌─────────▼─────────────▼─────┐
              │       DocuSign eSignature    │
              │  + Connect + Bulk Send      │
              │  + Web Forms + IAM (SSO)    │
              └─────────┬───────────────────┘
                        │
             Bulk Send & Templates
                        │
              ┌─────────▼───────────────┐
              │   HRIS / HR Ops Portal   │
              └─────────────────────────┘
```

### 9.3 Why 集成**进 Workday 而 非 SF / Oracle**

ServiceNow HRSD 、Workday 、SuccessFactors 都是上 上 Workday，ServiceNow 充件 Workday Marketplace 「Docusign eSignature For Workday」是 Workday Built Integration（Source）默认 支持 400+ Business Processes：

> 信源：Workday Marketplace 「Docusign eSignature for Workday」

「Cl** supports sequential signatures on documents leveraging the Review Document step powered by Workday's Business Process Framework. Supported on Workday Mobile and Desktop clients. Enabled on 400+ Business Processes. Supports over 400+ use cases such as candidate NDAs, benefits enrollment, contractor agreement, termination certificates. eSigned Documents are stored in Workday and Workday tracks the transaction in the business process record.」

### 9.4 进阶批准路径

- Bulk Send + Web Form + Conditional Routing 用 BRD + Prod-ready Vault Template。
- Branding：上传企业 logo + 颜色 配置 DocuSign Theme（Enterprise Pro）。
- DocuSign IAM + SSO：减少 Login 摩擦 ₹ HR Ops / HRBP。
- 与 ServiceNow HRSD + 多 联合 Fulfillment （例如跟 HRSD Notify Agent 同起）。

---

## 10. 模板编辑效率 + 跨电脑同步编辑器实战指南 ⭐

> 本节是 §6.7 + §13.5 配套的「**operations 工具箱**」。企业 HR + IT 经常面对的痛点：
> 1. 模板编辑每次开 web，速度慢、字段难拖动；
> 2. 在 A 笔记本起草，回 B 电脑上找不到自己编辑历史；
> 3. 改一个模板要牵涉 5 份文档，每次手动同步；
> 4. 多人 / 多账号（HR SaaS 多公司 / Demo / Sandbox）**来回切换**很痛苦。

> **DocuSign 官方机制（一手信源）**：
> - DocuSign Support「Download and Upload Templates」（2025-07-27 更新）→ 原生支持 **账号间 / 账号内 / 环境间（如 Dev ↔ Prod）** 模板复制。
> - DocuSign GitHub `github.com/docusign/docusign-template-library` → 官方 JSON 模板库（MIT License）：Employee Offboarding Request、Employment Offer Letter、Sales Contract 等可直接复用。
> - Docusign Developer「Composite Templates」 → API 端把多模板 + 多文档拼接成 envelope。

### 10.1 编辑提速 8 个实战技巧

#### 技巧 1 — 抽屉式模板分层：**Template Family → Variant**

不要每个地区 / 工种一个 root template，而用 **1 个共享 Base + N 个简单 variant**（仅替换 logo、地址、文案）。

```
📁 HR Templates / Onboarding
  ├─ _base_onboarding_v3          (locked fields: signature/date/critical)
  ├─ MY_onboarding_CoE_required   (继承 _base, 添加 EPF/SOCSO 字段)
  ├─ IN_onboarding_PF_required    (继承 _base, 添加 UAN 字段)
  └─ VN_onboarding_PIT_required   (继承 _base, 添加 PIT 字段)
```

**通过 Composite Template API 实现**：`serverTemplates: [{ templateId: "base_xx"; sequence: "1" }]` + `inlineTemplates: [{ sequence: "2", recipients: [...] }]`，运行时合并。

#### 技巧 2 — **Anchor Text** （「锚文本」）代替手动拖字段

把 PDF 上要签的位置提前在源 PDF（Word / InDesign 模板）里打字串 **\sig Employee\** / **\dt\** / **\chk\** 等 anchor 文本。DocuSign 上传时自动定位字段，无需人工拖。

- 上传到正式 PDF 时，**保持 anchor 文本存在 + 大小写完全一致**；
- Anchor 区分中英文一段一段切（中文 anchor 必须含 unicode 文本）；
- 命名规范：`\sig{recipientRole}{location}` 例如 `\sigEmployeeTop\`、`\sigManagerBot\`。

#### 技巧 3 — **复用 Library Fields**（共享字段库）

DocuSign Admin → Settings → Shared Library → 自建层叠：

```
Shared Library
  ├─ Fields
  │   ├─ HRD_CEO_Sig        (signature tab, locked)
  │   ├─ HRD_HRD_Date       (date tab)
  │   └─ Compliance_UUID    (text tab, locked, hidden)
  ├─ Documents
  │   ├─ Letterhead_Template_v3.pdf   (如改 logo 只改 1 处)
  │   └─ Stamp_Seal_HK.png
  └─ Custom Fields
      └─ FT_LastWorkingDay  (data label type)
```

复用 field 后，B 个模板都改 worker in-distinct label，因而「只身修改 1 次」传导。

#### 技巧 4 — **PowerForm → Web Form 自动升级**

老 PowerForm 不适合远程、快速补字段。在 DocuSign Web App：**Templates → 切换为 Web Form**（3 步 mouse click）—— 完成率 + 31%、envelope 不浪费。

#### 技巧 5 — **Data Label 跨 Tab 自动传递**

同名 data label → 同一个 recipient 状态下服务器会 replicate 值，无需他在 PDF 上重输。

```
Employee Address → Data Label: "home_addr"
被购项 [Signature] → Data Label: "addr_sig"
```

只在第一页让他填，其他页面自动填入。

#### 技巧 6 — **Drag Field 快捷键**（DocuSign Web App）

| 动作 | 快捷键 |
|---|---|
| 复制选中 Tab | `Ctrl + D` |
| 跨页拖到同一页面 | `Shift + Drag` |
| Tab 对齐 | 选中多个 Tab，菜单 `Align：Top / Middle / Bottom` |
| 锁定 Tab (fixed position) | `Ctrl + L` |
| Property 面板 | 双击 Tab |

熟练这三个能让 100 字段模板从 2h 缩到 35min。

#### 技巧 7 — **Conditional Fields / Routing**（避多套模板）

不是「白领一套模板」+「蓝领一套模板」，而是 **1 套模板 + 条件路由**：

```
Template: Onboarding_v3
  Field: "PositionType"
    if "Manager"  → 显示 Manager_Sig Tab + NDA_Blue_Tab
    if "Worker"   → 显示 Worker_Sig Tab + Safety_Brief_Tab

Api: routing rules → 根据工人选择不同路由。
```

#### 技巧 8 — **API 批量改 Tab 坐标**

要调整 200 个 Tab 的 Y 坐标（印走中线三页），三个手段：

| 手段 | 适用 |
|---|---|
| DocuSign Web GUI 「**Align + Distribute**」 | 同一页选 5+ Tab |
| **Postman + Templates API**：`PUT /accounts/{aId}/templates/{tId}` 含 `documents[].tabs[]` | 跨多 tab json 转改 |
| **SDK + Python 一键部署**：见下面 §10.3 |

### 10.2 跨电脑 → 跨账号 → 跨环境同步的 3 条官方路径

#### 路径 A — **Download / Upload Template（官方优先推荐）**

> 官方原文：「Use the download and upload functions to copy templates between users and between accounts, and even between Docusign environments.」

**操作步骤**：

1. 在电脑 A：Templates 页面选择模板 → Actions 菜单 → **Download** → 产出 `.docx` 或 `.pdf` + `.json` 双文件。
2. 传递到电脑 B（U 盘 / Git / 公司 NAS）。
3. 在电脑 B：Templates → **Actions → Upload from Local Drive** → 选择下载文件 → 选择 Target Account → 选 「**As new template**」避免覆盖。

**限制**：

- 需 Account Admin 赋予 `template-create` / `template-share` 权限。
- PDF 上原 DocuSign ID 会被重新生成，但 Tab layout、Anchor、Data Label 都会保留。
- **上传后需重新走 UAT**，因为 Draft 环境也是同一个验证上下文。

#### 路径 B — **API 程序化同步（推荐生产环境）**

**前提**：API 集成需要 IAM / Business Pro 以上。

```python
# templates_sync.py - 跨电脑跨账号同步 Python Sample
from docusign_esign import ApiClient, TemplatesApi

# Source (电脑 A) + Destination (电脑 B) 的 OAuth token
src_api = ApiClient()
src_api.set_base_path("https://demo.docusign.net/restapi")
src_api.add_default_header("Authorization", f"Bearer {TOKEN_FROM_A}")

dst_api = ApiClient()
dst_api.set_base_path("https://demo.docusign.net/restapi")
dst_api.add_default_header("Authorization", f"Bearer {TOKEN_FROM_B}")

tpl_api_src = TemplatesApi(src_api)
tpl_api_dst = TemplatesApi(dst_api)

# 1. 从 source 拉完整模板 + tabs
template_full = tpl_api_src.get(
    account_id=ACCOUNT_A_ID,
    template_id=TEMPLATE_ID_ON_COMPUTER_A,
)  # 包含 documents / tabs / recipients / customFields / notification

# 2. 可选：导出 JSON 存档到 Git / 公司 NAS
import json, pathlib
template_json = template_full.to_dict()
pathlib.Path("./templates_snapshot/coe_hr_pre_sign.json").write_text(
    json.dumps(template_json, indent=2, default=str)
)

# 3. 在 destination 创建同 schema 模板
new_template_request = {
    "name": template_full.name + " (synced 2026-06-04)",
    "description": template_full.description,
    "shared": "true",
    "documents": template_full.documents,
    "recipients": template_full.recipients,
    "custom_fields": template_full.custom_fields,
    "notification": template_full.notification,
    "event_notification": template_full.event_notification,
}
created = tpl_api_dst.create_template(
    account_id=ACCOUNT_B_ID,
    template=new_template_request,
)
print(f"Synced to templateId={created.template_id} on account B")
```

**进阶**：

- 这个脚本可以推个 **CI cron**（GitHub Actions / 公司内部 cron），每 6h 同步一次。
- 需要避同名覆盖：加在去 sync 前比对 `template_updated_date_time` + `etag`。

#### 路径 C — **Transfer Envelopes / Templates Between Users**（人员离职场景）

> DocuSign Community Answer：「Transfer Envelopes and Templates Between Users from the DocuSign eSignature Admin Page, you select the user who leaves the company → Actions → Transfer Envelopes.」

**使用场景**：HR Director 离职、账号退还，需要把其名下 templates / envelopes 转给继任者。

路径：

```
DocuSign Admin → Users → 选择离任人 → Actions
  ├─ Transfer Envelopes (所有未完成 envelope)
  └─ Transfer Templates (所有 私有 + 共享 templates 指向其他用户)
                    ↓
                  Complete transfer (Option: delete old user)
```

### 10.3 多电脑多账号场景实战推荐架构

> 推荐：**「Git 存档 + Python 同步脚本」** 控制 Source of Truth。

```
┌─ Source-of-Truth (Git) ────────────────────────────────────────┐
│  /templates_snapshot/                                             │
│    ├─ coe_hr_pre_sign.json     (JSON 全文，跨账号可移植)         │
│    ├─ onboarding_v3.json                                       │
│    └─ changelog.md            (记录谁、什么时间、同步到哪个账号) │
└─────────────────────────────────────────────────────────────────┘
          ⇡ refresh by Hand                       ⇣ auto CI

电脑 A 起草 改 → 1) Edit in DocuSign Web → 2) Download JSON → 3) Git commit
                                                     ↓
                                        CI (every 6h):
                                                  1) Pull 最新 JSON
                                                  2) Put to Prod Account via API
                                                  3) 发送 Slack 警报 + Diff link
```

**为什么这个架构**：

- **可追溯**：每个 change 都有 git blame + diff，避免「改了但不知道改了」位。
- **跨账号**：同一个 JSON archive 能直接 put 到 demo / staging / prod / customer-env。
- **防覆盖**：CI 会 reverse-diff -- 不同于本地会 push 上去是「同一 UID」。
- **可从其他 HR SaaS 编译**：许多 HR SaaS 导出 JSON/PDF 模板 → 同样可以入仓。

### 10.4 高性能模板上架 Tip Sheet

模板从起草到上 Prod 路径：

```
[1] Sketch    按需求页动 fields           (1-3 days)
      ↓
[2] Draft Web GUI 使用 Anchor Text         (1 day)
      ↓ sim email
[3] Playwright / Browser Test              (0.5 day)
      ↓
[4] Bulk Send dry run with dummy recipients (0.5 day)
      ↓
[5] Customer Signoff  (1-3 days)
      ↓
[6] JSON snapshot → Git                    (0.5 day)
      ↓
[7] CI push to Prod + Staging              (0.5 day)
      ↓
[8] 公告 + Training + Template Doc         (1 day)
────────────────────────────────────────────────
Total:    5-8 days  (一次起草 长期使用)
```

### 10.5 常见场需 generator

| 需要调整 | 推荐 |
|---|---|
| 调整 fields（小） | Web GUI + **Anchor Text** |
| 调整 PDF design | 最新版 Word → DocuSign Generator 下载 .docx 重发 |
| 跨账号同步 | API (path B) + CI |
| 人员离职转移 | Admin Transfer (path C) |
| 几十个模板同时调架 | Python SDK + Bulk replace on TabClone |
| Template 本身错认 | 不能改默认名 → Clone 并重命名后 Original 限制使用 |

### 10.6 Why Avoid Playwright / Dev Tools 「别跨电脑」式架设

某些 HR Lead 会用 `python + playwright` 打开后 DevTools 修改 template JSON、Tab Coords。这个「」有几个坑：

- DocuSign **班会配合**：Cron 检测 DevTools 链接动作会要求 SSL Reconnect。
- 一个会话一次只能导出一个模板。下一个需要重导。
- 官方 UI 已经 minimal Tech verh，如只有以下三个业务不需脚脚本：
  - Tab 坐标大量调整 → 用 API Path B。
  - 跨账号同步 → 用 API Path B。
  - 加大规模 replace → 用 API Path B。

「粗」UI 抓取不需。**不要混用 GUI + Playwright 跨电脑同步**。



---

## 11. 常见坑与避坑

### 11.1 Bulk Send 坑

| Pitfall | 避坑点 |
|---|---|
|  超过 1000/批报详 de error | 拆批 / 多个 Batch ID |
| 「 _  」 面前发件重发发  | 错贴 CSV → Emitter / Recipient roles 取 「Supervisor」「Manager」「Employee」 个 |
| 会出事 、出 Report | 出于后立即下载 Bulk Send Report |
| Cloud ID 用不上 | DocuSign 账号主 Supermail / 仅@公司.com Verification |
| 顺序选择错了 | 在 Template 上勾选 Sign in Order，不同员工不同顺序是 templates 个件是 templates 同一个 template 默认不能 ng顺序人。 多人多人 容护 人 需 个互护  |

### 11.2 Web Form 坑

| Pitfall | 避坑点 |
|---|---|
| Conditional Logic 补限件 **三个以** | 不要护 发护 3 遇到 多人 个其代 体件 |
| Form 限于 补 max fields | 补 多件护 这是你 Inbound Documents / Documents 见到 |
| Email 护送 误为 Same Person | DocuSign Web Form 护 Email 个 Smart Field |
| 把 Web Form 同 PowerForm 个 | Web Form 不是 PowerForm 续护 - . **PowerForm Use PowerForm 不同有体护 PowerForm 同。** |

### 11.3 : 马来西亚 坑

| Pitfall | 避坑点 |
|---|---|
| 报期 不上 12(2)  | 不同 招腿 腿年限 不同件护 以 4 周 / 6 周 / 8周 |
| 人在后面 还没报发 IR | 件、没事；**价 30 天 是 项法仔薪 后补仗**。 |
| CoE 个 「Performance Issue」 同雇佣 Saddle 个 | 护雇事件 + 鼓仔伙 Position / Department / Tenure 侣 X 是 |

---

## 12. 企业级架构能力 — 集成 / API / Workflow / MCP / Extension Apps ⭐

> **本节是 §0「能力图」中象限 C + 象限 D 的实战落地**。读者对象：Solution Architect / 实施顾问 / Lead Dev。覆盖 eSignature REST API、IAM 全家桶（Maestro / Navigator）、MCP Server、Extension App 框架。

### 12.1 DocuSign 三层账号体系 + OAuth2 认证矩阵

> 信源：developers.docusign.com「Implement Authentication with Docusign APIs」Learning Plan；developers.docusign.com/extension-apps/build-an-extension-app/it-infrastructure/authorization/

调用任何 DocuSign REST API 前，先理解三层：

| 层级 | 含义 | 谁能创建 |
|------|------|---------|
| **Account** | 客户账号（如 `acme-uat.docusign.com`） | DocuSign Sales |
| **Application（App）** | OAuth2 Client（你注册的集成 App） | 在 Developer Console（devconsole.docusign.com）自助创建 |
| **User** | DocuSign 账号内的一个真实用户（收件人或 admin） | Account Admin 邀请 |

#### 12.1.1 OAuth2 Grant Flow 选型

| Flow | 适用 | 安全机制 |
|---|---|---|
| **Authorization Code Grant** | Public App（用于 App Center 发布给第三方用户） | 必须 + PKCE 防 code interception |
| **JWT Grant** | Private App（企业内自用，单租户） | RSA 私钥签名 JWT；Admin 预授权一次 |
| **Client Credentials Grant** | Private App 后端服务（无需用户授权） | 最简单；适合纯后端轮询任务 |

#### 12.1.2 选择建议

- **企业内嵌到 HRIS（Workday/ServiceNow）的集成**：**JWT Grant**（用户授权一次后永远不用再次跳转）
- **对外服务（如让第三方 SaaS 集成 DocuSign）**：**Authorization Code Grant + PKCE**
- **CI/后台 cron（无用户交互）**：**Client Credentials Grant**，Credential 用 Vault 保管 + 90 天轮换

### 12.2 Extension App 6 种类型选型

> 信源：developers.docusign.com/extension-apps + github.com/docusign/extension-app-data-verification-reference-implementation

Docusign IAM 平台的 Extension App 框架支持 6 种 extension type，企业实施**首先要选对类型**：

| Type | 触发现场 | 典型场景 | 自建示例 |
|------|---------|---------|---------|
| **DataIO** | 字段级 ↔ 外部 API | 客户 ID 在外部系统中随时变化，实时拉来填 PDF | Salesforce Account 实时拉来 |
| **Connected Fields** | Web Form 字段直连 | 员工提交 Web Form 时字段 → HRIS | Web Form 字段 → Workday REST |
| **Data Verification** | Web Form 提交前自动验证 | 银行账号、SSN、地址、电话、Email 真伪 | Internal AML 验证 callout |
| **FileIO Input** | 从外部拉文档进 envelope | 合同模板来自 SharePoint / Confluence / S3 | SharePoint ≥ onedrive 镜像 |
| **FileIO Output** | 签后存档到外部 | 签完 PDF 自动归档到 OneDrive + S3 | 归档 + 命名规范 |
| **File Archive** | 长时间冷归档 | 满足法务 10 年保留要求 | Glacier 归档 |

> **实测组合建议**：
> - **HR 场景**：DataIO 拉员工 ID + Connected Fields 写回 HRIS + FileIO Output 归档到企业 NAS
> - **马来西亚 IR21 报表**：Data Verification 验证 IC 号 + FileIO Output 推送至 IR 系统

### 12.3 IAM 套餐选型 + Workflow 配额

> 信源：fluidlabs.com「The Complete Docusign IAM Implementation Guide (2026)」 + 官方 Docusign Pricing IAM Plans

| Plan | $ / 用户 / 月 | Workflow | Agreement Manager | AI | 适合 |
|---|---|---|---|---|---|
| **IAM Starter** | $40 | 1 | 1,000 / user / yr | AI search manage analysis | 小型或独立业务 |
| **IAM Standard** | $45 | 3 | 1,000 / user / yr | + | 小中型企业 |
| **IAM Professional** | $75 | 10 | 1,000 / user / yr | + Business Pro eSignature | 中大型企业（**推荐**） |
| **IAM Enterprise** | 联系销售 | 无限 | 1,000 / user / yr | + AI-Assisted Review | 大型 / 跨国 |

> 注意：Workflow 配额**是已发布的数量**——你可以 build / test 无限数量未发布的，但发布后最大 10 条。

### 12.4 Maestro Workflow Builder + API

> 信源：developers.docusign.com/docs/maestro-api + thenewstack.io「Build API-Driven Custom Agreement Workflows With Docusign Maestro」

Maestro 是**无代码/低代码** Workflow Builder，4 种触发方式：

| 触发方式 | 适合 |
|---------|------|
| **From a Link** | 外部访客可触发的 self-service |
| **From Within Workflow Builder** | 内部用户手动触发 |
| **From an Event** | Connect Webhook 触发（新签完成后归档） |
| **From an API Call** | 外部系统 API 触发（HRIS → Maestro） |

HR **Onboarding 自动开 PoC**：HRIS 由于 Onboard 起一个 Maestro workflow instance →
1. 「Send envelope」（eSignature trigger）→
2. 「Wait for envelope-completed event」→
3. 「Call Extension - DataIO」（写回 Workday）→
4. 「Send Slack notification」

Maestro API 现成 endpoints：
```
POST   /v1/accounts/{aId}/workflows/{wId}/actions/trigger
GET    /v1/accounts/{aId}/workflows/{wId}/instances/{iId}
DELETE /v1/accounts/{aId}/workflows/{wId}/instances/{iId}
```

### 12.5 Docusign MCP Server（2026-05-21 Momentum 发布）⭐

> 信源：docusign.com/blog/developers/claude-docusign-mcp-connector-guide + developers.docusign.com/platform/mcp-server + thenewstack.io「Building the agentic agreement enterprise」（2026-05-21）

**这是 2026 年最值得学习的 DocuSign 新能力**。MCP 是 Anthropic 主导、2024 年末发布的标准，DocuSign 在 Momentum 2026 上**首批支持 MCP 服务端**。

#### 12.5.1 MCP Server 暴露的能力

- 拉取 agreement context / metadata / clause
- Query agreement status + key dates
- Trigger workflow actions through IAM tools
- Integrate agreement intelligence into AI-driven workflows

#### 12.5.2 Claude 官方 Demo（Anthropic Connectors Directory 已收录）

官方 blog 示范用 Claude + Docusign MCP 做：

```
HR Leader: "Find all employment contracts expiring in 60 days for Singapore, and generate renewal offer letters"
   ↓
Claude 调用 Docusign MCP tools:
   1. search_agreements(filter={region:SG, expiring:<60d})
   2. for each agreement → extract employee_id
   3. generate_renewal_offer(employee_id, ...)
   4. (可选) trigger_maestro_workflow("renewal_offer_v1")
```

#### 12.5.3 如何启用

```
1. 注册 Docusign Developer 账号（已有）
2. devconsole.docusign.com → 创建 MCP Server App（选 IAM Professional 套餐）
3. 拿到 clientId / clientSecret
4. 在 Claude → Connectors → 选 Docusign
   - Authenticate via OAuth2 Authorization Code
   - 同意权限范围（默认 read_agreements, workflow_trigger）
5. Claude 自动发现 DocuSign tools，开始使用
```

#### 12.5.4 真实 arch 模式

```
Claude Workplace / IDE
   ↕  MCP protocol （JSON-RPC over stdio 或 WebSocket）
Docusign MCP Server（公对外）
   ↕  IAM 推荐 API
DocuSign IAM Professional Account
   ↕ 各种 internal extension
   - eSignature REST API
   - Agreement Manager API（IR21 extraction 等）
   - Maestro Workflow API
   - Extension Applications
```

#### 12.5.5 与自建 LLM 集成的取舍

| 方案 | 优 | 劣 |
|---|---|---|
| **Claude + Docusign MCP Connector** | 上手 5min，官方维护 | 受限于 Claude 不被企业允许 |
| **自建 LLM Gateway + Docusign MCP Server** | 完全控制 | 自建 OAuth2 + 缓存 + 安全审计 |
| **直接 eSignature REST API + 自建 RAG** | 完全脱离 DocuSign AI | 工作量大 |

企业**合规优先的话**，走自建 LLM Gateway（DeepSeek + 内网 + Docusign MCP Server）；追求快点验证业务 → 先走 Claude。

### 12.6 App Center 发布路径（ISV 路线）

> 信源：developers.docusign.com/extension-apps + fluidlabs.com「Build Docusign Extension Apps: ISV Guide」（2026）

**对企业内部**：Extension App 设为 **Private distribution** → 仅自己账号可见
**对产品厂商**：设为 **Public distribution** → 上 App Center 给客户安装

发布 Checklist：
```
ISV 上架 7 步:
1. 注册 Docusign Partner Account
2. 在 Developer Console 创建 private extension dev app
3. 完成 5 类 test：
   - Integration tests（连接测试）
   - Extension tests（功能验证）
   - Functional tests（端到端）
   - App Center preview（UI 预览）
   - Beta 客户（邀请制）
4. manifest.json 补全（marketing 描述 + 截图 + 价格）
5. 提交审核（review team 一般 4-6 周）
6. 等待 Marketplace 上架
7. 持续维护（API 变更 + bug 修复 + 新功能）
```

### 12.7 企业实施 P1-P4 阶段（fluidlabs 实战梳理）

| 阶段 | 周期 | 关键交付 |
|---|---|---|
| **P1: Assessment & Planning** | 1-2 周 | 当前合约 Volume / Workflow Mapping / 系统清单 / 文档复杂度评估 |
| **P2: Pilot Build** | 2-3 周 | 1 个 representative workflow（建议：Offer Letter / NDA 类）跑通 end-to-end |
| **P3: Wave Rollout** | 4-8 周 | 按业务线 / 地区分批推广，先 IT/HR 后 Finance/Sales/Procurement |
| **P4: Optimize & Govern** | 持续 | ROI 评估、AI agent 上线、合规审计、Renewal 提醒自动化 |

### 12.8 高频场景：把 DocuSign 嵌入 ServiceNow HRSD / Workday HCM

#### ServiceNow HRSD 嵌入方案

```
ServiceNow HRSD Workspace
   ↓ (Service Portal + UI Action)
DocuSign Embedded Signing iframe（clientUserId）
   ↓ 签完
Connect Webhook → HRIS Update REST Message
   ↓ 更新案例状态
ServiceNow HRSD Agent Workspace 刷新
```

最佳实践：
- 用 **Embedded Signing** 而非 mailto 链接，体验无缝
- `frameAncestors` 配置 ServiceNow 域名
- 验证 SMS / KBA 双因素确保安全

#### Workday Embedded 方案

Workday Marketplace 上的 **DocuSign eSignature For Workday** 是 **Workday Built Integration**：
- 支持 400+ Business Processes（NDA, Offer, Termination Certificate 等 400+ 用例）
- Workday Mobile + Desktop 客户端都支持
- 签后文件存 Workday，DocuSign Call Track Transaction

#### SuccessFactors / Oracle HCM

需要 SAP/Oracle 自家 BSP 配置 + DocuSign Adapter（MFG 系列的 SAP Cloud Connector）。典型 4-6 周 PoC。

---

## 13. 附录：可立即复用模板片段

### 13.1 DocuSign Template 角色 + 配合 Bulk Send

```
Roles:
  Employee — Receiving signature
  Supervisor — Initial countersign
  HR Lead — Final approver & archiver

Signing Order:
  ✓ Sequential
  Routing:
    R1 Employee  → R2 Supervisor → R3 HR Lead

Bulk Send CSV columns:
  Employee.Name, Employee.Email, Supervisor.Name, Supervisor.Email,
  HR Lead.Name, HR Lead.Email, Hire Date, Employee ID, Department Code

⚠ Single batch <= 1000 rows
```

### 13.2 Web Form 字段补护件（蓝领 HR 入职）

```
Group A — Personal (必)
  FullName (Text, prefill by HRIS)
  NickName (Text)
  IC/Passport (Text, masked)
  Date of Birth (Date)
  Gender (Radio)
  Marital Status (Radio)

Group B — Contact (必)
  Mobile Phone (Phone, with E.164 check)
  Personal Email (Email, validation enabled)
  Home Address (Text, with auto-translate option)
  Emergency Contact (Name + Phone)

Group C — Bank (然发)
  Bank Name (Dropdown with common banks per region)
  Account Number (Text with masked)
  Bank Branch (Text)
  Bank Code/Swift (Text)

Group D — Conditional : has used a visa ?
  Yes → Show Additional fields (签证文件副本上传)
  No → Skip

Signature Block:
  Employee signature placement
  HR Lead signature placement
  Date auto-fill
```

### 13.3 马来西亚 Resignation Letter / CoE Sample MIME

```
RESIGNATION LETTER TEMPLATE
─────────────────────────────────────
[Date]
[Manager Name]   Reporting Manager
[Company] Sdn Bhd
[Address]        WP Kuala Lumpur

Dear [Manager Name],

I, [Employee Full Name] (IC No. [NRIC]), hereby give notice of my
resignation from my position as [Job Title] at [Company Name],
effective [Last Working Day]. I confirm:

1. Notice Period (EA 1955 Section 12(2)): [4/6/8 weeks till tenure]
2. I waive the remainder of my notice period under Section 13(1):
   ☐ Yes
   ☐ No

Outstanding Items:
- Leave Balance: [N] days (to be paid in Final Settlement)
- Pending Expenses: [List]

Sincerely,
[Employee Signature]

─────────────────────────────────────

CERTIFICATE OF EMPLOYMENT TEMPLATE
─────────────────────────────────────
[Company Name] (Reg. No. [xxxxxx-x])
[Address Line 1], [Poscode] [City], Malaysia

Date: [Completion Date]

TO WHOM IT MAY CONCERN:

This is to certify that [Employee Full Name] (IC/Passport No.
[NRIC/Passport]) was employed at [Company Name] from [Hire Date] to
[Last Working Day] as [Last Position Title] in the [Department]

Employee Performance Reference: NOT INCLUDED (per HR Neutrality
Policy).

This certificate is issued upon the employee's request for purposes
of future employment/visa applications and is provided without
prejudice.

Authorized Signatory:
[Name]
HR Director
[Company Name]

(Company Stamp)

DocuSign Envelope ID  : [xxxx]
Signing Hash          : [SHA-256]
Audit Trail Reference : [DocuSign Connect Transaction ID]
─────────────────────────────────────
```

### 13.4 DocuSign Connect Webhook Payload 到 Workday / SuccessFactors 集成

```json
{
  "event": "envelope-completed",
  "apiVersion": "v2.1",
  "uri": "/restapi/v2.1/accounts/{accountId}/envelopes/{envelopeId}",
  "retryCount": 0,
  "configurationId": 12345,
  "generatedDateTime": "2026-06-04T08:30:00Z",
  "data": {
    "accountId": "...",
    "userId": "...",
    "envelopeId": "...",
    "envelopeSummary": {
      "status": "completed",
      "completedDateTime": "2026-06-04T08:25:00Z",
      "recipients": {
        "signers": [
          { "email": "employee@...com", "status": "completed" },
          { "email": "manager@...com",  "status": "completed" },
          { "email": "hr@...com",        "status": "completed" }
        ]
      }
    }
  }
}
```

HRIS 端接受 webhook 后：

```
1. lookup envelopeId → Workday Custom Object / SuccessFactors Document
2. mark 「DocuSign Envelope Stored = YES」
3. if Malaysia employee → trigger IR21 + 30-day DG notification workflow
4. if Blue Collar Day-1 → mark Day-1 Closed
5. archive final PDF to employee record (HRIS Document Folder)
```

### 13.5 「HR 随时签 + 员工 Last Day 才能签」完整 Envelope 参考定义（对应 §6.7）

下面给出 B-1（HR-only）和 B-2（Employee Acknowledge）两个 envelope 的完整字段定义，可直接作为 HRIS 集成的 input template。**注意**：由于 Envelope B-2 的 document 必须在 B-1 完成后才确定内容（带 HR 签字的 PDF），实际开发中应分两阶段执行。

```jsonc
// =========================================================
// Envelope B-1: HR-Only Pre-Sign（在 Resignation 完成后立即创建）
// =========================================================
{
  "status": "sent",
  "emailSubject": "Please sign Certificate of Employment for ${employeeName}",
  "documents": [{
    "documentBase64": "<TRIMMED_PDF_TEMPLATE>",
    "name": "CoE_Pre-Sign_${employeeId}.pdf",
    "fileExtension": "pdf"
  }],
  "recipients": {
    "signers": [
      {
        "email": "hr.manager@{company}.com",
        "name": "HR Manager",
        "recipientId": "1",
        "routingOrder": "1",
        "tabs": {
          "signatureTabs": [{
            "documentId": "1",
            "pageNumber": "1",
            "xPosition": "100",
            "yPosition": "500",
            "tabLabel": "HRSignature"
          }],
          "dateSignedTabs": [{
            "documentId": "1",
            "pageNumber": "1",
            "xPosition": "300",
            "yPosition": "500",
            "tabLabel": "HRDate"
          }]
        },
        "authenticationMethod": "phone",
        "phoneAuthentication": {
          "countryCode": "60",
          "phoneNumber": "16xxxxxxx",
          "senderProvidedNumbers": ["+6032xxxxxx"]
        }
      }
    ]
  },
  "notification": {
    "useAccountDefaults": "false",
    "reminders": {
      "reminderEnabled": "true",
      "reminderDelay": "1",
      "reminderFrequency": "2"
    },
    "expirations": {
      "expireEnabled": "true",
      "expireAfter": "30",
      "expireWarn": "3"
    }
  },
  "customFields": {
    "textCustomFields": [
      {"name": "EnvelopeType", "value": "CoE_HR_PreSign", "show": "true"},
      {"name": "EmployeeID",   "value": "{employeeId}", "show": "false"},
      {"name": "LastWorkingDay", "value": "{YYYY-MM-DD}", "show": "false"}
    ]
  }
}

// =========================================================
// Envelope B-2: Employee Acknowledge（Scheduled Send）
// 在 B-1 completed 后创建，document 用 Connect 回调取的 HR-signed PDF
// =========================================================
{
  "status": "created",
  "scheduledSendTime": "{LastDay}T01:00:00Z",
  "emailSubject": "[Action Required] Sign your Certificate of Employment",
  "emailBlurb": "Hi ${employeeName}, please sign your Certificate of Employment on or after ${LastDay}. This is your final document from HR.",
  "documents": [{
    "documentBase64": "<HR_SIGNED_PDF_FROM_B1>",
    "name": "CoE_${employeeId}_${LastDay}.pdf",
    "fileExtension": "pdf"
  }],
  "recipients": {
    "signers": [
      {
        "email": "{employeeEmail}",
        "name":  "{employeeFullName}",
        "recipientId": "1",
        "routingOrder": "1",
        "clientUserId": "employee-{employeeId}",
        "tabs": {
          "signatureTabs": [{
            "documentId": "1",
            "pageNumber": "1",
            "xPosition": "100",
            "yPosition": "650",
            "tabLabel": "EmployeeSignature"
          }],
          "dateSignedTabs": [{
            "documentId": "1",
            "pageNumber": "1",
            "xPosition": "300",
            "yPosition": "650",
            "tabLabel": "EmployeeDate"
          }]
        },
        "authenticationMethod": "phone",
        "phoneAuthentication": {
          "countryCode": "60",
          "phoneNumber": "{employeePhone}",
          "senderProvidedNumbers": ["+6032xxxxxx"]
        }
      }
    ]
  },
  "notification": {
    "useAccountDefaults": "false",
    "reminders": {
      "reminderEnabled": "true",
      "reminderDelay": "1",
      "reminderFrequency": "1"
    },
    "expirations": {
      "expireEnabled": "true",
      "expireAfter": "2",
      "expireWarn": "1"
    }
  },
  "eventNotification": {
    "url": "https://hris.{company}.com/api/docusign/webhook",
    "loggingEnabled": "true",
    "requireSignedXML": "true",
    "includeData": "recipients,tabs,custom_fields,documents",
    "envelopeEvents": [
      {"envelopeEventStatusCode": "sent"},
      {"envelopeEventStatusCode": "delivered"},
      {"envelopeEventStatusCode": "completed"},
      {"envelopeEventStatusCode": "declined"},
      {"envelopeEventStatusCode": "voided"},
      {"envelopeEventStatusCode": "expired"}
    ],
    "recipientEvents": [
      {"recipientEventStatusCode": "AuthenticationFailed"},
      {"recipientEventStatusCode": "Completed"}
    ]
  },
  "customFields": {
    "textCustomFields": [
      {"name": "EnvelopeType",         "value": "CoE_Employee_Ack",      "show": "true"},
      {"name": "LinkedEnvelopeB1",     "value": "{B-1 envelope ID}",     "show": "true"},
      {"name": "EmployeeID",           "value": "{employeeId}",          "show": "false"},
      {"name": "LastWorkingDay",       "value": "{YYYY-MM-DD}",          "show": "false"},
      {"name": "HRMGR_ApprovalReq",    "value": "YES",                   "show": "false"}
    ]
  }
}
```

> **代码层面注意**：
> - `scheduledSendTime` 用 **UTC** 存，但前端展示与 Email Blurb 要换算到员工 Local Time。
> - `clientUserId` 在使用 **Embedded Signing**（员工用 HRIS 自家门户内 H5）时必填；否则不用。
> - Webhook 用 HMAC 签名验证（`X-DocuSign-Signature-1` header），**必须**在 HRIS 验证签名后才入库。
> - `webhook.requireSignedXML=true` 在生产环境推荐。

---

## 信源一览（本文引用的主要权威来源）

| 信源 | 主题 |
|---|---|
| Docusign Pricing「IAM Plans」（官方 2026-05-29 更新） | AI Extract、IAM 系列套餐边界 |
| Docusign Pricing「eSignature Plans」（官方 2026-05-29 更新） | Personal/Standard/Business Pro 套餐边界 |
| Docusign IAM Support Landing Page（2026-05-29 更新） | IAM 整体产品 + FedRAMP Moderate |
| DocuSign Support「Differences Between Web Forms and PowerForms」（2026-06-02 更新） | Web Form vs PowerForm |
| Document Logistix「Employee Onboarding System」 | 入职流程参考 |
| DocuSign Developers「Bulk Sending Concept」 | Bulk Send 概念 |
| DocuSign UT Austin Admin「Use Bulk Send」 | Bulk Send 实操 / 限制 |
| Rutgers SASIT「Multiple Signature + Bulk Send」 | Bulk Send + CSV 示例 |
| DocuSign Community Michael.Rave / Alexandre Augusto「Envelope expiration settings」（2024-05-16） | Expiration 全局规则 |
| DocuSign Support「Set Reminders and Expirations」 | Reminder/Expiration 字段定义 |
| DocuSign C# SDK8「How to set envelope expire values eSignature」（2025-04-30） | Expiration API 代码样例 |
| DocuSign Developers「Conditional Recipients」 | Recipient Routing Rules |
| DocuSign Developers「Embedding」 | Embedded Signing 概览 |
| DocuSign Developers「Webhooks / Connect」 | Connect 事件订阅 |
| Esign.AI「Docusign Connect Best Architecture」 | 高并发 webhook 架构 |
| Workday Marketplace「Docusign eSignature For Workday」 | Workday Built Integration |
| 8Dolphins / Cyntexa「ServiceNow HRSD + AI Agent」参考 | 行业经验参考 |
| TimeTecCloud「What Happens If You Don't Serve Notice Period in Malaysia」 | EA 1955 S. 12-13 |
| CXC Global「Termination of Employment - Notice Period Malaysia」 | 法定离职补偿 |
| Skuad「Employment laws in Malaysia 2025 Guide」 | EA 1955 S. 19 工资 7 日 |
| MahWengKwai & Associates「Q&A on Employment Law in Malaysia」 | 资质 / 工资 / 产假 |
| HHQ「Amendments to the Employment Act of Malaysia」（2022-08-24） | 2022 修订总览 |
| LO Siaw Ching & Partners「Amendment of The Employment Act 2022」 | 11 条修正条款 |
| Malaysia MOHR PDF「Employment Act 1955 (Act 265)」 | 法律原文 |
| MPMA「Employment (Amendment) Act 2022」PDF | S. 60KA、99A、90B |
| DocuSign Support「Download and Upload Templates」（2025-07-27 更新） | 跨账号 / 跨环境模板迁移 |
| DocuSign Community「Transfer Envelopes and Templates Between Users」 | 人员离职模板转移 |
| DocuSign Developers「Composite Templates」 | Server + Inline + Document 拼接 |
| DocuSign Developers「Templates Update」 | Template 更新 API |
| DocuSign Developers「EnvelopeTemplates Apply」 | 把模板应用到 envelope |
| DocuSign GitHub `docusign-template-library`（MIT License） | 官方 JSON 模板示例 |
| dsucustomers.docusign.com「Certified Docusign eSignature Administrator」 | Admin 认证（60 题 / 70% / 90 分钟） |
| dsucustomers.docusign.com「Certified Docusign IAM Integration & Extension Developer」 | Dev/Architect 认证 |
| docusign.com/blog/developers/claude-docusign-mcp-connector-guide | Claude × DocuSign MCP 连接 |
| developers.docusign.com/platform/mcp-server | Docusign MCP Server（2026-05-21 Momentum） |
| developers.docusign.com/docs/maestro-api/maestro101 | Maestro API 触发链 |
| developers.docusign.com/extension-apps/build-an-extension-app | Extension App 6 类型 + Developer Console |
| github.com/docusign/extension-app-data-verification-reference-implementation | Data Verification 官方参考实现 |
| github.com/docusign/extension-app-data-io-reference-implementation | DataIO + 5 类 test |
| github.com/docusign/docusign-iam-java-client | 官方 IAM Java SDK |
| github.com/docusign/sample-app-workflows-node | Maestro Workflow Node.js 样本 |
| github.com/docusign/postman-collections | 官方 Postman Collection |
| thenewstack.io「Build API-Driven Custom Agreement Workflows With Docusign Maestro」 | Maestro 实操 |
| thenewstack.io「Building the agentic agreement enterprise」 | Docusign MCP + Agreement Manager（Momentum 2026 总结） |
| fluidlabs.com「The Complete Docusign IAM Implementation Guide (2026)」 | IAM 实施 P1-P4 + Extension App 选型 |
| fluidlabs.com「Build Docusign Extension Apps: ISV Guide」 | ISV 路线 + Extension App 商业策略 |
| docusign.com/trust/compliance/certifications | 合规认证列表（FedRAMP / GovRAMP / DoD IL4 / C5 / IRAP） |
| docusign.com/products/electronic-signature/features | eSignature 详细功能全景 |

---

> **下一步建议（如果还要继续）**
> 1. 在 Workday / SuccessFactors 启动一个 marker HRIS 集成 PoC（两周出件）。
> 2. DocuSign Connect + Webhooks 部署 + 加 Malaysian 红外 31 个护补件（二周）。
> 3. 在马来西亚 Site 试点 30 人「同一事件」双 envelope 路径。

---

> **报告结束 / 调研日期 2026-06-04。** 如需制作 HTML 速览版（消息渠道分享用），可在 Vim/HTML 模板中直接渲染本 .md。

