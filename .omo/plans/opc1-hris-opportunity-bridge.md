# OPC1 — HRIS 机会洞察与供需连接（中国）工作计划

## TL;DR

> **目标**：在中国 HRIS 领域，围绕“最近 3 个月”机会信号，构建 **~500 家目标公司机会需求清单**（按行业分层，含上市+头部民企）、**Top100 供应商画像与排序**（使用可得性代理指标）、并产出 **机会→供应商匹配表**（含报酬条款状态与外联动作包），同时给出 **可执行的自动盯盘机制** 与 **工具开发需求简要 PRD**。

**核心交付物（落到仓库 `Reports/`）**：
- 目标公司机会需求报告（Markdown）+ 目标公司表（约500行，CSV/Excel）
- 供应商 Top100 报告（Markdown）+ 附件数据表（CSV/Excel）
- 机会匹配总表（CSV/Excel）+ 报告内摘要表（Markdown）
- 盯盘/更新 SOP + 工具开发需求（Markdown）

**预计工作量**：Large
**并行执行**：YES（4 waves + Final）
**关键路径**：Schema/标准 → 小样本验证 → 全量采集/去重 → 匹配与外联动作包 → 盯盘SOP/工具需求 → 汇总报告

---

## Context

### Original Request
见：`AITasks/OPC1.md`

### Interview Summary（已确认）
- 500 家目标公司：**按行业分层**（互联网/软件、先进制造、消费/零售、能源/化工、医药健康、物流/出行、金融）
- 机会信号：招聘信号、组织扩张、合规压力、技术替换、供应商事件、融资与战略
- 供应商 Top100：接受 **可得性代理指标**（融资/客户案例/媒体曝光/产品覆盖等）
- 外联：你希望“需要实际外联”，但执行方式为 **你来外联**（代理准备线索/脚本/跟进SOP；你/团队实际发信拨号并回填结果）
- 交付形式：报告摘要 + CSV/Excel 完整表
- 交付存放：`Reports/`

### Existing Repo Pattern
- 基础报告模板可复用：`Reports/OPC1-HRIS-Market-Opportunity-Analysis-China-2026.md`（含监控章节 6.x）

### Research Findings（sources to anchor data acquisition）
- Listed universe anchors (indices / exchange constituents):
  - CSI 300 factsheet: https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/en/000300factsheeten.pdf
  - CSI 500 factsheet: https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/zh_CN/000905factsheet.pdf
  - CSI A500 factsheet: https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/zh_CN/000510factsheet.pdf
  - SSE constituents (SSE 50): https://english.sse.com.cn/markets/indices/data/list/constituents/index.shtml?COMPANY_CODE=000016&INDEX_Code=000016
  - SZSE constituents hub: https://www.szse.cn/English/siteMarketData/indices/constituent/index.html
- Top private / mixed ranking anchors:
  - Fortune China 500: https://fortune.com/ranking/fortune-china-500/
  - Fortune China 500 (CN): https://www.fortunechina.com/rankings/c/2026-01/27/content_426840.htm
  - Hurun China 500: https://hurun.net/en-US/Rank/HsRankDetails?pagetype=ctop500
  - ACFIC private 500 (example official page): https://wap.acfic.org.cn/qlyw_13743/202410/t20241012_229498.html
- Vendor landscape anchors (public, mixed quality; must re-verify):
  - QYResearch cloud-based HR software: https://www.qyresearch.com.cn/reports/4015305/cloud-based-hr-software
  - Huaon HR software panorama: https://m.huaon.com/channel/software/1134924.html
  - Worktile vendor comparison roundup: https://worktile.com/kb/p/3960241
  - Sohu vendor roundup: https://www.sohu.com/a/997571260_120517583

---

## Work Objectives

### Core Objective
建立一套可复用的“机会洞察→供应商匹配→外联动作→滚动盯盘”的作业系统（以数据表 + 报告 + SOP 形式交付），覆盖最近 3 个月高价值 HRIS 机会，并可月度更新。

### Concrete Deliverables (files)
> 最终落在 `Reports/`，文件命名允许带日期。

1) `Reports/OPC1-demand-companies-500-china-<YYYY-MM-DD>.md`
2) `Reports/OPC1-demand-companies-500-china-<YYYY-MM-DD>.csv` + `xlsx`
3) `Reports/OPC1-vendors-top100-hris-china-<YYYY-MM-DD>.md`
4) `Reports/OPC1-vendors-top100-hris-china-<YYYY-MM-DD>.csv` + `xlsx`
5) `Reports/OPC1-opportunity-matching-china-<YYYY-MM-DD>.csv` + `xlsx`
6) `Reports/OPC1-monitoring-and-tooling-brief-<YYYY-MM-DD>.md`

### Definition of Done
- [ ] 目标公司机会表：行数满足计划规则（目标 500），每行满足字段完备度与证据阈值
- [ ] 供应商 Top100：恰好 100 条，评分可复算，证据链齐全
- [ ] 匹配表：覆盖“纳入的机会集合”（全量或优先级子集，计划中明确），每行含匹配理由与外联动作包引用
- [ ] 盯盘/工具需求：可执行 SOP + 明确 MVP 工具需求（输入/输出/数据源/成本风险）

### Must NOT Have (guardrails)
- 不承诺代理自动拨号/发信；外联执行由你/团队完成
- 不把“自动盯盘”扩展成生产级爬虫平台（本次仅输出 SOP + 工具需求 + 可实现的 MVP 方案）
- 不把 Top100 做成“泛 HR 软件排行榜”（必须与 HRIS 机会匹配、合作/交付能力相关）
- 对佣金/报酬：没有公开证据的一律标注 `needs_confirmation`，不编造数值

---

## Verification Strategy (schema-first / TDD-style gates)

### Test Decision (Default)
- **Automated tests**：默认采用“数据校验脚本/规则（tests-after）+ 任务 QA 场景”，而非传统单元测试
- **Why**：交付物主要是报告与数据表，核心风险在于字段缺失、证据不足、去重错误、时间窗口漂移

### Global QA Policy
- 每个任务必须产出 `.sisyphus/evidence/` 下的证据文件（如：校验输出、抽样核对截图、统计汇总表）
- 所有“最近 3 个月”判断必须冻结一个 `AS_OF_DATE`，并在证据中记录

---

## Execution Strategy

### Parallel Execution Waves (overview)

Wave 1 — Foundations (schema, scoring, pilot gates):
- T1 Opportunity taxonomy + inclusion/evidence standards
- T2 Table schemas (company, vendor, opportunity, match, monitoring)
- T3 Scoring rubrics (opportunity + vendor + match)
- T4 Pilot sample (10 companies / 10 vendors / 10 matches) + validation gates
- T5 Repo output structure + naming conventions (Reports/*) + evidence convention

Wave 2 — Build universes (company pool + vendor pool) in parallel:
- T6 Listed-company base pool (indices/exchange constituents)
- T7 Top private-company pool (Fortune/Hurun/ACFIC)
- T8 Demand-side opportunity signal harvesting (last 3 months) + confidence tagging
- T9 Vendor candidate pool expansion (>=30 deep + scale to 100) + evidence capture
- T10 Vendor taxonomy tagging (HRIS/Payroll/WFM/ATS/Services/etc.)

Wave 3 — Matching + outreach pack + reports:
- T11 Opportunity→vendor matching logic + rationale templates
- T12 Opportunity matching master table (CSV/XLSX) + report summary tables
- T13 Outreach action pack (email/call/IM scripts + questionnaire + tracking SOP)
- T14 Draft demand report (MD) using existing report pattern
- T15 Draft vendor top100 report (MD) using existing report pattern

Wave 4 — Monitoring + tooling brief + stabilization:
- T16 Monitoring SOP (sources, cadence, queries, dedupe, escalation)
- T17 Tooling PRD (MVP) + options comparison (RSS/alerts/CRM import)
- T18 Data quality hardening (dedupe, conflict resolution, freshness drift)
- T19 Final packaging (links, appendix, change log template)

Final Verification Wave (parallel reviews):
- F1 Compliance & scope audit
- F2 Data QA audit (schema completeness + duplicates + freshness)
- F3 Report QA (readability + evidence traceability)
- F4 Operating-playbook QA (can someone run monthly update without you?)

---

## TODOs

- [x] 1. Define opportunity taxonomy + inclusion/exclusion + evidence threshold

  **What to do**:
  - Define “Opportunity” operationally for OPC1 (positive criteria + explicit exclusions).
  - Define signal taxonomy: hiring / expansion / compliance / replacement / vendor events / funding-strategy.
  - Define confidence levels (H/M/L) and minimum evidence threshold (e.g., ≥1 primary public source OR ≥2 independent secondary sources).
  - Freeze `AS_OF_DATE` rule (set once per run) and compute “last 3 months” window.

  **Must NOT do**:
  - Don’t treat generic hiring growth alone as HRIS opportunity.
  - Don’t convert paywalled claims into confirmed facts.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: definitions determine downstream quality and false-positive rate.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 2–5)
  - **Blocks**: 4, 8, 11–15
  - **Blocked By**: None

  **References**:
  - `AITasks/OPC1.md` — required outputs and time-window.
  - `Reports/OPC1-HRIS-Market-Opportunity-Analysis-China-2026.md` — section 3.x signal methodology pattern.

  **Acceptance Criteria**:
  - [ ] A taxonomy section exists with: criteria, exclusions, evidence threshold, confidence levels, `AS_OF_DATE`.
  - [ ] Includes ≥5 positive examples + ≥5 negative examples, each with cited URL + publication date.

  **QA Scenarios**:
  ```
  Scenario: Taxonomy completeness check
    Tool: Bash
    Steps:
      1. Open the taxonomy section in the drafted brief/report.
      2. Verify it includes: criteria, exclusions, evidence threshold, confidence, AS_OF_DATE.
    Expected Result: All subsections present.
    Evidence: .sisyphus/evidence/task-1-taxonomy-check.txt

  Scenario: Paywalled-source policy check
    Tool: Bash
    Steps:
      1. Pick 3 entries whose best source is paywalled.
      2. Verify they are marked `paywalled` and confidence is not “H”.
    Expected Result: No paywalled-only entry is treated as confirmed.
    Evidence: .sisyphus/evidence/task-1-paywall-policy.txt
  ```

- [x] 2. Define table schemas + validation rules (company/vendor/opportunity/match/monitor)

  **What to do**:
  - Define canonical schemas for:
    - Company master
    - Opportunity table
    - Vendor table
    - Match table
    - Monitoring spec table
  - Define entity resolution / dedupe keys and alias rules.
  - Define required vs optional columns; define allowed values (enums).

  **Must NOT do**:
  - Don’t allow free-text for key status fields (term_status, confidence).

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: structured specification work.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1 (with Tasks 1,3–5)
  - **Blocks**: 4, 6–12, 16–18
  - **Blocked By**: None

  **References**:
  - Deliverables list in this plan (required outputs).
  - Existing report tables style: `Reports/OPC1-HRIS-Market-Opportunity-Analysis-China-2026.md`

  **Acceptance Criteria**:
  - [ ] Schemas are documented with explicit columns, types, required/optional, and allowed values.
  - [ ] term_status enum includes: publicly_confirmed / indirectly_inferred / needs_confirmation / not_disclosed.

  **QA Scenarios**:
  ```
  Scenario: Schema review gate
    Tool: Bash
    Steps:
      1. Check each of the 5 tables has required/optional columns and allowed values.
      2. Check dedupe keys are defined.
    Expected Result: No schema left underspecified.
    Evidence: .sisyphus/evidence/task-2-schema-review.txt
  ```

- [x] 3. Define scoring rubrics (opportunity score + vendor score + match score)

  **What to do**:
  - Opportunity scoring: weight signals + freshness + evidence confidence.
  - Vendor scoring: separate “capability” vs “visibility”; include evidence confidence.
  - Match scoring: fit by industry/size/module + delivery feasibility + partner term status.
  - Document formulas so they are reproducible from table fields.

  **Must NOT do**:
  - Don’t let media exposure dominate capability.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: ranking and matching depend on it.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 9–12, 15
  - **Blocked By**: 2 (needs schema fields)

  **References**:
  - Metis guidance (separate visibility vs capability; reproducible scoring).

  **Acceptance Criteria**:
  - [ ] Rubrics documented with explicit weights and input fields.
  - [ ] Worked example: 3 opportunities + 3 vendors + 3 matches with computed scores.

  **QA Scenarios**:
  ```
  Scenario: Scoring reproducibility
    Tool: Bash
    Steps:
      1. Take the worked examples.
      2. Recompute manually from the documented formula.
    Expected Result: Scores match exactly.
    Evidence: .sisyphus/evidence/task-3-scoring-repro.txt
  ```

- [x] 4. Pilot sample gate (10 companies / 10 vendors / 10 matches)

  **What to do**:
  - Create a pilot dataset using the defined schemas (not full scale):
    - 10 companies across multiple industries
    - 10 vendors across categories
    - 10 match rows with rationales and term_status
  - Run dedupe + freshness + field completeness checks.
  - Adjust taxonomy/schema/rubrics if the pilot exposes issues.

  **Must NOT do**:
  - Don’t start full 500/100 collection before pilot passes.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: involves multi-source evidence capture + validation.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 1 (integration gate)
  - **Blocks**: 6–15
  - **Blocked By**: 1–3

  **References**:
  - Source anchors in Context section.

  **Acceptance Criteria**:
  - [ ] Pilot CSV exists and conforms to schema.
  - [ ] Pilot entries all within last-3-month window relative to recorded AS_OF_DATE (or explicitly marked as “control examples”).

  **QA Scenarios**:
  ```
  Scenario: Pilot validation
    Tool: Bash
    Steps:
      1. Count rows: companies=10, vendors=10, matches=10.
      2. Verify required columns are non-empty.
      3. Verify each row has ≥1 evidence URL.
    Expected Result: All checks pass.
    Evidence: .sisyphus/evidence/task-4-pilot-validation.txt
  ```

- [x] 5. Set up output structure + naming + evidence conventions

  **What to do**:
  - Confirm all final outputs live under `Reports/`.
  - Define a small, consistent directory convention (e.g., `Reports/OPC1/` optional) and a changelog pattern.
  - Define evidence naming under `.sisyphus/evidence/` (task-scoped).
  - Define CSV/XLSX export rules (UTF-8, column order matches schema, date formats).

  **Must NOT do**:
  - Don’t change existing report file; use it as a style/pattern reference.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 1
  - **Blocks**: 14–15, 19
  - **Blocked By**: 2

  **References**:
  - Existing report template: `Reports/OPC1-HRIS-Market-Opportunity-Analysis-China-2026.md`

  **Acceptance Criteria**:
  - [ ] A “Outputs & Naming” section exists in `Reports/OPC1-monitoring-and-tooling-brief-<date>.md`.

  **QA Scenarios**:
  ```
  Scenario: Naming convention check
    Tool: Bash
    Steps:
      1. List planned output filenames.
      2. Verify they match the schema and include date.
    Expected Result: All outputs follow a single convention.
    Evidence: .sisyphus/evidence/task-5-naming-check.txt
  ```

- [x] 6. Build listed-company base pool (indices/exchange constituents)

  **What to do**:
  - Use CSI/SSE/SZSE public constituent lists as the listed-company backbone.
  - Normalize company names (CN), ticker, exchange, and a consistent industry bucket mapping.
  - Deduplicate across overlapping indices.

  **Must NOT do**:
  - Don’t exceed 500 just by dumping all constituents; this is a candidate pool to be stratified.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: multi-source extraction + normalization + dedupe.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Tasks 7–10)
  - **Blocks**: 8, 12, 14
  - **Blocked By**: 2, 4

  **References**:
  - CSI 300 factsheet: https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/en/000300factsheeten.pdf
  - CSI 500 factsheet: https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/zh_CN/000905factsheet.pdf
  - CSI A500 factsheet: https://oss-ch.csindex.com.cn/static/html/csindex/public/uploads/indices/detail/files/zh_CN/000510factsheet.pdf
  - SSE constituents: https://english.sse.com.cn/markets/indices/data/list/constituents/index.shtml?COMPANY_CODE=000016&INDEX_Code=000016
  - SZSE constituents hub: https://www.szse.cn/English/siteMarketData/indices/constituent/index.html

  **Acceptance Criteria**:
  - [ ] A listed-company master CSV/XLSX is produced with required columns + sources per row.
  - [ ] Evidence includes row counts pre/post dedupe.

  **QA Scenarios**:
  ```
  Scenario: Dedupe sanity
    Tool: Bash
    Steps:
      1. Count raw rows from each source.
      2. Count deduped rows.
      3. Spot-check 10 duplicates were merged correctly (ticker match).
    Expected Result: Dedupe reduces overlaps without losing unique tickers.
    Evidence: .sisyphus/evidence/task-6-listed-dedupe.txt
  ```

- [x] 7. Build top private-company pool (Fortune/Hurun/ACFIC) + integrate with listed pool

  **What to do**:
  - Extract top private/mixed rankings and normalize names + industry buckets.
  - Merge with listed pool, keeping provenance and resolving conflicts (listed vs private).
  - Define stratification quotas across the 7 industries to reach ~500 targets.

  **Must NOT do**:
  - Don’t silently drop conflicts; record conflict resolution rule and evidence.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 8, 12, 14
  - **Blocked By**: 2, 4

  **References**:
  - Fortune China 500: https://fortune.com/ranking/fortune-china-500/
  - Hurun China 500: https://hurun.net/en-US/Rank/HsRankDetails?pagetype=ctop500
  - ACFIC private 500 example page: https://wap.acfic.org.cn/qlyw_13743/202410/t20241012_229498.html

  **Acceptance Criteria**:
  - [ ] A merged company universe is produced with: listed/private flag, industry bucket, source provenance, and dedupe key.
  - [ ] Stratification rule/quotas are documented and verifiable.

  **QA Scenarios**:
  ```
  Scenario: Stratification quota check
    Tool: Bash
    Steps:
      1. Generate a count-by-industry summary.
      2. Compare counts to documented quotas.
    Expected Result: Counts match quotas (or deviations explicitly justified).
    Evidence: .sisyphus/evidence/task-7-stratification-check.txt
  ```

- [x] 8. Harvest demand-side opportunity signals (last 3 months) for the 500-company set

  **What to do**:
  - For each target company (or prioritized subset if defined), collect last-3-month signals aligned to taxonomy.
  - Capture evidence URLs + publication dates + short evidence snippets.
  - Assign confidence and compute opportunity score.

  **Must NOT do**:
  - Don’t include signals outside the time window unless explicitly marked as context.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: high judgment, evidence quality, and time-window discipline.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 11–12, 14
  - **Blocked By**: 1–4, 7

  **References**:
  - Signal channels in existing report section 3.0 and 6.x.

  **Acceptance Criteria**:
  - [ ] Target company table contains ~500 companies as per stratification rule (goal: exactly 500 target companies).
  - [ ] Each target company row has at least one **universe evidence** source (index/ranking inclusion URL) + date.
  - [ ] Opportunity signals (if any) are recorded with: signal_type, signal_date, evidence_url(s), confidence, and summarized in the company table (or maintained as a linked signal list, per schema).

  **QA Scenarios**:
  ```
  Scenario: Target-company count audit
    Tool: Bash
    Steps:
      1. Count target company rows.
      2. Verify count == 500 (or matches the documented tolerance if explicitly set).
    Expected Result: Target list meets the planned size.
    Evidence: .sisyphus/evidence/task-8-target-count.txt

  Scenario: Freshness window audit (signals)
    Tool: Bash
    Steps:
      1. Sample 30 signal entries (where signal_date exists).
      2. Verify signal_date within [AS_OF_DATE-90d, AS_OF_DATE].
    Expected Result: 100% pass; any exceptions explicitly flagged.
    Evidence: .sisyphus/evidence/task-8-freshness-audit.txt
  ```

- [x] 9. Build vendor candidate pool (>=30 deep profiles → scale to Top100)

  **What to do**:
  - Start with ≥30 vendors for deep profiling (modules, target segment, delivery model, evidence links).
  - Expand to 100 vendors using proxy/availability indicators:
    - funding/public status, customer-case count, media visibility, module coverage, ecosystem/partners.
  - For each vendor, capture evidence URLs + dates + confidence.

  **Must NOT do**:
  - Don’t rank without evidence; low-evidence entries must be low confidence.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: large-scale structured research and evidence logging.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 10, 12, 15
  - **Blocked By**: 2–4

  **References**:
  - Existing report vendor analysis pattern: `Reports/OPC1-HRIS-Market-Opportunity-Analysis-China-2026.md` section 2.x.
  - Vendor landscape anchors (must re-verify):
    - https://www.qyresearch.com.cn/reports/4015305/cloud-based-hr-software
    - https://m.huaon.com/channel/software/1134924.html
    - https://worktile.com/kb/p/3960241
    - https://www.sohu.com/a/997571260_120517583

  **Acceptance Criteria**:
  - [ ] Vendor dataset contains exactly 100 rows for Top100 (plus optional “longlist” if needed).
  - [ ] Each Top100 row has: taxonomy tags, proxy fields populated, evidence URL(s), evidence date, confidence.

  **QA Scenarios**:
  ```
  Scenario: Top100 completeness check
    Tool: Bash
    Steps:
      1. Count vendor rows = 100.
      2. Sample 20 rows to ensure evidence_url and taxonomy tags non-empty.
    Expected Result: Row count correct; required fields present.
    Evidence: .sisyphus/evidence/task-9-top100-completeness.txt
  ```

- [x] 10. Tag vendors with taxonomy (HRIS/Payroll/WFM/ATS/Services/etc.) + segment fit

  **What to do**:
  - Apply a consistent taxonomy to each vendor (multi-tag allowed).
  - Label vendor type: software / service provider / hybrid.
  - Label target segment fit: SMB / mid-market / enterprise-group; plus industry strengths if evidenced.

  **Recommended Agent Profile**:
  - **Category**: `quick`
    - Reason: deterministic tagging once vendor facts are collected.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2
  - **Blocks**: 11–12, 15
  - **Blocked By**: 9

  **Acceptance Criteria**:
  - [ ] 100/100 vendors have taxonomy tags and vendor_type.

  **QA Scenarios**:
  ```
  Scenario: Tag coverage check
    Tool: Bash
    Steps:
      1. Compute % of rows with empty taxonomy tags.
    Expected Result: 0% empty.
    Evidence: .sisyphus/evidence/task-10-tag-coverage.txt
  ```

- [x] 11. Define matching logic + rationale templates (opportunity → vendor shortlist)

  **What to do**:
  - For each opportunity, produce a vendor shortlist (e.g., top 3–5) based on:
    industry bucket, company size proxy, required modules, deployment constraints, and vendor segment fit.
  - Define rationale template fields so they read consistently.
  - Define term_status handling: publicly_confirmed / indirectly_inferred / needs_confirmation / not_disclosed.

  **Must NOT do**:
  - Don’t claim commission terms without evidence.

  **Recommended Agent Profile**:
  - **Category**: `deep`
    - Reason: requires judgment + consistent rationale quality.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 12–15
  - **Blocked By**: 3, 8–10

  **Acceptance Criteria**:
  - [ ] A written matching rule + rationale template exists.
  - [ ] At least 10 sample matches include vendor shortlist + rationale + fit_confidence.

  **QA Scenarios**:
  ```
  Scenario: Rationale quality check
    Tool: Bash
    Steps:
      1. Review 10 sample matches.
      2. Verify rationale references concrete vendor capabilities and evidence links.
    Expected Result: No generic “best vendor” statements; evidence-backed.
    Evidence: .sisyphus/evidence/task-11-rationale-sample.txt
  ```

- [x] 12. Produce opportunity matching master table (CSV/XLSX) + report summary tables

  **What to do**:
  - Generate `Reports/OPC1-opportunity-matching-china-<date>.csv/xlsx`.
  - Include fields: opportunity_id, company, signal, signal_date, score, vendor_shortlist, rationale, fit_confidence, term_status, term_evidence_url, outreach_owner, next_step.
  - Produce a Markdown summary table for the report (top N opportunities).

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 13–15, 19
  - **Blocked By**: 8–11

  **Acceptance Criteria**:
  - [ ] Matching table exists and passes schema validation (required columns populated).
  - [ ] Every row’s vendor_shortlist references vendor IDs existing in the Top100 dataset.

  **QA Scenarios**:
  ```
  Scenario: Referential integrity check
    Tool: Bash
    Steps:
      1. Sample 30 match rows.
      2. Verify each vendor in shortlist exists in vendor table.
    Expected Result: 0 broken references.
    Evidence: .sisyphus/evidence/task-12-ref-integrity.txt
  ```

- [x] 13. Create outreach action pack (scripts + questionnaire + tracking SOP)

  **What to do**:
  - Prepare outreach assets for two directions:
    1) To vendors/partners: confirm referral/commission/partner terms + onboarding steps
    2) To target companies: validate HRIS demand and buying window
  - Include:
    - Cold email template
    - Call script
    - Short IM/WeChat/LinkedIn intro
    - “Commission/terms confirmation” questionnaire
    - Tracking SOP: statuses, follow-up cadence, how to backfill into the matching table

  **Must NOT do**:
  - Don’t actually send emails/calls as the agent; user/team executes outreach.

  **Recommended Agent Profile**:
  - **Category**: `writing`
    - Reason: script quality and clarity matters.
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 19
  - **Blocked By**: 11–12

  **References**:
  - Existing report’s “连接建议与行动计划” section as tone reference.

  **Acceptance Criteria**:
  - [ ] Action pack exists inside `Reports/OPC1-monitoring-and-tooling-brief-<date>.md` (or a dedicated appendix section).
  - [ ] Includes at least 1 template per channel + a questionnaire with concrete questions.

  **QA Scenarios**:
  ```
  Scenario: Script pack completeness
    Tool: Bash
    Steps:
      1. Verify all required script types exist.
      2. Verify questionnaire includes term_status mapping and evidence capture instructions.
    Expected Result: Pack is directly usable for human outreach.
    Evidence: .sisyphus/evidence/task-13-script-pack-check.txt
  ```

- [x] 14. Draft demand opportunities report (MD) using existing report pattern

  **What to do**:
  - Produce `Reports/OPC1-demand-companies-500-china-<date>.md`.
  - Must include:
    - methodology (taxonomy + evidence threshold)
    - industry stratification summary (counts)
    - top opportunities (ranked) with evidence and recommended vendor archetypes
    - appendix linking to full CSV/XLSX

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 19
  - **Blocked By**: 8, 12

  **References**:
  - `Reports/OPC1-HRIS-Market-Opportunity-Analysis-China-2026.md` — structure and table style.

  **Acceptance Criteria**:
  - [ ] Report exists in `Reports/` and links to the demand company CSV/XLSX.
  - [ ] Contains an industry count table and a “top N opportunities” table with evidence links.

  **QA Scenarios**:
  ```
  Scenario: Report-data linkage
    Tool: Bash
    Steps:
      1. Verify the report references the exact CSV/XLSX filenames.
      2. Verify top N entries exist in the CSV.
    Expected Result: No broken linkage between report and data.
    Evidence: .sisyphus/evidence/task-14-report-linkage.txt
  ```

- [x] 15. Draft vendor Top100 report (MD) using existing report pattern

  **What to do**:
  - Produce `Reports/OPC1-vendors-top100-hris-china-<date>.md`.
  - Must include:
    - taxonomy and tiering
    - scoring rubric summary
    - Top100 table (summary) + appendix link to full CSV/XLSX
    - explicit handling of commission/partner terms confidence

  **Recommended Agent Profile**:
  - **Category**: `writing`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3
  - **Blocks**: 19
  - **Blocked By**: 9–12

  **Acceptance Criteria**:
  - [ ] Report exists in `Reports/` and links to vendor CSV/XLSX.
  - [ ] Includes a section explaining proxy indicators and confidence.

  **QA Scenarios**:
  ```
  Scenario: Top100 reproducibility
    Tool: Bash
    Steps:
      1. Verify the report documents scoring fields.
      2. Spot-check 10 vendors have evidence URLs and confidence.
    Expected Result: Report claims match underlying data.
    Evidence: .sisyphus/evidence/task-15-top100-report-check.txt
  ```

- [x] 16. Write monitoring SOP (“auto watch” spec) for monthly updates

  **What to do**:
  - Reuse existing report’s 6.x structure, but make it executable:
    - source list (news, funding, vendor release notes, job postings)
    - cadence (weekly scan + monthly consolidation)
    - query logic per signal type
    - dedupe key rules
    - escalation rules (what becomes a “new opportunity”)
    - output schema (delta table)
  - Define how to compare “since last run” and what evidence to record.

  **Must NOT do**:
  - Don’t build a production crawler; this deliverable is SOP + spec.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Tasks 17–19)
  - **Blocks**: Final verification
  - **Blocked By**: 1–2

  **References**:
  - Existing monitoring pattern: `Reports/OPC1-HRIS-Market-Opportunity-Analysis-China-2026.md` section 6.x.

  **Acceptance Criteria**:
  - [ ] `Reports/OPC1-monitoring-and-tooling-brief-<date>.md` contains a monitoring SOP with concrete sources, cadence, and delta schema.

  **QA Scenarios**:
  ```
  Scenario: SOP executability check
    Tool: Bash
    Steps:
      1. Read SOP and confirm each signal type has: sources, query, cadence, output.
    Expected Result: No step requires implicit knowledge.
    Evidence: .sisyphus/evidence/task-16-sop-executability.txt
  ```

- [x] 17. Write tooling PRD (MVP) + options comparison

  **What to do**:
  - Define MVP tool requirements to support:
    - ingest sources / store evidence
    - track opportunities, matches, outreach status
    - generate deltas since last run
    - export CSV/XLSX
  - Compare 2–3 options (lightweight):
    - Obsidian + tables
    - Spreadsheet + scripts
    - Simple DB + scheduled job
  - Include cost/risk/maintenance notes.

  **Recommended Agent Profile**:
  - **Category**: `deep`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Final verification
  - **Blocked By**: 2, 16

  **Acceptance Criteria**:
  - [ ] Tooling PRD includes: inputs/outputs, user roles, data model, MVP scope, non-goals, and implementation notes.

  **QA Scenarios**:
  ```
  Scenario: PRD completeness
    Tool: Bash
    Steps:
      1. Verify PRD contains: MVP scope, non-goals, data model, update workflow.
    Expected Result: PRD is implementable by an engineering agent.
    Evidence: .sisyphus/evidence/task-17-prd-check.txt
  ```

- [x] 18. Data quality hardening (dedupe, conflict resolution, time-window drift)

  **What to do**:
  - Define conflict-resolution rules (prefer newer primary source; retain both with notes when unresolved).
  - Define parent/subsidiary handling and multiple opportunities per company.
  - Define stale/repost detection rule (prefer original publication date).
  - Define paywalled handling and confidence downgrades.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Final verification
  - **Blocked By**: 1–4

  **Acceptance Criteria**:
  - [ ] A “Data Quality Rules” appendix exists and is applied consistently across outputs.

  **QA Scenarios**:
  ```
  Scenario: Conflict rule spot-check
    Tool: Bash
    Steps:
      1. Identify 5 conflicting entries (name/ticker/status).
      2. Verify the documented rule was applied and both sources preserved.
    Expected Result: Conflicts resolved consistently.
    Evidence: .sisyphus/evidence/task-18-conflict-spotcheck.txt
  ```

- [x] 19. Final packaging: cross-links, appendices, and change-log template

  **What to do**:
  - Ensure reports cross-link to their CSV/XLSX and matching table.
  - Add an appendix: field dictionary + confidence/term_status legend.
  - Add a “since last run” change-log template for monthly updates.

  **Recommended Agent Profile**:
  - **Category**: `quick`
  - **Skills**: none

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4
  - **Blocks**: Final verification
  - **Blocked By**: 14–18

  **Acceptance Criteria**:
  - [ ] All deliverables exist in `Reports/` with working cross-links.
  - [ ] A change-log template exists for the next update cycle.

  **QA Scenarios**:
  ```
  Scenario: Link integrity check
    Tool: Bash
    Steps:
      1. Verify all referenced filenames exist.
      2. Verify the reports mention AS_OF_DATE and the 3-month window.
    Expected Result: No missing references.
    Evidence: .sisyphus/evidence/task-19-link-integrity.txt
  ```

---

## Final Verification Wave

> 4 个审查任务并行执行，全部通过才算完成。

- [x] F1. Scope & guardrail compliance audit

  **Acceptance Criteria**:
  - [x] Written audit result: PASS/FAIL with file pointers.

- [x] F2. Data QA audit (schema completeness + duplicates + freshness)

  **Acceptance Criteria**:
  - [x] Data QA report generated with PASS/FAIL and metrics.

- [x] F3. Report QA (readability + evidence traceability)

  **Acceptance Criteria**:
  - [x] Report QA verdict with a list of required edits (if any).

- [x] F4. Operating playbook QA (monthly update dry run)

  **Acceptance Criteria**:
  - [x] A dry-run output exists (even if small) demonstrating the SOP produces a delta.

  **QA Scenarios**:
  ```
  Scenario: SOP dry-run evidence
    Tool: Bash
    Steps:
      1. Verify the dry-run produced a delta table artifact.
      2. Verify it references the previous run outputs.
    Expected Result: Monthly workflow is actionable.
    Evidence: .sisyphus/evidence/final-f4-sop-dryrun.txt
  ```

---

## Commit Strategy

> 如果该仓库未来接入 git：每个“规划模块 + 校验规则”一个原子提交。

- `plan(opc1): define opportunity taxonomy and evidence standards`
- `plan(opc1): define schemas and validation gates`
- `plan(opc1): define scoring rubrics (company/vendor/match)`
- `plan(opc1): pilot sample + QA scenarios`
- `plan(opc1): company universe acquisition plan`
- `plan(opc1): vendor top100 acquisition plan`
- `plan(opc1): matching + outreach pack spec`
- `plan(opc1): monitoring SOP + tooling PRD`

---

## Success Criteria

- 交付物全部落在 `Reports/`，且可追溯（每个关键结论/条目都有来源链接与日期）
- 不确定信息显式标注（confidence / needs_confirmation / paywalled）
- “最近 3 个月”窗口可复现（记录 AS_OF_DATE 与窗口起止）
