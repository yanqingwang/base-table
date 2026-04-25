use crate::models::{BaseItem, FieldItem, RecordItem, TableItem};
use rusqlite::{params, Connection, Result};

pub fn app_db_path() -> String {
    std::env::current_dir()
        .map(|path| path.join("base-table.db").to_string_lossy().to_string())
        .unwrap_or_else(|_| "base-table.db".to_string())
}

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute_batch(
        r#"
        CREATE TABLE IF NOT EXISTS bases (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            folder TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS tables (
            id TEXT PRIMARY KEY,
            base_id TEXT NOT NULL,
            name TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(base_id) REFERENCES bases(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS fields (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            name TEXT NOT NULL,
            field_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            ordinal INTEGER NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS records (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            data_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            deleted_at TEXT,
            FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
        );
        CREATE TABLE IF NOT EXISTS views (
            id TEXT PRIMARY KEY,
            table_id TEXT NOT NULL,
            name TEXT NOT NULL,
            view_type TEXT NOT NULL,
            config_json TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY(table_id) REFERENCES tables(id) ON DELETE CASCADE
        );
        "#,
    )?;
    ensure_column(&conn, "bases", "folder", "TEXT NOT NULL DEFAULT ''")?;
    Ok(conn)
}

fn ensure_column(conn: &Connection, table: &str, column: &str, definition: &str) -> Result<()> {
    let mut stmt = conn.prepare(&format!("PRAGMA table_info({table})"))?;
    let columns = stmt
        .query_map([], |row| row.get::<_, String>(1))?
        .collect::<Result<Vec<_>>>()?;
    if !columns.iter().any(|existing| existing == column) {
        conn.execute(
            &format!("ALTER TABLE {table} ADD COLUMN {column} {definition}"),
            [],
        )?;
    }
    Ok(())
}

fn now() -> String {
    chrono::Utc::now().to_rfc3339()
}

pub fn create_base(conn: &Connection, name: &str) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let ts = now();
    conn.execute(
        "INSERT INTO bases (id, name, folder, created_at, updated_at) VALUES (?1, ?2, '', ?3, ?4)",
        params![id, name, ts, ts],
    )?;
    Ok(id)
}

pub fn list_bases(conn: &Connection) -> Result<Vec<BaseItem>> {
    let mut stmt =
        conn.prepare("SELECT id, name, folder FROM bases ORDER BY folder ASC, created_at ASC")?;
    let rows = stmt.query_map([], |row| {
        Ok(BaseItem {
            id: row.get(0)?,
            name: row.get(1)?,
            folder: row.get(2)?,
        })
    })?;
    rows.collect()
}

pub fn move_base_to_folder(conn: &Connection, base_id: &str, folder: &str) -> Result<()> {
    conn.execute(
        "UPDATE bases SET folder = ?1, updated_at = ?2 WHERE id = ?3",
        params![folder, now(), base_id],
    )?;
    Ok(())
}

pub fn rename_base(conn: &Connection, base_id: &str, name: &str) -> Result<()> {
    conn.execute(
        "UPDATE bases SET name = ?1, updated_at = ?2 WHERE id = ?3",
        params![name, now(), base_id],
    )?;
    Ok(())
}

pub fn delete_base(conn: &Connection, base_id: &str) -> Result<()> {
    conn.execute(
        "DELETE FROM records WHERE table_id IN (SELECT id FROM tables WHERE base_id = ?1)",
        params![base_id],
    )?;
    conn.execute(
        "DELETE FROM fields WHERE table_id IN (SELECT id FROM tables WHERE base_id = ?1)",
        params![base_id],
    )?;
    conn.execute(
        "DELETE FROM views WHERE table_id IN (SELECT id FROM tables WHERE base_id = ?1)",
        params![base_id],
    )?;
    conn.execute("DELETE FROM tables WHERE base_id = ?1", params![base_id])?;
    conn.execute("DELETE FROM bases WHERE id = ?1", params![base_id])?;
    Ok(())
}

pub fn create_table(conn: &Connection, base_id: &str, name: &str) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let ts = now();
    conn.execute(
        "INSERT INTO tables (id, base_id, name, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5)",
        params![id, base_id, name, ts, ts],
    )?;
    Ok(id)
}

pub fn list_tables(conn: &Connection, base_id: &str) -> Result<Vec<TableItem>> {
    let mut stmt = conn.prepare(
        "SELECT id, base_id, name FROM tables WHERE base_id = ?1 ORDER BY created_at ASC",
    )?;
    let rows = stmt.query_map(params![base_id], |row| {
        Ok(TableItem {
            id: row.get(0)?,
            base_id: row.get(1)?,
            name: row.get(2)?,
        })
    })?;
    rows.collect()
}

pub fn rename_table(conn: &Connection, table_id: &str, name: &str) -> Result<()> {
    conn.execute(
        "UPDATE tables SET name = ?1, updated_at = ?2 WHERE id = ?3",
        params![name, now(), table_id],
    )?;
    Ok(())
}

pub fn delete_table(conn: &Connection, table_id: &str) -> Result<()> {
    conn.execute("DELETE FROM records WHERE table_id = ?1", params![table_id])?;
    conn.execute("DELETE FROM fields WHERE table_id = ?1", params![table_id])?;
    conn.execute("DELETE FROM views WHERE table_id = ?1", params![table_id])?;
    conn.execute("DELETE FROM tables WHERE id = ?1", params![table_id])?;
    Ok(())
}

pub fn create_field(
    conn: &Connection,
    table_id: &str,
    name: &str,
    field_type: &str,
    ordinal: i64,
) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let ts = now();
    conn.execute(
        "INSERT INTO fields (id, table_id, name, field_type, config_json, ordinal, created_at, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)",
        params![id, table_id, name, field_type, "{}", ordinal, ts, ts],
    )?;
    Ok(id)
}

pub fn list_fields(conn: &Connection, table_id: &str) -> Result<Vec<FieldItem>> {
    let mut stmt = conn.prepare("SELECT id, table_id, name, field_type, ordinal, config_json FROM fields WHERE table_id = ?1 ORDER BY ordinal ASC")?;
    let rows = stmt.query_map(params![table_id], |row| {
        Ok(FieldItem {
            id: row.get(0)?,
            table_id: row.get(1)?,
            name: row.get(2)?,
            field_type: row.get(3)?,
            ordinal: row.get(4)?,
            config: serde_json::from_str::<serde_json::Value>(&row.get::<_, String>(5)?)
                .unwrap_or_else(|_| serde_json::json!({})),
        })
    })?;
    rows.collect()
}

pub fn update_field_config(
    conn: &Connection,
    field_id: &str,
    config: serde_json::Value,
) -> Result<()> {
    conn.execute(
        "UPDATE fields SET config_json = ?1, updated_at = ?2 WHERE id = ?3",
        params![config.to_string(), now(), field_id],
    )?;
    Ok(())
}

pub fn transpose_table(conn: &Connection, table_id: &str) -> Result<String> {
    let source_name: String = conn.query_row(
        "SELECT name FROM tables WHERE id = ?1",
        params![table_id],
        |row| row.get(0),
    )?;
    let base_id: String = conn.query_row(
        "SELECT base_id FROM tables WHERE id = ?1",
        params![table_id],
        |row| row.get(0),
    )?;
    let fields = list_fields(conn, table_id)?;
    let records = list_records(conn, table_id)?;
    let new_table_id = create_table(conn, &base_id, &format!("{source_name} Transposed"))?;
    let label_field_id = create_field(conn, &new_table_id, "Field", "text", 0)?;
    let record_field_ids = records
        .iter()
        .enumerate()
        .map(|(index, _)| {
            create_field(
                conn,
                &new_table_id,
                &format!("Record {}", index + 1),
                "text",
                (index + 1) as i64,
            )
        })
        .collect::<Result<Vec<_>>>()?;
    for field in fields {
        let mut data = serde_json::Map::new();
        data.insert(
            label_field_id.clone(),
            serde_json::Value::String(field.name.clone()),
        );
        for (index, record) in records.iter().enumerate() {
            if let Some(value) = record.data.get(&field.id) {
                data.insert(record_field_ids[index].clone(), value.clone());
            }
        }
        create_record(conn, &new_table_id, serde_json::Value::Object(data))?;
    }
    Ok(new_table_id)
}

pub fn rename_field(conn: &Connection, field_id: &str, name: &str) -> Result<()> {
    conn.execute(
        "UPDATE fields SET name = ?1, updated_at = ?2 WHERE id = ?3",
        params![name, now(), field_id],
    )?;
    Ok(())
}

pub fn update_field_type(conn: &Connection, field_id: &str, field_type: &str) -> Result<()> {
    conn.execute(
        "UPDATE fields SET field_type = ?1, updated_at = ?2 WHERE id = ?3",
        params![field_type, now(), field_id],
    )?;
    Ok(())
}

pub fn reorder_field(conn: &Connection, field_id: &str, ordinal: i64) -> Result<()> {
    conn.execute(
        "UPDATE fields SET ordinal = ?1, updated_at = ?2 WHERE id = ?3",
        params![ordinal, now(), field_id],
    )?;
    Ok(())
}

pub fn delete_field(conn: &Connection, field_id: &str) -> Result<()> {
    conn.execute("DELETE FROM fields WHERE id = ?1", params![field_id])?;
    Ok(())
}

pub fn create_record(conn: &Connection, table_id: &str, data: serde_json::Value) -> Result<String> {
    let id = uuid::Uuid::new_v4().to_string();
    let ts = now();
    conn.execute(
        "INSERT INTO records (id, table_id, data_json, created_at, updated_at, deleted_at) VALUES (?1, ?2, ?3, ?4, ?5, NULL)",
        params![id, table_id, data.to_string(), ts, ts],
    )?;
    Ok(id)
}

pub fn list_records(conn: &Connection, table_id: &str) -> Result<Vec<RecordItem>> {
    let mut stmt = conn.prepare("SELECT id, table_id, data_json FROM records WHERE table_id = ?1 AND deleted_at IS NULL ORDER BY created_at ASC")?;
    let rows = stmt.query_map(params![table_id], |row| {
        let data_json: String = row.get(2)?;
        let data = serde_json::from_str(&data_json).unwrap_or_else(|_| serde_json::json!({}));
        Ok(RecordItem {
            id: row.get(0)?,
            table_id: row.get(1)?,
            data,
        })
    })?;
    rows.collect()
}

pub fn update_record(conn: &Connection, record_id: &str, data: serde_json::Value) -> Result<()> {
    conn.execute(
        "UPDATE records SET data_json = ?1, updated_at = ?2 WHERE id = ?3",
        params![data.to_string(), now(), record_id],
    )?;
    Ok(())
}

pub fn delete_record(conn: &Connection, record_id: &str) -> Result<()> {
    conn.execute(
        "UPDATE records SET deleted_at = ?1 WHERE id = ?2",
        params![now(), record_id],
    )?;
    Ok(())
}
