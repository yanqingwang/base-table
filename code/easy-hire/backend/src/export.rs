use std::sync::Arc;
use axum::{extract::State, http::{HeaderMap, StatusCode}, response::IntoResponse};
use crate::{auth, S, E};

pub async fn export_candidates(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
) -> Result<impl IntoResponse, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let candidates = s.db.list_all_candidates()?;
    let mut csv = String::from("id,name,phone,email,status,source,country,skills,created_at\n");
    for c in candidates {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{},{}\n",
            csv_escape(&c.id),
            csv_escape(&c.name),
            csv_escape(&c.phone.unwrap_or_default()),
            csv_escape(&c.email.unwrap_or_default()),
            csv_escape(&c.status),
            csv_escape(&c.source),
            csv_escape(&c.country_code),
            csv_escape(&c.skills),
            csv_escape(&c.created_at),
        ));
    }
    let mut headers = HeaderMap::new();
    headers.insert("Content-Type", "text/csv; charset=utf-8".parse().unwrap());
    headers.insert("Content-Disposition", "attachment; filename=\"candidates.csv\"".parse().unwrap());
    Ok((StatusCode::OK, headers, csv))
}

pub async fn export_employees(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
) -> Result<impl IntoResponse, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let employees = s.db.list_all_employees()?;
    let mut csv = String::from("id,code,department,position,hired_at,status,sf_sync_status,docusign_status\n");
    for e in employees {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{}\n",
            csv_escape(&e.id),
            csv_escape(&e.employee_code.unwrap_or_default()),
            csv_escape(&e.department.unwrap_or_default()),
            csv_escape(&e.position.unwrap_or_default()),
            csv_escape(&e.hired_at.unwrap_or_default()),
            csv_escape(&e.status),
            csv_escape(&e.sf_sync_status.unwrap_or_default()),
            csv_escape(&e.docusign_status.unwrap_or_default()),
        ));
    }
    let mut headers = HeaderMap::new();
    headers.insert("Content-Type", "text/csv; charset=utf-8".parse().unwrap());
    headers.insert("Content-Disposition", "attachment; filename=\"employees.csv\"".parse().unwrap());
    Ok((StatusCode::OK, headers, csv))
}

pub async fn export_interviews(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
) -> Result<impl IntoResponse, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let interviews = s.db.list_all_interviews()?;
    let mut csv = String::from("id,candidate_id,job_title,job_id,scheduled_at,status,result,score,created_at\n");
    for i in interviews {
        csv.push_str(&format!(
            "{},{},{},{},{},{},{},{},{}\n",
            csv_escape(&i.id),
            csv_escape(&i.candidate_id),
            csv_escape(&i.job_title.unwrap_or_default()),
            csv_escape(&i.job_id.unwrap_or_default()),
            csv_escape(&i.scheduled_at.unwrap_or_default()),
            csv_escape(&i.status),
            csv_escape(&i.result.unwrap_or_default()),
            csv_escape(&i.overall_score.map(|s| s.to_string()).unwrap_or_default()),
            csv_escape(&i.created_at),
        ));
    }
    let mut headers = HeaderMap::new();
    headers.insert("Content-Type", "text/csv; charset=utf-8".parse().unwrap());
    headers.insert("Content-Disposition", "attachment; filename=\"interviews.csv\"".parse().unwrap());
    Ok((StatusCode::OK, headers, csv))
}

fn csv_escape(s: &str) -> String {
    if s.contains(',') || s.contains('"') || s.contains('\n') {
        format!("\"{}\"", s.replace('"', "\"\""))
    } else {
        s.to_string()
    }
}
