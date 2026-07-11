# XLSX Skill - Anthropic Official

Source: https://github.com/anthropics/skills

---
name: xlsx
description: "Use this skill any time a spreadsheet file is the primary input or output..."
license: Proprietary
---

## Requirements for Outputs

### All Excel files
- Professional font (Arial, Times New Roman)
- Zero formula errors
- Preserve existing templates when updating

### Financial models - Color Coding Standards
- Blue text: Hardcoded inputs
- Black text: Formulas and calculations
- Green text: Links from other worksheets
- Red text: External links to other files
- Yellow background: Key assumptions

### Number Formatting Standards
- Years: Format as text strings
- Currency: $#,##0 format
- Zeros： "-" display
- Percentages: 0.0% format
- Multiples: 0.0x format

### Formula Construction Rules
- Place ALL assumptions in separate assumption cells
- Use cell references instead of hardcoded values
- Verify all cell references
- No unintended circular references

## Reading and analyzing data

Use pandas for data analysis, visualization, and basic operations.

## Excel File Workflows

CRITICAL: Use Formulas, Not Hardcoded Values. Always use Excel formulas instead of calculating values in Python.

### Common Workflow
1. Choose tool (pandas for data, openpyxl for formulas/formatting)
2. Create/Load workbook
3. Modify data, formulas, formatting
4. Save to file
5. Recalculate formulas (scripts/recalc.py)
6. Verify and fix errors

## Best Practices
- pandas: Best for data analysis, bulk operations
- openpyxl: Best for complex formatting, formulas
- Always use formulas, not hardcoded calculated values
- Test 2-3 sample references before building full model
