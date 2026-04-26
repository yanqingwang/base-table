use base_table::{db, import};
use std::fs::File;
use std::io::Write;
use std::path::Path;
use zip::write::SimpleFileOptions;

#[test]
fn imports_each_excel_sheet_as_a_table() {
    let temp_path = std::env::temp_dir().join(format!(
        "base-table-multi-sheet-{}.xlsx",
        uuid::Uuid::new_v4()
    ));
    write_test_workbook(&temp_path);

    let conn = db::init_db(":memory:").expect("db init should succeed");
    let base_id = db::create_base(&conn, "Import Base").expect("base create should succeed");
    let result = import::import_workbook(
        &conn,
        &base_id,
        temp_path.to_str().expect("utf8 path"),
        false,
    )
    .expect("workbook import should succeed");

    let tables = db::list_tables(&conn, &base_id).expect("tables should list");
    assert_eq!(result.table_ids.len(), 2);
    assert_eq!(tables.len(), 2);
    assert_eq!(tables[0].name, "Tasks");
    assert_eq!(tables[1].name, "People");

    let first_records = db::list_records(&conn, &tables[0].id).expect("records should list");
    let second_records = db::list_records(&conn, &tables[1].id).expect("records should list");
    assert_eq!(first_records.len(), 1);
    assert_eq!(second_records.len(), 1);

    let fields = db::list_fields(&conn, &tables[0].id).expect("fields should list");
    let due_field = fields
        .iter()
        .find(|field| field.name == "Due")
        .expect("due date field should import");
    assert_eq!(due_field.field_type, "date");
    assert_eq!(
        first_records[0]
            .data
            .get(&due_field.id)
            .and_then(|value| value.as_str()),
        Some("2025-01-01")
    );
}

#[test]
fn duplicate_sheet_names_require_overwrite_and_replace_existing_tables() {
    let temp_path = std::env::temp_dir().join(format!(
        "base-table-duplicate-sheet-{}.xlsx",
        uuid::Uuid::new_v4()
    ));
    write_test_workbook(&temp_path);

    let conn = db::init_db(":memory:").expect("db init should succeed");
    let base_id = db::create_base(&conn, "Import Base").expect("base create should succeed");
    db::create_table(&conn, &base_id, "Tasks").expect("existing table should be created");

    let duplicate_error = import::import_workbook(
        &conn,
        &base_id,
        temp_path.to_str().expect("utf8 path"),
        false,
    )
    .expect_err("duplicate import without overwrite should fail");
    assert!(duplicate_error.contains("table already exists: Tasks"));

    let result = import::import_workbook(
        &conn,
        &base_id,
        temp_path.to_str().expect("utf8 path"),
        true,
    )
    .expect("duplicate import with overwrite should succeed");
    let tables = db::list_tables(&conn, &base_id).expect("tables should list");
    assert_eq!(result.table_ids.len(), 2);
    assert_eq!(tables.len(), 2);
    assert!(tables.iter().any(|table| table.name == "Tasks"));
    assert!(tables.iter().any(|table| table.name == "People"));
}

fn write_test_workbook(path: &Path) {
    let file = File::create(path).expect("test workbook should be created");
    let mut zip = zip::ZipWriter::new(file);
    let options = SimpleFileOptions::default();

    write_entry(
        &mut zip,
        options,
        "[Content_Types].xml",
        r#"<?xml version="1.0" encoding="UTF-8"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
</Types>"#,
    );
    write_entry(
        &mut zip,
        options,
        "_rels/.rels",
        r#"<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>"#,
    );
    write_entry(
        &mut zip,
        options,
        "xl/workbook.xml",
        r#"<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Tasks" sheetId="1" r:id="rId1"/>
    <sheet name="People" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>"#,
    );
    write_entry(
        &mut zip,
        options,
        "xl/_rels/workbook.xml.rels",
        r#"<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>"#,
    );
    write_entry(
        &mut zip,
        options,
        "xl/styles.xml",
        r#"<?xml version="1.0" encoding="UTF-8"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy-mm-dd"/></numFmts>
  <fonts count="1"><font/></fonts>
  <fills count="1"><fill><patternFill patternType="none"/></fill></fills>
  <borders count="1"><border/></borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="2">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
  </cellXfs>
</styleSheet>"#,
    );
    write_entry(
        &mut zip,
        options,
        "xl/worksheets/sheet1.xml",
        r#"<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>Title</t></is></c><c r="B1" t="inlineStr"><is><t>Due</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>First Task</t></is></c><c r="B2" s="1"><v>45658</v></c></row>
  </sheetData>
</worksheet>"#,
    );
    write_entry(
        &mut zip,
        options,
        "xl/worksheets/sheet2.xml",
        worksheet_xml("Name", "Alice"),
    );

    zip.finish().expect("zip should finish");
}

fn worksheet_xml(header: &str, value: &str) -> String {
    format!(
        r#"<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1"><c r="A1" t="inlineStr"><is><t>{header}</t></is></c></row>
    <row r="2"><c r="A2" t="inlineStr"><is><t>{value}</t></is></c></row>
  </sheetData>
</worksheet>"#
    )
}

fn write_entry(
    zip: &mut zip::ZipWriter<File>,
    options: SimpleFileOptions,
    name: &str,
    content: impl AsRef<[u8]>,
) {
    zip.start_file(name, options)
        .expect("zip entry should start");
    zip.write_all(content.as_ref())
        .expect("zip entry should write");
}
