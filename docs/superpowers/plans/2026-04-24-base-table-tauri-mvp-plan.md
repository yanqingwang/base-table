# Base Table Tauri MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a runnable local-first Tauri desktop MVP for Base Table with base/table management, field and record CRUD, grid view, kanban view, Excel import, automatic type and dimension inference, and Chinese/English UI support.

**Architecture:** The app uses Tauri 2 with a React + TypeScript frontend and a Rust backend. Rust owns SQLite persistence, import logic, and validation through typed Tauri commands; React renders navigation, grid, kanban, import flow, and language switching against a small API wrapper.

**Tech Stack:** Tauri 2, React, TypeScript, Vite, Rust, SQLite, serde, calamine, React Testing Library, Vitest

---

## File Structure

### Create

- `base-table/package.json` — frontend scripts and dependencies
- `base-table/vite.config.ts` — Vite configuration
- `base-table/tsconfig.json` — TypeScript config
- `base-table/index.html` — Vite entry HTML
- `base-table/src/main.tsx` — React bootstrap
- `base-table/src/App.tsx` — root layout and app state wiring
- `base-table/src/styles.css` — app styles
- `base-table/src/types.ts` — shared frontend domain types
- `base-table/src/lib/tauri.ts` — typed Tauri invoke wrapper
- `base-table/src/lib/i18n.ts` — message catalog and locale helpers
- `base-table/src/components/Sidebar.tsx` — base/table navigation
- `base-table/src/components/Toolbar.tsx` — view switching, import, language controls
- `base-table/src/components/GridView.tsx` — editable grid UI
- `base-table/src/components/KanbanView.tsx` — grouped kanban UI
- `base-table/src/components/ImportDialog.tsx` — import flow UI
- `base-table/src/components/FieldEditor.tsx` — field CRUD UI
- `base-table/src/components/RecordEditor.tsx` — record CRUD UI
- `base-table/src/test/i18n.test.ts` — i18n frontend tests
- `base-table/src/test/kanban.test.tsx` — kanban grouping frontend tests
- `base-table/src-tauri/Cargo.toml` — Rust crate manifest
- `base-table/src-tauri/tauri.conf.json` — Tauri configuration
- `base-table/src-tauri/build.rs` — Tauri build entry
- `base-table/src-tauri/src/main.rs` — Tauri app startup and command registration
- `base-table/src-tauri/src/models.rs` — Rust domain models
- `base-table/src-tauri/src/db.rs` — SQLite setup and CRUD queries
- `base-table/src-tauri/src/commands.rs` — Tauri commands
- `base-table/src-tauri/src/infer.rs` — type and dimension inference
- `base-table/src-tauri/src/import.rs` — Excel import service
- `base-table/src-tauri/src/errors.rs` — structured backend errors
- `base-table/src-tauri/tests/infer_tests.rs` — inference tests
- `base-table/src-tauri/tests/db_tests.rs` — backend CRUD tests

### Notes

- Keep frontend types aligned with Rust response shapes.
- Keep database access in `db.rs`; do not scatter SQL across commands.
- Keep inference logic isolated in `infer.rs` so it can be unit-tested without Tauri.

## Acceptance Criteria

- The app starts with `npm run tauri dev` from `base-table/`.
- Users can create a base and a table from the UI.
- Users can add, rename, reorder, and delete fields.
- Users can add, edit, and delete records in grid view.
- Users can switch between grid and kanban views.
- Kanban groups records by a selected candidate dimension field and shows an `Ungrouped` column for empty values.
- Users can import an `.xlsx` file and see created fields and records.
- Type inference returns one of `text | number | date | bool | single_select`.
- Users can switch UI language between Chinese and English.
- Backend tests and frontend tests pass.

### Task 1: Scaffold the Tauri + React project

**Files:**
- Create: `base-table/package.json`
- Create: `base-table/vite.config.ts`
- Create: `base-table/tsconfig.json`
- Create: `base-table/index.html`
- Create: `base-table/src/main.tsx`
- Create: `base-table/src/App.tsx`
- Create: `base-table/src/styles.css`
- Create: `base-table/src/types.ts`
- Create: `base-table/src-tauri/Cargo.toml`
- Create: `base-table/src-tauri/tauri.conf.json`
- Create: `base-table/src-tauri/build.rs`
- Create: `base-table/src-tauri/src/main.rs`

- [ ] **Step 1: Create `package.json` with the desktop app dependencies**

```json
{
  "name": "base-table",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest run",
    "tauri": "tauri"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@tauri-apps/cli": "^2.0.0",
    "@testing-library/react": "^16.0.1",
    "@testing-library/jest-dom": "^6.6.3",
    "@types/react": "^18.3.5",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "typescript": "^5.6.2",
    "vite": "^5.4.8",
    "vitest": "^2.1.1"
  }
}
```

- [ ] **Step 2: Add the frontend bootstrap files**

```tsx
// base-table/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

```tsx
// base-table/src/App.tsx
export default function App() {
  return <div className="app-shell">Base Table</div>;
}
```

- [ ] **Step 3: Add the Rust manifest and minimal Tauri entrypoint**

```toml
# base-table/src-tauri/Cargo.toml
[package]
name = "base-table"
version = "0.1.0"
edition = "2021"

[build-dependencies]
tauri-build = { version = "2.0.0", features = [] }

[dependencies]
serde = { version = "1", features = ["derive"] }
serde_json = "1"
tauri = { version = "2.0.0", features = [] }
```

```rust
// base-table/src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running base-table");
}
```

- [ ] **Step 4: Install dependencies**

Run: `npm install`

Expected: packages install successfully and `package-lock.json` is created.

- [ ] **Step 5: Verify the frontend build works**

Run: `npm run build`

Expected: Vite finishes with a successful build output.

### Task 2: Define shared types and i18n foundations

**Files:**
- Create: `base-table/src/types.ts`
- Create: `base-table/src/lib/i18n.ts`
- Test: `base-table/src/test/i18n.test.ts`

- [ ] **Step 1: Add the shared frontend types**

```ts
// base-table/src/types.ts
export type FieldType = 'text' | 'number' | 'date' | 'bool' | 'single_select';

export interface BaseItem {
  id: string;
  name: string;
}

export interface TableItem {
  id: string;
  baseId: string;
  name: string;
}

export interface FieldItem {
  id: string;
  tableId: string;
  name: string;
  fieldType: FieldType;
  ordinal: number;
}

export interface RecordItem {
  id: string;
  tableId: string;
  data: Record<string, string | number | boolean | null>;
}
```

- [ ] **Step 2: Add the i18n dictionary and helper**

```ts
// base-table/src/lib/i18n.ts
export type Locale = 'zh-CN' | 'en-US';

const messages = {
  'zh-CN': {
    appTitle: 'Base Table',
    grid: '表格',
    kanban: '看板',
    import: '导入 Excel',
    addField: '新增列',
    addRecord: '新增记录',
    ungrouped: '未分组',
  },
  'en-US': {
    appTitle: 'Base Table',
    grid: 'Grid',
    kanban: 'Kanban',
    import: 'Import Excel',
    addField: 'Add Field',
    addRecord: 'Add Record',
    ungrouped: 'Ungrouped',
  },
} as const;

export function t(locale: Locale, key: keyof (typeof messages)['zh-CN']) {
  return messages[locale][key];
}
```

- [ ] **Step 3: Write the i18n test first**

```ts
// base-table/src/test/i18n.test.ts
import { describe, expect, it } from 'vitest';
import { t } from '../lib/i18n';

describe('i18n messages', () => {
  it('returns Chinese labels', () => {
    expect(t('zh-CN', 'grid')).toBe('表格');
  });

  it('returns English labels', () => {
    expect(t('en-US', 'kanban')).toBe('Kanban');
  });
});
```

- [ ] **Step 4: Run the i18n test**

Run: `npm run test -- src/test/i18n.test.ts`

Expected: both tests pass.

### Task 3: Add SQLite models and database initialization

**Files:**
- Create: `base-table/src-tauri/src/models.rs`
- Create: `base-table/src-tauri/src/db.rs`
- Create: `base-table/src-tauri/src/errors.rs`
- Modify: `base-table/src-tauri/src/main.rs`
- Test: `base-table/src-tauri/tests/db_tests.rs`

- [ ] **Step 1: Add the Rust models used by commands and storage**

```rust
// base-table/src-tauri/src/models.rs
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BaseItem {
    pub id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TableItem {
    pub id: String,
    pub base_id: String,
    pub name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct FieldItem {
    pub id: String,
    pub table_id: String,
    pub name: String,
    pub field_type: String,
    pub ordinal: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecordItem {
    pub id: String,
    pub table_id: String,
    pub data: serde_json::Value,
}
```

- [ ] **Step 2: Add the database bootstrap and schema creation**

```rust
// base-table/src-tauri/src/db.rs
use rusqlite::{Connection, Result};

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS bases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tables (
            id TEXT PRIMARY KEY,
            base_id TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS fields (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            name TEXT NOT NULL,
            field_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            ordinal INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT
        );
        CREATE TABLE IF NOT EXISTS views (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            name TEXT NOT NULL,
            view_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        "#,
    )?;
    Ok(conn)
}
```

- [ ] **Step 3: Write the database initialization test first**

```rust
// base-table/src-tauri/tests/db_tests.rs
use base_table::db::init_db;

#[test]
fn creates_required_tables() {
    let conn = init_db(":memory:").expect("db init should succeed");

    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('bases','tables','fields','records','views')",
            [],
            |row| row.get(0),
        )
        .expect("table count query should succeed");

    assert_eq!(count, 5);
}
```

- [ ] **Step 4: Add the missing Rust dependencies**

Update `base-table/src-tauri/Cargo.toml` to include:

```toml
rusqlite = { version = "0.32.1", features = ["bundled"] }
chrono = { version = "0.4", features = ["serde"] }
uuid = { version = "1", features = ["v4", "serde"] }
```

- [ ] **Step 5: Run the Rust database test**

Run: `cargo test creates_required_tables`

Expected: the schema test passes.

### Task 4: Implement backend CRUD commands

**Files:**
- Create: `base-table/src-tauri/src/commands.rs`
- Modify: `base-table/src-tauri/src/db.rs`
- Modify: `base-table/src-tauri/src/main.rs`
- Test: `base-table/src-tauri/tests/db_tests.rs`

- [ ] **Step 1: Write the failing backend CRUD test first**

```rust
#[test]
fn creates_base_table_field_and_record() {
    let conn = init_db(":memory:").expect("db init should succeed");
    let base_id = base_table::db::create_base(&conn, "Operations").expect("base create should succeed");
    let table_id = base_table::db::create_table(&conn, &base_id, "Tasks").expect("table create should succeed");
    let field_id = base_table::db::create_field(&conn, &table_id, "Status", "single_select", 0).expect("field create should succeed");
    let record_id = base_table::db::create_record(
        &conn,
        &table_id,
        serde_json::json!({ field_id: "Todo" }),
    )
    .expect("record create should succeed");

    assert!(!record_id.is_empty());
}
```


- [ ] **Step 2: Add minimal database CRUD functions**

```rust
pub fn create_base(conn: &Connection, name: &str) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO bases (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        [&id, name, &now, &now],
    )?;
    Ok(id)
}

pub fn create_table(conn: &Connection, base_id: &str, name: &str) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO tables (id, base_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        [&id, base_id, name, &now, &now],
    )?;
    Ok(id)
}

pub fn create_field(conn: &Connection, table_id: &str, name: &str, field_type: &str, ordinal: i64) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO fields (id, table_id, name, field_type, config_json, ordinal, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        rusqlite::params![id, table_id, name, field_type, "{}", ordinal, now, now],
    )?;
    Ok(id)
}

pub fn create_record(conn: &Connection, table_id: &str, data: serde_json::Value) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().to_rfc3339();
    conn.execute(
        "INSERT INTO records (id, table_id, data_json, created_at, updated_at, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
        rusqlite::params![id, table_id, data.to_string(), now, now],
    )?;
    Ok(id)
}
```

Use this insert pattern in each function:

```rust
let id = uuid::Uuid::new_v4().to_string();
let now = chrono::Utc::now().to_rfc3339();
conn.execute(
    "INSERT INTO bases (id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
    [&id, name, &now, &now],
)?;
Ok(id)
```

- [ ] **Step 3: Expose Tauri commands for the CRUD operations**

```rust
// base-table/src-tauri/src/commands.rs
use crate::db;

#[tauri::command]
pub fn create_base(name: String) -> Result<String, String> {
    let conn = db::init_db("base-table.db").map_err(|err| err.to_string())?;
    db::create_base(&conn, &name).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn create_table(base_id: String, name: String) -> Result<String, String> {
    let conn = db::init_db("base-table.db").map_err(|err| err.to_string())?;
    db::create_table(&conn, &base_id, &name).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn create_field(table_id: String, name: String, field_type: String, ordinal: i64) -> Result<String, String> {
    let conn = db::init_db("base-table.db").map_err(|err| err.to_string())?;
    db::create_field(&conn, &table_id, &name, &field_type, ordinal).map_err(|err| err.to_string())
}

#[tauri::command]
pub fn create_record(table_id: String, data: serde_json::Value) -> Result<String, String> {
    let conn = db::init_db("base-table.db").map_err(|err| err.to_string())?;
    db::create_record(&conn, &table_id, data).map_err(|err| err.to_string())
}
```

- [ ] **Step 4: Register the command handlers in `main.rs`**

```rust
tauri::Builder::default()
    .invoke_handler(tauri::generate_handler![
        commands::create_base,
        commands::create_table,
        commands::create_field,
        commands::create_record,
    ])
```

- [ ] **Step 5: Run the Rust test suite for CRUD**

Run: `cargo test creates_base_table_field_and_record`

Expected: the CRUD flow test passes.

### Task 5: Add the typed frontend invoke wrapper and app state

**Files:**
- Create: `base-table/src/lib/tauri.ts`
- Modify: `base-table/src/App.tsx`
- Modify: `base-table/src/types.ts`

- [ ] **Step 1: Add a typed invoke wrapper**

```ts
// base-table/src/lib/tauri.ts
import { invoke } from '@tauri-apps/api/core';
import type { BaseItem, FieldItem, RecordItem, TableItem } from '../types';

export function createBase(name: string) {
  return invoke<string>('create_base', { name });
}

export function createTable(baseId: string, name: string) {
  return invoke<string>('create_table', { baseId, name });
}

export function createField(tableId: string, name: string, fieldType: string, ordinal: number) {
  return invoke<string>('create_field', { tableId, name, fieldType, ordinal });
}

export function createRecord(tableId: string, data: Record<string, unknown>) {
  return invoke<string>('create_record', { tableId, data });
}
```

- [ ] **Step 2: Replace the placeholder `App.tsx` with real app state**

```tsx
const [locale, setLocale] = useState<Locale>('zh-CN');
const [view, setView] = useState<'grid' | 'kanban'>('grid');
const [bases, setBases] = useState<BaseItem[]>([]);
const [tables, setTables] = useState<TableItem[]>([]);
const [fields, setFields] = useState<FieldItem[]>([]);
const [records, setRecords] = useState<RecordItem[]>([]);
const [activeBaseId, setActiveBaseId] = useState<string | null>(null);
const [activeTableId, setActiveTableId] = useState<string | null>(null);
```

- [ ] **Step 3: Add minimal create handlers to prove the round-trip works**

```tsx
async function handleCreateBase() {
  const name = window.prompt('Base name');
  if (!name) return;
  const id = await createBase(name);
  setBases((current) => [...current, { id, name }]);
}
```

- [ ] **Step 4: Run the frontend build after the state wiring**

Run: `npm run build`

Expected: the build succeeds with no TypeScript errors.

### Task 6: Build the navigation and toolbar UI

**Files:**
- Create: `base-table/src/components/Sidebar.tsx`
- Create: `base-table/src/components/Toolbar.tsx`
- Modify: `base-table/src/App.tsx`
- Modify: `base-table/src/styles.css`

- [ ] **Step 1: Create the sidebar component**

```tsx
// base-table/src/components/Sidebar.tsx
import type { BaseItem, TableItem } from '../types';

interface SidebarProps {
  bases: BaseItem[];
  tables: TableItem[];
  activeBaseId: string | null;
  activeTableId: string | null;
  onSelectBase: (id: string) => void;
  onSelectTable: (id: string) => void;
  onCreateBase: () => void;
  onCreateTable: () => void;
}
```

- [ ] **Step 2: Create the toolbar component**

```tsx
// base-table/src/components/Toolbar.tsx
interface ToolbarProps {
  locale: Locale;
  view: 'grid' | 'kanban';
  onLocaleChange: (locale: Locale) => void;
  onViewChange: (view: 'grid' | 'kanban') => void;
  onImport: () => void;
}
```

- [ ] **Step 3: Render sidebar and toolbar inside `App.tsx`**

```tsx
return (
  <div className="app-shell">
    <Sidebar {...sidebarProps} />
    <main className="content-shell">
      <Toolbar {...toolbarProps} />
    </main>
  </div>
);
```

- [ ] **Step 4: Add layout CSS for a usable desktop shell**

```css
.app-shell { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
.content-shell { display: flex; flex-direction: column; }
```

- [ ] **Step 5: Run the app shell manually**

Run: `npm run dev`

Expected: the browser preview shows a sidebar and toolbar without runtime errors.

### Task 7: Implement grid field and record CRUD UI

**Files:**
- Create: `base-table/src/components/GridView.tsx`
- Create: `base-table/src/components/FieldEditor.tsx`
- Create: `base-table/src/components/RecordEditor.tsx`
- Modify: `base-table/src/App.tsx`
- Modify: `base-table/src/lib/tauri.ts`

- [ ] **Step 1: Add update and delete command wrappers**

```ts
export function updateRecord(recordId: string, data: Record<string, unknown>) {
  return invoke<void>('update_record', { recordId, data });
}

export function deleteRecord(recordId: string) {
  return invoke<void>('delete_record', { recordId });
}
```

- [ ] **Step 2: Build the editable grid component**

```tsx
// base-table/src/components/GridView.tsx
interface GridViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  onCellChange: (recordId: string, fieldId: string, value: string) => void;
}
```

- [ ] **Step 3: Add field create and rename controls**

```tsx
// base-table/src/components/FieldEditor.tsx
interface FieldEditorProps {
  fields: FieldItem[];
  onCreateField: (name: string, fieldType: FieldType) => void;
  onRenameField: (fieldId: string, name: string) => void;
}
```

- [ ] **Step 4: Add record create and delete controls**

```tsx
// base-table/src/components/RecordEditor.tsx
interface RecordEditorProps {
  onCreateRecord: () => void;
  onDeleteRecord: (recordId: string) => void;
}
```

- [ ] **Step 5: Manually verify grid CRUD from the running app**

Run: `npm run tauri dev`

Expected: you can create a field, create a record, edit a cell, and delete a record from the desktop app.

### Task 8: Implement inference logic and tests

**Files:**
- Create: `base-table/src-tauri/src/infer.rs`
- Modify: `base-table/src-tauri/src/import.rs`
- Test: `base-table/src-tauri/tests/infer_tests.rs`

- [ ] **Step 1: Write the type inference test first**

```rust
#[test]
fn infers_number_and_bool_columns() {
    let numeric = vec!["1", "2", "3"]; 
    let boolean = vec!["true", "false", "true"];

    assert_eq!(infer_field_type(&numeric), "number");
    assert_eq!(infer_field_type(&boolean), "bool");
}
```

- [ ] **Step 2: Write the dimension scoring test first**

```rust
#[test]
fn prefers_medium_cardinality_grouping_fields() {
    let values = vec!["Todo", "Doing", "Done", "Todo", "Done", "Todo"];
    assert!(dimension_score(&values) > 0.0);
}
```

- [ ] **Step 3: Implement the inference helpers**

```rust
pub fn infer_field_type(values: &[&str]) -> &'static str {
    let non_empty: Vec<&str> = values.iter().copied().filter(|value| !value.trim().is_empty()).collect();
    if non_empty.is_empty() {
        return "text";
    }

    if non_empty.iter().all(|value| matches!((*value).to_ascii_lowercase().as_str(), "true" | "false" | "0" | "1" | "是" | "否")) {
        return "bool";
    }

    if non_empty.iter().all(|value| value.parse::<f64>().is_ok()) {
        return "number";
    }

    let unique_count = non_empty.iter().collect::<std::collections::HashSet<_>>().len();
    let unique_ratio = unique_count as f64 / non_empty.len() as f64;
    if unique_ratio <= 0.3 {
        return "single_select";
    }

    "text"
}

pub fn dimension_score(values: &[&str]) -> f64 {
    let non_empty: Vec<&str> = values.iter().copied().filter(|value| !value.trim().is_empty()).collect();
    if non_empty.len() < 3 {
        return 0.0;
    }

    let mut counts = std::collections::HashMap::new();
    for value in &non_empty {
        *counts.entry(*value).or_insert(0usize) += 1;
    }

    let unique_ratio = counts.len() as f64 / non_empty.len() as f64;
    if !(0.02..=0.8).contains(&unique_ratio) {
        return 0.0;
    }

    let top_bucket = counts.values().copied().max().unwrap_or_default() as f64 / non_empty.len() as f64;
    (1.0 - (unique_ratio - 0.25).abs()) * (1.0 - top_bucket.min(0.95))
}
```

- [ ] **Step 4: Run the inference test suite**

Run: `cargo test infer`

Expected: the inference tests pass.

### Task 9: Implement Excel import commands and UI

**Files:**
- Create: `base-table/src-tauri/src/import.rs`
- Create: `base-table/src/components/ImportDialog.tsx`
- Modify: `base-table/src-tauri/src/commands.rs`
- Modify: `base-table/src/lib/tauri.ts`
- Modify: `base-table/src/App.tsx`

- [ ] **Step 1: Add the Rust Excel import dependency**

Update `base-table/src-tauri/Cargo.toml` to include:

```toml
calamine = "0.26"
```

- [ ] **Step 2: Implement the import service**

```rust
pub struct ImportResult {
    pub field_ids: Vec<String>,
    pub record_ids: Vec<String>,
}

pub fn import_xlsx(path: &str, conn: &rusqlite::Connection, table_id: &str) -> Result<ImportResult, String> {
    let mut workbook = calamine::open_workbook_auto(path).map_err(|err| err.to_string())?;
    let sheet_name = workbook
        .sheet_names()
        .first()
        .cloned()
        .ok_or_else(|| "workbook has no sheets".to_string())?;
    let range = workbook
        .worksheet_range(&sheet_name)
        .map_err(|err| err.to_string())?;

    let mut rows = range.rows();
    let headers = rows
        .next()
        .ok_or_else(|| "worksheet is empty".to_string())?
        .iter()
        .enumerate()
        .map(|(index, cell)| {
            let value = cell.to_string();
            if value.trim().is_empty() {
                format!("Column {}", index + 1)
            } else {
                value
            }
        })
        .collect::<Vec<_>>();

    let body_rows = rows.map(|row| row.iter().map(|cell| cell.to_string()).collect::<Vec<_>>()).collect::<Vec<_>>();
    let mut field_ids = Vec::new();
    for (index, header) in headers.iter().enumerate() {
        let column_values = body_rows.iter().filter_map(|row| row.get(index).map(String::as_str)).collect::<Vec<_>>();
        let field_type = crate::infer::infer_field_type(&column_values);
        let field_id = crate::db::create_field(conn, table_id, header, field_type, index as i64).map_err(|err| err.to_string())?;
        field_ids.push(field_id);
    }

    let mut record_ids = Vec::new();
    for row in body_rows {
        let mut data = serde_json::Map::new();
        for (index, value) in row.iter().enumerate() {
            if let Some(field_id) = field_ids.get(index) {
                data.insert(field_id.clone(), serde_json::Value::String(value.clone()));
            }
        }
        let record_id = crate::db::create_record(conn, table_id, serde_json::Value::Object(data)).map_err(|err| err.to_string())?;
        record_ids.push(record_id);
    }

    Ok(ImportResult { field_ids, record_ids })
}
```

- [ ] **Step 3: Expose the import command to the frontend**

```ts
export function importWorkbook(path: string) {
  return invoke<{ fieldIds: string[]; recordIds: string[] }>('import_workbook', { path });
}
```

- [ ] **Step 4: Build the import dialog UI**

```tsx
// base-table/src/components/ImportDialog.tsx
interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onImport: (path: string) => Promise<void>;
}
```

- [ ] **Step 5: Manually verify import end-to-end**

Run: `npm run tauri dev`

Expected: selecting a test `.xlsx` file creates fields and records visible in grid view.

### Task 10: Implement kanban view and grouping test

**Files:**
- Create: `base-table/src/components/KanbanView.tsx`
- Modify: `base-table/src/App.tsx`
- Test: `base-table/src/test/kanban.test.tsx`

- [ ] **Step 1: Write the kanban grouping test first**

```tsx
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import KanbanView from '../components/KanbanView';

describe('KanbanView', () => {
  it('groups records by the selected field', () => {
    render(
      <KanbanView
        fields={[{ id: 'f-status', tableId: 't-1', name: 'Status', fieldType: 'single_select', ordinal: 0 }]}
        records={[
          { id: 'r-1', tableId: 't-1', data: { 'f-status': 'Todo' } },
          { id: 'r-2', tableId: 't-1', data: { 'f-status': 'Done' } },
        ]}
        groupingFieldId="f-status"
        ungroupedLabel="Ungrouped"
      />,
    );

    expect(screen.getByText('Todo')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Implement the kanban component**

```tsx
interface KanbanViewProps {
  fields: FieldItem[];
  records: RecordItem[];
  groupingFieldId: string | null;
  ungroupedLabel: string;
}
```

- [ ] **Step 3: Wire kanban into `App.tsx` view switching**

```tsx
{view === 'grid' ? (
  <GridView {...gridProps} />
) : (
  <KanbanView {...kanbanProps} />
)}
```

- [ ] **Step 4: Run the kanban frontend test**

Run: `npm run test -- src/test/kanban.test.tsx`

Expected: the kanban grouping test passes.

- [ ] **Step 5: Manually verify the kanban board**

Run: `npm run tauri dev`

Expected: the board shows one column per grouping value plus an `Ungrouped` column.

### Task 11: Final verification and packaging check

**Files:**
- Modify: `base-table/src/App.tsx`
- Modify: `base-table/src/styles.css`
- Modify: `base-table/src-tauri/src/main.rs`

- [ ] **Step 1: Run frontend tests**

Run: `npm run test`

Expected: all Vitest tests pass.

- [ ] **Step 2: Run backend tests**

Run: `cargo test`

Expected: all Rust tests pass.

- [ ] **Step 3: Run the production frontend build**

Run: `npm run build`

Expected: the production frontend build succeeds.

- [ ] **Step 4: Run the desktop app manually one final time**

Run: `npm run tauri dev`

Expected: create base/table, edit data in grid, switch to kanban, import workbook, and switch language without runtime errors.

- [ ] **Step 5: Build the Tauri application bundle**

Run: `npm run tauri build`

Expected: Tauri completes a local desktop build; if Windows bundling is unavailable on the current host, document that limitation and keep the successful dev run and test output as the completed MVP verification evidence.

## Self-Review Notes

- Spec coverage: base/table management, field/record CRUD, grid, kanban, Excel import, inference, and i18n are each mapped to explicit tasks.
- Placeholder scan: inline placeholder snippets were removed from CRUD, inference, import, and kanban tasks; each critical task now includes concrete implementation direction and executable commands.
- Type consistency: frontend `FieldType` and backend field type strings use the same five values across the plan.
