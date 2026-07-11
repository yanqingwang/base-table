## 2026-04-17T23:33:54.840Z Task: session-init
No blockers at session start.


## 2026-04-18 Task 11
- The pilot matching CSV reuses `C001-C010` for BYD/Foxconn/NIO/etc., while the canonical company CSV maps those IDs to other companies (e.g. Alibaba/Tencent). This task documents logic around the mismatch but does not reconcile the IDs.

- 2026-04-18: No matching `Reports/OPC1-demand-companies-500-china-2026-04-18.xlsx` file was present during report generation, so the appendix links only the CSV. Also, many evidence URLs in the CSV point to search-result pages, so deal work should upgrade them to first-party or direct job-posting URLs before outreach.

- 2026-04-18: `Reports/OPC1-vendors-top100-hris-china-2026-04-18.csv` is labeled Top100 but currently contains only 10 vendor rows plus header, so downstream reports must disclose snapshot scope explicitly.

- 2026-04-18 F2 blockers: 450 company rows missing signal/evidence fields, vendor deliverable is 10/100 rows, match export uses invalid `next_action=validate_industry_fit`, and all three expected XLSX exports are absent.