# LocalBase T5-T7 Implementation Plan

## TL;DR

> **Tasks**: Grid View Enhancement, Table Management, Record CRUD
> 
> **Deliverables**:
> - Sortable grid columns
> - Column resize functionality
> - Add/rename/delete table dialogs
> - Record creation and batch delete
> 
> **Estimated Effort**: Medium
> **Parallel Execution**: T5 & T6 parallel, T7 after T6

---

## Context

### Current State
- **Frontend**: Vanilla JS with Tauri (not Leptos)
- **Backend**: All Tauri commands implemented
- **Grid**: Basic rendering with double-click to edit
- **Tables**: Basic list with click to open

### What Exists
```javascript
// src/main.js - State management
state.tables, state.currentTable, state.currentFields, state.currentRecords

// Tauri commands (already implemented)
get_tables, create_table, delete_table, rename_table
get_table_schema, add_field, delete_field
get_records, create_record, update_record, delete_record
```

### What Needs Enhancement
| Task | Current | Needed |
|------|---------|--------|
| T5: Grid Sorting | None | Click header to sort |
| T5: Column Resize | None | Drag to resize |
| T5: Cell Editing | Double-click | Better UX |
| T6: Rename Table | None | Modal + backend |
| T6: Delete Confirm | `confirm()` | Better modal |
| T7: Add Record | None | Button + row insert |
| T7: Batch Delete | None | Checkbox + delete |

---

## Work Objectives

### T5: Grid View Enhancement
1. **Column Sorting**: Click header to sort ASC/DESC
2. **Column Resize**: Drag column borders to resize
3. **Row Numbers**: Accurate numbering across pages
4. **Cell Focus**: Tab/Enter navigation between cells

### T6: Table Management
1. **Rename Table**: Modal dialog + `rename_table` command
2. **Delete Confirmation**: Better modal with table name
3. **Table Context Menu**: Right-click for quick actions
4. **Field Management**: Edit/delete existing fields

### T7: Record CRUD
1. **Add Record**: Insert row at top/bottom
2. **Batch Delete**: Checkbox selection + delete
3. **Record Count**: Display total records
4. **Quick Navigation**: Jump to specific page

---

## Verification Strategy

### QA Policy
Every task MUST include agent-executed QA scenarios.
Evidence saved to `.sisyphus/evidence/task-{N}-{scenario}.{ext}`

---

## TODOs

---

- [ ] 5. Grid View Enhancement

  **What to do**:
  - Add column sorting (click header toggles ASC/DESC/none)
  - Add column resize (drag border)
  - Track sort state in `state.sortField`, `state.sortDir`
  - Pass sort params to `get_records` command
  - Add visual indicators for sorted columns (▲/▼)
  - Keyboard navigation (Tab between cells)

  **Must NOT do**:
  - Don't implement multi-column sort (T12)
  - Don't implement advanced cell types (T13)

  **Recommended Agent Profile**:
  > **Category**: `visual-engineering`
  > - Reason: UI component with interaction design
  > **Skills**: `frontend-design`
  > - `frontend-design`: CSS styling and layout

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T6)
  - **Blocks**: T12
  - **Blocked By**: T3 (frontend layout exists)

  **References**:
  - `src/main.js:173-228` - Current grid rendering
  - `src/styles.css` - Grid styling

  **Acceptance Criteria**:
  - [ ] Click column header sorts data
  - [ ] Sort indicator (▲/▼) shows current sort
  - [ ] Drag column border resizes column
  - [ ] Tab key moves between cells

  **QA Scenarios**:

  ```
  Scenario: Column sorting
    Tool: Playwright
    Preconditions: Table open with >5 records
    Steps:
      1. Click column header "name"
      2. Verify data sorted A-Z
      3. Click "name" header again
      4. Verify data sorted Z-A
      5. Click "name" header third time
      6. Verify sort cleared
    Expected Result: Sort cycles: none → ASC → DESC → none
    Evidence: .sisyphus/evidence/t5-sort.{ext}

  Scenario: Column resize
    Tool: Playwright
    Preconditions: Table open
    Steps:
      1. Hover over column border (cursor changes)
      2. Drag border left
      3. Column narrows
      4. Drag border right
      5. Column widens
    Expected Result: Column width persists during session
    Evidence: .sisyphus/evidence/t5-resize.{ext}
  ```

  **Commit**: YES
  - Message: `feat: enhance grid view with sorting and resize`
  - Files: `src/main.js`, `src/styles.css`

---

- [ ] 6. Table Management

  **What to do**:
  - Add "Rename Table" modal with input field
  - Call `rename_table(tableId, newName)` command
  - Add table context menu (right-click)
  - Improve delete confirmation modal
  - Add "Delete Table" menu item
  - Call `delete_table(tableId)` command

  **Must NOT do**:
  - Don't implement table duplication
  - Don't implement table templates

  **Recommended Agent Profile**:
  > **Category**: `visual-engineering`
  > - Reason: UI dialogs and interactions
  > **Skills**: `frontend-design`
  > - `frontend-design`: Modal styling and UX

  **Parallelization**:
  - **Can Run In Parallel**: YES (with T5)
  - **Blocks**: None
  - **Blocked By**: T1, T2

  **References**:
  - `src-tauri/src/commands/mod.rs:65-70` - `rename_table` command
  - `src-tauri/src/commands/mod.rs:57-62` - `delete_table` command
  - `src/main.js:288-365` - Modal handling

  **Acceptance Criteria**:
  - [ ] Can rename table via modal
  - [ ] Can delete table with confirmation
  - [ ] Table list updates after rename/delete
  - [ ] Modal shows table name in warning

  **QA Scenarios**:

  ```
  Scenario: Rename table
    Tool: Playwright
    Preconditions: At least one table exists
    Steps:
      1. Navigate to table view
      2. Click table name (or rename button)
      3. Enter new name "renamed_table"
      4. Click confirm
      5. Verify name updated in header
      6. Go back to tables list
      7. Verify new name in list
    Expected Result: Table renamed successfully
    Evidence: .sisyphus/evidence/t6-rename.{ext}

  Scenario: Delete table with confirmation
    Tool: Playwright
    Preconditions: At least one table exists
    Steps:
      1. Click delete button on table card
      2. Confirmation modal appears with table name
      3. Click "Cancel" - table should remain
      4. Click delete again
      5. Click "Delete" to confirm
      6. Table removed from list
    Expected Result: Table only deleted on confirm
    Evidence: .sisyphus/evidence/t6-delete.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement table rename and delete confirmation`
  - Files: `src/main.js`, `src/styles.css`, `index.html`

---

- [ ] 7. Record CRUD Operations

  **What to do**:
  - Add "Add Record" button in toolbar
  - Insert empty row at top (or bottom via setting)
  - Auto-focus first field for immediate editing
  - Add checkboxes to record rows
  - Add "Delete Selected" button
  - Display record count: "Showing X of Y records"
  - Add page size selector (25/50/100)

  **Must NOT do**:
  - Don't implement record cloning
  - Don't implement record version history

  **Recommended Agent Profile**:
  > **Category**: `visual-engineering`
  > - Reason: Data interaction patterns
  > **Skills**: `frontend-design`
  > - `frontend-design`: Form and list styling

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Blocks**: T10 (form sharing)
  - **Blocked By**: T5, T6

  **References**:
  - `src/main.js:152-171` - `openTable` function
  - `src/main.js:230-271` - `startEditing` function
  - `src-tauri/src/commands/mod.rs:114-120` - `create_record` command

  **Acceptance Criteria**:
  - [ ] "Add Record" button creates new row
  - [ ] Checkbox selection works
  - [ ] Batch delete removes selected records
  - [ ] Record count shows "X of Y"
  - [ ] Page size can be changed

  **QA Scenarios**:

  ```
  Scenario: Add new record
    Tool: Playwright
    Preconditions: Table with fields "name", "email"
    Steps:
      1. Click "Add Record" button
      2. New row appears at top
      3. Double-click "name" cell
      4. Type "John Doe"
      5. Press Enter
      6. Double-click "email" cell
      7. Type "john@example.com"
      8. Press Enter
      9. Record saved automatically
    Expected Result: New record persisted in database
    Evidence: .sisyphus/evidence/t7-add-record.{ext}

  Scenario: Batch delete records
    Tool: Playwright
    Preconditions: Table with >3 records
    Steps:
      1. Check first 2 records
      2. Click "Delete Selected" button
      3. Confirmation shows "2 records"
      4. Confirm deletion
      5. Records removed
    Expected Result: Only unselected record remains
    Evidence: .sisyphus/evidence/t7-batch-delete.{ext}

  Scenario: Record count display
    Tool: Playwright
    Preconditions: Table with 75 records
    Steps:
      1. View table (page size 50)
      2. Verify "Showing 1-50 of 75"
      3. Change page size to 100
      4. Verify "Showing 1-75 of 75"
    Expected Result: Count updates correctly
    Evidence: .sisyphus/evidence/t7-count.{ext}
  ```

  **Commit**: YES
  - Message: `feat: implement record CRUD with batch operations`
  - Files: `src/main.js`, `src/styles.css`, `index.html`

---

## Final Verification Wave

- [ ] F1. **Build Verification** — `quick`
  Run `npm run build && cargo check`
  Output: `Build [PASS/FAIL]`

- [ ] F2. **UI Verification** — `unspecified-high`
  Execute all QA scenarios from T5, T6, T7
  Output: `Scenarios [N/N pass]`

- [ ] F3. **Integration Test** — `unspecified-high`
  Create table → Add fields → Add records → Edit → Delete
  Output: `Flow [PASS/FAIL]`

---

## Success Criteria

- [ ] Column sorting works (click header)
- [ ] Column resize works (drag border)
- [ ] Table rename works
- [ ] Table delete with confirmation works
- [ ] Add record creates new row
- [ ] Batch delete removes selected
- [ ] Record count displays correctly

---

**Plan Version**: 1.0
**Generated**: 2026-04-11
**Status**: Ready for execution
