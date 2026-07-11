# DocuSign Onboarding Automation

Multi-template onboarding flow for blue-collar worker hiring.

## Overview

This system automates the full onboarding document cycle:

1. **Data Entry** — Excel template captures all employee info
2. **Document Generation** — Creates PDF documents (Offer Letter, NDA, Authorization, Forms)
3. **Template Setup** — Creates DocuSign templates with form fields
4. **Batch Send** — Sends multiple envelopes per employee (Offer Letter + Onboarding Package)
5. **Batch Export** — Exports signed documents and form data per template

## Onboarding Document Set

| Document | Description | Key Fields |
|---|---|---|
| 录用通知书 (Offer Letter) | Job offer with terms | name, position, startDate, salary |
| 保密协议 (NDA) | Confidentiality agreement | name, company, date |
| 个人信息授权书 (Privacy Authorization) | Data processing consent | name, idCard, date |
| 个人信息采集表 (Info Collection) | Personal details | name, phone, address, emergencyContact |
| 银行账户信息采集 (Bank Info) | Salary account details | bankName, accountNo, branch |
| 证件信息采集 (ID Documents) | ID/passport collection | idCard, passportNo, expiryDate |
