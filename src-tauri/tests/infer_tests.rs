use base_table::infer::{dimension_score, infer_field_type};

#[test]
fn infers_number_bool_date_and_single_select_columns() {
    assert_eq!(
        infer_field_type(&["1".into(), "2".into(), "3".into()]),
        "number"
    );
    assert_eq!(
        infer_field_type(&["true".into(), "false".into(), "是".into()]),
        "bool"
    );
    assert_eq!(
        infer_field_type(&["2026-04-24".into(), "2026/04/25".into()]),
        "date"
    );
    assert_eq!(
        infer_field_type(&["Todo".into(), "Done".into(), "Todo".into()]),
        "single_select"
    );
}

#[test]
fn prefers_medium_cardinality_grouping_fields() {
    let values = vec![
        "Todo".into(),
        "Doing".into(),
        "Done".into(),
        "Todo".into(),
        "Done".into(),
        "Todo".into(),
    ];
    assert!(dimension_score(&values) > 0.0);
}
