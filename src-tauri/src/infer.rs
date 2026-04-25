use std::collections::{HashMap, HashSet};

pub fn infer_field_type(values: &[String]) -> &'static str {
    let non_empty: Vec<&str> = values
        .iter()
        .map(String::as_str)
        .filter(|value| !value.trim().is_empty())
        .collect();
    if non_empty.is_empty() {
        return "text";
    }
    if non_empty.iter().all(|value| {
        matches!(
            value.trim().to_ascii_lowercase().as_str(),
            "true" | "false" | "0" | "1" | "是" | "否"
        )
    }) {
        return "bool";
    }
    if non_empty
        .iter()
        .all(|value| value.trim().parse::<f64>().is_ok())
    {
        return "number";
    }
    if non_empty.iter().all(|value| looks_like_date(value.trim())) {
        return "date";
    }
    let unique_count = non_empty.iter().copied().collect::<HashSet<_>>().len();
    let unique_ratio = unique_count as f64 / non_empty.len() as f64;
    if unique_count <= 20 && unique_ratio <= 0.8 {
        return "single_select";
    }
    "text"
}

fn looks_like_date(value: &str) -> bool {
    chrono::NaiveDate::parse_from_str(value, "%Y-%m-%d").is_ok()
        || chrono::NaiveDate::parse_from_str(value, "%Y/%m/%d").is_ok()
}

pub fn dimension_score(values: &[String]) -> f64 {
    let non_empty: Vec<&str> = values
        .iter()
        .map(String::as_str)
        .filter(|value| !value.trim().is_empty())
        .collect();
    if non_empty.len() < 3 {
        return 0.0;
    }
    let mut counts: HashMap<&str, usize> = HashMap::new();
    for value in &non_empty {
        *counts.entry(*value).or_insert(0) += 1;
    }
    let unique_ratio = counts.len() as f64 / non_empty.len() as f64;
    if !(0.02..=0.8).contains(&unique_ratio) {
        return 0.0;
    }
    let top_bucket_ratio =
        counts.values().copied().max().unwrap_or_default() as f64 / non_empty.len() as f64;
    let balance = 1.0 - top_bucket_ratio.min(0.95);
    let cardinality_fit = 1.0 - (unique_ratio - 0.25).abs().min(1.0);
    (balance * cardinality_fit).max(0.0)
}
