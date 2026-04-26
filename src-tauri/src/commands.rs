use crate::errors::{to_message, AppResult};
use crate::models::{
    BaseItem, DimensionCandidate, FieldItem, ImportResult, RecordItem, TableItem, ViewItem,
};

fn conn() -> AppResult<rusqlite::Connection> {
    crate::db::init_db(&crate::db::app_db_path()).map_err(to_message)
}

#[tauri::command]
pub fn create_base(name: String) -> AppResult<String> {
    crate::db::create_base(&conn()?, &name).map_err(to_message)
}

#[tauri::command]
pub fn list_bases() -> AppResult<Vec<BaseItem>> {
    crate::db::list_bases(&conn()?).map_err(to_message)
}

#[tauri::command]
pub fn rename_base(base_id: String, name: String) -> AppResult<()> {
    crate::db::rename_base(&conn()?, &base_id, &name).map_err(to_message)
}

#[tauri::command]
pub fn delete_base(base_id: String) -> AppResult<()> {
    crate::db::delete_base(&conn()?, &base_id).map_err(to_message)
}

#[tauri::command]
pub fn move_base_to_folder(base_id: String, folder: String) -> AppResult<()> {
    crate::db::move_base_to_folder(&conn()?, &base_id, &folder).map_err(to_message)
}

#[tauri::command]
pub fn create_table(base_id: String, name: String) -> AppResult<String> {
    crate::db::create_table(&conn()?, &base_id, &name).map_err(to_message)
}

#[tauri::command]
pub fn list_tables(base_id: String) -> AppResult<Vec<TableItem>> {
    crate::db::list_tables(&conn()?, &base_id).map_err(to_message)
}

#[tauri::command]
pub fn rename_table(table_id: String, name: String) -> AppResult<()> {
    crate::db::rename_table(&conn()?, &table_id, &name).map_err(to_message)
}

#[tauri::command]
pub fn delete_table(table_id: String) -> AppResult<()> {
    crate::db::delete_table(&conn()?, &table_id).map_err(to_message)
}

#[tauri::command]
pub fn create_field(
    table_id: String,
    name: String,
    field_type: String,
    ordinal: i64,
) -> AppResult<String> {
    crate::db::create_field(&conn()?, &table_id, &name, &field_type, ordinal).map_err(to_message)
}

#[tauri::command]
pub fn list_fields(table_id: String) -> AppResult<Vec<FieldItem>> {
    crate::db::list_fields(&conn()?, &table_id).map_err(to_message)
}

#[tauri::command]
pub fn rename_field(field_id: String, name: String) -> AppResult<()> {
    crate::db::rename_field(&conn()?, &field_id, &name).map_err(to_message)
}

#[tauri::command]
pub fn update_field_type(field_id: String, field_type: String) -> AppResult<()> {
    crate::db::update_field_type(&conn()?, &field_id, &field_type).map_err(to_message)
}

#[tauri::command]
pub fn reorder_field(field_id: String, ordinal: i64) -> AppResult<()> {
    crate::db::reorder_field(&conn()?, &field_id, ordinal).map_err(to_message)
}

#[tauri::command]
pub fn update_field_config(field_id: String, config: serde_json::Value) -> AppResult<()> {
    crate::db::update_field_config(&conn()?, &field_id, config).map_err(to_message)
}

#[tauri::command]
pub fn delete_field(field_id: String) -> AppResult<()> {
    crate::db::delete_field(&conn()?, &field_id).map_err(to_message)
}

#[tauri::command]
pub fn create_view(
    table_id: String,
    name: String,
    view_type: String,
    config: serde_json::Value,
) -> AppResult<String> {
    crate::db::create_view(&conn()?, &table_id, &name, &view_type, config).map_err(to_message)
}

#[tauri::command]
pub fn list_views(table_id: String) -> AppResult<Vec<ViewItem>> {
    crate::db::list_views(&conn()?, &table_id).map_err(to_message)
}

#[tauri::command]
pub fn rename_view(view_id: String, name: String) -> AppResult<()> {
    crate::db::rename_view(&conn()?, &view_id, &name).map_err(to_message)
}

#[tauri::command]
pub fn update_view_config(view_id: String, config: serde_json::Value) -> AppResult<()> {
    crate::db::update_view_config(&conn()?, &view_id, config).map_err(to_message)
}

#[tauri::command]
pub fn delete_view(view_id: String) -> AppResult<()> {
    crate::db::delete_view(&conn()?, &view_id).map_err(to_message)
}

#[tauri::command]
pub fn create_record(table_id: String, data: serde_json::Value) -> AppResult<String> {
    crate::db::create_record(&conn()?, &table_id, data).map_err(to_message)
}

#[tauri::command]
pub fn list_records(table_id: String) -> AppResult<Vec<RecordItem>> {
    crate::db::list_records(&conn()?, &table_id).map_err(to_message)
}

#[tauri::command]
pub fn update_record(record_id: String, data: serde_json::Value) -> AppResult<()> {
    crate::db::update_record(&conn()?, &record_id, data).map_err(to_message)
}

#[tauri::command]
pub fn delete_record(record_id: String) -> AppResult<()> {
    crate::db::delete_record(&conn()?, &record_id).map_err(to_message)
}

#[tauri::command]
pub fn dimension_candidates(table_id: String) -> AppResult<Vec<DimensionCandidate>> {
    let conn = conn()?;
    let fields = crate::db::list_fields(&conn, &table_id).map_err(to_message)?;
    let records = crate::db::list_records(&conn, &table_id).map_err(to_message)?;
    let mut candidates = fields
        .into_iter()
        .filter(|field| matches!(field.field_type.as_str(), "text" | "bool" | "single_select"))
        .filter_map(|field| {
            let values = records
                .iter()
                .filter_map(|record| record.data.get(&field.id).map(value_to_string))
                .collect::<Vec<_>>();
            let score = crate::infer::dimension_score(&values);
            (score > 0.0).then_some(DimensionCandidate {
                field_id: field.id,
                field_name: field.name,
                score,
            })
        })
        .collect::<Vec<_>>();
    candidates.sort_by(|left, right| right.score.total_cmp(&left.score));
    Ok(candidates)
}

fn value_to_string(value: &serde_json::Value) -> String {
    match value {
        serde_json::Value::String(value) => value.clone(),
        serde_json::Value::Number(value) => value.to_string(),
        serde_json::Value::Bool(value) => value.to_string(),
        _ => String::new(),
    }
}

#[tauri::command]
pub fn workbook_sheet_names(path: String) -> AppResult<Vec<String>> {
    crate::import::workbook_sheet_names(&path)
}

#[tauri::command]
pub fn import_workbook(base_id: String, path: String, overwrite: bool) -> AppResult<ImportResult> {
    crate::import::import_workbook(&conn()?, &base_id, &path, overwrite)
}

#[tauri::command]
pub fn transpose_table(table_id: String) -> AppResult<String> {
    crate::db::transpose_table(&conn()?, &table_id).map_err(to_message)
}

#[tauri::command]
pub fn write_text_file(path: String, contents: String) -> AppResult<()> {
    std::fs::write(path, contents).map_err(|error| error.to_string())
}
