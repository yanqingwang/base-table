pub mod db;
pub mod errors;
pub mod import;
pub mod infer;
pub mod models;

#[cfg(feature = "desktop")]
pub mod commands;

#[cfg(feature = "desktop")]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .invoke_handler(tauri::generate_handler![
            commands::create_base,
            commands::list_bases,
            commands::rename_base,
            commands::delete_base,
            commands::move_base_to_folder,
            commands::create_table,
            commands::list_tables,
            commands::rename_table,
            commands::delete_table,
            commands::create_field,
            commands::list_fields,
            commands::rename_field,
            commands::update_field_type,
            commands::reorder_field,
            commands::update_field_config,
            commands::delete_field,
            commands::create_record,
            commands::list_records,
            commands::update_record,
            commands::delete_record,
            commands::dimension_candidates,
            commands::import_workbook,
            commands::transpose_table,
            commands::write_text_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running base-table");
}
