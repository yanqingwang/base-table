# Base Table Tauri MVP Design

Date: 2026-04-24

## Goal

Build a local-first desktop MVP for Base Table, a lightweight multidimensional table app inspired by Feishu Base and NocoDB. The MVP focuses on local data maintenance, Excel import, automatic field and dimension inference, grid editing, kanban grouping, and Chinese/English UI support.

## Technology Stack

- Desktop shell: Tauri 2
- Frontend: React with TypeScript
- Backend: Rust Tauri commands
- Storage: SQLite
- Excel import: Rust-side `.xlsx` reader
- Internationalization: frontend message dictionaries for Chinese and English

This stack keeps the required Rust/Tauri foundation while using web UI tooling for complex tables and kanban interactions.

## Scope

The MVP includes:

- Base and table navigation.
- Field create, rename, type change, delete, and reorder support.
- Record create, edit, and delete support.
- Grid view for direct table editing.
- Kanban view grouped by a selected field.
- Excel import from `.xlsx` files.
- Automatic field type inference during import.
- Automatic dimension candidate detection for grouping fields.
- Chinese and English UI language switching.

The MVP excludes cloud sync, account login, permission management, multi-user collaboration, attachments, formulas, automation workflows, and public sharing service mode.

## Architecture

The application has three layers:

1. React UI layer renders navigation, toolbar, grid view, kanban view, import flow, and language switching.
2. Tauri command layer exposes typed commands for CRUD, import, inference, and view configuration.
3. SQLite persistence layer stores base metadata, table schemas, dynamic record data, and view settings.

The frontend never writes directly to the database. All mutations go through Rust commands so validation, conversion, and persistence remain centralized.

## Data Model

SQLite tables:

- `bases(id, name, created_at, updated_at)`
- `tables(id, base_id, name, created_at, updated_at)`
- `fields(id, table_id, name, field_type, config_json, ordinal, created_at, updated_at)`
- `records(id, table_id, data_json, created_at, updated_at, deleted_at)`
- `views(id, table_id, name, view_type, config_json, created_at, updated_at)`

Field types in the MVP:

- `text`
- `number`
- `date`
- `bool`
- `single_select`

Records store values in `data_json` keyed by field id. This avoids table migrations whenever users add, remove, or change fields.

## Main User Flows

### Create and Maintain Data

Users create a base, create tables, add fields, and add records. The grid view allows inline editing of cell values. Field changes trigger validation in Rust before persistence.

### Import Excel

Users choose an `.xlsx` file. The app reads the first sheet by default, uses the first row as field names, samples column values, infers field types, creates fields, creates records, and reports any uncertain inference decisions.

### Detect Dimensions

After import or record changes, the backend calculates dimension candidates. Candidate fields are text, boolean, or single-select fields with enough non-empty values and a useful unique-value ratio. The highest-scoring candidate becomes the default kanban grouping field.

### Use Kanban

Users open kanban view, choose a grouping field, and see records split into columns by field value. Empty values appear in an `Ungrouped` column. Card titles use the first text field or record id.

## Error Handling

- Database errors return structured error messages to the frontend.
- Import errors identify the file, sheet, row, or column when possible.
- Invalid field conversions do not destroy existing values; the UI shows conversion failures and keeps the original data.
- Kanban falls back to `Ungrouped` when the selected grouping field is missing or empty.

## Testing Strategy

- Rust unit tests cover field type inference, dimension scoring, and CRUD validation.
- Frontend tests cover i18n messages, grid editing state, and kanban grouping behavior.
- Integration checks verify that Tauri commands can initialize the database, create a table, add fields, add records, and import a sample workbook.

## Implementation Boundary

The first code milestone should produce a runnable Tauri desktop app with a seeded local database and working CRUD through the UI. Excel import and kanban should follow after the data model is stable.
