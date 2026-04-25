use crate::models::ImportResult;
use calamine::{open_workbook_auto, Reader};

pub fn import_workbook(
    conn: &rusqlite::Connection,
    base_id: &str,
    path: &str,
) -> Result<ImportResult, String> {
    let mut workbook = open_workbook_auto(path).map_err(|error| error.to_string())?;
    let sheet_names = workbook.sheet_names().to_vec();
    if sheet_names.is_empty() {
        return Err("workbook has no sheets".to_string());
    }

    let mut table_ids = Vec::new();
    let mut field_ids = Vec::new();
    let mut record_ids = Vec::new();

    for sheet_name in sheet_names {
        let table_id = crate::db::create_table(conn, base_id, &sheet_name)
            .map_err(|error| error.to_string())?;
        let range = workbook
            .worksheet_range(&sheet_name)
            .map_err(|error| error.to_string())?;
        let rows = range
            .rows()
            .map(|row| row.iter().map(|cell| cell.to_string()).collect::<Vec<_>>())
            .collect::<Vec<_>>();
        let imported = import_rows(conn, &table_id, rows)?;
        table_ids.push(table_id);
        field_ids.extend(imported.field_ids);
        record_ids.extend(imported.record_ids);
    }

    Ok(ImportResult {
        table_ids,
        field_ids,
        record_ids,
    })
}

fn import_rows(
    conn: &rusqlite::Connection,
    table_id: &str,
    mut rows: Vec<Vec<String>>,
) -> Result<ImportResult, String> {
    if rows.is_empty() {
        return Ok(ImportResult {
            table_ids: Vec::new(),
            field_ids: Vec::new(),
            record_ids: Vec::new(),
        });
    }

    let headers = rows.remove(0);
    let headers = headers
        .into_iter()
        .enumerate()
        .map(|(index, value)| {
            if value.trim().is_empty() {
                format!("Column {}", index + 1)
            } else {
                value
            }
        })
        .collect::<Vec<_>>();

    let mut field_ids = Vec::new();
    for (index, header) in headers.iter().enumerate() {
        let column = rows
            .iter()
            .filter_map(|row| row.get(index).cloned())
            .collect::<Vec<_>>();
        let field_type = crate::infer::infer_field_type(&column);
        let field_id = crate::db::create_field(conn, table_id, header, field_type, index as i64)
            .map_err(|error| error.to_string())?;
        field_ids.push(field_id);
    }

    let mut record_ids = Vec::new();
    for row in rows {
        let mut data = serde_json::Map::new();
        for (index, value) in row.iter().enumerate() {
            if let Some(field_id) = field_ids.get(index) {
                data.insert(field_id.clone(), serde_json::Value::String(value.clone()));
            }
        }
        let record_id = crate::db::create_record(conn, table_id, serde_json::Value::Object(data))
            .map_err(|error| error.to_string())?;
        record_ids.push(record_id);
    }

    Ok(ImportResult {
        table_ids: Vec::new(),
        field_ids,
        record_ids,
    })
}
