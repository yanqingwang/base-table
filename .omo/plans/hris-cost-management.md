# HRIS Cost Management Blueprint

## TL;DR
> **Summary**: Restructure `AITasks/HRIS Cost Management.md` into a decision-complete operating blueprint for managing HRIS and adjacent regional-owned system costs. The end state is a single source of truth that supports monthly and annual cost visibility, shared-cost allocation, renewal governance, multidimensional reporting, and channel-specific data capture rules.
> **Deliverables**:
> - Updated `AITasks/HRIS Cost Management.md` with complete scope, control model, reporting model, governance model, and rollout blueprint
> - Embedded appendices for canonical data model, reporting views, allocation rules, cadence, and worked examples
> - Evidence artifacts under `.sisyphus/evidence/`
> **Effort**: Medium
> **Parallel**: YES - 3 waves
> **Critical Path**: 1 → 3 → 4 → 5 → 8 → 10 → 11

## Context
### Original Request
Discuss and plan around `HRIS Cost Management.md`.

### Interview Summary
- Expected outcome is both **A + B**: improve/restructure the document and produce an executable management plan.
- Scope includes HRIS plus surrounding **regional-owned systems**.
- Primary goal is **budget visibility**.
- Primary owners are **HR + Finance**.
- Time horizon is **annual + monthly**.
- BPO handling is **layered**: the core ledger covers system-related BPO/service costs first, then expands via secondary views if needed.
- Planning depth is a **direct delivery blueprint**.
- Primary reporting grain is **country + system + cost category**.
- Shared regional costs are preserved at source, then allocated by rule while keeping a pre-allocation shared view.
- Financial states are **Actual / Budget / Forecast / Committed** plus **Recurring / One-time / Renewal Adjustment**.
- Currency policy is **transaction/local currency + reporting currency** with a fixed monthly FX rule.
- Bundled vendors are tracked primarily at **module level** while retaining vendor/contract dimensions.

### Metis Review (gaps addressed)
- Treated this as **architecture-level planning**, not a light document edit.
- Promoted a canonical atomic record so all views derive from the same base cost line.
- Added explicit treatment for allocation governance, FX policy, close/versioning rules, bundled vendors, and mixed BPO/service fees.
- Added guardrails to prevent scope creep into procurement, AP, payment execution, or full HRIS architecture redesign.

## Work Objectives
### Core Objective
Turn `AITasks/HRIS Cost Management.md` from a short note into a complete operating blueprint for HRIS cost management across regional-owned systems.

### Deliverables
- A rewritten `AITasks/HRIS Cost Management.md` with these sections:
  - Objective and scope
  - In-scope / layered-scope / out-of-scope cost taxonomy
  - Canonical atomic record and dimension dictionary
  - Financial-state model and lifecycle rules
  - Shared-cost allocation rules and lineage requirements
  - Currency / FX policy
  - Reporting-view catalog and export rules
  - WeChat capture vs desktop control workflow
  - Governance / RACI / operating calendar
  - Phased rollout blueprint
  - Worked examples and edge-case handling

### Definition of Done (verifiable conditions with commands)
- `grep -n "^## Objective and Scope" "AITasks/HRIS Cost Management.md"`
- `grep -n "^## Canonical Atomic Record" "AITasks/HRIS Cost Management.md"`
- `grep -n "^## Allocation Rules" "AITasks/HRIS Cost Management.md"`
- `grep -n "^## Reporting Views" "AITasks/HRIS Cost Management.md"`
- `grep -n "^## WeChat and Desktop Workflow" "AITasks/HRIS Cost Management.md"`
- `grep -n "^## Governance and Operating Calendar" "AITasks/HRIS Cost Management.md"`
- `grep -n "^## Implementation Blueprint" "AITasks/HRIS Cost Management.md"`
- `grep -n "2026-03 | Indonesia | Payroll | Actual" "AITasks/HRIS Cost Management.md"`
- `grep -n "Shared regional e-sign fee" "AITasks/HRIS Cost Management.md"`

### Must Have
- One canonical cost-line model that supports all required views.
- Country, system, cost category, vendor/contract, state, period, currency, owner, and allocation lineage.
- Distinct treatment for shared vs allocated costs.
- Renewals, changes, annual adjustments, and BPO/system-related service fees.
- WeChat submission rules and desktop control rules.
- Monthly + quarterly + annual governance cadence.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)
- No expansion into payment execution, AP posting, or invoice approval system implementation.
- No full procurement platform or vendor scorecard redesign.
- No vague phrases like “support multidimensional analysis” without exact dimensions, rules, or examples.
- No free-text master data design for country/system/category/vendor.
- No duplicated totals between module-level and contract-level views.

## Verification Strategy
> ZERO HUMAN INTERVENTION - all verification is agent-executed.
- Test decision: **none (document/blueprint work)** + verification by content assertions and worked-example checks
- QA policy: Every task includes agent-executed content checks and edge-case validation
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy
### Parallel Execution Waves
> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Tasks **1-4** — source doc restructure, scope taxonomy, canonical model, financial semantics

Wave 2: Tasks **5-8** — allocation/BPO policy, governance/master data, reporting catalog, capture/control workflow

Wave 3: Tasks **9-11** — operating calendar, tooling/rollout blueprint, consolidation with examples

### Dependency Matrix (full, all tasks)
| Task | Depends On | Blocks |
|---|---|---|
| 1 | None | 3, 11 |
| 2 | None | 5, 7, 11 |
| 3 | 1 | 4, 5, 7, 8, 11 |
| 4 | 3 | 5, 7, 9, 11 |
| 5 | 2, 3, 4 | 7, 8, 9, 11 |
| 6 | 2, 3 | 8, 9, 10, 11 |
| 7 | 2, 3, 4, 5 | 10, 11 |
| 8 | 3, 5, 6 | 10, 11 |
| 9 | 4, 5, 6 | 10, 11 |
| 10 | 6, 7, 8, 9 | 11 |
| 11 | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | Final verification |

### Agent Dispatch Summary (wave → task count → categories)
- Wave 1 → 4 tasks → `writing`, `deep`
- Wave 2 → 4 tasks → `deep`, `writing`, `unspecified-high`
- Wave 3 → 3 tasks → `writing`, `deep`

## TODOs
> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Restructure the source document into a control-ready blueprint

  **What to do**: Rewrite `AITasks/HRIS Cost Management.md` so it moves from the current `role / task / 限制条件` note format into a structured operating blueprint. Introduce section headings in this exact order: `Objective and Scope`, `Cost Scope Taxonomy`, `Canonical Atomic Record`, `Financial States`, `Allocation Rules`, `Currency and FX Policy`, `Reporting Views`, `WeChat and Desktop Workflow`, `Governance and Operating Calendar`, `Implementation Blueprint`, `Worked Examples`, `Out of Scope`.
  **Must NOT do**: Do not keep the current loose bullet structure as the main format; do not add tool-specific implementation details yet; do not remove the original business asks.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: This task is document architecture and structural rewriting.
  - Skills: `[]` - No additional skill is required for markdown restructuring.
  - Omitted: `documents` - The file is markdown, not DOCX/XLSX/PPTX.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 3, 11 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:1-14` - Current source note with the original scope and constraints.
  - Pattern: `AITasks/HRIS Cost Management.md:5-9` - Original in-scope costs and required analytical views.
  - Pattern: `AITasks/HRIS Cost Management.md:12-13` - Original capture constraints: easy recording, multidimensional export, WeChat + desktop.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "^## Objective and Scope" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "^## Cost Scope Taxonomy" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "^## Out of Scope" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "attendance\|payroll\|e-sign\|BPO" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Blueprint sections exist in the required order
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
sections = ['## Objective and Scope','## Cost Scope Taxonomy','## Canonical Atomic Record','## Financial States','## Allocation Rules','## Currency and FX Policy','## Reporting Views','## WeChat and Desktop Workflow','## Governance and Operating Calendar','## Implementation Blueprint','## Worked Examples','## Out of Scope']
positions = [text.index(s) for s in sections]
assert positions == sorted(positions)
print('ordered')
PY`
    Expected: Command prints `ordered` and exits 0.
    Evidence: .sisyphus/evidence/task-1-document-structure.txt

  Scenario: Original business asks are preserved after the rewrite
    Tool: Bash
    Steps: Run `grep -n "attendance\|payroll\|electronic signature\|e-sign\|BPO\|微信\|WeChat" "AITasks/HRIS Cost Management.md"`
    Expected: Output contains references to all original cost families and capture channels.
    Evidence: .sisyphus/evidence/task-1-document-structure-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): restructure source blueprint` | Files: `AITasks/HRIS Cost Management.md`

- [x] 2. Define the cost-scope taxonomy and layered BPO boundary

  **What to do**: Create an explicit taxonomy that splits costs into `In Scope`, `Layered Scope`, and `Out of Scope`. In Scope must include attendance, payroll, e-sign, SaaS annual fees, renewals, changes, annual adjustments, and system-related BPO/service fees. Layered Scope must cover broader HR BPO where it is partially system-related. Out of Scope must exclude payment execution, AP posting, and general HR outsourcing spend with no system relationship. In the same section, add a system-inventory onboarding table template with columns for `region`, `country`, `system/module`, `vendor`, `contract owner`, `country owner`, `scope status`, and `notes`.
  **Must NOT do**: Do not leave BPO as a single vague bucket; do not treat all HR outsourcing as immediately in scope; do not skip annual adjustments or contract changes.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Requires careful scope boundary design and classification rules.
  - Skills: `[]` - No additional skill required.
  - Omitted: `review-work` - Verification belongs in the final wave, not here.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 7, 11 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:5-8` - Explicitly names attendance, payroll, e-sign, SaaS fees, renewals, changes, BPO/service fees, and annual adjustments.
  - External: `https://www2.deloitte.com/us/en/pages/human-capital/articles/intelligent-hr-technology-trends.html` - Use for technology-cost framing only, not for copying structure.
  - External: `https://www.shrm.org/resourcesandtools/hr-topics/technology/pages/default.aspx` - Reference HR tech governance context.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "^### In Scope" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "^### Layered Scope" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "^### Out of Scope" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "system-related BPO\|annual adjustment\|renewal" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "region\|country\|system/module\|vendor\|contract owner\|scope status" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Taxonomy distinguishes system-related BPO from broader HR outsourcing
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
assert 'system-related BPO' in text
assert 'Layered Scope' in text
assert 'Out of Scope' in text
print('taxonomy-ok')
PY`
    Expected: Command prints `taxonomy-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-2-scope-taxonomy.txt

  Scenario: Out-of-scope controls block procurement/AP creep
    Tool: Bash
    Steps: Run `grep -n "payment execution\|AP posting\|procurement platform" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows those items listed under out-of-scope language, not implementation scope.
    Evidence: .sisyphus/evidence/task-2-scope-taxonomy-error.txt

  Scenario: System inventory onboarding template exists for regional-owned systems
    Tool: Bash
    Steps: Run `grep -n "contract owner\|country owner\|scope status\|system/module" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows an inventory template or equivalent field list for onboarding real systems later.
    Evidence: .sisyphus/evidence/task-2-scope-taxonomy-template.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): define cost taxonomy and BPO boundaries` | Files: `AITasks/HRIS Cost Management.md`

- [x] 3. Define the canonical atomic record and dimension dictionary

  **What to do**: Add a canonical base-record specification that all reports must derive from. The base record must include at least: `month`, `country`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`, `service period`, `transaction currency`, `reporting currency`, `amount`, `owner`, `source document`, `shared/allocation flag`, and `allocation rule version`. Add a dimension dictionary that defines each field, allowed values, and whether it is controlled master data or transaction data.
  **Must NOT do**: Do not let reporting views define their own separate grains; do not use free-text fields for country/system/category/vendor; do not omit source-line lineage.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: This is the foundational data/control model.
  - Skills: `[]` - No additional skill required.
  - Omitted: `documents` - Markdown only.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 4, 5, 7, 8, 11 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:9` - Original requirement for multidimensional views by country, product, function, and rollups.
  - Pattern: `AITasks/HRIS Cost Management.md:12` - Data must be easy to record and export after multidimensional display.
  - External: `https://www.nist.gov/topics/cybersecurity-framework` - Use as a reminder to keep ownership/source traceable.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "^## Canonical Atomic Record" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "month\|country\|system/module\|vendor\|contract\|cost category\|financial state\|transaction currency\|reporting currency\|allocation rule version" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "^### Dimension Dictionary" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: A single base record supports all required dimensions
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
required = ['month','country','system/module','vendor','contract','cost category','financial state','transaction currency','reporting currency','allocation rule version']
missing = [x for x in required if x not in text]
assert not missing, missing
print('canonical-ok')
PY`
    Expected: Command prints `canonical-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-3-canonical-record.txt

  Scenario: No uncontrolled free-text dimensions are left ambiguous
    Tool: Bash
    Steps: Run `grep -n "controlled master data\|picklist\|effective-dated" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows explicit master-data control language for dimensions.
    Evidence: .sisyphus/evidence/task-3-canonical-record-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): define canonical cost line and dimensions` | Files: `AITasks/HRIS Cost Management.md`

- [x] 4. Define financial states, service periods, renewals, and FX policy

  **What to do**: Add a section that defines the state model for `Actual`, `Budget`, `Forecast`, and `Committed`, plus subtypes `Recurring`, `One-time`, and `Renewal Adjustment`. Document the exact trigger for each state, the service-period rule, the monthly close rule, the annual plan freeze, the treatment of retroactive credits/true-ups, and the FX-lock policy for reporting currency conversion.
  **Must NOT do**: Do not leave “Committed” undefined; do not rely on ad hoc FX conversion; do not mix invoice date, service date, and reporting month without a single primary rule.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Requires financial-control clarity and no ambiguous semantics.
  - Skills: `[]` - No additional skill required.
  - Omitted: `systematic-debugging` - This is design, not defect analysis.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 7, 9, 11 | Blocked By: 3

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:6-8` - Renews/changes, annual service fees, BPO/system fees, annual adjustments.
  - External: `https://www.gartner.com/en/information-technology/insights/cost-optimization` - Use for cadence and cost-governance framing.
  - External: `https://www.iso.org/isoiec-27001-information-security.html` - Use as a governance-quality reminder for controlled rules and versioning.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "Actual\|Budget\|Forecast\|Committed" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "Recurring\|One-time\|Renewal Adjustment" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "monthly close\|annual plan freeze\|retroactive credit\|FX" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: State and FX policy are precise enough for automated checks
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
required = ['Actual','Budget','Forecast','Committed','Recurring','One-time','Renewal Adjustment','monthly close','annual plan freeze','FX']
missing = [x for x in required if x not in text]
assert not missing, missing
print('states-ok')
PY`
    Expected: Command prints `states-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-4-financial-states.txt

  Scenario: Late credit and renewal uplift edge cases are explicitly handled
    Tool: Bash
    Steps: Run `grep -n "retroactive credit\|true-up\|renewal uplift\|renewal notice" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows explicit treatment for prior-period corrections and renewal changes.
    Evidence: .sisyphus/evidence/task-4-financial-states-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): define financial states and fx policy` | Files: `AITasks/HRIS Cost Management.md`

- [x] 5. Define shared-cost allocation rules and BPO classification rules

  **What to do**: Write the allocation policy for regional/shared costs. Keep a pre-allocation shared record, define allowed allocation bases, define rule ownership/versioning/effective dates, and require traceability from allocated cost lines back to the original shared line. In the same section, add explicit classification rules for mixed BPO/system invoices so the executor knows when a cost stays in the core ledger, moves to layered scope, or stays out.
  **Must NOT do**: Do not force every cost into a country immediately; do not allow allocated values to overwrite source shared values; do not treat mixed BPO invoices as self-evident.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Shared-cost lineage and BPO classification are high-risk control rules.
  - Skills: `[]` - No additional skill required.
  - Omitted: `requesting-code-review` - Review belongs to the final verification wave.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 7, 8, 9, 11 | Blocked By: 2, 3, 4

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:7-9` - Service-related fees, BPO costs, annual adjustments, and multi-dimensional rollups.
  - Pattern: `AITasks/HRIS Cost Management.md:9` - Country-level and dimension-based rollups require explicit allocation semantics.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "^## Allocation Rules" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "shared\|allocated\|allocation basis\|allocation rule version\|effective date" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "mixed BPO\|system-related BPO\|layered scope" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Shared costs remain visible before and after allocation
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
assert 'pre-allocation shared view' in text
assert 'allocation rule version' in text
assert 'source shared line' in text
print('allocation-ok')
PY`
    Expected: Command prints `allocation-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-5-allocation-rules.txt

  Scenario: Mixed BPO/system invoice handling is binary and explicit
    Tool: Bash
    Steps: Run `grep -n "mixed BPO/system invoice\|classification rule\|core ledger\|layered scope" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows exact routing rules for mixed invoices, not generic prose.
    Evidence: .sisyphus/evidence/task-5-allocation-rules-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): add allocation and BPO classification rules` | Files: `AITasks/HRIS Cost Management.md`

- [x] 6. Define governance, RACI, and master-data controls

  **What to do**: Add a governance section that names the roles and responsibilities for HR, Finance, regional system owner, country submitter, Procurement, and IT. Include who creates/approves changes to countries, systems, modules, vendors, cost categories, FX tables, and allocation rules. Add control rules for picklists, effective-dated master data, change logging, and exception handling.
  **Must NOT do**: Do not leave HR+Finance as the only named actors; do not allow country/system/category definitions to be edited ad hoc; do not skip exception ownership.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: This is primarily governance articulation and role mapping.
  - Skills: `[]` - No additional skill required.
  - Omitted: `documents` - Markdown only.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8, 9, 10, 11 | Blocked By: 2, 3

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:5-13` - Scope and channel constraints imply multi-role governance, not single-owner operation.
  - External: `https://www.nist.gov/topics/cybersecurity-framework` - Use as a reminder to define ownership and traceability, not as a strict template.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "^## Governance and Operating Calendar" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "HR\|Finance\|regional system owner\|country submitter\|Procurement\|IT" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "picklist\|effective-dated\|change log\|exception" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Every controlled object has an owner and change rule
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
required = ['countries','systems','modules','vendors','cost categories','FX tables','allocation rules']
missing = [x for x in required if x not in text]
assert not missing, missing
print('governance-ok')
PY`
    Expected: Command prints `governance-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-6-governance.txt

  Scenario: No uncontrolled master-data editing path exists
    Tool: Bash
    Steps: Run `grep -n "ad hoc\|free-text" "AITasks/HRIS Cost Management.md"`
    Expected: If these terms appear, they are explicitly prohibited; no uncontrolled path is endorsed.
    Evidence: .sisyphus/evidence/task-6-governance-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): define governance and master-data controls` | Files: `AITasks/HRIS Cost Management.md`

- [x] 7. Define the reporting-view catalog and export contract

  **What to do**: Document the exact reporting views that must exist, each derived from the canonical record: by country, by system/module, by product, by function, by vendor/contract, by cost category, country rollup, country cost-change view, shared-cost pre-allocation view, shared-cost post-allocation view, renewal calendar, and annual-vs-monthly variance views. For each view, specify grouping fields, mandatory filters, totals, export columns, and whether it is operational or management-facing.
  **Must NOT do**: Do not describe reporting as “flexible” without naming exact views; do not invent views that need a second data model; do not skip export-column definitions.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Requires mapping user-facing views back to the canonical grain.
  - Skills: `[]` - No additional skill required.
  - Omitted: `playwright` - No browser verification is needed for a markdown blueprint.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 10, 11 | Blocked By: 2, 3, 4, 5

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:9` - Explicit view requirements by country, product, function, and rollups.
  - Pattern: `AITasks/HRIS Cost Management.md:12` - Views must support display and export.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "country rollup\|country cost change\|product view\|function view\|vendor/contract view\|renewal calendar" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "export columns\|grouping fields\|mandatory filters" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: All required views are explicitly enumerated and tied to one model
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
required = ['country view','product view','function view','vendor/contract view','cost category view','country rollup','country cost change','pre-allocation shared view','post-allocation shared view','renewal calendar','annual-vs-monthly variance']
missing = [x for x in required if x not in text]
assert not missing, missing
print('views-ok')
PY`
    Expected: Command prints `views-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-7-reporting-views.txt

  Scenario: Every view includes export columns rather than informal descriptions
    Tool: Bash
    Steps: Run `grep -n "export columns" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows explicit export-contract language for each major view group.
    Evidence: .sisyphus/evidence/task-7-reporting-views-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): define reporting views and export contract` | Files: `AITasks/HRIS Cost Management.md`

- [x] 8. Define WeChat submission workflow and desktop control workflow

  **What to do**: Split capture UX from control UX. The WeChat mini-program flow must cover only lightweight submission/update fields and status checks. The desktop flow must cover review, correction, approval, export, bulk maintenance, rule administration, and exception handling. Name the minimum required fields for WeChat submission and the minimum required actions for desktop administration.
  **Must NOT do**: Do not push allocation-rule editing, FX maintenance, or master-data creation into the mini-program; do not assume mobile is suitable for complex reconciliation.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: This is workflow/control design with strong guardrails.
  - Skills: `[]` - No additional skill required.
  - Omitted: `frontend-ui-ux` - This task defines product requirements, not UI implementation.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 10, 11 | Blocked By: 3, 5, 6

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:12-13` - Original requirement for easy recording, multidimensional export, WeChat mini-program, and desktop updates.
  - Pattern: `AITasks/HRIS Cost Management.md:6-9` - Renewals, changes, and multi-dimensional views require desktop-grade control functions.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "^## WeChat and Desktop Workflow" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "WeChat\|desktop\|submission\|approval\|bulk maintenance\|exception" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "minimum required fields\|minimum required actions" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Mobile and desktop responsibilities are separated cleanly
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
assert 'WeChat submission' in text
assert 'desktop control' in text
for forbidden in ['allocation rule editing in WeChat','FX maintenance in WeChat','master-data creation in WeChat']:
    assert forbidden in text
print('workflow-ok')
PY`
    Expected: Command prints `workflow-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-8-workflow.txt

  Scenario: Desktop workflow explicitly covers review and correction paths
    Tool: Bash
    Steps: Run `grep -n "review\|correction\|approval\|export\|bulk maintenance\|rule administration" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows all control actions in the desktop workflow.
    Evidence: .sisyphus/evidence/task-8-workflow-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): define wechat and desktop workflows` | Files: `AITasks/HRIS Cost Management.md`

- [x] 9. Define the governance cadence, renewal management, and close calendar

  **What to do**: Add a calendar that states monthly cost close, monthly variance review, quarterly forecast refresh, quarterly renewal review, annual budget cycle, and annual platform rationalization review. Include renewal notice windows, owner escalation rules, and what evidence each review must produce.
  **Must NOT do**: Do not leave cadence as “monthly/quarterly review” without naming the outputs; do not omit renewal lead times; do not make annual planning independent from monthly actuals.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: Primarily a governance/cadence specification task.
  - Skills: `[]` - No additional skill required.
  - Omitted: `verification-before-completion` - Final verification wave already handles completion checks.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 10, 11 | Blocked By: 4, 5, 6

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:6-9` - Renewals, changes, annual adjustments, and cost-change analysis need operating cadence.
  - External: `https://www.gartner.com/en/information-technology/insights/cost-optimization` - Use only for cost-governance cadence inspiration.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "monthly close\|monthly variance review\|quarterly forecast refresh\|quarterly renewal review\|annual budget cycle\|annual platform rationalization review" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "60 days\|90 days\|owner escalation\|evidence required" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Calendar ties monthly, quarterly, and annual loops together
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
required = ['monthly close','monthly variance review','quarterly forecast refresh','quarterly renewal review','annual budget cycle']
missing = [x for x in required if x not in text]
assert not missing, missing
print('calendar-ok')
PY`
    Expected: Command prints `calendar-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-9-calendar.txt

  Scenario: Renewal alerts have concrete lead times and ownership
    Tool: Bash
    Steps: Run `grep -n "60 days\|90 days\|renewal owner\|escalation" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows specific reminder lead times and owner/escalation fields.
    Evidence: .sisyphus/evidence/task-9-calendar-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): define governance cadence and renewal calendar` | Files: `AITasks/HRIS Cost Management.md`

- [x] 10. Define the implementation blueprint and tool decision matrix

  **What to do**: Add a phased implementation blueprint that starts with a controlled cost register and progresses only if needed into approval workflow, row-level permissions, and external integrations. Phase 1 must remain tool-agnostic but include decision criteria for any future stack that needs WeChat submission, desktop control, multidimensional views, export, controlled master data, allocation rules, FX tables, and auditability. Include an explicit escalation trigger for when a simple register is no longer enough.
  **Must NOT do**: Do not commit to a specific tool stack without user approval; do not make ERP/AP integration a phase-1 requirement; do not assume a mini-program alone can handle control-grade administration.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Requires sequencing, scope control, and architecture guardrails.
  - Skills: `[]` - No additional skill required.
  - Omitted: `brainstorming` - Planning decisions are already locked for this session.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 11 | Blocked By: 6, 7, 8, 9

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:12-13` - WeChat input and desktop updates are hard constraints.
  - Pattern: `AITasks/HRIS Cost Management.md:9` - Multidimensional views and export are mandatory.
  - External: `https://www.shrm.org/resourcesandtools/hr-topics/technology/pages/default.aspx` - Reference general HR technology governance, not a mandated platform.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "^## Implementation Blueprint" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "Phase 1\|Phase 2\|decision criteria\|escalation trigger" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "tool-agnostic\|WeChat submission\|desktop control\|auditability" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Phase 1 remains a controlled register, not a full platform program
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
assert 'Phase 1' in text and 'controlled cost register' in text
assert 'ERP/AP integration' in text
assert 'escalation trigger' in text
print('blueprint-ok')
PY`
    Expected: Command prints `blueprint-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-10-blueprint.txt

  Scenario: Tool decision criteria are explicit and stack-neutral
    Tool: Bash
    Steps: Run `grep -n "decision criteria\|tool-agnostic\|controlled master data\|allocation rules\|FX tables\|auditability" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows a tool-evaluation matrix or equivalent checklist rather than a premature vendor choice.
    Evidence: .sisyphus/evidence/task-10-blueprint-error.txt
  ```

  **Commit**: NO | Message: `docs(hris-cost): add implementation blueprint and tool matrix` | Files: `AITasks/HRIS Cost Management.md`

- [x] 11. Consolidate the document with worked examples and reconciliation checks

  **What to do**: Finish the rewrite by embedding concrete worked examples that prove the blueprint is executable. Include at least: (1) a single-country recurring fee, (2) a shared regional e-sign fee allocated across three countries, (3) a bundled vendor split into modules, (4) a mid-year renewal uplift, and (5) a retroactive credit after close. Each example must show how the same base record supports both transaction/reporting currency and the correct reporting views.
  **Must NOT do**: Do not leave examples as placeholders; do not use fake headings without data rows; do not produce examples that cannot reconcile back to a source line.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: This is final document synthesis with precise examples.
  - Skills: `[]` - No additional skill required.
  - Omitted: `review-work` - Final verification wave handles formal review.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: Final verification | Blocked By: 1, 2, 3, 4, 5, 6, 7, 8, 9, 10

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `AITasks/HRIS Cost Management.md:5-13` - Original functional scope and channel requirements that must survive the rewrite.
  - Pattern: `AITasks/HRIS Cost Management.md:9` - Multi-dimensional viewing and country-level change analysis.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `grep -n "2026-03 | Indonesia | Payroll | Actual | Recurring" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "Shared regional e-sign fee | Shared | Allocation basis" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "Vendor bundle split | Attendance | Payroll" "AITasks/HRIS Cost Management.md"`
  - [ ] `grep -n "mid-year renewal uplift\|retroactive credit" "AITasks/HRIS Cost Management.md"`

  **QA Scenarios** (MANDATORY - task incomplete without these):
  ```
  Scenario: Worked examples cover happy-path and multi-country allocation
    Tool: Bash
    Steps: Run `python - <<'PY'
from pathlib import Path
text = Path('AITasks/HRIS Cost Management.md').read_text()
required = ['2026-03 | Indonesia | Payroll | Actual | Recurring','Shared regional e-sign fee','Vendor bundle split','mid-year renewal uplift','retroactive credit']
missing = [x for x in required if x not in text]
assert not missing, missing
print('examples-ok')
PY`
    Expected: Command prints `examples-ok` and exits 0.
    Evidence: .sisyphus/evidence/task-11-examples.txt

  Scenario: Reporting and reconciliation lineage is visible from each example
    Tool: Bash
    Steps: Run `grep -n "source line\|transaction currency\|reporting currency\|allocation rule version\|view output" "AITasks/HRIS Cost Management.md"`
    Expected: Output shows each example can be traced and re-used across reporting views.
    Evidence: .sisyphus/evidence/task-11-examples-error.txt
  ```

  **Commit**: YES | Message: `docs(hris-cost): build decision-complete cost blueprint` | Files: `AITasks/HRIS Cost Management.md`, `.sisyphus/evidence/*`

## Final Verification Wave (MANDATORY — after ALL implementation tasks)
> 4 review agents run in PARALLEL. ALL must APPROVE. Present consolidated results to user and get explicit "okay" before completing.
> **Do NOT auto-proceed after verification. Wait for user's explicit approval before marking work complete.**
> **Never mark F1-F4 as checked before getting user's okay.** Rejection or user feedback -> fix -> re-run -> present again -> wait for okay.
- [x] F1. Plan Compliance Audit — oracle

  **What to do**: Run an Oracle review that compares the final rewritten `AITasks/HRIS Cost Management.md` against this plan. The review must confirm that every mandatory section, control rule, reporting view, and edge-case example exists.
  **Tool / Agent**: `task(subagent_type="oracle")`
  **Exact prompt**: `Compare the final implementation against .sisyphus/plans/hris-cost-management.md. Verify required sections, canonical record, financial states, allocation rules, reporting views, workflow split, governance cadence, implementation blueprint, and worked examples. Return APPROVED or list blocking deviations only.`
  **Pass Condition**: Oracle returns `APPROVED` with no blocking deviations.
  **Evidence**: `.sisyphus/evidence/f1-plan-compliance.md`

- [x] F2. Code Quality Review — unspecified-high

  **What to do**: Run a high-effort review of the changed markdown artifact(s) for ambiguity, contradiction, missing definitions, duplicated logic, and non-executable acceptance language.
  **Tool / Agent**: `task(category="unspecified-high")`
  **Exact prompt**: `Review the changed markdown files for ambiguity, contradictions, duplicated logic, undefined terms, and any acceptance criteria or workflow rules that still require human interpretation. Return APPROVED or list blocking issues only.`
  **Pass Condition**: Reviewer returns `APPROVED` or reports only non-blocking editorial suggestions.
  **Evidence**: `.sisyphus/evidence/f2-quality-review.md`

- [x] F3. Real Manual QA — unspecified-high (+ playwright if UI)

  **What to do**: Re-run the key executable checks from the document using Bash so the final artifact proves it contains the required sections and worked examples. Because this plan is document-only, Playwright is not needed unless the executor also builds a UI outside scope.
  **Tool / Agent**: `Bash`
  **Steps**:
  1. Run `grep -n "^## Objective and Scope\|^## Canonical Atomic Record\|^## Allocation Rules\|^## Reporting Views\|^## WeChat and Desktop Workflow\|^## Governance and Operating Calendar\|^## Implementation Blueprint" "AITasks/HRIS Cost Management.md"`
  2. Run `grep -n "2026-03 | Indonesia | Payroll | Actual | Recurring\|Shared regional e-sign fee\|Vendor bundle split\|mid-year renewal uplift\|retroactive credit" "AITasks/HRIS Cost Management.md"`
  3. Run `grep -n "transaction currency\|reporting currency\|allocation rule version\|country rollup\|renewal calendar" "AITasks/HRIS Cost Management.md"`
  **Pass Condition**: All grep commands return at least one match and exit 0.
  **Evidence**: `.sisyphus/evidence/f3-manual-qa.txt`

- [x] F4. Scope Fidelity Check — deep

  **What to do**: Run a deep scope audit to ensure the implementation did not drift into payment execution, AP posting, procurement-platform design, or ERP integration work beyond the blueprint guardrails.
  **Tool / Agent**: `task(category="deep")`
  **Exact prompt**: `Compare the final changed files against .sisyphus/plans/hris-cost-management.md. Confirm the implementation stays within document/blueprint scope and did not expand into payment execution, AP posting, procurement platform design, full workflow platform delivery, or ERP integration requirements. Return APPROVED or list blocking scope deviations only.`
  **Pass Condition**: Deep reviewer returns `APPROVED` with no scope deviations.
  **Evidence**: `.sisyphus/evidence/f4-scope-fidelity.md`

## Commit Strategy
- Single commit recommended after document consolidation and evidence capture.
- Commit message: `docs(hris-cost): build decision-complete cost management blueprint`

## Success Criteria
- The rewritten document can be executed without asking the planner for clarification.
- Every required reporting view is derivable from one canonical cost line.
- Shared, allocated, local-currency, reporting-currency, renewal, and BPO edge cases are explicitly handled.
- WeChat and desktop responsibilities are separated cleanly enough to avoid control failure.
- Phase-1 scope stays a controlled cost-management blueprint rather than turning into a procurement or ERP program.
