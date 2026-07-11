# OPC1：HRIS服务商Top100榜单摘要报告（中国）

> **数据快照日期**: 2026年4月18日
> **数据文件**: `OPC1-vendors-top100-hris-china-2026-04-18.csv`
> **报告口径**: 基于当前CSV快照撰写；该文件名为Top100，但当前工作区内可读取到的有效记录为10家服务商。
> **报告日期**: 2026年4月18日

---

## 执行摘要

本报告用于给 OPC1 的中国 HRIS 服务商池提供一份可快速阅读的榜单摘要。基于当前 `OPC1-vendors-top100-hris-china-2026-04-18.csv` 快照，已识别的样本共 10 家，覆盖 **一体化 HRIS / Core HR、Payroll、WFM、ATS / Recruiting、Analytics、Implementation / Services** 等主要能力带。当前榜单头部呈现出两个清晰趋势：一是**一体化平台能力**仍然决定综合得分上限，二是**排班、薪酬合规、招聘流程**等专项能力在中国市场依然具备单点突破价值。

从现有样本看，**UKG（79）**、**北森（74）**位于第一梯队；**红海云（70）**与 **i人事 / 金蝶 s-HR / 用友大易（69）**构成第二梯队；其余厂商更多体现为特定客户段或场景优势。需要特别说明的是：当前 CSV 中的 `confidence` 字段均为 **M（Medium）**，意味着这些入榜判断更适合作为**供应商筛选与初步分层**，而不应直接视作对渠道佣金、合作条款或 Partner Program 的商业确认。

---

## 一、榜单口径与适用范围

### 1.1 本报告覆盖内容

本报告聚焦三类信息：

1. **厂商分类**：厂商属于一体化 HR 平台、薪酬/考勤/WFM、招聘 ATS、实施服务等哪类能力集合。
2. **得分摘要**：基于 `vendor_score` 对当前服务商样本进行排序和分层。
3. **商业可用性提醒**：说明 `confidence` 对 commission / partner terms 研判的边界，避免把产品能力证据误读为商业分润证据。

### 1.2 数据限制

- 当前工作区可读取到的榜单源文件只有：[`OPC1-vendors-top100-hris-china-2026-04-18.csv`](OPC1-vendors-top100-hris-china-2026-04-18.csv)
- 该 CSV 当前仅包含 **10 条供应商记录**，未见对应 XLSX 文件。
- 因此，本文中的“Top 20”表实际为**当前快照中的全部样本排序预览**；若后续补充完整 Top100 导出，应以补充版重新生成完整表格与统计分布。

---

## 二、服务商 taxonomy 与 tiering

### 2.1 taxonomy 分类

基于 `vendor_tags` 字段，当前样本的服务商能力可归纳为以下几类：

| taxonomy 类别 | 说明 | 当前样本中的代表厂商 |
|---|---|---|
| **HRIS / Core HR** | 员工主数据、人事主档、组织流程、一体化人事底座 | i人事、北森、金蝶 s-HR、红海云、BambooHR、宏景软件、UKG |
| **Payroll** | 薪酬计算、社保/个税、合规薪资处理 | i人事、北森、金蝶 s-HR、红海云、宏景软件、UKG |
| **WFM** | 考勤、排班、工时优化、劳动力调度 | i人事、北森、盖雅工场、红海云、喔趣科技、UKG |
| **ATS / Recruiting** | 招聘流程、候选人管理、招聘协同 | i人事、北森、用友大易、BambooHR |
| **Analytics** | HR 分析、报表、数据洞察 | i人事、北森、盖雅工场、金蝶 s-HR、用友大易、红海云、UKG、喔趣科技、宏景软件 |
| **Services / Implementation** | 实施、交付、配置、顾问服务属性 | 盖雅工场、宏景软件 |
| **Integration / Ecosystem** | 与 ERP、财务、业务系统或平台生态集成 | 金蝶 s-HR、用友大易、红海云 |
| **Global / Cross-border** | 跨国薪酬、国际合规或国际化产品适配 | UKG、BambooHR |

### 2.2 tiering 分层

本报告为便于阅读，按 `vendor_score` 将当前样本分为四档：

| tier | 分数区间 | 含义 | 当前厂商 |
|---|---|---|---|
| **Tier 1** | 74-79 | 平台完整度与市场可见度兼具，适合作为优先长名单 | UKG、北森 |
| **Tier 2** | 69-73 | 一体化能力较强，适合进入重点比较池 | 红海云、i人事、金蝶 s-HR、用友大易 |
| **Tier 3** | 64-68 | 在中型客户或专项场景有较强适配度 | BambooHR、宏景软件、盖雅工场 |
| **Tier 4** | 55-63 | 更偏场景化或细分能力，适合补位型筛选 | 喔趣科技 |

**解读要点**：
- **Tier 1-2** 基本由一体化平台或具备显著平台延展性的产品占据，说明综合能力仍然是中国 HRIS 采购的首要排序因子。
- **Tier 3-4** 并不代表“不可用”，更多表示厂商更偏专项场景、特定客群或可见度略弱。
- 在后续机会匹配中，建议把 **vendor_score 当作排序起点**，而不是替代场景化选型的最终答案。

---

## 三、评分方法摘要（scoring rubric summary）

### 3.1 评分结构

结合 CSV 中可见字段，本报告采用以下摘要口径解释 `vendor_score`：

- **Capability（能力证据）约 70%**
  - 依据 `vendor_tags` 的覆盖广度与组合完整度
  - 依据 `target_segment_fit` 对 SMB / Mid-market / Enterprise 的适配范围
  - 依据 `industry_strengths` 体现的行业落地深度
  - 依据 `notes` 中对产品能力、部署能力、实施属性的描述
- **Visibility（可见度证据）约 30%**
  - 依据 `visibility_level`
  - 依据 `website_url`、`evidence_url`、`supporting_evidence_urls` 的存在情况
  - 依据 `evidence_date` 与 `as_of_date` 的时间新近度

### 3.2 评分逻辑说明

这种 70/30 的摘要方法有两个目的：

1. **避免把品牌声量当成产品实力本身**：在 HR 软件选型里，功能覆盖、行业适配、实施能力通常比单纯曝光更重要。
2. **保留市场验证信号**：当两个厂商能力接近时，更高的市场可见度通常意味着更多公开案例、生态认知或采购熟悉度。

因此，`vendor_score` 更适合被理解为：**“能力优先、可见度校正”的综合排序分数**。

---

## 四、Top 20 榜单摘要（当前快照可见样本）

> 说明：当前 CSV 仅有 10 家厂商，因此本表展示当前可见样本的完整排序，作为 Top20 预览表。

| 排名 | vendor_name | vendor_score | vendor_type | vendor_tags | confidence |
|---|---|---:|---|---|---|
| 1 | UKG | 79 | software | core_hr\|payroll\|wfm\|global_payroll\|analytics | M |
| 2 | 北森 | 74 | software | core_hr\|payroll\|wfm\|ats\|recruiting\|analytics | M |
| 3 | 红海云 | 70 | software | core_hr\|payroll\|wfm\|analytics\|integration | M |
| 4 | i人事 | 69 | software | core_hr\|payroll\|wfm\|ats\|recruiting\|analytics\|ai | M |
| 5 | 金蝶 s-HR | 69 | software | core_hr\|payroll\|analytics\|integration | M |
| 6 | 用友大易 | 69 | software | ats\|recruiting\|analytics\|integration | M |
| 7 | BambooHR | 65 | software | core_hr\|ats\|recruiting\|benefits | M |
| 8 | 宏景软件 | 65 | software | core_hr\|payroll\|analytics\|implementation | M |
| 9 | 盖雅工场 | 64 | software | wfm\|analytics\|implementation | M |
| 10 | 喔趣科技 | 55 | software | wfm\|analytics\|other | M |

### 4.1 Top 榜单观察

- **综合平台型厂商占优**：北森、红海云、i人事、金蝶 s-HR 在功能组合上更完整，因此得分更稳定。
- **WFM 与 Payroll 是中国市场的关键加分项**：UKG、红海云、盖雅工场、喔趣科技都因劳动力管理能力而具备明显差异化。
- **ATS 型厂商需要看是否具备平台延展性**：用友大易虽然在招聘链路上强，但其得分仍低于更完整的一体化 HR 平台。
- **国际厂商有“能力强、落地需复核”的特征**：UKG 与 BambooHR 具备较强产品成熟度，但中国本地化交付、合规与生态联动仍需单独验证。

---

## 五、commission / partner terms 的 confidence 处理

### 5.1 本榜单不直接确认佣金或渠道条款

当前 CSV 的公开字段主要证明的是：

- 产品能力是否存在
- 厂商是否具备某类客户/行业适配度
- 市场可见度是否足以支撑其进入长名单

**这些证据并不等于**以下商业事实已经被确认：

- 厂商是否开放代理 / 渠道合作
- 是否存在标准化 Partner Program
- 佣金比例、返点阶梯、注册保护期、联合交付分成等是否公开可得

### 5.2 佣金/合作条款的代理性判断（proxy indicators）

当缺少明确的 partner terms 时，本报告只允许做**低到中等置信度的代理判断**，代理信号包括：

| 代理信号 | 可推断内容 | 不能直接推断的内容 |
|---|---|---|
| 厂商有官方站点、公开解决方案与行业案例 | 厂商具备一定商业化成熟度 | 不代表已开放渠道分佣 |
| notes 中提到 implementation / deployment / integration | 可能存在顾问、实施、生态协作空间 | 不代表有标准佣金政策 |
| visibility_level 为 high | 市场认知较高，合作触达成本可能更低 | 不代表 partner terms 更透明 |
| 多个证据链接、日期较新 | 公开材料较完整，适合优先人工复核 | 不代表商业条款已核实 |

### 5.3 confidence 字段的实际含义

建议把当前 `confidence` 解释为**“对入榜与分类判断的证据强度”**，而不是“对佣金条款真实性的置信度”。在 commission / partner terms 场景下，可采用以下补充口径：

| 级别 | 对产品与分类判断 | 对 commission / partner terms 判断 |
|---|---|---|
| **H** | 官方与多源证据充分，分类判断较稳 | 仅当看到官方伙伴计划、条款页、申请页或明确商务说明时才可判为高 |
| **M** | 适合作为长名单筛选依据 | 只能视为“值得继续 BD 验证”，不可用于报价或收益预测 |
| **L** | 仅适合观察或补充线索 | 不能用于任何合作收益判断 |

**当前样本全部为 M**，因此本报告的商业结论是：

> 这些厂商可以进入合作优先级筛选池，但**任何 commission、返点或 partner terms 都需要后续通过官方伙伴页面、渠道经理回复或合同材料单独核验**。

---

## 六、推荐用法

### 6.1 若目标是做厂商长名单

优先从 **UKG、北森、红海云、i人事、金蝶 s-HR、用友大易** 开始，这些厂商在综合产品带宽或采购认知度上更适合进入第一轮比较池。

### 6.2 若目标是做场景匹配

- **Payroll / 合规**：UKG、红海云、金蝶 s-HR、宏景软件
- **WFM / 排班**：UKG、盖雅工场、喔趣科技、红海云
- **ATS / 招聘**：北森、i人事、用友大易、BambooHR
- **中大型一体化 HR 平台**：北森、红海云、金蝶 s-HR、UKG

### 6.3 若目标是做渠道或合作拓展

先按 `vendor_score + visibility_level + confidence` 排序决定优先联络顺序，但在进入商务阶段前，必须新增一层 **Partner Evidence Review**，专项核验：

1. 官方伙伴计划页
2. 是否存在代理申请入口
3. 是否有区域/行业渠道限制
4. 是否披露返佣或 referral 机制
5. 是否要求实施、售前或认证资源投入

---

## 附录

- 完整 CSV：[`OPC1-vendors-top100-hris-china-2026-04-18.csv`](OPC1-vendors-top100-hris-china-2026-04-18.csv)
- Matching table：[`OPC1-opportunity-matching-china-2026-04-18.csv`](OPC1-opportunity-matching-china-2026-04-18.csv)
- XLSX：当前工作区未发现同名 XLSX 附件；若后续补充，可在本附录追加链接。

