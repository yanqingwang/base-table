# SmartRecruiter × SAP 实施 替代 SAP Recruiting 亚太 7 国研究报告

> **甲方角色指导手册** | 场景：美国跨国公司 × SAP 实施 SmartRecruiter, 替代现有 SAP SuccessFactors Recruiting
> 范围：中国、日本、韩国、马来西亚、泰国、菲律宾、新加坡
> **报告日期：2026-06-04** | 信源：SAP 官方 SmartRecruiter 收购公告 (2025-08-01), SmartRecruiters for SAP SuccessFactors (2026-03), Zalaris 迁移指南, HeyMilo AI screening, Ajinga 中国市场集成

---

## 目录

1. [替代 SAP Recruiting 的 7 个主要步骤](#1-替代-sap-recruiting-的-7-个主要步骤-)
2. [SmartRecruiter vs SAP Recruiting 关键优化](#2-smartrecruiter-vs-sap-recruiting-关键优化-)
3. [实施中的 7 个常见坑与对策](#3-实施中的-7-个常见坑与对策-)
4. [亚太 7 国渠道集成全景表](#4-亚太-7-国渠道集成全景表-)
5. [区域合规要求一览](#5-区域合规要求一览-)
6. [迁移时间线与关键里程碑](#6-迁移时间线与关键里程碑-)

---

## 1. 替代 SAP Recruiting 的 7 个主要步骤 

SAP 2025-08 收购 SmartRecruiters, 2026-03 正式发布 SmartRecruiters for SAP SuccessFactors。
迁移窗口 = **3-5 年**（现有 SF Recruiting 合同持续有效）。

### Step 1 — Readiness Assessment (2 周)
- 现状清查：SF Recruiting 中的 Job Req / Candidate / Offer / Onboarding 流程 mapping
- 数据质量评估：重复候选人、过时 Req、不一致的 Status
- 合规差距：7 国各自的 Data Residency / Consent 要求 vs SmartRecruiters 支持情况

### Step 2 — Process Simplification (2 周)
- **不要 1:1 搬流程！** SAP Recruiting 的流程往往是 10 年 legacy
- 推荐：以 SmartRecruiters OOTB 流程为基准, 只保留必要的差异化步骤
- 输出：Future-State Process Blueprint

### Step 3 — Data Mapping & Migration Planning (3 周)
- 核心实体映射：
  - Job Requisition ↔ Job
  - Candidate Profile ↔ Candidate
  - Application ↔ Application
  - Offer ↔ Offer
  - Onboarding Task ↔ Onboarding
- SAP 2026 年将提供 Migration Tooling（验证中）

### Step 4 — Integration Architecture Design (3 周)
- SmartRecruiters ↔ SAP SuccessFactors Employee Central 双向同步
- SmartRecruiters ↔ SAP Talent Hub / Skills Graph
- SmartRecruiters ↔ 各国 Job Board (见 §4)
- SmartRecruiters ↔ Background Check Providers (各国有不同 vendor)
- SSO: 建议 SmartRecruiters 作为 OAuth2 Client, SAP IAS 作为 IdP

### Step 5 — Configuration & Testing (4-6 周)
- SmartRecruiters OOTB Configuration (Job Template, Workflow, Offer Template)
- Region-specific 配置 (多语言 Career Site, Local Job Board XML Feed)
- Integration Testing + UAT

### Step 6 — Training & Change Management (2 周)
- Recruiter 重新学习 ATS（SmartRecruiters UI 比 SAP Recruiting 现代很多, 但操作逻辑不同）
- Hiring Manager Self-Service 培训
- **此阶段同步上线 AI Screening**（HeyMilo / Winston）→ 新旧 ATS 切换时的最佳窗口

### Step 7 — Cutover & Hypercare (2 周)
- 建议按**国家分批**而非一次性全量切换：先 2 个试点国家 → 4 周稳定期 → 其余国家
- Hypercare 4 周

---

## 2. SmartRecruiter vs SAP Recruiting 关键优化 

| 维度 | SAP SF Recruiting | SmartRecruiter | 优化幅度 |
|------|-------------------|----------------|---------|
| Recruiter UX | Legacy UI, 多页面跳转 | Modern SPA, Drag-drop Pipeline | ★★★★☆ |
| Candidate Portal | 标准模板, 难定制 | 可定制 Branded Career Site + 多语言 | ★★★★★ |
| AI Matching | 基础 Skills Match | Winston AI + 第三方 AI Screening (HeyMilo) | ★★★★★ |
| Job Distribution | 需手动配置 XML Feed | Marketplace: 50+ Job Board 直连 | ★★★★★ |
| Offer Management | 基础 Offer Letter | Offer Approval + eSignature 原生集成 | ★★★★☆ |
| Mobile | 有限移动端 | Native iOS/Android + 候选人 Chat | ★★★★☆ |
| Analytics | 基于 Report Center | 内置 BI Dashboard + Predictive | ★★★★★ |
| Onboarding | 独立模块, 需额外 License | SmartRecruiters Onboarding 即将接管 SAP Onboarding 产品线 | ★★★★☆ |
| High Volume Hiring | 不支持 | 原生支持 (蓝领批量招聘) | ★★★★★ |
| Language Support | 主要语言 (~10) | 50+ 语言 | ★★★★★ |
| Marketplace | 受限 | 400+ Partner Apps | ★★★★★ |

**核心优化三句总结**：
1. **Recruiter 效率提升**：Pipeline visual drag-drop, 单屏完成 Screening → Interview → Offer
2. **AI 真正可用**：Winston (embedded AI) + HeyMilo (多语言 Voice/Video AI screening 支持中日韩泰等 50+ 语言)
3. **全球渠道一键分发**：SmartRecruiters Marketplace 内 50+ Job Board 直连, 无需每次写 XML Feed

---

## 3. 实施中的 7 个常见坑与对策 

### 坑 1｜1:1 流程迁移
**对策**：要求 SAP 在 Step 2 先做 Process Simplification Workshop — 以 OOTB 为基线, 仅保留必要变异

### 坑 2｜数据清洗不到位
**对策**：Step 1 必须运行 Data Quality Report — 重复 Candidate / 僵尸 Req 不迁移

### 坑 3｜忽略 Hiring Manager 体验
**对策**：SmartRecruiter 的核心差异化是 Hiring Manager Self-Service — 必须纳入 UAT 和培训

### 坑 4｜中国市场渠道缺失
**对策**：SmartRecruiter Marketplace 已有 **AJINGA** 集成, 覆盖 51job / Zhaopin / Liepin / BOSS 直聘 (2026 年已上线)

### 坑 5｜合规盲区 — Consent Management
**对策**：7 国各有 Consent 要求 (见 §5), SmartRecruiter 原生 Consent Management 可配置但需要各国法律审核

### 坑 6｜多语言 Career Site 内容
**对策**：SmartRecruiter 支持多语言, 但需要**甲方提供翻译**, 不是 SAP 负责

### 坑 7｜新旧 ATS 并行期混乱
**对策**：明确并行期规则 — 哪个系统是 Source of Truth — 建议 SmartRecruiter 为主, SF Recruiting 冻结为只读

---

## 4. 亚太 7 国渠道集成全景表 

| 国家 | 核心 Job Board | 次要渠道 | SmartRecruiter 连接方式 | 备注 |
|------|---------------|---------|------------------------|------|
| 中国 | 51job, Zhaopin, Liepin, BOSS 直聘 | WeChat 企业号, Maimai | **AJINGA Marketplace App**（官方已上线） | 需 ICP 备案 Career Site |
| 日本 | Indeed Japan, Recruit (Rikunabi), MyNavi | LinkedIn Japan, Green | XML Feed / Indeed 原生集成 | 需日文版 Job Description |
| 韩国 | JobKorea, Saramin, Incruit | Wanted, LinkedIn Korea | XML Feed | 韩文版 Career Site 必需 |
| 马来西亚 | JobStreet, LinkedIn | Ricebowl, MauKerja | JobStreet XML Feed + LinkedIn 原生 | 英文 + 马来文 |
| 泰国 | JobsDB, JobThai | LinkedIn, JobBKK | JobsDB XML Feed | 英文 + 泰文 |
| 菲律宾 | JobStreet, Kalibrr | LinkedIn, BestJobs | JobStreet XML Feed + LinkedIn 原生 | 英文 |
| 新加坡 | LinkedIn, MyCareersFuture | Indeed SG, JobStreet | LinkedIn 原生 + XML Feed | 英文 |

**AJINGA — 中国渠道的 key enabler**：
- SmartRecruiters Marketplace 官方合作伙伴
- 一键分发到 51job / Zhaopin / Liepin / BOSS 直聘 / Maimai / WeChat
- 支持中文简历自动解析 → SmartRecruiters Candidate Profile
- 2026 年已 Go-Live, 验证通过

---

## 5. 区域合规要求一览 

| 国家 | 隐私法规 | Consent 要求 | Data Residency | 特殊要求 |
|------|---------|-------------|----------------|---------|
| 中国 | PIPL (个人信息保护法) | 明确同意 + 单独同意 (敏感信息) | 境内存储 | 需完成个人信息保护影响评估 (PIA) + 出境安全评估 |
| 日本 | APPI (个人信息保护法) | Opt-in Consent | 不强制但推荐 | 匿名化处理后可使用 |
| 韩国 | PIPA (个人信息保护法) | Opt-in + 14 天内删除请求处理 | 不强制 | 需提供"不提供信息的后果"说明 |
| 马来西亚 | PDPA 2010 | Opt-in | 不强制 | 跨境传输需确保"同等保护水平" |
| 泰国 | PDPA | 明确 Opt-in | 不强制 | 敏感数据 (民族/宗教/健康) 需 Explicit Consent |
| 菲律宾 | Data Privacy Act 2012 | Opt-in | 不强制 | 需任命 Data Protection Officer |
| 新加坡 | PDPA 2012 | Deemed Consent 允许 (但建议 Opt-in) | 不强制 | 2024 修订: Data Breach 72h 通知 |

**SmartRecruiter 原生 Compliance 能力**：
- 内置 GDPR / CCPA 框架
- Configurable Consent Management (per country)
- Data Retention Policy (per country)
- Anonymization / Pseudonymization
- Data Subject Access Request (DSAR) Workflow
- 2026-05 新品: Multi-Factor Authentication + Transparency Log

---

## 6. 迁移时间线与关键里程碑 

```
Month 0-1  │ Readiness Assessment + Process Simplification
Month 1-2  │ 试点国家 1 (Singapore) + 国家 2 (Malaysia) 配置
Month 2-4  │ Integration Build + Test
Month 4-5  │ UAT + Recruiter Training + AI Screening 上线
Month 5-6  │ Pilot Go-Live (SG + MY)
Month 6-8  │ Hypercare + Wave 2 准备 (CN + JP)
Month 8-10 │ Wave 2 上线 (China + Japan)
Month 10-12│ Wave 3 (KR + TH + PH) + SF Recruiting 冻结
```

**关键决策点**：
- Month 1: 是否启用 AI Screening（建议 YES — 迁移窗口是最佳时机）
- Month 3: 中国数据出境评估是否通过（如果不过, 中国 Talent Data 需本地化部署）
- Month 5: Pilot 国家是否满足 Go-Live 标准（SAP 的标准是 UAT 通过 + < 3 个 P1 级 Bug）

---

> **信源**：SAP「SAP to Acquire SmartRecruiters」(2025-08-01), SAP「SmartRecruiters for SAP SuccessFactors」(2026-03), CIO.com「SAP Sets Timeline to Replace SuccessFactors Recruiting Module」(2025), Zalaris「SmartRecruiters for SAP SuccessFactors: Implementation Guide」(2026), HeyMilo「SuccessFactors to SmartRecruiters Migration Guide」(2026), SmartRecruiters Marketplace「AJINGA」(2026), SmartRecruiters「May 2026 Product Release: MFA + Transparency Log」(2026-05), SmartRecruiters Compliance Resources, TeamUp China「Zhilian Zhaopin Overview」(2024), SmartRecruiters / LinkedIn「AJINGA joins SmartRecruiters Marketplace」(2026)
