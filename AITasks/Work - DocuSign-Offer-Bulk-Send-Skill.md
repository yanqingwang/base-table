# DocuSign Offer Bulk Send Skill

**Version**: 1.0  
**Date**: 2026-06-13  
**Environment**: DEV (demo.docusign.net)  
**Template**: MY_Offer_Laird_Bulk_Send-DEV2 (6908f56d-f41c-46a7-9610-297299088f8d)

---

## Overview

This skill enables bulk sending of offer letters using the DocuSign eSignature API. It supports:
- CSV and XLSX data input
- Multiple recipient roles (HR Manager, Employee)
- Phone number (SMS) delivery with email fallback
- DocGen field mapping
- Dry-run validation mode

---

## Quick Start

### Prerequisites
- Python 3.8+
- DocuSign DEV account with API access
- Valid JWT authentication configured in `.env`

### Basic Usage

```bash
# Send offer to sample data
python send_laird_test.py --status sent

# Send from XLSX file
python send_laird_test.py --xlsx Sample-Bulk-Recipient.xlsx --status sent

# Send from CSV file
python send_laird_test.py --csv laird_test_batch.csv --status sent

# Dry-run (validate without sending)
python send_laird_test.py --xlsx Sample-Bulk-Recipient.xlsx --dry-run

# Send specific row (0-indexed)
python send_laird_test.py --xlsx Sample-Bulk-Recipient.xlsx --index 0 --status sent
```

---

## Data Format

### XLSX/CSV Column Structure

Columns use prefixes to identify recipient roles and field types:

| Prefix | Purpose | Example |
|--------|---------|---------|
| `HR Manager::` | HR Manager recipient metadata | `HR Manager::Email` |
| `Employee::` | Employee recipient fields | `Employee::Full Name as Per IC` |
| `Document Generation::` | DocuSign DocGen fields | `Document Generation::Job Title` |
| (none) | Employee fields (bare format) | `Full Name as Per IC` |

### Required Columns

| Column | Description | Default |
|--------|-------------|---------|
| `Employee::Name` | Employee full name | Required |
| `Employee::Email` | Employee email | `wangyantsing@qq.com` |
| `Employee::PhoneNumber` | Employee phone (for SMS) | Optional |
| `HR Manager::Name` | HR Manager name | Uses Employee::Name |
| `HR Manager::Email` | HR Manager email | `wangyantsing@qq.com` |
| `HR Manager::PhoneNumber` | HR Manager phone (for SMS) | Optional |

### Sample XLSX Structure

See `Sample-Bulk-Recipient.xlsx` for complete template with 116 columns covering:
- 6 HR Manager columns
- 95 Employee columns  
- 14 Document Generation columns

---

## Phone Number (SMS) Delivery

The script supports SMS delivery when phone numbers are provided:

1. **HR Manager**: Uses `HR Manager::PhoneNumber`
2. **Employee**: Uses `Employee::PhoneNumber`

### SMS Fallback Behavior

If SMS delivery fails (account lacks permission), the script automatically falls back to email delivery:
- HR Manager: Uses `HR Manager::Email`
- Employee: Uses `Employee::Email`

### Phone Number Format

Accepts formats:
- `+60123456789` (with country code)
- `012-3456789` (local format)
- `0123456789` (plain digits)

---

## Document Generation (DocGen)

The Offer Letter document uses DocuSign Document Generation for dynamic content.

### DocGen Fields

| Field | Type | Description |
|-------|------|-------------|
| REQ_ID | TextBox | Requisition ID |
| Initiate_Date | Date | Offer initiation date |
| Employee_Full_Name | TextBox | Employee name |
| Identification_Card_Number | TextBox | IC/Passport number |
| Employee_Home_Address | TextBox | Full address |
| Job_Title | TextBox | Position title |
| Band_Level_Role | TextBox | Job band/level |
| Effective_Date | Date | Start date |
| Currency | Select | MYR or USD |
| Monthly_Basic_Salary | Number | Monthly salary |
| Incentive_Rate | TextBox | Incentive percentage |
| Probation_Period | TextBox | Probation duration |
| Month_s_Notice_Confirmed | Select | Notice period (1/2 months) |
| Month_s_Written_Notice | Select | Written notice (1/2 months) |

### DocGen Limitations

**IMPORTANT**: DocuSign API does NOT persist DocGen field values programmatically.

DocGen fields must be filled via the web UI add-genforms page before sending:
1. Open template in DocuSign web UI
2. Click "Use" on the template
3. Fill in DocGen fields on the add-genforms page
4. Proceed to add fields and send

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| `ACCOUNT_LACKS_PERMISSIONS` | SMS not enabled | Script falls back to email |
| `name and email columns required` | Missing required columns | Add Employee::Name and Employee::Email |
| `TEMPLATE_NOT_FOUND` | Template ID mismatch | Verify template ID in script |

### Data Validation

The script validates:
- Employee name is present
- Email defaults to `wangyantsing@qq.com` if missing
- Phone numbers are parsed correctly
- Tab types match template definitions

---

## Template Information

| Property | Value |
|----------|-------|
| Template ID | `6908f56d-f41c-46a7-9610-297299088f8d` |
| Name | MY_Offer_Laird_Bulk_Send-DEV2 |
| Account | 45444181 (TE-MY) |
| Environment | demo.docusign.net |
| Documents | 5 (Offer Letter + 4 PDFs) |
| HR Manager Tabs | 1 (signature) |
| Employee Tabs | 148 (92 text, 29 list, 7 date, etc.) |
| DocGen Fields | 14 |

---

## Troubleshooting

### Issue: Envelope created but fields not filled

**Cause**: DocGen fields not populated via web UI

**Solution**: 
1. Open template in DocuSign web UI
2. Fill DocGen fields on add-genforms page
3. Send envelope

### Issue: SMS delivery fails

**Cause**: Account lacks SMS permission

**Solution**: Script automatically falls back to email. To enable SMS, contact DocuSign support.

### Issue: Missing tabs in envelope

**Cause**: Column name doesn't match template tab label

**Solution**: 
1. Check template tab labels via API
2. Ensure XLSX column names match exactly
3. Use `Employee::` prefix for Employee fields

---

## API Reference

### Authentication

```python
from docusign_auth import get_access_token, get_api_headers

token = get_access_token()
headers = get_api_headers(token)
```

### Create Envelope

```python
import urllib.request
import json

url = f"https://demo.docusign.net/restapi/v2.1/accounts/45444181/envelopes"
payload = {
    "templateId": "6908f56d-f41c-46a7-9610-297299088f8d",
    "templateRoles": [...],
    "status": "sent"
}
req = urllib.request.Request(url, json.dumps(payload).encode(), headers=headers, method="POST")
resp = urllib.request.urlopen(req)
```

---

## File Locations

| File | Path | Description |
|------|------|-------------|
| Main Script | `DEV/send_laird_test.py` | Bulk send script |
| Auth Module | `DEV/docusign_auth.py` | JWT authentication |
| Sample Data | `DEV/Sample-Bulk-Recipient.xlsx` | XLSX template |
| Sample CSV | `DEV/laird_test_batch.csv` | CSV template |
| Private Key | `DEV/docusign_private_v2.pem` | RSA private key |
| Config | `DEV/.env` | Environment variables |

---

## Support

For issues or questions:
1. Check this operation manual
2. Review script comments in `send_laird_test.py`
3. Check DocuSign API documentation
4. Contact development team
