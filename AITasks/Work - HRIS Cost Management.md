# HRIS Cost Management

## Objective and Scope

基于以下要求，参考nocodb，使用rust为核心，开发出可以本地使用的工具程序，可以完成以下目标。

This blueprint defines how HR and Finance manage HRIS-related costs in a way that is easy to record, easy to update, and ready for multidimensional reporting and export. The scope covers the recurring and change-driven cost management needs around core HRIS and adjacent business support services, while keeping the design implementation-neutral at this stage.

The blueprint preserves the original business asks: manage attendance systems, payroll systems, e-sign platforms, SaaS annual fees, renewals, changes, system-related BPO or service fees, annual adjustments, multidimensional views, and the requirement that data can be captured through WeChat and updated from desktop.

## Cost Scope Taxonomy
### In Scope
In-scope costs include attendance, payroll, e-sign, and other HRIS-related systems that require ongoing cost management. The scope also includes SaaS annual fees, renewal events, change requests that affect commercial terms, and each annual adjustment that changes the recurring baseline through price uplift, scope revision, or similar contract movement.

Service-related costs are in scope when they are directly tied to operating, supporting, or administering the systems above. This includes system-related BPO and service fees where the work is part of keeping the HRIS capability running.

### Layered Scope
Layered Scope covers broader HR BPO or managed-service spend that is only partially system-related. These items should be classified separately from the core ledger so the business can see the full operating picture without treating all HR outsourcing as immediately equivalent to HRIS system cost.

Where one service bundle mixes system support and broader people-process work, the system-related portion can be brought into the core view while the remaining broader HR BPO stays in the layered view unless later governance expands the boundary.

### Out of Scope
Out of scope are payment execution, AP posting, and procurement platform scope creep, as well as general HR outsourcing spend with no direct system relationship. The taxonomy should block these items from entering the core HRIS cost view unless a later governance decision explicitly reclassifies them.

### System Inventory Onboarding Template
| region | country | system/module | vendor | contract owner | country owner | scope status | notes |
|---|---|---|---|---|---|---|---|
| APAC | Indonesia | Payroll | Example Vendor | Regional HRIS Lead | Indonesia HR Ops Lead | In Scope | Initial onboarding example for a country-managed payroll module. |

The taxonomy must support viewing the same costs by country, product, function, and consolidated totals so that local and regional spending can be understood without redefining the cost each time it is reported.

## Canonical Atomic Record
The canonical base record is the single source of truth for the register: one atomic cost line at the lowest governed grain, entered once and then reused by every downstream country, product, function, contract, and consolidated view. Reporting views must derive from this record rather than defining separate grains, duplicate totals, or free-text dimension variants.

Each base record must capture, at minimum, `month`, `country`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`, `subtype`, `service period`, `transaction currency`, `reporting currency`, `amount`, `function`, `owner`, `source document`, `shared/allocation flag`, and `allocation rule version`. Here `amount` is the authoritative transaction-currency value captured from the source evidence; any `reporting amount` is a derived reporting-view value produced from that source amount under the approved FX policy and must never overwrite the transaction amount. Where a cost remains fully direct, the `shared/allocation flag` should show that no allocation was applied; where a cost is shared, the source line must remain visible before any downstream allocation is derived from it.

The record should stay simple enough for routine entry, but structured enough to support later rollups by country, product, function, and change history without re-entry. The core principle is one atomic record per accountable cost event, not separate records for each view, and source-line lineage must remain traceable back to the originating evidence.

### Dimension Dictionary
| field | definition | allowed values / format | control type |
|---|---|---|---|
| `month` | Primary reporting month for the cost line at canonical grain. | `YYYY-MM`; one closed month per record. | Transaction data using a controlled picklist from the finance calendar. |
| `country` | Legal or operating country accountable for the source or allocated line, or the controlled special value `Shared` for a pre-allocation shared source line before recipient allocation occurs. | Controlled country list used in the system inventory, plus controlled special value `Shared` allowed only when `shared/allocation flag = Shared Source`. | Controlled master data; no free-text country names. |
| `system/module` | Named HRIS product or module being charged, including bundled modules when managed separately. | Controlled system/module list aligned to onboarding taxonomy. | Controlled master data; effective-dated reference when names or scope change. |
| `vendor` | External supplier providing the software or service. | Controlled vendor list. | Controlled master data; effective-dated reference for vendor merges or renames. |
| `contract` | Commercial agreement, order form, or contract vehicle tied to the charge. | Contract identifier from the governed contract register. | Controlled master data; effective-dated reference to preserve contract history. |
| `cost category` | Standard classification of the cost line such as subscription, implementation change, support service, or renewal adjustment. | Controlled picklist approved by HR and Finance. | Controlled master data through a governed picklist; no open-text categories. |
| `financial state` | Financial status used for planning and reporting. | Controlled picklist, at minimum `Actual`, `Budget`, `Forecast`, or `Committed`. | Controlled master data through a governed picklist. |
| `service period` | Date range or service month that the charge economically relates to. | Start/end date or stated monthly service period using the close-rule convention. | Transaction data validated against the accounting calendar. |
| `transaction currency` | Currency on the source commercial document. | ISO currency code picklist. | Controlled master data through a governed currency picklist. |
| `reporting currency` | Currency used for consolidated reporting after FX policy is applied. | Approved reporting currency code picklist. | Controlled master data through a governed currency picklist. |
| `amount` | Authoritative transaction-currency monetary amount at source-line grain. | Numeric transaction amount with sign rules defined by finance policy. | Transaction data captured from governed source evidence. |
| `reporting amount` | Derived reporting-currency monetary amount used in exports and reporting views after FX policy is applied. | Derived numeric amount in the selected reporting currency; never entered as a replacement for `amount`. | Derived value produced deterministically from `amount`, `reporting currency`, and the approved FX policy for the record's financial state and cycle. |
| `function` | Business function the cost is attributed to for reporting and allocation, separate from the accountable owner. | Controlled function list approved by HR and Finance. | Controlled master data; effective-dated reference when function structures change. |
| `owner` | Accountable business owner for review and maintenance of the record. | Named owner from approved responsibility list. | Controlled master data; effective-dated reference when ownership changes. |
| `source document` | Originating invoice, statement of work, renewal notice, or other support for the line. | Document ID or repository link that uniquely identifies evidence. | Transaction data with mandatory lineage to governed evidence storage. |
| `shared/allocation flag` | Indicates whether the line is direct, shared pre-allocation, or allocated output. | Controlled picklist such as `Direct`, `Shared Source`, `Allocated`. | Controlled master data through a governed picklist. |
| `allocation rule version` | Version of the approved allocation rule used to derive allocated values. | Required version identifier when `shared/allocation flag` is `Allocated`; blank or `N/A` for direct lines by policy. | Controlled master data with effective-dated reference to approved allocation logic. |

All dimension references that define the canonical grain must be governed as controlled master data or controlled picklist values rather than free-text entry, and each effective-dated reference must preserve historical meaning when functions, owners, vendors, systems/modules, or contracts change over time. This keeps one canonical grain stable enough for downstream reporting, allocation lineage, and governance review.

## Financial States
Each canonical cost line must carry exactly one `financial state` and one cost subtype so the record can be tested consistently across planning, close, renewal, and variance review.

### Required Financial States
| state | definition | executable rule |
|---|---|---|
| `Actual` | Realized cost or realized reduction supported by booked evidence. | Use `Actual` only when the amount is evidenced by an invoice, accrual, credit memo, or approved true-up and is tied to a defined service period. Closed-month `Actual` lines cannot be overwritten; corrections must be added as separate adjusting lines in the first open month. |
| `Budget` | Approved annual baseline used for the plan year. | Use `Budget` only for the frozen annual plan approved at the annual plan freeze. `Budget` stays unchanged during the year unless HR and Finance formally approve a re-baseline under governance. |
| `Forecast` | Latest expected outcome for current or future service periods. | Use `Forecast` for expected amounts that are not yet `Actual` and not yet firm enough to be `Committed`, including expected run-rate changes, expected renewal outcomes, expected retroactive credit, and expected true-up. `Forecast` may be refreshed during each planning cycle until monthly close for the affected open month. |
| `Committed` | Future obligation with binding commercial support. | Use `Committed` for future service periods when the amount is backed by an executed contract, order form, signed renewal, or non-cancellable notice. `Committed` converts to `Actual` as the service period is consumed and the amount is recognized through the close process. |

### Required Cost Subtypes
| subtype | definition | executable rule |
|---|---|---|
| `Recurring` | Repeating charge for an ongoing service period. | Use for subscriptions, managed services, or support fees that recur over successive months or years. Annual or multi-month recurring fees must still be represented across the covered monthly service periods at canonical month grain. |
| `One-time` | Non-recurring charge or credit. | Use for implementation fees, one-off scope changes, termination items, one-off credits, and other items that do not create the next recurring baseline. |
| `Renewal Adjustment` | Change to the recurring baseline caused by a renewal event. | Use when a renewal changes price, scope, quantity, or term relative to the prior recurring baseline. The uplift, reduction, or other delta created by renewal must be explicitly visible as `Renewal Adjustment` rather than being hidden inside a replacement recurring total. |

### Service-Period and Close Rules
The `month` on the canonical record must follow the economic service period, not merely the invoice receipt date. If one invoice covers multiple months, the cost must be spread into the covered monthly service periods at canonical month grain; if the source document states a non-ratable schedule, that stated schedule governs instead of straight-line spreading.

The monthly close rule is that closed months are locked for ordinary editing. Any late invoice, retroactive credit, or true-up affecting a closed month must be recorded as a separate adjusting line in the first open month with the original affected `service period` retained on the record for audit traceability.

The annual plan freeze rule is that `Budget` is frozen at the approved planning cut-off for the plan year. After the annual plan freeze, new information changes `Forecast` or `Committed`, not `Budget`, unless a formal governance decision authorizes a re-baseline.

### Renewal, Credit, and True-up Treatment
A retroactive credit must be recorded as a negative `Actual` line in the first open month after the credit is known or booked, while preserving the original affected `service period` on the record. A true-up must follow the same rule: if it settles a prior under- or over-accrual, record the difference as a separate `Actual` adjusting line in the first open month and reference the prior service coverage in the `service period` field.

A renewal notice that is informative but not yet binding should update `Forecast`. A signed renewal, executed order form, or non-cancellable renewal notice should create `Committed` records for the next service period. Any renewal uplift or renewal reduction relative to the prior baseline must be identified explicitly as `Renewal Adjustment` so downstream checks can distinguish baseline recurrence from renewal-driven movement.

## Allocation Rules
Some costs belong directly to one country or one operating unit, while others may need to be shared across multiple countries, products, or functions. Allocation rules must therefore be explicit, consistent, and reviewable rather than embedded in ad hoc commentary.

### Required Allocation Lifecycle
A shared charge must first be recorded as one canonical `Shared Source` line that preserves the original invoice or contract evidence at unsplit amount. This pre-allocation shared view is mandatory and must remain queryable after downstream allocations are created; allocation must never overwrite or hide the source shared amount.

Allocated reporting is a separate allocated view derived from the `Shared Source` line. Each allocated output line must retain a `source shared line` reference back to the originating shared record, carry the allocated amount for exactly one receiving country, product, or function combination, and preserve the same `month`, `vendor`, `contract`, `system/module`, `financial state`, `service period`, and source evidence context unless an explicit governed exception says otherwise.

The allocation lineage rule is binary: if a cost is shared, there must be exactly one visible source shared line before split and one or more allocated output lines after split; if a cost is direct, no allocated output lines may be created. Every allocated line must be reproducible from the visible source shared line and the approved allocation rule in force for that service period.

### Allocation Rule Governance
Each approved rule must be recorded as governed master data with, at minimum, `allocation rule version`, allocation basis, rule owner, approval date, and effective date range. `allocation rule version`, effective date, and owner are mandatory on any rule that may create allocated output; no shared line may be split by an undocumented or expired rule.

Allowed allocation basis options must come from a controlled list approved jointly by HR and Finance. At minimum the policy may use `Headcount`, `Employee Population`, `Active License Count`, `Named User Count`, `Country Revenue`, `Transaction Volume`, `Fixed Percentage`, or `Direct Identification` when that basis is the best supported driver for the shared service. Free-text or one-off allocation bases are not allowed in production records.

Rule ownership is accountable, not advisory. The named rule owner is responsible for maintaining the driver definition, the receiving population, and the effective-dated percentage or factor table so reviewers can reproduce the allocation result for any month. If the driver changes, a new allocation rule version must be created with a new effective date rather than silently editing historical logic.

### Executable Allocation Controls
The pre-allocation shared view must show the unsplit shared amount, the `shared/allocation flag = Shared Source`, and the approved allocation rule version planned for the split. The allocated view must show each recipient line with `shared/allocation flag = Allocated`, the resulting allocated amount, and the `source shared line` identifier used to derive that line.

For any one source shared line and allocation rule version, the sum of all allocated output lines must equal the source shared amount under the same financial state and service period, subject only to approved rounding policy. Rounding residual, if any, must be assigned by documented policy to one recipient line and remain auditable from the source shared line.

Allocation timing follows the canonical service-period rule. A shared fee covering multiple service periods must first be represented across the covered months at canonical month grain and then allocated within each month using the allocation rule version effective for that month. Closed months remain locked; if the allocation basis changes after close, the new rule applies prospectively or through a first-open-month adjusting line rather than rewriting historical allocated outputs.

### Mixed BPO/System Invoice Routing
A mixed BPO/system invoice must be classified line by line or component by component before any allocation is performed. The routing decision is binary for each classified component: `core ledger` when the charge is directly tied to operating, supporting, or administering an in-scope HRIS system; `layered scope` when the charge is broader HR BPO or managed service work that is only partially system-related; and `out-of-scope` when the charge has no direct system relationship or falls into blocked categories such as payment execution, AP posting, or procurement platform scope creep.

If the source document separately states the system-related and broader BPO components, route each stated component directly to its destination before allocation. If the source document is bundled, Finance and the accountable business owner must create an auditable decomposition memo that identifies the in-scope system component, the layered broader-HR component, and any out-of-scope component; only the identified in-scope system component may enter the core ledger allocation flow.

The mixed BPO/system invoice control rule is therefore explicit: system-related portions may be recorded in the core ledger and may use allocation rules when they are genuinely shared; broader HR BPO portions must stay in layered scope even if they appear on the same vendor invoice; out-of-scope portions must be blocked from both the core ledger and layered HRIS reporting views. No bundled invoice may be loaded as fully core merely because one component is system-related.

### Allocation Auditability Requirement
Any reviewer must be able to move from allocated view to pre-allocation shared view to source evidence without relying on narrative explanation outside the register. The register must therefore preserve source shared line visibility, allocation rule version, effective date, owner, allocation basis, and receiving-line lineage so allocation results and mixed-invoice routing decisions remain explicit and auditable.

## Currency and FX Policy
The blueprint should support cost recording in the transaction currency while still enabling consolidated reporting in a common reporting currency when needed. The policy should make it clear which currency is entered, which currency is reported, and when exchange treatment is refreshed.

Every canonical source line must be entered in the `transaction currency` shown on the governing commercial or accounting evidence. Reporting views may convert that amount into the approved `reporting currency`, but the original transaction-currency amount must remain visible and unchanged.

The FX-lock policy is as follows. `Actual` uses the approved monthly close FX rate for the record `month`, and that reporting-currency conversion is locked once the monthly close is completed for that month. `Budget` uses the annual plan freeze FX rate set for the plan cycle. `Forecast` and `Committed` use the current planning FX rate set approved for the active forecast cycle, and those converted values refresh only when the forecast cycle is formally refreshed rather than ad hoc line by line.

If a retroactive credit, true-up, or renewal adjustment is recorded after a month is closed, the adjusting line uses the FX rate policy of the first open month in which the adjustment is recorded, while the `service period` still points to the original affected coverage. This keeps closed-month reporting stable while preserving economic traceability.

This is especially important for annual SaaS fees, renewals, and BPO or service fees that may be contracted in one currency but reviewed across multiple countries or regions.

## Reporting Views
All reporting views must derive from the same canonical atomic record and, where relevant, the governed allocated outputs derived from that record. The reporting layer must not create a second data model, alternate grain, or free-form reporting-only dimensions. Every view below is therefore a governed projection of the same canonical fields, lineage, and allocation policy already defined in this blueprint.

### Reporting View Contract
Each required view must declare five things explicitly: grouping fields, mandatory filters, totals, export columns, and audience. `Grouping fields` define how rows are rolled up for onscreen review. `Mandatory filters` define the minimum selection controls that must exist even when the user later narrows the result further. `Totals` define the summary values that must always be available for the view. `Export columns` define the output contract that can be downloaded without rebuilding the data manually. `Audience` states whether the view is operational, management-facing, or both.

Unless a view states a narrower export set, export must preserve traceability fields from the canonical model so the output remains audit-ready. The default detailed export contract is: `month`, `country`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`, `subtype`, `service period`, `transaction currency`, `reporting currency`, `amount`, `reporting amount`, `function`, `owner`, `source document`, `shared/allocation flag`, `allocation rule version`, and `source shared line` when the exported row is an allocated output.

### Operational Detail Views
#### Country view
- Grouping fields: `country`, `month`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`.
- Mandatory filters: `month` or month range, `country`, `financial state`, `reporting currency`.
- Totals: total amount by selected country and month range, plus subtotals by `system/module` and `cost category`.
- Export columns: default detailed export contract.
- Audience: operational and management-facing.

#### Product view
- Grouping fields: `system/module`, `month`, `country`, `vendor`, `contract`, `cost category`, `financial state`.
- Mandatory filters: `month` or month range, `system/module`, `financial state`, `reporting currency`.
- Totals: total amount by selected product or module and month range, plus subtotals by `country` and `cost category`.
- Export columns: default detailed export contract.
- Audience: operational and management-facing.

#### Function view
- Grouping fields: `function`, `month`, `country`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`, with `owner` available as secondary accountability detail.
- Mandatory filters: `month` or month range, `function`, `financial state`, `reporting currency`.
- Totals: total amount by selected function and month range, plus subtotals by `country` and `system/module`; `owner` remains available for accountability drill-down.
- Export columns: default detailed export contract so `function` is the reporting dimension and `owner` remains the accountable role.
- Audience: operational and management-facing.

#### Vendor/contract view
- Grouping fields: `vendor`, `contract`, `month`, `country`, `system/module`, `cost category`, `financial state`.
- Mandatory filters: `month` or month range, `vendor` or `contract`, `financial state`, `reporting currency`.
- Totals: total amount by vendor and contract, plus subtotals by `country` and `system/module`.
- Export columns: default detailed export contract.
- Audience: operational.

#### Cost category view
- Grouping fields: `cost category`, `month`, `country`, `system/module`, `vendor`, `contract`, `financial state`.
- Mandatory filters: `month` or month range, `cost category`, `financial state`, `reporting currency`.
- Totals: total amount by cost category, plus subtotals by `country` and `system/module`.
- Export columns: default detailed export contract.
- Audience: operational.

### Shared-Cost Control Views
#### Pre-allocation shared view
- Grouping fields: `month`, `vendor`, `contract`, `system/module`, `financial state`, `allocation rule version`, `owner`.
- Mandatory filters: `month` or month range, `shared/allocation flag = Shared Source`, `financial state`, `reporting currency`.
- Totals: total unsplit shared amount by month range, plus subtotals by `vendor`, `contract`, and `allocation rule version`.
- Export columns: `month`, `country`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`, `subtype`, `service period`, `transaction currency`, `reporting currency`, `amount`, `reporting amount`, `function`, `owner`, `source document`, `shared/allocation flag`, `allocation rule version`.
- Audience: operational.

#### Post-allocation shared view
- Grouping fields: `month`, `country`, `system/module`, `vendor`, `contract`, `financial state`, `allocation rule version`, `source shared line`.
- Mandatory filters: `month` or month range, `shared/allocation flag = Allocated`, `financial state`, `reporting currency`.
- Totals: total allocated amount by month range, plus subtotals by recipient `country`, `system/module`, and `source shared line`.
- Export columns: `month`, `country`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`, `subtype`, `service period`, `transaction currency`, `reporting currency`, `amount`, `reporting amount`, `function`, `owner`, `source document`, `shared/allocation flag`, `allocation rule version`, `source shared line`.
- Audience: operational.

### Management Rollup and Change Views
#### Country rollup
- Grouping fields: `country`, `financial state`, `month`.
- Mandatory filters: `month` or month range, `financial state`, `reporting currency`.
- Totals: total amount by country, grand total for the selected scope, and percentage share of total by country.
- Export columns: `country`, `financial state`, `month`, `reporting currency`, total amount, share of total.
- Audience: management-facing.

#### Country cost change
- Grouping fields: `country`, `month`, `financial state`.
- Mandatory filters: comparison month or comparison month range, `country`, `financial state`, `reporting currency`.
- Totals: current-period total, comparison-period total, absolute variance, and percentage variance by country.
- Export columns: `country`, current month or period, comparison month or period, `financial state`, `reporting currency`, current amount, comparison amount, absolute variance, percentage variance.
- Audience: management-facing.

#### Renewal calendar
- Grouping fields: `contract`, `vendor`, `system/module`, `country`, renewal service period.
- Mandatory filters: renewal service period or upcoming period window, `financial state`, `reporting currency`.
- Totals: count of upcoming renewals, total current recurring baseline, and total identified renewal adjustment for the selected window.
- Export columns: `vendor`, `contract`, `system/module`, `country`, `owner`, `service period`, `financial state`, current recurring amount, renewal adjustment amount, `reporting currency`, `source document`.
- Audience: operational and management-facing.

#### Annual-vs-monthly variance
- Grouping fields: `country`, `system/module`, `financial state`, plan year, `month`.
- Mandatory filters: plan year, `financial state`, `reporting currency`, with optional `country` and `system/module` narrowing.
- Totals: annual total, sum of monthly totals, absolute variance, and percentage variance for the selected scope.
- Export columns: plan year, `month`, `country`, `system/module`, `financial state`, `reporting currency`, annual baseline amount, monthly cumulative amount, absolute variance, percentage variance.
- Audience: management-facing.

The required catalog is therefore explicit and complete: country view, product view, function view, vendor/contract view, cost category view, country rollup, country cost change, pre-allocation shared view, post-allocation shared view, renewal calendar, and annual-vs-monthly variance. Each of these views must remain a direct derivative of the canonical record plus governed allocation outputs so operational exports and management summaries always reconcile back to one model and one lineage chain.

## WeChat and Desktop Workflow
The workflow must separate `WeChat submission` from `desktop control` so channel permissions stay explicit, auditable, and aligned to governance. WeChat is the capture channel for country submitters when they need to record or route a cost item quickly, while desktop control remains the governed channel for review, correction, approval, export, bulk maintenance, rule administration, and exception handling.

### WeChat submission
`WeChat submission` is limited to lightweight intake and status routing. Each WeChat submission must capture the minimum required fields: `month`, `country`, `system/module`, `vendor`, `contract`, `cost category`, `financial state`, `service period`, `transaction currency`, `amount`, `owner`, and `source document` so the receiving reviewer can identify the accountable cost event without reopening the submission for missing basics.

WeChat may be used to create a new submission, provide supporting evidence, and respond to reviewer requests for straightforward factual completion, but it is not the channel for control-grade administration. The WeChat path must explicitly prohibit allocation rule editing in WeChat, FX maintenance in WeChat, and master-data creation in WeChat.

### Desktop control
`desktop control` is the required channel for governed actions after intake. The desktop path must support the minimum required actions: `review`, `correction`, `approval`, `export`, `bulk maintenance`, `rule administration`, and `exception` handling because these actions require broader record visibility, controlled change discipline, and audit-ready lineage across dimensions and periods.

Desktop control therefore owns any activity that can change governed logic, controlled reference values, or downstream reporting outputs. Reviewers, Finance, the regional system owner, Procurement, and IT must use desktop control for control-grade maintenance and governance execution, and no desktop-only control may be delegated back to mobile merely for convenience.

## Governance and Operating Calendar
The operating model should assign explicit accountability across HR, Finance, the regional system owner, country submitter, Procurement, and IT so that submission, approval, reference-data maintenance, and exception handling do not collapse into a generic HR-and-Finance-only process. Governance should ensure that cost updates are made routinely rather than only at budgeting time, and every governed change must follow approved ownership rather than ad hoc or free-text master-data edits.

### Governance Roles and RACI
| role | primary accountability | recurring decisions / actions |
|---|---|---|
| HR | Business policy owner for the HRIS cost register and operating cadence. | Confirms scope intent, reviews people-process impact, co-approves controlled master-data changes that affect business meaning, and chairs the periodic governance review with Finance. |
| Finance | Financial control owner for reporting integrity and close alignment. | Approves cost-category semantics, close and FX usage, annual adjustment treatment, and exception resolution that affects financial reporting or plan baselines. |
| Regional system owner | Accountable owner for regional system and module structures across countries. | Approves country-to-system alignment, module onboarding, allocation-rule proposals for shared regional platforms, and lifecycle changes such as module retirement or rename. |
| Country submitter | Responsible submitter for country-level onboarding, monthly updates, and evidence completeness. | Proposes new country records, submits renewals or change events with support, flags exceptions, and cannot directly change governed picklists or reference tables. |
| Procurement | Commercial control owner for vendor and contract changes. | Validates vendor onboarding, contract identifiers, renewal notices, commercial amendments, and any vendor or contract change before it becomes active in the register. |
| IT | Technical control owner for integration touchpoints, access control, and reference-table deployment discipline. | Maintains controlled reference tables in the chosen tool, enforces no-free-text configuration, implements effective-dated updates after approval, and preserves change-log traceability. |

### Controlled Object Ownership and Change Approval
| controlled object | accountable owner | required change approver(s) | control expectation |
|---|---|---|---|
| Countries | HR with country-level stewardship through the country submitter community | HR and Finance | Country values must come from the governed country list; country submitters may request additions or retirement but may not create ad hoc country labels. |
| Systems | Regional system owner | Regional system owner and HR | System names and scope status must stay aligned to the governed onboarding inventory with effective-dated history for rename, scope expansion, or retirement. |
| Modules | Regional system owner | Regional system owner and HR | Module additions, bundle splits, and module retirement must use approved effective dates so historical reporting retains prior structure. |
| Vendors | Procurement | Procurement and Finance | Vendor onboarding, rename, merge, or retirement must follow the governed vendor register with effective-dated references and no free-text vendor maintenance in transaction entry. |
| Cost categories | Finance | Finance and HR | Category values must come from the approved picklist and change only through formal governance review so reporting semantics stay stable across periods. |
| FX tables | Finance | Finance | Approved FX tables must be published by cycle and effective date; users may not override monthly close, annual plan freeze, or active forecast-cycle rates at line level. |
| Allocation rules | Finance for methodology, with regional system owner accountable for business applicability | Finance and regional system owner | Shared-cost allocation rules must be versioned, effective-dated, and traceable to approved logic before any allocated output is produced. |

### Master-Data and Control Requirements
- Picklist governance: all governed dimensions and reference tables, including countries, systems, modules, vendors, cost categories, currencies, financial states, and shared/allocation flags, must be maintained as controlled picklists or controlled master data. Country submitters may request a change, but only the accountable owner and required approver(s) may authorize it, and IT must deploy the approved value without enabling open-text alternatives.
- Effective-dated references: any change to countries, systems, modules, vendors, owners, FX tables, or allocation rules must carry an effective start date and, where relevant, an end date so historical records preserve the meaning in force at the time of posting. Reused labels must not overwrite prior reference meaning.
- Change log: each approved master-data or rule change must be recorded in a governed change log with request date, requested by, controlled object, old value, new value, effective date, approver(s), implementer, and reason for change. The change log should be reviewable in the periodic governance forum and retained as audit evidence.
- Exception process: if a submission cannot be coded with existing governed values, the country submitter raises an exception with supporting evidence to the regional system owner and Finance. Procurement joins when the issue affects a vendor or contract, and IT joins when deployment or access controls are involved. Temporary exception handling must use a tracked queue and named owner; unresolved exceptions escalate to the HR-and-Finance governance forum rather than allowing ad hoc free-text entry.

### Operating Cadence and Review Evidence
The operating calendar is mandatory and time-boxed so that the register, forecast, renewals, and governance actions are reviewed on a reproducible schedule rather than through ad hoc follow-up. Each cycle below must produce retained evidence so reviewers can prove what was reviewed, what changed, who owns the follow-up, and whether escalation is required.

| cadence | primary owner | minimum scope | evidence required |
|---|---|---|---|
| monthly close | Finance | Confirm the closed-month `Actual` register, first-open-month adjusting lines, FX-lock application, unresolved exceptions, and source-evidence completeness for booked activity. | Closed-month register extract, adjustment log, FX table used for the close, exception status list, and reviewer sign-off showing the month is locked. |
| monthly variance review | HR and Finance | Review month-to-budget, month-to-forecast, and renewal-adjustment variance by country, system/module, vendor, and owner; assign corrective actions for material movement. | Variance pack with current month actuals versus `Budget` and `Forecast`, named action list, due dates, and rationale for each material variance. |
| quarterly forecast refresh | Finance with input from HR, Procurement, and the regional system owner | Refresh `Forecast` and `Committed` amounts for open and future service periods using the active planning FX rate, known changes, expected credits, and renewal outlook. | Approved forecast refresh pack, updated assumptions log, planning FX table for the cycle, and evidence for each material re-forecast driver. |
| quarterly renewal review | Procurement and the renewal owner | Review all upcoming renewals, current recurring baseline, expected renewal adjustment, negotiation status, and unresolved commercial decisions for the next two quarters. | Renewal calendar export, contract status tracker, negotiation notes, expected renewal adjustment summary, and named action owners with target dates. |
| annual budget cycle | HR and Finance | Freeze the next plan-year `Budget`, confirm in-scope platforms, baseline recurring spend, expected one-time items, and approved planning assumptions. | Approved annual budget pack, plan-freeze FX table, approved baseline by country and system/module, and sign-off on plan-year assumptions. |
| annual platform rationalization review | HR, Finance, and the regional system owner | Review whether each platform, module, and service remains justified, whether layered or out-of-scope items should be reclassified, and whether consolidation or retirement actions are required. | Platform rationalization memo, reviewed system inventory, retire/retain/consolidate decisions, benefit-risk summary, and approved follow-up actions. |

### Renewal Lead-Time Signals and Escalation Path
Every upcoming renewal must have a named renewal owner from Procurement or the accountable business function, recorded against the contract before the look-ahead window begins. The renewal owner is responsible for keeping the renewal calendar current, confirming commercial status, and assembling the evidence required for review.

The minimum renewal lead-time signals are explicit. At 90 days before renewal, the renewal owner must confirm the renewal service period, current recurring baseline, incumbent commercial terms, expected demand or scope change, and whether the item is expected to remain `Forecast` or move toward `Committed`. At 60 days before renewal, the renewal owner must confirm negotiation status, expected renewal adjustment, approval path, and whether escalation is needed to protect continuity, budget, or policy compliance.

The escalation path is mandatory when evidence is missing, commercial terms remain unresolved, or the expected outcome breaches approved thresholds. The renewal owner first escalates to Procurement and Finance for commercial and budget impact review; unresolved business-scope or platform decisions then escalate to HR and the regional system owner; unresolved decision or timing risk remains open on the governance forum agenda until disposition is recorded.

Evidence required per review is non-optional: renewal notice or contract renewal date, current contract identifier, baseline recurring amount, expected renewal adjustment or no-change confirmation, business-demand confirmation, approval status, negotiation status, named renewal owner, and next action date. A renewal cannot be treated as review-ready without this evidence set, and missing evidence must be called out in the quarterly renewal review and monthly variance review until resolved.

## Implementation Blueprint
The implementation blueprint must remain `tool-agnostic`, stay compatible with the governance and workflow controls already defined above, and sequence capability only when the business case is explicit rather than implied by platform ambition. The roadmap should therefore start with a bounded register and move forward only when operating evidence shows that additional control depth is required.

### Phase 1
`Phase 1` is a controlled cost register. It should capture the canonical atomic records, enforce the existing controlled master data and picklist rules, support the required multidimensional views and export outputs, allow `WeChat submission` for lightweight intake, and preserve `desktop control` for review, correction, approval, rule administration, and exception handling already defined in this blueprint. `Phase 1` may reference approved allocation rules and approved FX tables where the register needs them for reporting consistency, but it remains a governed register first rather than a full workflow or systems-integration program.

`ERP/AP integration` is not a phase-1 requirement. Phase 1 should prove that the controlled register, evidence lineage, recurring update cadence, and exportable reporting outputs are working in live operations before integration scope is considered.

### Phase 2
`Phase 2` should begin only when progression conditions are met. Those progression conditions are that the business has confirmed the Phase 1 register structure is stable, the approval workflow needs are repeatable enough to justify formal workflow buildout, row-level permissions are required to manage sustained cross-country access boundaries, and integrations are justified by proven operational pain rather than assumed future architecture.

The explicit `escalation trigger` for moving beyond the simple register is persistent evidence that the Phase 1 operating model can no longer meet control or operating needs through governed register maintenance alone, for example when approval workflow steps are repeatedly handled outside the register, row-level permissions are needed to prevent inappropriate access in production use, or manual integrations create material audit, timeliness, or maintenance risk.

### Tool decision matrix
The `decision criteria` for selecting or expanding the implementation approach must stay neutral and `tool-agnostic`. Any candidate solution should be judged against whether it can support `WeChat submission`, `desktop control`, multidimensional views, export, controlled master data, allocation rules, FX tables, and `auditability` without weakening the governance model already defined in this document. The same decision criteria should also test whether the tool can preserve evidence lineage, effective-dated reference control, reproducible shared-cost treatment, and a clear path to later approval workflow, row-level permissions, and integrations only if the Phase 2 progression conditions are actually met.

## Worked Examples
The examples below use concrete source lines and derived views to prove that one canonical record structure can support direct costs, shared allocation, module decomposition, renewal movement, and first-open-month adjustments without losing reconciliation control. To keep lineage unambiguous, each example separates the canonical transaction record from the derived reporting-view output and explicitly states the source line, transaction amount, reporting currency, reporting amount, allocation rule version, and view output lineage.

### Example 1: Single-country recurring payroll fee
This is the happy-path direct recurring case for a single-country payroll module. The cost is entered once at canonical grain and reused across reporting views without any allocation.

**Canonical source record**

| month | country | system/module | financial state | subtype | shared/allocation flag | vendor | contract | service period | transaction currency | transaction amount | allocation rule version | source document | function | owner |
|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|
| 2026-03 | Indonesia | Payroll | Actual | Recurring | Direct | Nusantara Payroll Services | IDN-PAY-2026 | 2026-03-01 to 2026-03-31 | IDR | 180000000 | N/A | INV-IDN-2026-0315 | HR Operations | Indonesia HR Ops Lead |

**Derived reporting-view output**

| reporting view | reporting currency | reporting amount | record reference |
|---|---|---:|---|
| Country view / Product view / Function view / Vendor-contract view / Country rollup | USD | 11688 | IDN-PAY-2026-03-01 |

Control check literal: `2026-03 | Indonesia | Payroll | Actual | Recurring`

- source line: `IDN-PAY-2026-03-01` from invoice `INV-IDN-2026-0315` for March payroll processing in Indonesia.
- transaction amount: authoritative `amount = IDR 180000000` on the canonical source record.
- reporting currency and reporting amount: `USD` and `11688` in the derived reporting views using the approved March 2026 monthly close FX rate while keeping the transaction amount unchanged on the source record.
- allocation rule version: `N/A` because the line is direct and no allocated output is allowed.
- view output lineage: the same canonical record appears in Country view (Indonesia, March 2026), Product view (Payroll), Function view (`HR Operations`, with `Indonesia HR Ops Lead` retained as owner), Vendor/contract view (`Nusantara Payroll Services` / `IDN-PAY-2026`), and Country rollup without creating duplicate records.
- reconciliation check: detailed export filtered to `source document = INV-IDN-2026-0315` returns one direct source line with authoritative transaction `amount` and one consistent derived `reporting amount` reused across the reporting views above.

### Example 2: Shared regional e-sign fee allocated across three countries
This example proves the shared-cost lifecycle: one visible unsplit shared source line first, then allocated outputs derived by an approved rule version.

| scenario | line type | control note |
|---|---|---|
| Shared regional e-sign fee | Shared | Allocation basis = Active License Count under rule `APAC-ESIGN-V3` effective 2026-01-01 |

**Canonical pre-allocation shared source record**

| month | country | system/module | financial state | subtype | shared/allocation flag | vendor | contract | service period | transaction currency | transaction amount | allocation rule version | source document | function | owner |
|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|
| 2026-03 | Shared | E-sign | Actual | Recurring | Shared Source | SignFlow APAC | APAC-ESIGN-2026 | 2026-03-01 to 2026-03-31 | SGD | 9000 | APAC-ESIGN-V3 | INV-SG-ESIGN-0331 | HR Operations | Regional HRIS Lead |

**Derived allocated output view**

| month | country | system/module | financial state | subtype | shared/allocation flag | vendor | contract | service period | source shared line | allocation basis | allocation rule version | reporting currency | reporting amount | function | owner |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---:|---|---|
| 2026-03 | Indonesia | E-sign | Actual | Recurring | Allocated | SignFlow APAC | APAC-ESIGN-2026 | 2026-03-01 to 2026-03-31 | SHARED-ESIGN-2026-03 | Active License Count 50% | APAC-ESIGN-V3 | USD | 3330 | HR Operations | Regional HRIS Lead |
| 2026-03 | Thailand | E-sign | Actual | Recurring | Allocated | SignFlow APAC | APAC-ESIGN-2026 | 2026-03-01 to 2026-03-31 | SHARED-ESIGN-2026-03 | Active License Count 30% | APAC-ESIGN-V3 | USD | 1998 | HR Operations | Regional HRIS Lead |
| 2026-03 | Vietnam | E-sign | Actual | Recurring | Allocated | SignFlow APAC | APAC-ESIGN-2026 | 2026-03-01 to 2026-03-31 | SHARED-ESIGN-2026-03 | Active License Count 20% | APAC-ESIGN-V3 | USD | 1332 | HR Operations | Regional HRIS Lead |

- source line: `SHARED-ESIGN-2026-03` tied to invoice `INV-SG-ESIGN-0331`; the source shared line remains visible in the pre-allocation shared view, and `country = Shared` is the controlled special value used only for that unsplit pre-allocation record.
- transaction amount: authoritative `amount = SGD 9000` on the canonical shared source record.
- reporting currency and reporting amount: `USD` and `6660` total in the reporting layer, shown as derived reporting amounts of USD 3330 for Indonesia, USD 1998 for Thailand, and USD 1332 for Vietnam in the post-allocation shared view.
- allocation rule version: `APAC-ESIGN-V3`, owned by the Regional HRIS Lead and effective for March 2026.
- view output lineage: pre-allocation shared view shows one `Shared Source` line; post-allocation shared view shows three `Allocated` recipient lines with `source shared line = SHARED-ESIGN-2026-03`; Country view for Indonesia, Thailand, and Vietnam shows only each country's allocated reporting amount, while Vendor/contract view can display both the shared source and allocated outputs with filters.
- reconciliation check: USD 3330 + USD 1998 + USD 1332 = USD 6660 in reporting currency, and the same split traces back to the visible `SGD 9000` shared source record under the same service period and financial state.

### Example 3: Vendor bundle split into attendance and payroll modules
This example shows how a bundled invoice is decomposed into module-level canonical lines without losing vendor and contract lineage.

| scenario | module 1 | module 2 |
|---|---|---|
| Vendor bundle split | Attendance | Payroll |

**Canonical decomposed source records**

| month | country | system/module | financial state | subtype | shared/allocation flag | vendor | contract | service period | transaction currency | transaction amount | allocation rule version | source document | function | decomposition memo |
|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|
| 2026-04 | Malaysia | Attendance | Actual | Recurring | Direct | PeopleSuite APAC | MYS-BUNDLE-2026 | 2026-04-01 to 2026-04-30 | MYR | 12000 | N/A | INV-MYS-BUNDLE-0405 | HR Operations | MEMO-BUNDLE-2026-04 |
| 2026-04 | Malaysia | Payroll | Actual | Recurring | Direct | PeopleSuite APAC | MYS-BUNDLE-2026 | 2026-04-01 to 2026-04-30 | MYR | 18000 | N/A | INV-MYS-BUNDLE-0405 | HR Operations | MEMO-BUNDLE-2026-04 |

**Derived reporting-view output**

| reporting view | reporting currency | reporting amount | record reference |
|---|---|---:|---|
| Product view - Attendance | USD | 2820 | MYS-BUNDLE-2026-ATT |
| Product view - Payroll | USD | 4230 | MYS-BUNDLE-2026-PAY |
| Vendor-contract view total | USD | 7050 | INV-MYS-BUNDLE-0405 |

- source line: one bundled invoice `INV-MYS-BUNDLE-0405`, decomposed by auditable memo `MEMO-BUNDLE-2026-04` into two canonical module lines before reporting.
- transaction amount: authoritative `amount = MYR 30000` on the invoice, split into source amounts of `MYR 12000` for Attendance and `MYR 18000` for Payroll.
- reporting currency and reporting amount: the reporting layer shows `USD` with derived reporting amounts of 2820 for Attendance, 4230 for Payroll, and 7050 in the Vendor/contract view total while preserving the original MYR transaction amounts and common invoice lineage.
- allocation rule version: `N/A` because the split is a source decomposition, not a shared-cost allocation.
- view output lineage: Product view shows separate Attendance and Payroll totals; Vendor/contract view shows both lines under `PeopleSuite APAC` and `MYS-BUNDLE-2026`; Country rollup totals the same invoice through the two decomposed module rows without duplicate counting.
- reconciliation check: MYR 12000 + MYR 18000 = MYR 30000 at source, and USD 2820 + USD 4230 = USD 7050 in the reporting layer, so the decomposed module lines reconcile to the bundled invoice in both source and reporting views.

### Example 4: mid-year renewal uplift with recurring baseline and adjustment kept separate
This example shows how a signed renewal changes the recurring baseline in the second half of the year while keeping the uplift visible as a renewal adjustment instead of hiding it inside a replacement total.

**Canonical source records**

| month | country | system/module | financial state | subtype | shared/allocation flag | vendor | contract | service period | transaction currency | transaction amount | allocation rule version | source document | function | note |
|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|
| 2026-07 | Philippines | Core HR | Committed | Recurring | Direct | TalentSphere | PHL-COREHR-2026-R2 | 2026-07-01 to 2026-07-31 | PHP | 550000 | N/A | RENEWAL-PHL-0701 | HR Operations | new recurring baseline after renewal signature |
| 2026-07 | Philippines | Core HR | Committed | Renewal Adjustment | Direct | TalentSphere | PHL-COREHR-2026-R2 | 2026-07-01 to 2026-07-31 | PHP | 50000 | N/A | RENEWAL-PHL-0701 | HR Operations | mid-year renewal uplift versus prior baseline |

**Derived reporting-view output**

| reporting view | reporting currency | reporting amount | record reference |
|---|---|---:|---|
| Renewal calendar - current recurring baseline | USD | 9350 | PHL-COREHR-2026-R2-REC |
| Renewal calendar - renewal adjustment | USD | 850 | PHL-COREHR-2026-R2-RA |

- source line: signed renewal notice `RENEWAL-PHL-0701` supporting both the new recurring July line and the explicit renewal delta line.
- transaction amount: authoritative `amount = PHP 600000` total July commitment, represented as source amounts of `PHP 550000` for the new recurring baseline and `PHP 50000` for the renewal adjustment.
- reporting currency and reporting amount: July planning FX converts those source amounts into derived `USD` reporting amounts of 9350 for the recurring baseline and 850 for the renewal adjustment for renewal calendar and forecast-to-commit reporting, while PHP remains the transaction amount on source.
- allocation rule version: `N/A` because the contract is country-direct.
- view output lineage: Renewal calendar shows the current recurring baseline and the identified renewal adjustment separately; Country cost change and Annual-vs-monthly variance can isolate the uplift rather than treating the full July amount as ordinary run rate.
- reconciliation check: reviewers can compare the July recurring source line against the prior baseline and separately validate that the `mid-year renewal uplift` equals the commercial delta stated in the signed renewal evidence.

### Example 5: retroactive credit after close recorded in the first open month
This edge case shows the monthly close rule: a closed month is not rewritten, so the correction is entered as a separate negative Actual line in the first open month while retaining the original affected service period.

**Canonical source record**

| month | country | system/module | financial state | subtype | shared/allocation flag | vendor | contract | service period | transaction currency | transaction amount | allocation rule version | source document | function | note |
|---|---|---|---|---|---|---|---|---|---|---:|---|---|---|---|
| 2026-05 | Indonesia | Payroll | Actual | One-time | Direct | Nusantara Payroll Services | IDN-PAY-2026 | 2026-03-01 to 2026-03-31 | IDR | -15000000 | N/A | CREDIT-IDN-0506 | HR Operations | retroactive credit for March overbilling recorded after March close |

**Derived reporting-view output**

| reporting view | reporting currency | reporting amount | record reference |
|---|---|---:|---|
| Country view - May adjustment line | USD | -960 | CREDIT-IDN-0506 |

- source line: credit memo `CREDIT-IDN-0506` references the original March payroll invoice and is recorded in the first open month, May 2026, because March is already closed.
- transaction amount: authoritative `amount = IDR -15000000` on the adjusting source line.
- reporting currency and reporting amount: May close FX policy converts that source amount to derived `USD -960` in the reporting view even though the service period remains March 2026.
- allocation rule version: `N/A` because the correction applies to a direct country line.
- view output lineage: Country view for May shows the negative adjusting line, while detailed export preserves `service period = 2026-03-01 to 2026-03-31`; monthly close evidence for March remains unchanged, and reconciliation from May back to the original March service period is explicit.
- reconciliation check: March closed-month totals stay locked, May carries the negative adjustment, and the audit trail links the credit memo to the original source document and service coverage without overwriting history.

Across all five scenarios, the same canonical structure supports direct and shared lines, transaction and reporting currency views, rule-version traceability, and view-level reconciliation without introducing a second model or reporting-only grain.
## Out of Scope
This blueprint does not yet choose a vendor, define a detailed system architecture, or commit to a specific implementation platform. It also does not yet cover payment execution, invoice processing, or broader non-system HR outsourcing costs that have no direct connection to the managed HRIS and service scope.

The purpose of this document is to create a control-ready blueprint for cost management, not to finalize a full product build or procurement decision.
