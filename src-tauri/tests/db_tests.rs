use base_table::db;

#[test]
fn creates_required_tables() {
    let conn = db::init_db(":memory:").expect("db init should succeed");
    let count: i64 = conn
        .query_row(
            "SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name IN ('bases','tables','fields','records','views')",
            [],
            |row| row.get(0),
        )
        .expect("table count query should succeed");
    assert_eq!(count, 5);
}

#[test]
fn creates_base_table_field_and_record() {
    let conn = db::init_db(":memory:").expect("db init should succeed");
    let base_id = db::create_base(&conn, "Operations").expect("base create should succeed");
    let table_id = db::create_table(&conn, &base_id, "Tasks").expect("table create should succeed");
    let field_id = db::create_field(&conn, &table_id, "Status", "single_select", 0)
        .expect("field create should succeed");
    let record_id = db::create_record(
        &conn,
        &table_id,
        serde_json::json!({ field_id.clone(): "Todo" }),
    )
    .expect("record create should succeed");
    assert!(!record_id.is_empty());
    assert_eq!(
        db::list_records(&conn, &table_id)
            .expect("records should list")
            .len(),
        1
    );

    db::update_record(
        &conn,
        &record_id,
        serde_json::json!({ field_id.clone(): "Done" }),
    )
    .expect("record update should succeed");
    let updated = db::list_records(&conn, &table_id).expect("records should list");
    assert_eq!(updated[0].data[&field_id], "Done");
}

#[test]
fn updates_and_deletes_base_table_and_field_metadata() {
    let conn = db::init_db(":memory:").expect("db init should succeed");
    let base_id = db::create_base(&conn, "Old Base").expect("base create should succeed");
    db::rename_base(&conn, &base_id, "New Base").expect("base rename should succeed");
    assert_eq!(
        db::list_bases(&conn).expect("bases should list")[0].name,
        "New Base"
    );

    let table_id =
        db::create_table(&conn, &base_id, "Old Table").expect("table create should succeed");
    db::rename_table(&conn, &table_id, "New Table").expect("table rename should succeed");
    assert_eq!(
        db::list_tables(&conn, &base_id).expect("tables should list")[0].name,
        "New Table"
    );

    let field_id = db::create_field(&conn, &table_id, "Status", "text", 0)
        .expect("field create should succeed");
    db::update_field_type(&conn, &field_id, "single_select")
        .expect("field type update should succeed");
    db::reorder_field(&conn, &field_id, 4).expect("field reorder should succeed");
    let field = &db::list_fields(&conn, &table_id).expect("fields should list")[0];
    assert_eq!(field.field_type, "single_select");
    assert_eq!(field.ordinal, 4);

    db::delete_table(&conn, &table_id).expect("table delete should succeed");
    assert!(db::list_tables(&conn, &base_id)
        .expect("tables should list")
        .is_empty());

    db::delete_base(&conn, &base_id).expect("base delete should succeed");
    assert!(db::list_bases(&conn).expect("bases should list").is_empty());
}
