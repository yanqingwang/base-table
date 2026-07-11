# OPC1 — Monitoring & Tooling Brief

**报告日期：2026年04月18日**

---

## 1. Purpose

This brief defines the canonical schemas and validation rules for OPC1 exports so CSV/XLSX QA can run deterministically.
It is the schema contract for:

- company master
- opportunity table
- vendor table
- match table
- monitoring spec table

### 1.1 Global rules

- All exports must use UTF-8.
- Date format: `YYYY-MM-DD`.
- Datetime format: `YYYY-MM-DDTHH:MM:SSZ`.
- Column order is fixed and must match the schema order below.
- Do not add ad hoc columns without a schema revision.
- All `*_id` fields are stable, opaque, and unique.

### 1.2 Shared enums

| Field | Allowed values |
|---|---|
| `confidence` | `H`, `M`, `L` |
| `term_status` | `publicly_confirmed`, `indirectly_inferred`, `needs_confirmation`, `not_disclosed` |
| `company_market_status` | `listed`, `private`, `mixed`, `unknown` |
| `vendor_type` | `software`, `service`, `hybrid`, `unknown` |
| `signal_type` | `hiring`, `expansion`, `compliance`, `replacement`, `vendor_event`, `funding_strategy` |
| `source_type` | `official_site`, `news`, `job_board`, `regulatory`, `social`, `report`, `database`, `other` |
| `contact_method` | `email`, `phone`, `wechat`, `linkedin`, `website_form`, `other` |
| `match_type` | `direct`, `adjacent`, `ecosystem`, `alternative` |
| `match_status` | `pending`, `ready_to_contact`, `contacted`, `confirmed`, `rejected`, `closed` |
| `next_action` | `identify_contact`, `send_email`, `call`, `wechat_followup`, `request_terms`, `monitor`, `close` |
| `monitor_domain` | `demand`, `vendor`, `funding`, `policy`, `product`, `job_board`, `company_site`, `social`, `other` |
| `monitor_cadence` | `daily`, `weekly`, `biweekly`, `monthly` |
| `monitor_action` | `create_opportunity`, `update_opportunity`, `update_vendor`, `update_match`, `escalate`, `ignore` |
| `employee_band` | `smb`, `mid_market`, `enterprise_group`, `unknown` |
| `visibility_level` | `high`, `medium`, `low`, `unknown` |
| `delivery_feasibility` | `high`, `medium`, `low`, `blocked` |

---


### 1.3 Outputs & Naming

All final OPC1 deliverables live under `Reports/`; task-scoped evidence remains under `.sisyphus/evidence/`.

| Artifact | Canonical filename pattern | Notes |
|---|---|---|
| Demand report | `Reports/OPC1-demand-companies-500-china-<YYYY-MM-DD>.md` | Human-readable company-universe report |
| Demand table | `Reports/OPC1-demand-companies-500-china-<YYYY-MM-DD>.csv` / `.xlsx` | Same basename; XLSX must mirror CSV exactly |
| Vendor report | `Reports/OPC1-vendors-top100-hris-china-<YYYY-MM-DD>.md` | Human-readable vendor Top100 report |
| Vendor table | `Reports/OPC1-vendors-top100-hris-china-<YYYY-MM-DD>.csv` / `.xlsx` | Same basename; column order stays schema-ordered |
| Matching table | `Reports/OPC1-opportunity-matching-china-<YYYY-MM-DD>.csv` / `.xlsx` | Canonical Task 4+ basename for the opportunity→vendor connection table; keep the legacy `OPC1-opportunity-table-china-<date>` family only as a backward-compatibility alias where older scripts still expect it |
| Monitoring brief | `Reports/OPC1-monitoring-and-tooling-brief-<YYYY-MM-DD>.md` | Canonical schema / SOP contract |
| Delta summary | `Reports/OPC1-monitor-delta-summary-<YYYY-MM-DD>.md` | Since-last-run summary |
| Delta tables | `Reports/OPC1-monitor-delta-companies-<YYYY-MM-DD>.csv` / `Reports/OPC1-monitor-delta-vendors-<YYYY-MM-DD>.csv` | Added / removed rows only |

#### 1.3.1 Filename rules

- Use exactly one run date token: `<YYYY-MM-DD>`.
- Keep the `Reports/` prefix on every deliverable path.
- Keep CSV/XLSX basenames identical; only the file extension changes.
- Do not invent undated output names for final artifacts.
- Keep the legacy monitor delta family (`OPC1-monitor-delta-*`) for all since-last-run outputs.

#### 1.3.2 Evidence artifact naming

- Task-scoped evidence stays under `.sisyphus/evidence/`.
- Canonical pattern: `.sisyphus/evidence/task-5-<slug>.<ext>`.
- Primary naming check artifact for this task: `.sisyphus/evidence/task-5-naming-check.txt`.
- Failure logs use the same slug with `-error` appended, for example `.sisyphus/evidence/task-5-naming-check-error.txt`.
- Keep evidence filenames short, descriptive, and tied to a single task.

#### 1.3.3 CSV/XLSX export rules

- Export text as UTF-8.
- Preserve the schema column order exactly; CSV and XLSX must match each other and the schema definition.
- Dates use `YYYY-MM-DD`.
- UTC datetimes use `YYYY-MM-DDTHH:MM:SSZ`.
- Stable IDs remain opaque and must not be regenerated differently between CSV and XLSX for the same run.
- Do not add ad hoc columns or formulas unless the schema is revised first.
- Treat XLSX as a faithful tabular mirror of CSV, not a presentation rewrite.

#### 1.3.4 Since-last-run / changelog template

Use the same block structure for each monthly update, whether embedded in the delta summary or archived separately:

```md
## Since Last Run (<old RUN_DATE> → <new RUN_DATE>)
- Baseline snapshot: `Reports/<previous dated file>`
- Current snapshot: `Reports/<current dated file>`
- Companies added: N
- Companies removed: N
- Vendors added: N
- Vendors removed: N
- Matching changes: N added / N removed / N updated
- Notes: short explanation of the biggest deltas
```

### 14.4 Delivered artifact links

- Demand report: [`OPC1-demand-companies-500-china-2026-04-18.md`](OPC1-demand-companies-500-china-2026-04-18.md) → [`CSV`](OPC1-demand-companies-500-china-2026-04-18.csv)
- Vendor report: [`OPC1-vendors-top100-hris-china-2026-04-18.md`](OPC1-vendors-top100-hris-china-2026-04-18.md) → [`CSV`](OPC1-vendors-top100-hris-china-2026-04-18.csv)
- Matching table: [`OPC1-opportunity-matching-china-2026-04-18.csv`](OPC1-opportunity-matching-china-2026-04-18.csv)

### 1.4 Opportunity taxonomy and evidence standard (Task 1)

This section operationalizes Task 1 from `.sisyphus/plans/opc1-hris-opportunity-bridge.md` and is the gating methodology for all future OPC1 opportunity rows.

#### 1.4.1 Frozen `AS_OF_DATE` and exact last-3-month window logic

- `AS_OF_DATE` for this run is fixed at `2026-04-18` and must not change within the same run.
- The canonical OPC1 freshness window is an **inclusive 90-day lookback**: `signal_date >= AS_OF_DATE - 89 days` and `signal_date <= AS_OF_DATE`.
- For this report run, the exact eligible window is **`2026-01-19` through `2026-04-18` inclusive**.
- If a source page is updated later than the underlying event, use the **original publication / announcement date** as `signal_date` when recoverable; otherwise treat the entry as lower-confidence context.
- Items outside this frozen window may be cited as background context, but they must **not** be counted as current OPC1 opportunities.

#### 1.4.2 What counts as an `opportunity`

An OPC1 `opportunity` exists only when a public signal indicates a plausible, near-term HRIS / HCM / ATS / payroll / WFM / compliance workflow need that a vendor or service provider could act on.

A row qualifies only if **all** of the following are true:

1. The signal maps to one of the closed `signal_type` values: `hiring`, `expansion`, `compliance`, `replacement`, `vendor_event`, `funding_strategy`.
2. The signal is specific enough to imply an actionable HR systems need, not just general corporate activity.
3. The evidence is public, linkable, dated, and within the frozen window (or explicitly marked as background only).
4. The evidence supports either a direct demand hypothesis or a direct vendor/channel hypothesis that can later be matched.
5. The entry can be assigned a schema-compatible `confidence` value (`H`, `M`, or `L`).

#### 1.4.3 Explicit exclusions

The following do **not** count as OPC1 opportunities by themselves:

- Generic headcount growth or general recruiting news without HR systems specificity.
- Company size, ranking, or index membership alone (for example Fortune / Hurun / CSI / ACFIC inclusion).
- Vendor ranking articles or market roundups that describe products but do not show a specific buyer-side signal.
- Undated pages, reposts, or pages where the original event date cannot be established.
- Paywalled-only claims without accessible corroboration.
- Broad digital-transformation language with no HR, payroll, workforce, labor-compliance, or employee-lifecycle implication.
- Old case studies or news outside the frozen 90-day window, unless clearly marked as non-scoring context.

**Hard guardrail:** generic hiring growth alone is **not** an HRIS opportunity.

#### 1.4.4 `signal_type` taxonomy

| `signal_type` | Operational definition | Included when | Exclude when |
|---|---|---|---|
| `hiring` | Public hiring signal that explicitly implies HR systems, recruiting ops, payroll ops, workforce scheduling, HR shared services, or HR data infrastructure demand | Role names, workflow descriptions, or tooling scope clearly indicate HRIS / ATS / payroll / WFM work | The page only shows generic company recruiting, non-HR roles, or undifferentiated headcount expansion |
| `expansion` | New factories, stores, regions, overseas entities, or workforce-complexity expansion likely to create new employee-lifecycle, scheduling, payroll, or compliance burden | The expansion creates multi-site, multi-shift, cross-border, or large frontline workforce management complexity | It is only a marketing office, brand launch, or other expansion with no plausible workforce systems consequence |
| `compliance` | Policy, payroll, labor, tax, social insurance, data, contract, or cross-border employment obligations that materially increase HR systems requirements | The signal ties to payroll calculation, labor records, scheduling, contracts, privacy, or auditability | It is macro policy commentary with no clear HR operations implication |
| `replacement` | Evidence that incumbent tools are insufficient, fragmented, being consolidated, or being replaced by a broader HR stack | The source indicates migration, consolidation, HR stack modernization, or dissatisfaction with legacy point tools | It is merely a vendor comparison article with no buyer-side migration signal |
| `vendor_event` | Vendor-side event that can trigger buyer or channel action, such as new partner program, implementation capability, outage, acquisition, product sunset, or major release relevant to matching | The event changes partner strategy, implementation risk, migration timing, or buyer fit | The source is only generic brand promotion with no implication for timing or matching |
| `funding_strategy` | Financing, strategic reorientation, or explicit growth strategy likely to create HR systems demand or vendor/channel motion | The source links funding/strategy to workforce scaling, new-market entry, channel expansion, or operating model change | Funding is reported with no operational scaling signal |

#### 1.4.5 Evidence threshold and `confidence`

| `confidence` | Minimum standard | Use when | Must not use when |
|---|---|---|---|
| `H` | At least **1 primary public source** (official company / government / regulatory / official job posting / official vendor page) **or** **2 independent secondary public sources** that clearly corroborate the same signal | The signal is explicit, dated, within window, and directly supports an actionable HR systems hypothesis | The claim depends only on a paywalled source, a single speculative secondary article, or an undated/reposted page |
| `M` | **1 credible public source** with meaningful operational specificity, but lacking primary confirmation or full corroboration | The hypothesis is strong enough to monitor or shortlist, but still needs confirmation | The signal is generic, stale, or purely inferential |
| `L` | Weak proxy evidence, list-based inclusion, or indirect context only | Keep as watchlist/context if still relevant to later verification | Use as a confirmed current opportunity |

Additional evidence rules:

- `paywalled` is a source-status qualifier, not a substitute for `confidence`.
- **Paywalled-only claims cannot be treated as confirmed high-confidence facts.** They must be marked as paywalled context and capped below `H` unless corroborated by accessible public evidence.
- If the best accessible evidence is a vendor/self-promotional article, keep `confidence` at `M` or `L` unless a second independent source or primary buyer-side source confirms the signal.
- If multiple sources disagree, prefer the newer primary source; otherwise preserve the conflict in notes and downgrade `confidence`.

#### 1.4.6 Inclusion / exclusion quick test

Include the row only if the answer to every question below is **yes**:

1. Is the source public, linkable, and dated?
2. Does it fall inside the frozen window, or is it clearly marked as background only?
3. Does it map cleanly to exactly one main `signal_type`?
4. Does it imply a concrete HR systems need or matching implication?
5. Can it be scored with `confidence` without over-claiming?

If any answer is **no**, exclude it or downgrade it to non-scoring context.

#### 1.4.7 Positive examples (should count if captured as rows)

| # | Example | Why it qualifies | Suggested `signal_type` | URL | Publication date | Source status |
|---|---|---|---|---|---|---|
| P1 | Worktile describes enterprise talent-management systems as needing employee-lifecycle coverage from recruitment through exit rather than a single attendance tool | This is a valid **replacement** archetype: when a target company publicly signals that attendance-only tooling is no longer enough and broader lifecycle coverage is needed, it becomes an actionable HRIS modernization signal | `replacement` | https://worktile.com/kb/p/3961244 | 2026-03-11 | secondary_public |
| P2 | Worktile highlights AI recruiting, resume capture, and multi-role interview workflow automation as core needs in enterprise people systems | This is a valid **hiring** archetype when a target company publicly shows recruiting-scale pain plus ATS / hiring-ops workflow requirements, not merely generic recruiting volume | `hiring` | https://worktile.com/kb/p/3961244 | 2026-03-11 | secondary_public |
| P3 | Worktile frames intelligent scheduling, complex attendance, and minute-level labor-cost control as key needs for manufacturing / retail / logistics operations | This is a valid **expansion** or frontline-WFM archetype when a target adds sites, stores, factories, or shift complexity that creates clear scheduling / timekeeping demand | `expansion` | https://worktile.com/kb/p/3960588 | 2026-03-05 | secondary_public |
| P4 | Worktile states that multinational or multi-location operations need payroll, social-insurance, and data-compliance automation instead of isolated tools | This is a valid **compliance** archetype because the source ties HR systems selection to payroll and compliance execution rather than abstract transformation language | `compliance` | https://worktile.com/kb/p/3960241 | 2026-03-02 | secondary_public |
| P5 | Sohu describes overseas-factory / global operations support, multi-language, multi-currency, and global compliance as differentiators for enterprise HR platforms | This is a valid **funding_strategy / expansion** archetype when a company publicly signals overseas build-out or cross-border growth that changes HR systems scope | `funding_strategy` | https://www.sohu.com/a/997571260_120517583 | 2026-03-17 | secondary_public |

#### 1.4.8 Negative examples (should not count by themselves)

| # | Example | Why it is excluded | URL | Publication date | Source status |
|---|---|---|---|---|---|
| N1 | Fortune China 500 inclusion | Ranking / size alone is only a universe-building signal, not an HRIS demand signal | https://fortune.com/ranking/fortune-china-500/ | 2025-07-22 | secondary_public |
| N2 | Generic SaaS recruitment-system comparison article | A comparison of recruiting tools can help build the vendor longlist, but it does not prove that any target company currently has an opportunity | https://worktile.com/kb/p/3957480 | 2026-01-16 | secondary_public |
| N3 | ACFIC 2024 China Private 500 report | Large scale and broad digitization language are still not enough without HR-specific operational evidence | https://wap.acfic.org.cn/qlyw_13743/202410/t20241012_229498.html | 2024-10-12 | primary_public |
| N4 | Generic vendor ranking / product roundup | A vendor list may help build the vendor universe, but it does not prove that any target company currently has an opportunity | https://worktile.com/kb/p/3960241 | 2026-03-02 | secondary_public |
| N5 | Self-promotional HR systems ranking article | Product marketing or vendor positioning content without buyer-side evidence must not be promoted into a confirmed target-company opportunity | https://www.sohu.com/a/997571260_120517583 | 2026-03-17 | secondary_public |

#### 1.4.9 Practical paywall policy

- If a claim is visible only in a paywalled report, mark the source as `paywalled` in notes and keep the row below `H` unless an accessible corroborating source is added.
- Do not convert paywalled estimates, partner terms, migration claims, or customer wins into `publicly_confirmed` facts.
- When a paywalled page is the earliest lead, use it only to trigger follow-up verification against accessible company, regulator, vendor, or job-posting sources.


## 1.5 Scoring rubrics (Task 3)

This section operationalizes Task 3 from `.sisyphus/plans/opc1-hris-opportunity-bridge.md`.
All scores are **integer 0-100 values** and must be reproducible from canonical fields only.
If a required scoring input is empty, the row must either use the documented fallback below or remain unscored until the field is populated.

### 1.5.1 Scoring-support fields required by downstream tasks

The schema contract above remains intact, but Task 3 requires a small set of explicit scoring inputs so Tasks 4 and 8–12 can compute rankings deterministically.
These inputs are canonical schema fields, not narrative-only notes:

| Table | Field | Why it exists |
|---|---|---|
| company master | `employee_band` | Supports size fit in match scoring |
| opportunity table | `required_vendor_tags` | Expresses the module need implied by the signal |
| opportunity table | `supporting_source_urls` | Makes secondary-source corroboration deterministic for `confidence` QA |
| opportunity table | `opportunity_score` | Stores the computed opportunity score |
| vendor table | `target_segment_fit` | Supports vendor size/segment fit |
| vendor table | `industry_strengths` | Supports industry fit |
| vendor table | `visibility_level` | Separates visibility from capability in vendor ranking |
| vendor table | `supporting_evidence_urls` | Makes secondary-source corroboration deterministic for vendor `confidence` QA |
| vendor table | `as_of_date` | Makes vendor freshness scoring reproducible from row data |
| vendor table | `vendor_score` | Stores the computed vendor score |
| match table | `delivery_feasibility` | Captures execution feasibility independent of pure fit |

### 1.5.2 Opportunity score (`opportunity_score`)

**Purpose:** rank opportunity rows by actionable strength without hiding freshness or evidence quality.

**Input fields:** `signal_type`, `signal_date`, `as_of_date`, `confidence`

**Formula:**

`opportunity_score = signal_strength_points + freshness_points + evidence_confidence_points`

**Weight split (100 total):**

- signal strength: **50** max
- freshness: **25** max
- evidence confidence: **25** max

#### A. `signal_strength_points` from `signal_type`

| `signal_type` | Points |
|---|---:|
| `replacement` | 50 |
| `compliance` | 45 |
| `expansion` | 40 |
| `hiring` | 35 |
| `vendor_event` | 30 |
| `funding_strategy` | 25 |

#### B. `freshness_points` from `signal_date` vs `as_of_date`

First compute:

`signal_age_days = as_of_date - signal_date`

Then assign points:

| `signal_age_days` | Points |
|---|---:|
| 0-15 | 25 |
| 16-30 | 20 |
| 31-45 | 15 |
| 46-60 | 10 |
| 61-75 | 5 |
| 76-90 | 0 |

#### C. `evidence_confidence_points` from `confidence`

| `confidence` | Points |
|---|---:|
| `H` | 25 |
| `M` | 15 |
| `L` | 5 |

#### D. Worked examples — opportunity score

| Example | `signal_type` | `signal_date` | `as_of_date` | `signal_age_days` | `confidence` | Arithmetic | `opportunity_score` |
|---|---|---|---|---:|---|---|---:|
| O-EX1 | `replacement` | `2026-04-10` | `2026-04-18` | 8 | `H` | 50 + 25 + 25 | 100 |
| O-EX2 | `expansion` | `2026-03-12` | `2026-04-18` | 37 | `M` | 40 + 15 + 15 | 70 |
| O-EX3 | `vendor_event` | `2026-01-25` | `2026-04-18` | 83 | `L` | 30 + 0 + 5 | 35 |

### 1.5.3 Vendor score (`vendor_score`)

**Purpose:** rank vendors for OPC1 matching while keeping proven capability more important than media visibility.

**Input fields:** `vendor_tags`, `target_segment_fit`, `industry_strengths`, `confidence`, `evidence_date`, `as_of_date`, `visibility_level`

**Formula:**

`vendor_score = capability_points + evidence_confidence_points + freshness_points + visibility_points`

**Weight split (100 total):**

- capability: **60** max
- evidence confidence: **20** max
- evidence freshness: **10** max
- visibility: **10** max

**Guardrail:** `visibility_points` can never exceed 10, so visibility/media alone cannot outrank a materially stronger vendor.

#### A. `capability_points` (60 max)

`capability_points = module_coverage_points + segment_coverage_points + industry_strength_points`

##### 1) `module_coverage_points` from `vendor_tags` (25 max)

Count the distinct tags in `vendor_tags` that intersect this scoring set:
`core_hr`, `payroll`, `wfm`, `ats`, `recruiting`, `benefits`, `analytics`, `global_payroll`

Then compute:

`module_coverage_points = min(distinct_matching_tag_count, 5) * 5`

##### 2) `segment_coverage_points` from `target_segment_fit` (15 max)

Count the distinct values in `target_segment_fit` from the closed set `smb`, `mid_market`, `enterprise_group`.

`segment_coverage_points = min(distinct_segment_count, 3) * 5`

##### 3) `industry_strength_points` from `industry_strengths` (20 max)

Count the distinct values in `industry_strengths` using the same sector vocabulary as `sector_primary`.

`industry_strength_points = min(distinct_industry_count, 4) * 5`

#### B. `evidence_confidence_points` from `confidence`

| `confidence` | Points |
|---|---:|
| `H` | 20 |
| `M` | 12 |
| `L` | 6 |

#### C. `freshness_points` from `evidence_date`

First compute:

`evidence_age_days = as_of_date - evidence_date`

Then assign points:

| `evidence_age_days` | Points |
|---|---:|
| 0-30 | 10 |
| 31-60 | 7 |
| 61-90 | 4 |

If `evidence_age_days > 90`, the vendor row is outside the frozen OPC1 window and must remain unscored for Top100 ranking.

#### D. `visibility_points` from `visibility_level`

| `visibility_level` | Points |
|---|---:|
| `high` | 10 |
| `medium` | 6 |
| `low` | 3 |
| `unknown` | 0 |

#### E. Worked examples — vendor score

Assume `as_of_date = 2026-04-18` for all examples.

| Example | `vendor_tags` | `target_segment_fit` | `industry_strengths` | `confidence` | `evidence_date` | `as_of_date` | `visibility_level` | Arithmetic | `vendor_score` |
|---|---|---|---|---|---|---|---|---|---:|
| V-EX1 | `core_hr|payroll|ats|analytics` | `mid_market|enterprise_group` | `advanced_manufacturing|finance|healthcare` | `H` | `2026-04-04` | `2026-04-18` | `high` | module 20 + segment 10 + industry 15 + confidence 20 + freshness 10 + visibility 10 | 85 |
| V-EX2 | `payroll|global_payroll` | `enterprise_group` | `finance|healthcare|consumer_retail|internet_software` | `M` | `2026-02-28` | `2026-04-18` | `medium` | module 10 + segment 5 + industry 20 + confidence 12 + freshness 7 + visibility 6 | 60 |
| V-EX3 | `wfm` | `smb` | `logistics_mobility` | `L` | `2026-01-27` | `2026-04-18` | `high` | module 5 + segment 5 + industry 5 + confidence 6 + freshness 4 + visibility 10 | 35 |

### 1.5.4 Match score (`match_score`)

**Purpose:** rank opportunity-to-vendor matches using fit first, then delivery and term realism.

**Input fields across canonical tables:**

- company master: `sector_primary`, `employee_band`
- opportunity table: `required_vendor_tags`
- vendor table: `vendor_tags`, `target_segment_fit`, `industry_strengths`
- match table: `delivery_feasibility`, `term_status`

**Formula:**

`match_score = industry_fit_points + size_fit_points + module_fit_points + delivery_feasibility_points + term_status_points`

**Weight split (100 total):**

- industry fit: **20** max
- size fit: **15** max
- module fit: **25** max
- delivery feasibility: **20** max
- partner / term status: **20** max

#### A. `industry_fit_points`

- 20 points if `sector_primary` appears in `industry_strengths`
- 0 points if it does not appear or `industry_strengths` is empty

#### B. `size_fit_points`

If `employee_band` is included in `target_segment_fit`, assign 15 points.
Otherwise assign:

- 8 points for one-step adjacency: `smb` ↔ `mid_market`, or `mid_market` ↔ `enterprise_group`
- 0 points for no overlap or non-adjacent mismatch

#### C. `module_fit_points`

Count the distinct tags in the intersection of `required_vendor_tags` and `vendor_tags`.
Let:

- `required_count = distinct tag count in required_vendor_tags`
- `matched_count = distinct tag count in intersection(required_vendor_tags, vendor_tags)`

Then compute:

`module_fit_points = floor((matched_count / required_count) * 25)`

If `required_vendor_tags` is empty, the row must not receive a final `match_score`.

#### D. `delivery_feasibility_points` from `delivery_feasibility`

| `delivery_feasibility` | Points |
|---|---:|
| `high` | 20 |
| `medium` | 12 |
| `low` | 4 |
| `blocked` | 0 |

#### E. `term_status_points` from `term_status`

| `term_status` | Points |
|---|---:|
| `publicly_confirmed` | 20 |
| `indirectly_inferred` | 12 |
| `needs_confirmation` | 6 |
| `not_disclosed` | 0 |

#### F. Worked examples — match score

| Example | `sector_primary` | `employee_band` | `required_vendor_tags` | `vendor_tags` | `target_segment_fit` | `industry_strengths` | `delivery_feasibility` | `term_status` | Arithmetic | `match_score` |
|---|---|---|---|---|---|---|---|---|---|---:|
| M-EX1 | `advanced_manufacturing` | `enterprise_group` | `core_hr|payroll|analytics` | `core_hr|payroll|analytics|integration` | `mid_market|enterprise_group` | `advanced_manufacturing|finance` | `high` | `publicly_confirmed` | industry 20 + size 15 + floor(3/3×25)=25 + delivery 20 + terms 20 | 100 |
| M-EX2 | `consumer_retail` | `mid_market` | `ats|recruiting|analytics` | `ats|recruiting` | `smb|mid_market` | `consumer_retail|internet_software` | `medium` | `needs_confirmation` | industry 20 + size 15 + floor(2/3×25)=16 + delivery 12 + terms 6 | 69 |
| M-EX3 | `healthcare` | `enterprise_group` | `payroll|global_payroll` | `payroll` | `mid_market` | `finance` | `low` | `not_disclosed` | industry 0 + size 8 + floor(1/2×25)=12 + delivery 4 + terms 0 | 24 |

### 1.5.5 Implementation notes for Tasks 4 and 8–12

- `required_vendor_tags` must be populated on every scored opportunity row before match ranking begins.
- `employee_band`, `target_segment_fit`, and `industry_strengths` must be treated as controlled values, not free-text prose.
- `vendor_score` and `opportunity_score` are derived fields and should be recomputed whenever their inputs change.
- `match_score` is only valid when all required fit inputs exist; otherwise the row stays unscored and should fail QA.
- When ties occur, prefer the row with the higher `confidence`; if still tied, prefer the newer `signal_date` (opportunities) or newer `evidence_date` (vendors/matches).


### 1.5.6 Opportunity -> vendor shortlist logic (Task 11)

**Purpose:** produce a consistent top 3-5 vendor shortlist for each opportunity using the same canonical fields across company, opportunity, vendor, and match rows, while keeping commercial-term claims separate from pure fit scoring.

**Shortlist inputs:**

- company / joined company master: `sector_primary`, `employee_band`
- opportunity row: `required_vendor_tags`, `signal_type`, `source_url`
- vendor row: `vendor_tags`, `target_segment_fit`, `industry_strengths`, `vendor_score`, `notes`
- candidate match row: `delivery_feasibility`, `term_status`, `match_type`

**Important implementation note:** the current pilot files do not expose a standalone `deployment_constraints` column. For shortlist generation, deployment constraints are captured through the reasoning that sets `delivery_feasibility` (for example: China-local operator needs, global payroll coverage, private deployment requirements, or integration burden). Do not invent a separate field unless the canonical schema is extended later.

#### A. Candidate generation and shortlist size

1. Start from every vendor row with at least one overlap between `required_vendor_tags` and `vendor_tags`.
2. Reject rows with `delivery_feasibility = blocked` before ranking.
3. Compute `match_score` using the Task 11 formula below.
4. Sort by `match_score` descending.
5. Break ties using, in order: `vendor_score` descending, `delivery_feasibility` (`high` > `medium` > `low`), `term_status` (`publicly_confirmed` > `indirectly_inferred` > `needs_confirmation` > `not_disclosed`), then `evidence_date` descending.
6. Keep the top **3-5** rows per opportunity. If fewer than three rows remain after gating, retain all surviving rows and mark the opportunity for additional vendor research.

#### B. Task 11 `match_score` formula (100 total)

`match_score = industry_fit_points + module_match_points + segment_fit_points + delivery_feasibility_points`

| Component | Rule | Max points |
|---|---|---:|
| `industry_fit_points` | `25` if `sector_primary` appears in `industry_strengths`, else `0` | 25 |
| `module_match_points` | `floor((matched_count / required_count) * 30)` | 30 |
| `segment_fit_points` | `25` for exact `employee_band` match in `target_segment_fit`; `15` for one-step adjacency (`smb` <-> `mid_market`, `mid_market` <-> `enterprise_group`); else `0` | 25 |
| `delivery_feasibility_points` | `20` for `high`, `12` for `medium`, `4` for `low`, `0` for `blocked` | 20 |

**Scoring rules:**

- `required_count` = distinct tag count in `required_vendor_tags`
- `matched_count` = distinct tag count in `intersection(required_vendor_tags, vendor_tags)`
- If `required_vendor_tags` is empty, do not score the row.
- If the joined company row does not provide `employee_band`, the row may still be reviewed qualitatively, but it must not receive a final `match_score` until the size proxy is restored.

#### C. `match_type` assignment rules

| `match_type` | When to use |
|---|---|
| `direct` | Exact industry match, at least two-thirds module coverage, exact or adjacent segment fit, and `delivery_feasibility` is `high` or `medium` |
| `adjacent` | Strong module coverage exists, but one fit dimension still needs validation (industry proof, segment fit, or deployment feasibility) |
| `ecosystem` | Vendor covers a meaningful slice of the need but likely depends on a partner, implementation layer, or adjacent platform to close the gap |
| `alternative` | Fallback candidate with non-zero score that is useful for monitoring or comparison, but not a front-line outreach target |

#### D. `delivery_feasibility` handling for deployment constraints

Use `delivery_feasibility` as the canonical place to encode deployment realism.

| `delivery_feasibility` | Meaning for Task 11 shortlist generation |
|---|---|
| `high` | Public evidence supports the required modules, target segment, and sector pattern with no obvious delivery blocker |
| `medium` | The vendor is still a valid shortlist candidate, but deployment-specific validation is needed (for example global payroll, private deployment, China-local execution, or heavy integration dependencies) |
| `low` | The row is a stretch fit: partial module coverage, weaker segment alignment, or thin evidence on delivery execution |
| `blocked` | Missing critical capability or explicit deployment mismatch; exclude from shortlist |

#### E. `term_status` handling (separate from `match_score`)

`term_status` does **not** add points in Task 11. It controls how far the shortlist row can go in outreach and what language is allowed in rationale text.

| `term_status` | Allowed handling |
|---|---|
| `publicly_confirmed` | Source explicitly states the partner condition or commercial term; compensation fields may be populated if the evidence is quoted or linked |
| `indirectly_inferred` | Public evidence supports the existence of a partner / implementation path, but exact commercial terms are absent; keep compensation fields blank and write that terms are inferred, not confirmed |
| `needs_confirmation` | Default shortlist status when fit is strong but no public term evidence exists; valid for ranking, but `next_action` should request terms or confirm partner model |
| `not_disclosed` | Use for monitoring or control rows where public evidence says nothing about partner economics; do not claim referral or reseller terms |

#### F. Rationale template fields

The shortlist output should keep the same four fields on every row:

| Field | Required content |
|---|---|
| `match_type` | One of `direct`, `adjacent`, `ecosystem`, `alternative` using section C |
| `delivery_feasibility` | One of `high`, `medium`, `low`, `blocked` using section D |
| `match_score` | Integer `0`-`100` from section B |
| `rationale_text` | Four-sentence template described below |

**`rationale_text` template:**

`{company_name} ({sector_primary}, {employee_band}) requires {required_vendor_tags}. {vendor_name} covers {matched_vendor_tags} and has public evidence for {industry_or_use_case_reference}. Delivery is {delivery_feasibility} because {deployment_constraint_reason}. This is a {match_type} match scored {match_score}/100; term status remains {term_status}, so {term_action}.`

**Consistency rules for rationale text:**

- Sentence 1 states the buyer context and required modules only.
- Sentence 2 states concrete vendor capability evidence only.
- Sentence 3 explains deployment realism only.
- Sentence 4 states ranking outcome plus the permitted term-status language.
- Never write "best vendor" or any commission claim unless `term_status = publicly_confirmed` and the source says so explicitly.

#### G. Output expectation

Each opportunity should end with a ranked shortlist of 3-5 vendors. Rows below the top five can remain in the wider candidate pool, but only shortlisted rows should receive narrative rationale text.

**Pilot note:** the current embedded Task 4 pilot examples still reflect the earlier generic match-score rubric. Treat this Task 11 section as the shortlist-generation rule for downstream opportunity -> vendor ranking and rationale writing.

---

## 2. Company master schema

**Primary key:** `company_id`

| Column | Type | Required | Allowed values / rules |
|---|---|---:|---|
| `company_id` | string | yes | `^C\d{3}$` |
| `company_name` | string | yes | Canonical company name |
| `company_aliases` | string | no | Pipe-delimited alias list; normalized for dedupe only |
| `legal_name` | string | no | Official legal entity name if known |
| `company_market_status` | enum | yes | `listed` / `private` / `mixed` / `unknown` |
| `sector_primary` | enum | yes | `internet_software`, `advanced_manufacturing`, `consumer_retail`, `energy_chemicals`, `healthcare`, `logistics_mobility`, `finance`, `other` |
| `listing_exchange` | string | no | `SSE`, `SZSE`, `HKEX`, `STAR`, `BSE`, `NYSE`, `NASDAQ`, `OTC`, `other` |
| `ticker` | string | no | Exchange ticker if listed |
| `country` | string | yes | Default `CN` for OPC1 China universe |
| `employee_band` | enum | yes | `smb` / `mid_market` / `enterprise_group` / `unknown` |
| `universe` | string | yes | Universe label, e.g. `CSI A500 (000510.CSI)` |
| `universe_as_of` | date | yes | Snapshot date for the universe |
| `universe_source_url` | string | yes | Valid http/https URL |
| `notes` | string | no | Free text, non-key |

### 2.1 Company dedupe / alias rules

- Canonical key: normalized `legal_name` if present; otherwise normalized `company_name`.
- Normalization removes whitespace, punctuation, and common legal suffixes (`有限公司`, `股份有限公司`, `Co., Ltd.`, `Inc.`, `Ltd.`).
- Chinese and English names may map to the same `company_id` if the source evidence is the same entity.
- `company_aliases` must not be used for joins; it is display/reference only.

---

## 3. Vendor schema

**Primary key:** `vendor_id`

| Column | Type | Required | Allowed values / rules |
|---|---|---:|---|
| `vendor_id` | string | yes | `^V\d{3}$` |
| `vendor_name` | string | yes | Canonical vendor name |
| `vendor_aliases` | string | no | Pipe-delimited alias list; normalized for dedupe only |
| `vendor_type` | enum | yes | `software` / `service` / `hybrid` / `unknown` |
| `vendor_tags` | string | no | Pipe-delimited controlled vocabulary from: `core_hr`, `payroll`, `wfm`, `ats`, `recruiting`, `benefits`, `analytics`, `implementation`, `outsourcing`, `consulting`, `integration`, `ai`, `global_payroll`, `other` |
| `target_segment_fit` | string | no | Pipe-delimited controlled vocabulary from: `smb`, `mid_market`, `enterprise_group`, `unknown` |
| `industry_strengths` | string | no | Pipe-delimited values from the same sector vocabulary used by `sector_primary` |
| `visibility_level` | enum | no | `high` / `medium` / `low` / `unknown` |
| `website_url` | string | no | Valid http/https URL |
| `evidence_url` | string | yes | Primary evidence URL for inclusion / scoring |
| `supporting_evidence_urls` | string | no | Pipe-delimited additional public evidence URLs on distinct domains when corroboration is needed |
| `evidence_date` | date | yes | Source publication / capture date |
| `as_of_date` | date | yes | Frozen run date used for vendor freshness scoring |
| `confidence` | enum | yes | `H` / `M` / `L` |
| `vendor_score` | integer | no | Derived `0`-`100` from the Task 3 rubric |
| `notes` | string | no | Free text, non-key |

### 3.1 Vendor dedupe / alias rules

- Canonical key: normalized `vendor_name` plus domain if `website_url` exists.
- If two vendor rows share the same normalized name and evidence cluster, merge them into one `vendor_id`.
- Service firms and software firms may coexist in the same table; `vendor_type` must reflect the actual business model.
- `vendor_tags` are advisory classification tokens, not free text.

---

## 4. Opportunity schema

**Primary key:** `opportunity_id`

| Column | Type | Required | Allowed values / rules |
|---|---|---:|---|
| `opportunity_id` | string | yes | `^O\d{3}$` |
| `company_id` | string | yes | Must exist in company master |
| `company_name` | string | yes | Must match canonical company name for `company_id` |
| `signal_type` | enum | yes | `hiring`, `expansion`, `compliance`, `replacement`, `vendor_event`, `funding_strategy` |
| `signal_subtype` | string | no | Narrower description; keep short and specific |
| `signal_summary` | string | yes | One-line summary of the opportunity signal |
| `required_vendor_tags` | string | no | Pipe-delimited vendor-module need using the `vendor_tags` vocabulary |
| `signal_date` | date | yes | Source date of the signal |
| `as_of_date` | date | yes | Frozen run date used for the 3-month window |
| `source_type` | enum | yes | `official_site`, `news`, `job_board`, `regulatory`, `social`, `report`, `database`, `other` |
| `source_url` | string | yes | Primary evidence URL for the opportunity signal |
| `supporting_source_urls` | string | no | Pipe-delimited additional public source URLs on distinct domains when corroboration is needed |
| `confidence` | enum | yes | `H` / `M` / `L` |
| `term_status` | enum | yes | `publicly_confirmed`, `indirectly_inferred`, `needs_confirmation`, `not_disclosed` |
| `contact_method` | enum | no | `email`, `phone`, `wechat`, `linkedin`, `website_form`, `other` |
| `contact_detail` | string | no | Specific address/handle/phone if known |
| `opportunity_score` | integer | no | Derived `0`-`100` from the Task 3 rubric |
| `notes` | string | no | Free text, non-key |

### 4.1 Opportunity dedupe rules

- Canonical key: the section 10.6.2 `opportunity_dedupe_key` (`normalized_entity_name + "|" + signal_type + "|" + event_date + "|" + signal_anchor`).
- For canonical exports, `company_id` remains the authoritative row link to the company master, but it is not sufficient by itself for opportunity dedupe because one company may have multiple valid opportunities.
- If the same opportunity appears from multiple sources, keep one row, retain the strongest evidence in `source_url`, and store additional corroborating URLs in `supporting_source_urls`. Replacing `source_url` with stronger evidence does **not** create a new opportunity row when the `opportunity_dedupe_key` is otherwise unchanged.
- `signal_date` must equal the original publication / announcement date when recoverable and must remain within the frozen lookback window for the run.
- `term_status = publicly_confirmed` is only allowed when the source explicitly states the commercial term or partner condition.

---

## 5. Match schema

**Primary key:** `match_id`

| Column | Type | Required | Allowed values / rules |
|---|---|---:|---|
| `match_id` | string | yes | `^M\d{3}$` |
| `opportunity_id` | string | yes | Must exist in opportunity table |
| `company_id` | string | yes | Must exist in company master |
| `company_name` | string | yes | Must match canonical company name for `company_id` |
| `vendor_id` | string | yes | Must exist in vendor table |
| `vendor_name` | string | yes | Must match canonical vendor name for `vendor_id` |
| `match_type` | enum | yes | `direct`, `adjacent`, `ecosystem`, `alternative` |
| `delivery_feasibility` | enum | yes | `high` / `medium` / `low` / `blocked` |
| `match_score` | integer | yes | `0`-`100`; derived from the Task 3 rubric |
| `match_status` | enum | yes | `pending`, `ready_to_contact`, `contacted`, `confirmed`, `rejected`, `closed` |
| `term_status` | enum | yes | `publicly_confirmed`, `indirectly_inferred`, `needs_confirmation`, `not_disclosed` |
| `compensation_model` | enum | no | `referral_fee`, `reseller_margin`, `implementation_share`, `consulting_share`, `revenue_share`, `fixed_fee`, `unknown` |
| `compensation_rate_min_pct` | decimal | no | 0-100; required only when rates are disclosed |
| `compensation_rate_max_pct` | decimal | no | 0-100; must be >= min if both exist |
| `contact_method` | enum | no | `email`, `phone`, `wechat`, `linkedin`, `website_form`, `other` |
| `contact_detail` | string | no | Specific address/handle/phone if known |
| `source_url` | string | yes | Valid http/https URL supporting the match |
| `evidence_date` | date | yes | Evidence capture/publication date |
| `rationale` | string | yes | Why this vendor fits this opportunity |
| `next_action` | enum | yes | `identify_contact`, `send_email`, `call`, `wechat_followup`, `request_terms`, `monitor`, `close` |
| `notes` | string | no | Free text, non-key |

### 5.1 Match dedupe rules

- Canonical key: `opportunity_id + vendor_id + match_type`.
- One opportunity may map to multiple vendors; one vendor may map to multiple opportunities.
- `match_score` is integer only; no symbols or prose.
- If `term_status = publicly_confirmed`, at least one of `compensation_model`, `compensation_rate_min_pct`, or `compensation_rate_max_pct` must be present.

---

## 6. Monitoring spec schema

**Primary key:** `monitor_id`

| Column | Type | Required | Allowed values / rules |
|---|---|---:|---|
| `monitor_id` | string | yes | `^N\d{3}$` |
| `monitor_name` | string | yes | Human-readable monitor label |
| `monitor_domain` | enum | yes | `demand`, `vendor`, `funding`, `policy`, `product`, `job_board`, `company_site`, `social`, `other` |
| `source_name` | string | yes | Source feed or site name |
| `source_url` | string | yes | Valid http/https URL |
| `query_or_rule` | string | yes | Exact query, filter, or rule identifier |
| `keywords` | string | no | Pipe-delimited keyword list |
| `cadence` | enum | yes | `daily`, `weekly`, `biweekly`, `monthly` |
| `as_of_date` | date | yes | Frozen run date |
| `freshness_window_days` | integer | yes | `90` by default for OPC1 |
| `last_checked_at` | datetime | no | ISO-8601 UTC |
| `last_change_at` | datetime | no | ISO-8601 UTC |
| `action_on_change` | enum | yes | `create_opportunity`, `update_opportunity`, `update_vendor`, `update_match`, `escalate`, `ignore` |
| `owner` | string | no | Person/system responsible |
| `notes` | string | no | Free text, non-key |

### 6.1 Monitoring dedupe rules

- Canonical key: `source_url + query_or_rule + cadence`.
- Each monitor row must point to exactly one source and one action rule.
- `freshness_window_days` must be a positive integer.

---

## 7. Validation rules for CSV/XLSX QA

### 7.1 Structural checks

- Each export must contain exactly the columns listed in its schema, in the same order.
- Required columns must be non-empty in every row.
- No duplicate primary keys are allowed.
- All ID formats must match their regex.

### 7.2 Referential checks

- Every `company_id` in opportunity/match rows must exist in company master.
- Every `vendor_id` in match rows must exist in vendor master.
- Every `opportunity_id` in match rows must exist in opportunity table.
- Denormalized names must exactly match canonical names for their IDs.

### 7.3 Enum checks

- `confidence` is only `H`, `M`, `L`.
- `term_status` is only `publicly_confirmed`, `indirectly_inferred`, `needs_confirmation`, `not_disclosed`.
- All other enums are case-sensitive and closed set.

### 7.4 Evidence checks

- `source_url` / `supporting_source_urls` / `evidence_url` / `supporting_evidence_urls` / `universe_source_url` must contain only valid http(s) URLs.
- A row cannot be considered confirmed without evidence.
- For opportunity rows, `confidence = H` is allowed only when either (a) `source_type` is a primary class (`official_site`, `regulatory`, `job_board`) or (b) `supporting_source_urls` provides at least one additional URL on a distinct domain so the row has at least 2 independent secondary-source domains in total.
- For vendor rows, `confidence = H` is allowed only when either (a) `website_url` and `evidence_url` share the same domain, treating the evidence as primary vendor evidence, or (b) `supporting_evidence_urls` provides at least one additional URL on a distinct domain so the row has at least 2 independent secondary-source domains in total.
- `confidence = M` requires one credible public source in the main evidence field, with optional corroboration in the supporting URL field.
- `confidence = L` is acceptable for list-based inclusion only.

### 7.5 Term checks

- `publicly_confirmed`: explicit public statement of compensation/partner terms.
- `indirectly_inferred`: terms are inferred from public evidence but not explicitly stated.
- `needs_confirmation`: source suggests an opportunity exists but terms are not verified.
- `not_disclosed`: terms are absent or explicitly undisclosed.
- If `term_status = publicly_confirmed`, structured term fields must not all be empty.

### 7.6 Date / window checks

- `signal_date` and scored-row `evidence_date` must be within the frozen run window.
- `signal_date` cannot be after `as_of_date`.
- `as_of_date` must be identical across all tables in the same run, including vendor rows.

### 7.7 Alias / dedupe checks

- Alias comparison is normalization-based only; raw aliases do not define identity.
- Normalization removes whitespace, punctuation, and common legal suffixes.
- Duplicate aliases inside one cell must be collapsed before export.

### 7.8 Scoring checks

- `opportunity_score`, `vendor_score`, and `match_score` must be reproducible exactly from the Task 3 formulas in section 1.5.
- A scored opportunity row must have non-empty `signal_type`, `signal_date`, `as_of_date`, and `confidence`; if `confidence = H` and `source_type` is not primary, `supporting_source_urls` must supply the second independent source domain.
- A scored vendor row must have non-empty `vendor_tags`, `confidence`, `evidence_date`, `as_of_date`, and `visibility_level`; `target_segment_fit` and `industry_strengths` are required if the row is intended for matching. If `confidence = H` and `evidence_url` is not vendor-primary via `website_url` domain match, `supporting_evidence_urls` must supply the second independent source domain.
- A scored match row is valid only after joining its referenced company, opportunity, and vendor rows; the joined inputs must include non-empty `required_vendor_tags`, `employee_band`, `target_segment_fit`, `industry_strengths`, `delivery_feasibility`, and `term_status`.
- `match_score` must not be assigned when `required_vendor_tags` is empty.

---

## 7.9 Task 4 pilot gate findings (10 companies / 10 vendors / 10 matches)

The Task 4 pilot reuses the final deliverable basenames with a **10-row gated sample only**. It does **not** start the full 500-company / 100-vendor build.

### 7.9.1 Pilot-specific findings

- The canonical schemas in sections 2, 3, and 5 were sufficient for a 10/10/10 pilot without schema-breaking columns.
- The pilot resolved the earlier naming split by making **`OPC1-opportunity-matching-china-<date>.csv`** the canonical matching-table basename in this brief. The older `OPC1-opportunity-table-china-<date>` wording is now treated as a legacy compatibility alias only.
- Because Task 4 does not yet require a standalone opportunity CSV deliverable, the pilot keeps the scored opportunity ledger embedded here for traceability of `opportunity_id` values used in the match table.
- Two rows (`Starbucks China`, `Eli Lilly China`) are retained as **China-operator control examples** to pressure-test large China retail / healthcare expansion patterns. They remain inside the frozen date window and are explicitly marked as `control_example=china_operator` in the matching notes so downstream tasks can replace them with China-native companies if stricter universe rules are adopted.

### 7.9.1A Company-master freshness rule used by the pilot

- The canonical company schema does not have a separate `evidence_date` column; company-universe inclusion is evidenced by the pair **`universe_source_url` + `universe_as_of`**.
- For the Task 4 pilot, company freshness therefore means: every company row has a public `universe_source_url`, and `universe_as_of` is frozen to the pilot run date `2026-04-18`.
- Opportunity freshness is still proven separately in the embedded O001-O010 ledger and in the match table evidence dates.

### 7.9.2 Embedded pilot opportunity ledger

| opportunity_id | company_id | company_name | signal_type | signal_date | required_vendor_tags | opportunity_score | source_url |
|---|---|---|---|---|---|---:|---|
| O001 | C001 | BYD Company Limited | expansion | 2026-01-28 | `core_hr|payroll|analytics` | 55 | https://www.autonews.com/byd/an-byd-2026-global-expansion-in-europe-canada-ev-tariffs-0128/ |
| O002 | C002 | Foxconn Zhengzhou Operations | expansion | 2026-02-05 | `wfm|analytics` | 60 | https://www.reuters.com/world/asia-pacific/foxconn-opens-ev-rd-hub-central-chinas-zhengzhou-2026-02-05/ |
| O003 | C003 | Semiconductor Manufacturing International Corp. | expansion | 2026-02-11 | `core_hr|payroll|analytics` | 60 | https://www.reuters.com/world/china/smic-add-wafer-capacity-meet-strong-chip-demand-warns-margin-hit-2026-02-11/ |
| O004 | C004 | NIO Inc. | expansion | 2026-03-11 | `core_hr|payroll|global_payroll` | 70 | https://www.reuters.com/world/asia-pacific/chinas-nio-targets-overseas-sales-thousands-cars-this-year-2026-03-11/ |
| O005 | C005 | XPeng Inc. | expansion | 2026-03-20 | `ats|recruiting|analytics` | 75 | https://www.reuters.com/world/asia-pacific/chinas-xpeng-launch-evs-latin-american-market-2026-03-20/ |
| O006 | C006 | JD.com, Inc. | expansion | 2026-03-16 | `ats|recruiting|analytics` | 70 | https://www.reuters.com/business/retail-consumer/jdcom-launches-joybuy-europe-targeting-amazon-2026-03-16/ |
| O007 | C007 | Starbucks China | expansion | 2026-04-02 | `wfm|analytics` | 75 | https://www.reuters.com/world/china/starbucks-closes-china-deal-with-boyu-plans-expand-stores-2026-04-02/ |
| O008 | C008 | Chery Automobile Co., Ltd. | expansion | 2026-04-12 | `core_hr|payroll|wfm` | 80 | https://www.reuters.com/business/autos-transportation/chinas-chery-looking-expand-car-production-europe-top-executives-say-2026-04-12/ |
| O009 | C009 | Mixue Group | expansion | 2026-04-11 | `wfm|analytics` | 80 | https://www.reuters.com/world/americas/chinese-investment-brazil-pivots-power-dams-ice-cream-courting-consumers-2026-04-11/ |
| O010 | C010 | Eli Lilly China | funding_strategy | 2026-03-11 | `core_hr|payroll|analytics` | 55 | https://www.reuters.com/business/healthcare-pharmaceuticals/eli-lilly-invest-3-billion-china-over-next-decade-2026-03-11/ |

## 8. Compatibility notes for current OPC1 outputs

- Keep the current generator’s core identifiers and evidence fields as the baseline.
- Current `status` rows in the legacy opportunity export map to canonical `match_status`.
- Current `compensation_terms` text should be replaced by structured `term_status` plus optional compensation fields.
- Existing company/vendor outputs already match the naming pattern used by the repo’s OPC1 reports.

---

## 9. Schema review gate

A schema review passes only if:

1. All five tables are defined.
2. Every table has explicit required/optional columns.
3. Every status field uses closed enums.
4. Dedupe keys and alias rules are stated.
5. Validation rules are deterministic enough to implement without human judgment.


---

## 10. Monitoring SOP for monthly updates (Task 16)

This section converts the legacy market report's 6.x monitoring idea into an operator-ready SOP.
It is intentionally a **runbook/spec**, not a crawler architecture.
The operator must be able to execute it with a browser, saved searches/alerts, and the existing `Reports/OPC1-monitor-delta-*` output family.

### 10.1 Operating goal and scope

- Goal: detect **net-new or materially changed OPC1 opportunities** since the previous run and prepare a deterministic monthly delta.
- Operating rhythm: **weekly scan** for signal capture, then **monthly consolidation** for the dated delta outputs.
- Scope covers six signal types only: `hiring`, `expansion`, `compliance`, `replacement`, `vendor_event`, `funding_strategy`.
- Scope includes both demand-side and vendor-side monitoring channels.
- Scope excludes production crawling, hidden databases, or judgment that is not written down in this SOP.

### 10.2 Frozen dates and exact comparison baseline

For every weekly scan or monthly consolidation, record these values before opening any source:

| Field | Rule |
|---|---|
| `RUN_DATE` | Date the operator is executing the current monitoring cycle in `YYYY-MM-DD` |
| `AS_OF_DATE` | Freeze to `RUN_DATE`; do not change it during that cycle |
| `LOOKBACK_START` | `AS_OF_DATE - 89 days` (inclusive 90-day window) |
| `BASELINE_RUN_DATE` | Date token from the most recent prior OPC1 snapshot/delta already stored in `Reports/` |
| `BASELINE_COMPANY_FILE` | Latest prior `Reports/OPC1-demand-companies-500-china-<YYYY-MM-DD>.csv` |
| `BASELINE_VENDOR_FILE` | Latest prior `Reports/OPC1-vendors-top100-hris-china-<YYYY-MM-DD>.csv` |
| `BASELINE_DELTA_SUMMARY` | Latest prior `Reports/OPC1-monitor-delta-summary-<YYYY-MM-DD>.md` if it exists |

**Baseline selection logic:**

1. List dated files in `Reports/` matching the canonical filename families.
2. Pick the latest run date strictly earlier than the current `RUN_DATE`.
3. Use that run as the baseline for since-last-run comparison.
4. If no prior dated run exists, mark the cycle as `initial_baseline_build`; do not claim "added" or "removed" deltas yet.

### 10.3 Source map by channel

Use the source lists below exactly as the default monitoring set. If a source is unavailable, record the miss in notes rather than silently skipping it.

#### 10.3.1 News and market media

| Channel | Concrete sources | What to look for | Default cadence |
|---|---|---|---|
| General business / tech news | 36Kr, Sohu Tech, Sina Tech, Tencent News, Huxiu, CLS | financing, expansion, HR product launches, partner announcements | weekly |
| HR / SaaS market commentary | Worktile knowledge base pages already used in OPC1, QYResearch, Huaon, vendor roundups with dated updates | replacement, compliance, vendor event archetypes, market changes worth follow-up | weekly |
| Public-company newsrooms | company investor news pages, press centers, announcements pages | new factories, new business units, overseas setup, workforce expansion, digitization projects | weekly |

#### 10.3.2 Funding and strategy channels

| Channel | Concrete sources | What to look for | Default cadence |
|---|---|---|---|
| Startup / financing media | 36Kr financing feed, IT桔子, EqualOcean, company financing press releases | new fundraising, channel strategy, GTM expansion, M&A | weekly |
| Public filings / investor updates | listed company announcements, annual/interim updates, investor-relations pages | strategic transformation, overseas rollout, shared-service buildout | weekly |
| Vendor official newsrooms | vendor press centers, partnership pages, product launch pages | new partner program, product sunset, rollout, acquisition, implementation expansion | weekly |

#### 10.3.3 Vendor release-note and company-site channels

| Channel | Concrete sources | What to look for | Default cadence |
|---|---|---|---|
| Vendor release notes | product changelog, release notes, partner program pages, implementation announcement pages | new AI module, payroll/compliance release, integration availability, sunset/migration notice | weekly |
| Company official sites | corporate news, HR transformation case studies, procurement notices, digital-transformation sections | system replacement, HR shared-service setup, new region/factory/store expansion | weekly |
| Ecosystem partner pages | implementation partner directories, alliance announcements, reseller pages | partner onboarding, regional delivery expansion, co-selling motion | weekly |

#### 10.3.4 Job-posting channels

| Channel | Concrete sources | What to look for | Default cadence |
|---|---|---|---|
| Major job boards | BOSS直聘, 猎聘, 智联招聘, 前程无忧/51Job, Liepin company pages | HRIS manager, ATS admin, payroll systems, WFM, HR shared services, data governance roles | weekly |
| Company careers pages | official recruiting pages for target companies and top vendors | direct HR systems hiring, implementation hiring, solution consultant hiring | weekly |

#### 10.3.5 Policy / regulatory channels

| Channel | Concrete sources | What to look for | Default cadence |
|---|---|---|---|
| National policy | Ministry of Human Resources and Social Security, State Taxation Administration, CAC, Ministry of Industry and Information Technology | payroll, social insurance, labor data, privacy, cross-border data, employment compliance | weekly |
| Local policy | provincial / municipal HRSS bureaus, tax bureaus, social-security bureaus in key operating regions | local payroll/social-insurance rules, labor-record changes, scheduling/overtime compliance changes | weekly |
| Exchange / regulator notices | SSE, SZSE, SAMR where relevant | listed-company compliance or restructuring disclosures that imply HR systems changes | weekly |

### 10.4 Weekly scan procedure

Perform the steps below once per week. The output of a weekly scan is a candidate log, not yet the official monthly delta.

1. Freeze `RUN_DATE`, `AS_OF_DATE`, and `LOOKBACK_START`.
2. Open each source channel in section 10.3.
3. Run the exact query logic from section 10.5 for each signal type.
4. For every candidate result, capture at minimum:
   - entity name
   - source URL
   - source title
   - publication date
   - signal type
   - 1-2 sentence evidence snippet
   - whether the source is primary or secondary
5. Discard undated or clearly duplicate pages immediately.
6. Apply the dedupe rules in section 10.6.
7. Apply the escalation rules in section 10.7.
8. Carry forward surviving candidates into the monthly consolidation queue.

### 10.5 Exact query logic by signal type

Run the following logic per signal type. Queries may be executed in Chinese or English, but the operator must keep the required keywords and entity constraints intact.

#### 10.5.1 `hiring`

- Primary sources: company careers pages, BOSS直聘, 猎聘, 智联招聘, 前程无忧.
- Entity scope: target companies first; Top100 vendors second.
- Query template for target companies:
  - `"<company_name>" (HRIS OR 人力资源系统 OR 招聘系统 OR ATS OR 薪酬系统 OR 考勤系统 OR 排班系统 OR 人事共享服务 OR HR数据) site:(zhipin.com OR liepin.com OR zhaopin.com OR 51job.com OR company careers domain)`
- Query template for vendor-side hiring:
  - `"<vendor_name>" (实施顾问 OR 解决方案顾问 OR 渠道伙伴 OR partner OR implementation OR payroll consultant)`
- Count as a valid `hiring` signal only when the job description mentions HR systems implementation, administration, migration, payroll, ATS, WFM, or HR data operations.
- Reject if the posting is generic recruiter / HRBP / campus hiring with no systems clue.

#### 10.5.2 `expansion`

- Primary sources: company newsrooms, investor pages, exchange announcements, major business media.
- Query template:
  - `"<entity_name>" (新工厂 OR 新门店 OR 新园区 OR 海外 OR 出海 OR regional hub OR expansion OR 新增员工 OR shared service center)`
- Count as `expansion` only when the event creates multi-site, multi-shift, cross-region, or cross-border workforce complexity that could require HRIS / payroll / WFM support.
- Reject if the announcement is only branding, a marketing office, or revenue guidance without workforce implications.

#### 10.5.3 `compliance`

- Primary sources: MOHRSS, STA, CAC, local HRSS/tax bureaus, company compliance disclosures, payroll/compliance vendor updates.
- Query template:
  - `(个税 OR 社保 OR 劳动合同 OR 用工合规 OR 数据合规 OR 跨境数据 OR 工时 OR 排班 OR payroll compliance) AND (<company_name> OR <industry_bucket> OR <region_name>)`
- Count as `compliance` when the source changes payroll, labor-record, scheduling, employee-data, contract, or cross-border employment obligations in a way that requires system/process adjustment.
- Reject if the source is only high-level policy commentary without an operational requirement.

#### 10.5.4 `replacement`

- Primary sources: company digital-transformation pages, procurement notices, case studies, migration announcements, vendor sunset notices.
- Query template:
  - `"<entity_name>" (替换 OR 升级 OR 上云 OR 迁移 OR 数字化人力资源 OR legacy HR system OR migration OR implementation)`
- Count as `replacement` when the evidence shows tool consolidation, incumbent dissatisfaction, stack modernization, procurement for a new system, or a sunset that forces migration.
- Reject if the source is only a generic vendor comparison article not tied to a specific buyer or vendor change event.

#### 10.5.5 `vendor_event`

- Primary sources: vendor newsrooms, release notes, partner pages, product updates, outage notices, acquisition announcements.
- Query template:
  - `"<vendor_name>" (发布 OR 上线 OR release notes OR partner program OR 渠道 OR implementation partner OR outage OR 收购 OR 停止维护)`
- Count as `vendor_event` when the event changes buyer fit, migration urgency, delivery capability, or partner/channel behavior.
- Reject if the page is undated marketing copy with no operational change.

#### 10.5.6 `funding_strategy`

- Primary sources: financing news, investor updates, founder letters, company strategy announcements.
- Query template:
  - `"<entity_name>" (融资 OR investment OR strategic round OR 战略升级 OR 渠道合作 OR 出海战略 OR AI战略)`
- Count as `funding_strategy` when funding or strategy is explicitly tied to workforce scaling, new-market entry, ecosystem expansion, AI-native HR rollout, or post-funding GTM acceleration.
- Reject if the item reports money raised but gives no operational growth implication.

### 10.6 Dedupe-key rules

Apply dedupe before any escalation decision.

#### 10.6.1 Source-page dedupe

Treat two rows as the same source event when all of the following match:

- same normalized entity name
- same `signal_type`
- same original publication date
- same or materially identical URL after removing tracking parameters

#### 10.6.2 Opportunity-level dedupe

Use this canonical opportunity dedupe key:

`opportunity_dedupe_key = normalized_entity_name + "|" + signal_type + "|" + event_date + "|" + signal_anchor`

Where:

- `normalized_entity_name` removes whitespace, punctuation, and legal suffixes
- `event_date` is the original publication / announcement date
- `signal_anchor` is the strongest stable anchor available, chosen in this order:
  1. official notice / filing ID
  2. job posting ID
  3. procurement notice ID
  4. vendor release version / announcement slug
  5. canonicalized URL path

#### 10.6.3 Entity-level dedupe for delta outputs

Reuse existing file families and compare entities with stable keys, not display names only.

| Output family | Canonical dedupe key |
|---|---|
| `OPC1-monitor-delta-companies-<YYYY-MM-DD>.csv` | `company_id` if available; otherwise normalized `company_name` |
| `OPC1-monitor-delta-vendors-<YYYY-MM-DD>.csv` | `vendor_id` if available; otherwise normalized `vendor_name` + vendor website domain |
| opportunity block inside `OPC1-monitor-delta-summary-<YYYY-MM-DD>.md` | `opportunity_dedupe_key` |

#### 10.6.4 Repost / syndication handling

- Prefer the earliest primary source over later media rewrites.
- If several secondary sources repeat the same event, keep the earliest dated one plus one corroborating source in notes.
- Do not treat syndicated reposts as separate opportunities.

### 10.7 Escalation rules: what becomes a "new opportunity"

Escalate a candidate into the official monthly delta only when **all** checks below pass:

1. The candidate maps to one of the six valid `signal_type` values.
2. The event date falls within `LOOKBACK_START` to `AS_OF_DATE`, inclusive.
3. The evidence threshold from section 1.4.5 is met.
4. The candidate survives dedupe under section 10.6.
5. The item is either not present in the baseline, or is materially changed versus the baseline.

A candidate becomes `new_opportunity` when **any one** of these baseline comparisons is true:

- the `opportunity_dedupe_key` does not exist in the prior run
- the same entity has a new `signal_type`
- the same entity and signal type has a new event date with stronger evidence inside the current window
- a prior watchlist item moves from `L` to `M` or `H` due to new corroboration
- a vendor-side event creates a new replacement / migration / partner opening that did not exist in the prior run

A candidate becomes `changed_opportunity` when the prior row exists but one of these fields changed materially:

- `confidence`
- `term_status`
- `required_vendor_tags`
- `source_url` / strongest evidence set
- recommended action (for example from `monitor` to `identify_contact`)

A candidate stays `watch_only` and is **not** promoted into the official delta when:

- it is outside the window
- it is only generic hiring growth
- it is paywalled-only with no accessible corroboration
- it is a duplicate / repost
- it lacks an HR systems implication

### 10.8 Weekly-to-monthly cadence

| Cadence | Required action | Required output |
|---|---|---|
| Weekly | Run all signal queries, capture candidate evidence, dedupe, flag provisional escalations | working notes or queue; no final dated delta required |
| Month-end consolidation | Re-run critical sources for the month, compare against baseline run, finalize entity and opportunity changes | `Reports/OPC1-monitor-delta-summary-<YYYY-MM-DD>.md`, `Reports/OPC1-monitor-delta-companies-<YYYY-MM-DD>.csv`, `Reports/OPC1-monitor-delta-vendors-<YYYY-MM-DD>.csv` |

### 10.9 Delta output schema

Do **not** invent a new filename family. Use the existing dated delta outputs and populate them with the fields below.

#### 10.9.1 Company delta CSV schema

Filename: `Reports/OPC1-monitor-delta-companies-<YYYY-MM-DD>.csv`

| Column | Required | Meaning |
|---|---:|---|
| `change` | yes | `added`, `removed`, `changed` |
| `run_date` | yes | current `RUN_DATE` |
| `baseline_run_date` | yes | prior run date used for comparison |
| `company_id` | no | stable ID if available |
| `company_name` | yes | canonical display name |
| `dedupe_key` | yes | `company_id` or normalized company name |
| `changed_fields` | no | pipe-delimited list for `changed` rows |
| `reason` | yes | short explanation of the delta |
| `evidence_url` | no | strongest public evidence URL |
| `evidence_date` | no | publication / announcement date |

#### 10.9.2 Vendor delta CSV schema

Filename: `Reports/OPC1-monitor-delta-vendors-<YYYY-MM-DD>.csv`

| Column | Required | Meaning |
|---|---:|---|
| `change` | yes | `added`, `removed`, `changed` |
| `run_date` | yes | current `RUN_DATE` |
| `baseline_run_date` | yes | prior run date used for comparison |
| `vendor_id` | no | stable ID if available |
| `vendor_name` | yes | canonical display name |
| `dedupe_key` | yes | `vendor_id` or normalized vendor identity |
| `changed_fields` | no | pipe-delimited list for `changed` rows |
| `reason` | yes | short explanation of the delta |
| `evidence_url` | no | strongest public evidence URL |
| `evidence_date` | no | publication / announcement date |

#### 10.9.3 Delta summary markdown schema

Filename: `Reports/OPC1-monitor-delta-summary-<YYYY-MM-DD>.md`

The summary markdown must contain these blocks in order:

1. current run metadata: `RUN_DATE`, `AS_OF_DATE`, `LOOKBACK_START`
2. baseline references: prior company file, prior vendor file, prior delta summary if present
3. counts: companies added / removed / changed; vendors added / removed / changed; opportunities new / changed / watch_only
4. link block pointing to the two delta CSVs
5. an embedded opportunity delta table with columns:
   - `change_type`
   - `entity_name`
   - `signal_type`
   - `event_date`
   - `confidence`
   - `term_status`
   - `dedupe_key`
   - `reason`
   - `evidence_url`
6. operator notes: source gaps, unresolved duplicates, and follow-up actions

### 10.10 Exact since-last-run comparison logic

Apply comparisons in this order during monthly consolidation:

1. Identify the baseline run from section 10.2.
2. Load the current cycle's company, vendor, and candidate-opportunity rows.
3. Normalize names and URLs using the dedupe rules in section 10.6.
4. Compare company entities against `BASELINE_COMPANY_FILE` using `company_id`, else normalized `company_name`.
5. Compare vendor entities against `BASELINE_VENDOR_FILE` using `vendor_id`, else normalized `vendor_name` plus domain.
6. Compare opportunity candidates against the prior run's summary/opportunity block using `opportunity_dedupe_key`.
7. Classify each current row as `added`, `removed`, `changed`, or `unchanged`.
8. For `changed`, record the exact field-level reason in `changed_fields` and `reason`.
9. Exclude `unchanged` rows from the final delta CSVs, but keep them in working notes if needed.
10. Write the current dated delta outputs and explicitly reference the baseline filenames used.

### 10.11 Evidence recording rules

For every escalated opportunity or entity delta, record enough evidence so a second operator can audit the decision without asking the original operator what they meant.

Minimum evidence package per promoted row:

- source URL
- source title
- publication date
- 1-2 sentence excerpt or notes snippet
- source type (`official_site`, `news`, `job_board`, `regulatory`, `social`, `report`, `database`, `other`)
- whether the source is primary or secondary
- why the item passed escalation
- if changed, which baseline field changed

### 10.12 SOP executability checklist

A monthly monitoring cycle passes only if the operator can answer **yes** to every check below:

- Was `RUN_DATE` / `AS_OF_DATE` / `LOOKBACK_START` written down before the scan started?
- Was a concrete baseline run selected from dated `Reports/` artifacts?
- Were all six signal types scanned with the exact query logic above?
- Were concrete sources checked across news, funding, vendor releases, job postings, company sites, and policy/regulatory channels?
- Were dedupe keys applied before escalation?
- Were `new_opportunity` versus `changed_opportunity` decisions tied to explicit baseline comparisons?
- Were outputs written using the existing `OPC1-monitor-delta-summary`, `OPC1-monitor-delta-companies`, and `OPC1-monitor-delta-vendors` filename families?
- Does the summary markdown contain an opportunity delta table plus operator notes on unresolved items?

If any answer is **no**, the monthly run is incomplete and must not be treated as the new baseline.

---

## 11. Outreach Action Pack

This section gives the outreach owner a **ready-to-use manual pack** for the two approved OPC1 directions:

1. vendor / partner outreach to confirm referral, reseller, implementation, or commission terms
2. target-company outreach to validate HRIS demand, timing, and buying window

Use these templates only after a row is already grounded in the canonical match table or monitoring queue. Keep all placeholders as structured fields until the operator has a verified contact path.

### 11.1 Outreach guardrails

- Start from rows that already have a clear `company_name`, `vendor_name`, `match_status`, `term_status`, and `next_action`.
- Do **not** claim a referral, reseller, implementation, or commission arrangement as fact unless `term_status = publicly_confirmed` and a public source says so.
- If terms are unknown, state that the team is validating partner model and onboarding requirements.
- Personalize only from public evidence already captured in OPC1 (`signal_type`, source notes, required modules, match rationale, public vendor evidence).
- Do not include personal phone numbers, private email addresses, or invented contact details in saved templates.

### 11.2 Cold email template — vendor / partner outreach (referral confirmation)

**Use when:** `match_status` is `ready_to_contact` or `contacted` and `term_status` is `needs_confirmation` or `not_disclosed`.

**Subject options**
- OPC1 partnership inquiry for {{vendor_name}} and {{company_name}}
- Confirming referral / implementation terms for {{vendor_name}}
- Potential HRIS fit for {{company_name}} — partner terms check

**Template**

```text
Hi {{contact_name}},

I’m reaching out from {{team_name}} regarding a current HRIS matching review for {{company_name}}. Based on public evidence, we believe {{vendor_name}} may be relevant for {{use_case_summary}}.

Before we progress the opportunity internally, we want to confirm your current partner / referral motion for this type of account. Could you help clarify:
- whether you support referral, reseller, or implementation-partner collaboration for this segment
- whether there are any standard onboarding steps, qualification requirements, or regional restrictions
- who the right owner is for next-step coordination if this is a fit

If helpful, we can share a short summary of the use case and timing window.

Thank you,
{{sender_name}}
{{team_name}}
{{generic_contact_channel}}
```

**Operator note:** If the vendor only supports direct sales, update `next_action` to `monitor` or `identify_contact` and record the exact routing answer in notes.

### 11.3 Cold email template — target-company outreach (demand validation)

**Use when:** the monitoring evidence suggests an active HRIS / ATS / payroll / WFM need and the row is approved for validation outreach.

**Subject options**
- Quick question on {{company_name}}’s HR systems priorities
- Validating HRIS timing for {{company_name}}
- Short outreach on {{company_name}}’s recruiting / payroll / workforce tooling plans

**Template**

```text
Hi {{contact_name}},

I’m with {{team_name}} and we track public signals related to HR systems, recruiting operations, payroll, and workforce management in China. We recently noted {{public_signal_summary}} and wanted to validate whether {{company_name}} is actively reviewing related systems or workflows this cycle.

We are not asking for confidential information. We are simply trying to understand:
- whether this area is a live priority
- whether the current need is exploratory, budgeted, or already in evaluation
- whether there is a practical window for a short follow-up conversation

If this is not your area, a redirect to the relevant HR, HRIS, payroll, or digital transformation owner would be appreciated.

Best regards,
{{sender_name}}
{{team_name}}
{{generic_contact_channel}}
```

**Operator note:** Keep the ask focused on timing, ownership, and category need. Do not pitch product claims not supported by the match rationale.

### 11.4 Call script template

Keep the live call under 3 minutes on first contact. The operator should cover **4 points only** and stop if the contact is not the right owner.

#### 11.4.1 Vendor / partner call script

```text
Hello, this is {{sender_name}} from {{team_name}}. We’re reviewing whether {{vendor_name}} could be relevant for a current HRIS opportunity tied to {{company_name}}.

The quick reason for my call is to confirm your partner motion for this type of account.

1. Are referral, reseller, or implementation-partner routes available for this segment or region?
2. If yes, what are the standard onboarding or qualification steps?
3. Is there a partner manager or channel owner we should speak with next?
4. If commercial terms are not public, what is the correct process to request them?

Thanks — I’m only looking to confirm routing and next steps, not negotiate anything on this call.
```

#### 11.4.2 Target-company call script

```text
Hello, this is {{sender_name}} from {{team_name}}. I’m calling because we saw a public signal related to {{public_signal_summary}} and wanted to check whether {{company_name}} is actively reviewing HRIS, ATS, payroll, or workforce-management priorities.

1. Is this a live initiative, a watchlist item, or not a current priority?
2. Is there an owner for this workflow or system area?
3. Is there a likely review or buying window in the next 3-6 months?
4. If now is not the right time, when would a lightweight follow-up be more appropriate?

Thank you — we’re only validating demand and timing.
```

### 11.5 Short IM / WeChat / LinkedIn intros

Keep these under 100 words. Send only after the row has a clear reason for contact.

#### 11.5.1 Vendor / partner intro

```text
Hi {{contact_name}} — I’m with {{team_name}} and we’re reviewing {{vendor_name}} for a current HRIS opportunity involving {{company_name}}. Could you point me to the right person to confirm partner / referral / implementation terms and onboarding steps for this segment? Thank you.
```

#### 11.5.2 Target-company intro

```text
Hi {{contact_name}} — I’m with {{team_name}} and we track public HR systems signals. We recently noted {{public_signal_summary}} at {{company_name}} and wanted to ask whether HRIS / ATS / payroll / WFM planning is active this cycle, or who the right owner would be for a brief validation chat. Thank you.
```

### 11.6 Commission / terms confirmation questionnaire

Use this only for vendor / partner-side outreach. Record answers in structured notes and keep unknown items blank rather than inferred.

| # | Question | Why it matters |
|---|---|---|
| 1 | What partner motion applies here: referral, reseller, implementation, co-sell, or direct only? | Determines whether the row can progress beyond `needs_confirmation` |
| 2 | Is the motion available for {{region_name}} and {{target_segment}}? | Confirms region/segment eligibility before handoff |
| 3 | Are there minimum deal-size, module-scope, or account-qualification thresholds? | Screens out mismatched opportunities early |
| 4 | What onboarding steps are required before a partner can introduce or support an opportunity? | Defines the operational path to activation |
| 5 | Is there a named partner manager, channel owner, or application form for next steps? | Gives the operator a concrete routing path |
| 6 | Are implementation services delivered directly, through certified partners, or both? | Clarifies delivery feasibility and partner dependence |
| 7 | If referral or partner compensation exists, how is it structured at a high level? | Allows factual note-taking without inventing rates |
| 8 | Are there restrictions on industry, company size, geography, or competitor displacement cases? | Prevents wasted follow-up on excluded accounts |
| 9 | What proof points or discovery inputs do you require before reviewing a specific account? | Helps the operator prepare the next package properly |
| 10 | What is the expected response time and next-step sequence after submission? | Supports follow-up cadence and queue management |

### 11.7 Tracking SOP for outreach execution

This SOP keeps outreach updates tied to the canonical OPC1 match workflow rather than scattered notes.

#### 11.7.1 Minimum status fields to track

| Field | Required use |
|---|---|
| `company_name` | Target account tied to the opportunity |
| `vendor_name` | Vendor or partner being validated |
| `match_status` | Use closed values: `pending`, `ready_to_contact`, `contacted`, `confirmed`, `rejected`, `closed` |
| `term_status` | Use closed values: `publicly_confirmed`, `indirectly_inferred`, `needs_confirmation`, `not_disclosed` |
| `next_action` | Use closed values such as `identify_contact`, `send_email`, `call`, `wechat_followup`, `request_terms`, `monitor`, `close` |
| `contact_method` | Record the actual channel used: `email`, `phone`, `wechat`, `linkedin`, `website_form`, `other` |
| `contact_detail` | Save role mailbox, public form URL, or generic channel handle only; avoid private personal data in the brief |
| `last_contact_date` | Date of the latest outbound or inbound interaction |
| `follow_up_due_date` | Next date the operator should act |
| `owner` | Person responsible for the next step |
| `notes` | Fact-based recap of what was confirmed, denied, or redirected |

#### 11.7.2 Follow-up cadence

| Current state | Required next step | Default timing |
|---|---|---|
| `ready_to_contact` + no outreach sent | send the appropriate cold email or intro | same business day or next business day |
| `contacted` + no reply | send one short follow-up on the same channel | 3 business days |
| `contacted` + still no reply after follow-up | try an alternate channel (`call` or `wechat_followup`) if a public path exists | 5-7 business days from first touch |
| redirected to another owner | update `contact_detail`, keep `match_status = contacted`, and resend to the new owner | within 2 business days |
| terms partially confirmed | update notes, keep `term_status = indirectly_inferred` or `needs_confirmation`, request the missing item directly | within 2 business days |
| demand validated but buying window unclear | set `next_action = monitor` with a dated follow-up point | 14-30 calendar days depending on urgency |
| explicit no-fit / no-motion answer | set `match_status = rejected` or `closed` and record the reason | same day |

#### 11.7.3 Backfill instructions

1. Start from the existing match row rather than a separate outreach-only tracker.
2. After each touch, update `match_status`, `term_status`, `next_action`, `contact_method`, `contact_detail`, `last_contact_date`, and `follow_up_due_date`.
3. Copy only factual outcomes into `notes`: confirmed route, denied route, redirect, timing signal, or no-response milestone.
4. If a public source later confirms terms, upgrade `term_status` only after attaching that evidence URL/date to the canonical row.
5. If the outreach disproves the match, preserve the history in notes and move the row to `rejected` or `closed`; do not delete the row.
6. During monthly review, backfill all outreach outcomes into the same queue/filter used for `needs_confirmation`, `pending`, `ready_to_contact`, and `changed` rows.

---

## 12. Tooling PRD (MVP) + options comparison (Task 17)

This section defines the **minimum viable tooling** needed to run OPC1 as an ongoing operating system rather than a one-off report. It stays aligned with the canonical schema, scoring logic, outputs and monitoring SOP already defined in this brief.

### 12.1 Product goal

Build a lightweight internal toolset that helps one operator or a small team do four things reliably:

1. ingest public-source evidence from the monitoring channels in section 10
2. store and update canonical OPC1 entities without breaking schema rules
3. track opportunity -> vendor -> outreach progress over time
4. generate since-last-run deltas plus CSV/XLSX exports for report production

The MVP is a **workflow enabler**, not a crawler platform, CRM replacement, or production data platform.

### 12.2 Target users and roles

| Role | Primary responsibility | What the MVP must let them do |
|---|---|---|
| `operator` | Run weekly scans and monthly consolidation | create/update monitor candidates, attach evidence, classify `signal_type`, assign `confidence`, export deltas |
| `research_lead` | Review quality and approve promotion into official outputs | validate evidence threshold, resolve duplicates/conflicts, approve `new_opportunity` / `changed_opportunity` |
| `outreach_owner` | Follow up on shortlisted matches and term confirmation | review `match_status`, update `next_action`, backfill `term_status`, record contact progress |
| `admin` | Maintain controlled vocabularies and job configuration | manage field mappings, date freeze settings, export templates, scheduled refresh settings |

### 12.3 User problems to solve

- Evidence is currently spread across notes, reports, and scripts, which makes monthly re-checks harder than they should be.
- The monitoring SOP is executable, but an operator still needs a structured place to store candidates, compare them with the baseline, and promote them into canonical outputs.
- Outreach follow-up can drift from the underlying evidence if `match_status`, `term_status`, and `next_action` are tracked outside the same operating surface.
- Future engineering work needs a precise MVP scope so implementation can start without inventing hidden requirements.

### 12.4 MVP inputs

The MVP must accept these inputs directly, with field names aligned to the canonical schema above:

| Input category | Required contents | Notes |
|---|---|---|
| Baseline snapshots | latest dated company, vendor, and delta artifacts under `Reports/` | used for since-last-run comparison |
| Monitoring candidate captures | entity name, source URL, source title, publication date, evidence snippet, source type, primary/secondary flag | captured during weekly scan before promotion |
| Canonical table rows | company, vendor, opportunity, match, monitor-spec fields from sections 2-6 | closed enums and required columns remain authoritative |
| Manual review decisions | duplicate resolution, confidence adjustments, `term_status`, `match_status`, `next_action` | required because public evidence is incomplete for some rows |
| Run metadata | `RUN_DATE`, `AS_OF_DATE`, `LOOKBACK_START`, `BASELINE_RUN_DATE` | must be frozen per cycle per section 10.2 |

### 12.5 MVP outputs

| Output | Minimum requirement | Must stay aligned with |
|---|---|---|
| Canonical working tables | editable company / vendor / opportunity / match / monitor records | sections 2-6 |
| Monthly delta package | `Reports/OPC1-monitor-delta-summary-<YYYY-MM-DD>.md`, company delta CSV, vendor delta CSV | section 10.9 |
| Export package | schema-ordered CSV/XLSX for current run deliverables | section 1.3 + section 7 |
| Review queue | list of rows needing confirmation, conflict resolution, or outreach follow-up | `confidence`, `term_status`, `match_status`, `next_action` enums |
| Audit trace | per-row evidence links, timestamps, and changed-fields notes | section 10.11 |

### 12.6 Canonical MVP data model

The MVP must reuse the existing OPC1 canonical tables as the source of truth. It should not introduce a conflicting business object model.

#### 12.6.1 Authoritative entities

| Canonical table | Purpose in MVP | Key fields that must remain unchanged |
|---|---|---|
| Company master | target-company universe and baseline comparison | `company_id`, `company_name`, `company_market_status`, `sector_primary`, `employee_band`, `universe*` |
| Vendor table | Top100 / longlist vendor tracking | `vendor_id`, `vendor_name`, `vendor_type`, `vendor_tags`, `target_segment_fit`, `industry_strengths`, `vendor_score` |
| Opportunity table | dated HRIS demand signal tracking | `opportunity_id`, `company_id`, `signal_type`, `required_vendor_tags`, `signal_date`, `confidence`, `term_status`, `opportunity_score` |
| Match table | vendor shortlist plus outreach state | `match_id`, `opportunity_id`, `vendor_id`, `match_type`, `delivery_feasibility`, `match_score`, `match_status`, `next_action`, `term_status` |
| Monitoring spec table | operator source/query catalog | `monitor_id`, `monitor_domain`, `source_url`, `query_or_rule`, `cadence`, `action_on_change` |

#### 12.6.2 Supporting MVP records

These are **supporting workflow records**, not replacements for the canonical tables:

| Supporting record | Why the MVP needs it | Minimum fields |
|---|---|---|
| `run_cycle` | freeze a single monitoring/export cycle | `run_date`, `as_of_date`, `lookback_start`, `baseline_run_date`, operator, status |
| `evidence_capture` | preserve source package before a row is promoted | entity reference, source URL, source title, publication date, snippet, source type, primary/secondary flag |
| `review_decision` | preserve why a row was promoted, downgraded, merged, or held | row reference, reviewer, decision type, changed fields, rationale, timestamp |

Guardrail: if a supporting record duplicates a canonical field, the canonical table remains authoritative for export.

### 12.7 Core MVP workflow

#### 12.7.1 Weekly scan flow

1. Create a `run_cycle` and freeze `RUN_DATE` / `AS_OF_DATE` / `LOOKBACK_START`.
2. Pull the active monitor list from the monitoring spec table.
3. Capture candidate evidence into `evidence_capture` records.
4. Classify each candidate with proposed `signal_type`, `confidence`, and entity linkage.
5. Run dedupe against the rules in section 10.6.
6. Place unresolved rows into the review queue instead of promoting them silently.

#### 12.7.2 Monthly consolidation flow

1. Select the baseline files from the latest prior dated run.
2. Compare current canonical entities and candidates against the baseline using the dedupe keys from section 10.6.
3. Mark rows as `added`, `removed`, `changed`, or `unchanged`.
4. Require reviewer approval for rows with weak evidence, field conflicts, or `needs_confirmation` commercial terms.
5. Generate the section 10.9 delta outputs.
6. Export the current run's schema-ordered CSV/XLSX outputs for downstream reports.

#### 12.7.3 Outreach follow-up flow

1. Start from approved match rows only.
2. Let the outreach owner update `match_status`, `next_action`, `contact_method`, `contact_detail`, and `term_status`.
3. If partner terms become public, require structured backfill into the match table rather than free-text-only notes.
4. If no confirmation is obtained, keep the row at `needs_confirmation` or `not_disclosed`; do not invent values.

### 12.8 MVP scope

The MVP must include the following capabilities and may defer everything else:

| In scope for MVP | Why it is needed now |
|---|---|
| Canonical table CRUD with field validation | without this, the schema contract will drift immediately |
| Evidence capture linked to rows | required for traceability and reproducible review |
| Review queue for duplicate/conflict/confidence decisions | public-source research is noisy and cannot be fully auto-promoted |
| Since-last-run comparison using baseline snapshots | this is the heart of Task 16 + Task 17 usefulness |
| CSV/XLSX export using fixed column order | required by the report deliverables and QA gates |
| Basic outreach status tracking on match rows | enough to keep opportunity -> vendor follow-up in one place |
| Manual job trigger or simple scheduled refresh | enough to support weekly scan + monthly consolidation cadence |

### 12.9 Explicit non-goals

The MVP must **not** try to do the following:

- no production-grade crawler platform
- no autonomous outbound email, calling, or messaging
- no automatic commission-rate inference from weak evidence
- no replacement of the canonical markdown brief as the business-spec source of truth
- no advanced BI dashboarding beyond basic filters/views needed for operators
- no broad generic CRM implementation unrelated to OPC1 opportunity matching
- no new scoring model that conflicts with section 1.5

### 12.10 Functional requirements

| ID | Requirement | Acceptance intent |
|---|---|---|
| FR-1 | The system must enforce the closed enums and required fields defined in sections 1.2 and 2-6 during data entry/import. | Prevent schema drift and invalid exports |
| FR-2 | The system must let an operator attach multiple evidence captures to one entity/opportunity/match. | Preserve corroboration and auditability |
| FR-3 | The system must preserve frozen run metadata per monitoring cycle. | Keep the 90-day window reproducible |
| FR-4 | The system must compute or re-compute `opportunity_score`, `vendor_score`, and `match_score` from canonical inputs only. | Keep rankings reproducible |
| FR-5 | The system must generate since-last-run comparisons against the chosen baseline run. | Support Task 16 monthly delta workflow |
| FR-6 | The system must export CSV/XLSX files whose column order exactly matches the canonical schemas. | Keep QA deterministic |
| FR-7 | The system must support review actions for duplicate merge, confidence change, term-status update, and promotion/hold decisions. | Avoid silent operator judgment |
| FR-8 | The system must expose a simple queue/filter for rows in `needs_confirmation`, `pending`, `ready_to_contact`, or `changed`. | Make follow-up actionable |

### 12.11 Non-functional requirements

| Area | MVP requirement |
|---|---|
| Reliability | A failed export or comparison run must leave the prior baseline untouched. |
| Auditability | Every promoted or materially changed row must keep evidence URL, date, and reviewer/operator attribution. |
| Simplicity | One technically capable operator should be able to run and maintain the MVP without a dedicated platform team. |
| Portability | Data must remain exportable to plain CSV/XLSX/Markdown-adjacent artifacts; no lock-in to a black-box format. |
| Maintenance | Routine monthly operation should be possible with light script/config upkeep, not continuous engineering support. |

### 12.12 Implementation notes for engineering

- Start from the existing Python scripts and filename families rather than replacing them wholesale.
- Treat the canonical schemas in this brief as contract-first definitions; implementation may add helper fields internally, but exports must map back cleanly.
- Keep scoring as deterministic functions over stored fields, not prompt-time reasoning.
- Separate three stages clearly: evidence capture, review decision, canonical export.
- Use a lightweight scheduler or manual trigger for the weekly/monthly jobs; do not scope a distributed job system into MVP.
- Prefer append-only review/audit records for decisions so later QA can reconstruct why a row changed.
- Design imports/exports so the markdown brief, CSV/XLSX outputs, and simple scripts can coexist during transition.

### 12.13 Options comparison (lightweight implementation paths)

#### 12.13.1 Option A — Obsidian + tables

**Shape:** keep most workflow inside the existing vault using markdown tables/properties, with minimal helper scripts for export and validation.

| Dimension | Assessment |
|---|---|
| Fit to current repo | Very high for documentation-first work; lowest migration cost |
| Cost | Lowest |
| Build speed | Fastest initial setup |
| Operational risk | Medium-high once row count and monthly diffs grow |
| Maintenance | Low at first, but manual overhead grows quickly |
| Strengths | Excellent for narrative context, decision logs, and single-operator notes |
| Weaknesses | Weak row-level validation, weak concurrent editing, awkward delta computation, hard to keep schema-order exports clean at scale |

**Best when:** the MVP is mainly for one operator doing low-volume manual tracking.

#### 12.13.2 Option B — Spreadsheet + scripts

**Shape:** keep canonical tables in one or more spreadsheets, and use Python scripts for validation, scoring, delta generation, and CSV/XLSX export.

| Dimension | Assessment |
|---|---|
| Fit to current repo | High; closest to existing `opc1_generate.py` / `opc1_monitor.py` workflow |
| Cost | Low |
| Build speed | Fast |
| Operational risk | Medium; spreadsheets can drift, but scripts can police structure |
| Maintenance | Moderate and manageable for MVP |
| Strengths | Easy manual editing, familiar operator UX, script-friendly exports, low setup burden |
| Weaknesses | Needs discipline around schema locking, review history is weaker than a DB unless explicitly logged, concurrency is acceptable but not ideal |

**Best when:** the goal is a practical MVP that one small team can adopt quickly without infrastructure overhead.

#### 12.13.3 Option C — Simple DB + scheduled job

**Shape:** store canonical tables in a lightweight database with a small internal admin UI or forms layer, plus scheduled Python jobs for refresh/export.

| Dimension | Assessment |
|---|---|
| Fit to current repo | Medium; requires more new implementation than Options A/B |
| Cost | Low-to-medium |
| Build speed | Slowest of the three |
| Operational risk | Lowest data-integrity risk once built correctly |
| Maintenance | Highest engineering maintenance among the MVP options |
| Strengths | Strong validation, cleaner audit trail, better row relationships, easiest future evolution beyond MVP |
| Weaknesses | More upfront engineering, more deployment/ops choices, easier to overbuild into a platform project |

**Best when:** the team already knows it will continue beyond pilot scale and can afford slightly higher engineering setup now.

### 12.14 Recommended MVP choice

**Recommended default: Option B — Spreadsheet + scripts.**

Reasoning:

- It matches the current operating reality: markdown brief + Python scripts + dated `Reports/` exports.
- It can enforce most of the hard requirements in this PRD without prematurely building a platform.
- It keeps operator editing simple while still allowing deterministic QA, scoring, and delta generation.
- It leaves a clean upgrade path to Option C later if row volume, audit demands, or multi-user complexity make spreadsheets too fragile.

### 12.15 Decision criteria for moving beyond the MVP

Upgrade from Option B to Option C only when at least one of these becomes true:

- monthly row volume or evidence volume makes spreadsheet review materially slow or error-prone
- multiple users are editing the same canonical rows frequently
- auditability requirements exceed what review logs plus exports can comfortably support
- scheduled refreshes and export jobs become operationally critical enough that ad hoc script execution is no longer acceptable

### 12.16 PRD completeness checklist

This Task 17 PRD is complete only if an engineering agent can answer **yes** to every question below directly from this section and the already referenced sections of the brief:

- Are the intended users and their roles explicit?
- Are the required inputs and outputs explicit?
- Is the MVP data model tied to the canonical OPC1 tables instead of a new conflicting model?
- Is the weekly scan -> monthly consolidation -> outreach update workflow explicit?
- Are in-scope items and non-goals explicit?
- Are implementation constraints and recommended MVP option explicit?
- Are cost, risk, and maintenance trade-offs compared across the lightweight options?

If any answer is **no**, the PRD must be revised before engineering starts.


## 13. Appendix — Data Quality Rules (Task 18)

This appendix hardens the operator workflow around sections 1.4.5, 4.1, 5.1, and 10.6. Use it when the same company or opportunity appears under competing names, sources, dates, or market-status interpretations. The goal is to make conflict handling reproducible without rewriting historical evidence artifacts.

### 13.1 Resolution order: which source wins

Apply this precedence order before promoting or editing any canonical row:

1. newer **primary** source with a recoverable original publication / announcement date
2. older primary source if the newer item is only a rewrite or commentary page
3. corroborated secondary public sources on distinct domains
4. single secondary public source
5. paywalled-only, undated, or repost-only context

Operational rules:

- If two sources disagree and one is a newer primary source, update the canonical row to the newer primary source and move the displaced URL into `supporting_source_urls`, `supporting_evidence_urls`, or `notes`.
- If the conflict is still unresolved after checking source type and date, **preserve both sources** in the row-level evidence trail and cap `confidence` at `M`.
- Do not delete or overwrite historical pilot/control artifacts only to make names match a later canonical snapshot; record the reconciliation logic in `notes` instead.

### 13.2 Company/entity conflict handling

#### 13.2.1 Listed/private overlap

When the same normalized entity appears in both the listed backbone and a private-ranking anchor:

- keep **one** company row
- keep the listed ticker / exchange fields if they exist
- set `company_market_status = mixed`
- preserve **both** provenance URLs in `notes`
- record the resolution explicitly, for example `conflict_resolution=listed_backbone+private_ranking_overlap=>mixed`

This is the required treatment for current examples such as `比亚迪`, `长城汽车`, and `顺丰控股`.

#### 13.2.2 Parent / subsidiary / operating-unit naming

Do **not** automatically collapse a source-named subsidiary, local operating company, or business unit into the parent brand.

Keep a separate row or opportunity scope when **any** of the following is true:

- the source explicitly names the local entity or operating unit (`Starbucks China`, `Foxconn Zhengzhou Operations`, `Eli Lilly China`)
- the hiring / expansion / compliance signal is clearly specific to that operating unit
- merging upward would lose geography, plant, store-network, or labor-model specificity that affects matching

Only roll the row up to the parent when a primary source explicitly confirms the parent and subsidiary are interchangeable for the event being captured. Otherwise, keep the source-named entity as canonical for that row and add the parent brand only as alias / notes context.

#### 13.2.3 Alias / language drift across outputs

When current and historical artifacts use different names for the same entity (`京东` vs `JD.com, Inc.`, `比亚迪` vs `BYD Company Limited`):

- normalize both names using the section 2.1 rules
- reconcile using canonical company identity plus dated artifact context, not display name only
- keep the later canonical snapshot untouched and keep the earlier pilot/control artifact untouched
- document the alias mapping in review notes instead of rewriting historical evidence files

### 13.3 Multiple opportunities per company

One company may legitimately have multiple active opportunities. Do **not** collapse opportunities to one row per company.

Keep separate opportunity rows whenever **any** of the following changes:

- `signal_type`
- original event date
- stable source anchor (`official notice ID`, `job posting ID`, procurement ID, release slug, or canonical URL path)
- the source names a different operating unit that matters for delivery or matching

Collapse rows only when the section 10.6.2 `opportunity_dedupe_key` is materially the same. If a later source is just a stronger confirmation of the same event, keep one canonical row, upgrade the primary evidence if appropriate, and preserve the displaced source as supporting evidence.

### 13.4 Stale, repost, and time-window drift

Use the **original publication / announcement date** as `signal_date`, `event_date`, or `evidence_date` whenever it is recoverable.

- A later page refresh, repost, or syndication timestamp does **not** reopen the 90-day window.
- If the original date is recoverable from the URL slug, filing ID, or page metadata, use that original date for dedupe and freshness checks.
- If the original date cannot be recovered, the row may remain watchlist/context only, but it must not be promoted as a fresh high-confidence opportunity.
- Reposts stay attached to the same canonical opportunity and should not create a second row.

### 13.5 Paywalled evidence and confidence downgrades

Treat paywalled sources as lead-generation context, not as self-sufficient confirmation.

- `paywalled` can be noted in `notes`, but it does **not** justify `confidence = H` by itself.
- A paywalled-only claim must stay below `H` and below `publicly_confirmed` unless accessible corroboration is added.
- If commercial terms, partner status, or migration claims come only from paywalled or inaccessible reporting, keep `term_status` at `needs_confirmation` or `not_disclosed`.
- If a public accessible source later confirms the same claim, retain the paywalled lead in notes/supporting evidence, but promote the row using the accessible corroboration.

### 13.6 Operator decision table

| Conflict pattern | Required operator action | Field/result expectation |
|---|---|---|
| Same entity appears in listed + private sources | Keep one company row, preserve both provenance URLs, set `company_market_status = mixed` | No duplicate company row; ticker retained if listed |
| Same event appears in multiple source URLs | Keep one opportunity row, pick strongest / newer primary source, move the rest to supporting evidence | `opportunity_dedupe_key` unchanged |
| Source names subsidiary / local opco rather than parent | Keep source-named entity unless primary evidence proves parent-level equivalence | Avoid losing delivery-relevant operating detail |
| Same entity appears under Chinese/English aliases across snapshots | Reconcile by normalized identity + artifact date; do not rewrite archived artifacts | Alias noted; archived evidence semantics preserved |
| Repost or syndicated rewrite appears later | Keep earliest original dated source as freshness anchor | No artificial reset of the 90-day window |
| Paywalled-only confirmation | Keep below `H`; do not upgrade `term_status` to `publicly_confirmed` | Row stays reviewable and operator-actionable, not over-claimed |

---

## Task 12 opportunity-matching summary

<!-- task-12-summary:start -->

| opportunity_id | company_name | sector_primary | signal_date | top_vendor | top_score | next_action |
|---|---|---|---|---|---:|---|
| O032 | 中国中车 | advanced_manufacturing | 2026-01-21 | 北森 | 100 | identify_contact |
| O025 | 广汇集团 | advanced_manufacturing | 2026-01-27 | 北森 | 100 | identify_contact |
| O009 | 金山办公 | internet_software | 2026-02-05 | 用友大易 | 100 | identify_contact |
| O028 | 多弗国际 | advanced_manufacturing | 2026-02-10 | 北森 | 100 | identify_contact |
| O011 | 指南针 | internet_software | 2026-02-14 | 用友大易 | 100 | identify_contact |
| O046 | 华天科技 | advanced_manufacturing | 2026-02-21 | 北森 | 100 | identify_contact |
| O012 | 昆仑万维 | internet_software | 2026-02-28 | 用友大易 | 100 | identify_contact |
| O008 | 完美世界 | internet_software | 2026-03-03 | 用友大易 | 100 | identify_contact |
| O016 | 神州数码 | internet_software | 2026-03-03 | 用友大易 | 100 | identify_contact |
| O049 | 国电南瑞 | advanced_manufacturing | 2026-03-04 | 北森 | 100 | identify_contact |

<!-- task-12-summary:end -->


## 14. Packaging appendix

### 14.1 Field dictionary

#### Company master
| Field | Definition |
|---|---|
| `company_id` | Stable company key (`^C\d{3}$`). |
| `company_name` | Canonical company name. |
| `company_aliases` | Pipe-delimited alias list for dedupe only. |
| `legal_name` | Official legal entity name, if known. |
| `company_market_status` | `listed` / `private` / `mixed` / `unknown`. |
| `sector_primary` | Primary sector label. |
| `listing_exchange` | Exchange code for listed names, if any. |
| `ticker` | Exchange ticker, if any. |
| `country` | Default operating country, usually `CN`. |
| `employee_band` | `smb` / `mid_market` / `enterprise_group` / `unknown`. |
| `universe` | Universe label used for inclusion. |
| `universe_as_of` | Snapshot date for the universe. |
| `universe_source_url` | Source URL for the universe inclusion. |
| `notes` | Free-text, non-key notes. |

#### Vendor table
| Field | Definition |
|---|---|
| `vendor_id` | Stable vendor key (`^V\d{3}$`). |
| `vendor_name` | Canonical vendor name. |
| `vendor_aliases` | Pipe-delimited alias list for dedupe only. |
| `vendor_type` | `software` / `service` / `hybrid` / `unknown`. |
| `vendor_tags` | Controlled module vocabulary (pipe-delimited). |
| `target_segment_fit` | Pipe-delimited segment fit vocabulary. |
| `industry_strengths` | Pipe-delimited sector strengths. |
| `visibility_level` | `high` / `medium` / `low` / `unknown`. |
| `website_url` | Vendor site URL, if available. |
| `evidence_url` | Primary evidence URL for inclusion/scoring. |
| `supporting_evidence_urls` | Additional corroborating URLs. |
| `evidence_date` | Source publication / capture date. |
| `as_of_date` | Frozen run date for freshness scoring. |
| `confidence` | `H` / `M` / `L`. |
| `vendor_score` | Derived 0-100 score. |
| `notes` | Free-text, non-key notes. |

#### Opportunity table
| Field | Definition |
|---|---|
| `opportunity_id` | Stable opportunity key (`^O\d{3}$`). |
| `company_id` | Foreign key to company master. |
| `company_name` | Canonical company name for the company id. |
| `signal_type` | `hiring` / `expansion` / `compliance` / `replacement` / `vendor_event` / `funding_strategy`. |
| `signal_subtype` | Short narrowing descriptor, if needed. |
| `signal_summary` | One-line opportunity summary. |
| `required_vendor_tags` | Pipe-delimited vendor-module need. |
| `signal_date` | Original signal date. |
| `as_of_date` | Frozen run date for the 90-day window. |
| `source_type` | `official_site` / `news` / `job_board` / `regulatory` / `social` / `report` / `database` / `other`. |
| `source_url` | Primary evidence URL for the opportunity. |
| `supporting_source_urls` | Additional corroborating URLs. |
| `confidence` | `H` / `M` / `L`. |
| `term_status` | `publicly_confirmed` / `indirectly_inferred` / `needs_confirmation` / `not_disclosed`. |
| `contact_method` | `email` / `phone` / `wechat` / `linkedin` / `website_form` / `other`. |
| `contact_detail` | Specific contact detail, if known. |
| `opportunity_score` | Derived 0-100 score. |
| `notes` | Free-text, non-key notes. |

#### Match table
| Field | Definition |
|---|---|
| `match_id` | Stable match key (`^M\d{3}$`). |
| `opportunity_id` | Foreign key to opportunity table. |
| `company_id` | Foreign key to company master. |
| `company_name` | Canonical company name for the company id. |
| `vendor_id` | Foreign key to vendor table. |
| `vendor_name` | Canonical vendor name for the vendor id. |
| `match_type` | `direct` / `adjacent` / `ecosystem` / `alternative`. |
| `delivery_feasibility` | `high` / `medium` / `low` / `blocked`. |
| `match_score` | Derived 0-100 score. |
| `match_status` | `pending` / `ready_to_contact` / `contacted` / `confirmed` / `rejected` / `closed`. |
| `term_status` | `publicly_confirmed` / `indirectly_inferred` / `needs_confirmation` / `not_disclosed`. |
| `compensation_model` | Optional structured commercial model. |
| `compensation_rate_min_pct` | Optional minimum compensation rate. |
| `compensation_rate_max_pct` | Optional maximum compensation rate. |
| `contact_method` | `email` / `phone` / `wechat` / `linkedin` / `website_form` / `other`. |
| `contact_detail` | Specific contact detail, if known. |
| `source_url` | Evidence URL supporting the match. |
| `evidence_date` | Evidence capture / publication date. |
| `rationale` | Why the vendor fits the opportunity. |
| `next_action` | `identify_contact` / `send_email` / `call` / `wechat_followup` / `request_terms` / `monitor` / `close`. |
| `notes` | Free-text, non-key notes. |

#### Monitoring spec table
| Field | Definition |
|---|---|
| `monitor_id` | Stable monitor key (`^N\d{3}$`). |
| `monitor_name` | Human-readable monitor label. |
| `monitor_domain` | `demand` / `vendor` / `funding` / `policy` / `product` / `job_board` / `company_site` / `social` / `other`. |
| `source_name` | Source feed or site name. |
| `source_url` | Monitor source URL. |
| `query_or_rule` | Exact query, filter, or rule identifier. |
| `keywords` | Pipe-delimited keyword list. |
| `cadence` | `daily` / `weekly` / `biweekly` / `monthly`. |
| `as_of_date` | Frozen run date. |
| `freshness_window_days` | Freshness window, usually 90. |
| `last_checked_at` | ISO-8601 UTC timestamp. |
| `last_change_at` | ISO-8601 UTC timestamp. |
| `action_on_change` | `create_opportunity` / `update_opportunity` / `update_vendor` / `update_match` / `escalate` / `ignore`. |
| `owner` | Responsible person or system. |
| `notes` | Free-text, non-key notes. |

### 14.2 Confidence and term_status legend

| Field | Value | Meaning |
|---|---|---|
| `confidence` | `H` | Strong public evidence; use only when the row meets the highest corroboration bar. |
| `confidence` | `M` | Credible public evidence, but still needs confirmation. |
| `confidence` | `L` | Weak proxy or watchlist-only evidence. |
| `term_status` | `publicly_confirmed` | Commercial terms are explicitly stated in public evidence. |
| `term_status` | `indirectly_inferred` | Terms are inferred, not explicitly stated. |
| `term_status` | `needs_confirmation` | Opportunity exists, but terms are not verified. |
| `term_status` | `not_disclosed` | Terms are absent or explicitly undisclosed. |

### 14.3 Monthly update template

```md
## Since Last Run (<old RUN_DATE> → <new RUN_DATE>)
- Baseline snapshot: `Reports/<previous dated file>`
- Current snapshot: `Reports/<current dated file>`
- Companies added: N
- Companies removed: N
- Vendors added: N
- Vendors removed: N
- Matching changes: N added / N removed / N updated
- Notes: short explanation of the biggest deltas
```

### 14.4 Delivered artifact links

- Demand report: [`OPC1-demand-companies-500-china-2026-04-18.md`](OPC1-demand-companies-500-china-2026-04-18.md) → [`CSV`](OPC1-demand-companies-500-china-2026-04-18.csv)
- Vendor report: [`OPC1-vendors-top100-hris-china-2026-04-18.md`](OPC1-vendors-top100-hris-china-2026-04-18.md) → [`CSV`](OPC1-vendors-top100-hris-china-2026-04-18.csv)
- Matching table: [`OPC1-opportunity-matching-china-2026-04-18.csv`](OPC1-opportunity-matching-china-2026-04-18.csv)
