use std::sync::Arc;

use axum::{
    extract::{Path, Query, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use serde_json::Value;

use crate::{auth, db, S, E};

#[derive(Deserialize)]
pub struct JobQuery {
    pub status: Option<String>,
    pub q: Option<String>,
}

#[derive(Deserialize)]
pub struct ApplyInput {
    pub job_id: String,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub resume_text: Option<String>,
    pub cover_letter: Option<String>,
}

#[derive(Deserialize)]
pub struct StatusInput {
    pub status: String,
}

#[derive(Deserialize)]
pub struct PublicJobQuery {
    pub q: Option<String>,
}

pub async fn public_list_jobs(
    State(s): State<Arc<S>>,
    Query(q): Query<PublicJobQuery>,
) -> Result<Json<Vec<db::Job>>, E> {
    let jobs = s.db.list_jobs(Some("active"), q.q.as_deref())?;
    Ok(Json(jobs))
}

pub async fn public_get_job(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<db::Job>, E> {
    let job = s.db.job_by_id(&id)?;
    if job.status != "active" {
        return Err(E("job not found".into()));
    }
    let _ = s.db.increment_job_views(&id);
    let job = s.db.job_by_id(&id)?;
    Ok(Json(job))
}

pub async fn public_apply(
    State(s): State<Arc<S>>,
    Json(input): Json<ApplyInput>,
) -> Result<(StatusCode, Json<db::JobApplication>), E> {
    let job = s.db.job_by_id(&input.job_id)?;
    if job.status != "active" {
        return Err(E("job is not accepting applications".into()));
    }

    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let app_id = uuid::Uuid::new_v4().to_string();

    let candidate_id = {
        let existing = s.db.candidate_by_phone_or_email(None, Some(&input.email))?;
        if let Some(c) = existing.into_iter().next() {
            c.id
        } else {
            let cid = uuid::Uuid::new_v4().to_string();
            let candidate = db::Candidate {
                id: cid.clone(),
                user_id: None,
                agency_id: None,
                name: input.name.clone(),
                phone: input.phone.clone(),
                email: Some(input.email.clone()),
                id_number: None,
                country_code: "PH".to_string(),
                date_of_birth: None,
                gender: None,
                nationality: None,
                address: None,
                city: None,
                province: None,
                postal_code: None,
                education_level: None,
                education_school: None,
                education_major: None,
                education_year: None,
                work_experience_years: None,
                previous_employer: None,
                previous_position: None,
                previous_duration: None,
                previous_duties: None,
                languages: None,
                certifications: None,
                emergency_contact_name: None,
                emergency_contact_phone: None,
                emergency_contact_relation: None,
                skills: "[]".to_string(),
                resume_text: input.resume_text.clone(),
                resume_file_url: None,
                profile_photo_url: None,
                status: "applied".to_string(),
                source: "direct".to_string(),
                notes: None,
                created_at: now.clone(),
                updated_at: now.clone(),
            };
            s.db.create_candidate(&candidate)?;
            cid
        }
    };

    let application = db::JobApplication {
        id: app_id.clone(),
        job_id: input.job_id,
        candidate_id: Some(candidate_id),
        name: input.name,
        email: input.email,
        phone: input.phone,
        resume_text: input.resume_text,
        resume_file_url: None,
        cover_letter: input.cover_letter,
        status: "applied".to_string(),
        created_at: now.clone(),
        updated_at: now,
    };

    s.db.create_application(&application)?;
    let app = s.db.application_by_id(&app_id)?;
    Ok((StatusCode::CREATED, Json(app)))
}

pub async fn list_jobs(
    State(s): State<Arc<S>>,
    Query(q): Query<JobQuery>,
) -> Result<Json<Vec<db::Job>>, E> {
    let jobs = s.db.list_jobs(q.status.as_deref(), q.q.as_deref())?;
    Ok(Json(jobs))
}

pub async fn create_job(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Json(input): Json<Value>,
) -> Result<(StatusCode, Json<db::Job>), E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let job = db::Job {
        id: id.clone(),
        title: input.get("title").and_then(|v| v.as_str()).unwrap_or("").to_string(),
        description: input.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()),
        location: input.get("location").and_then(|v| v.as_str()).map(|s| s.to_string()),
        salary_min: input.get("salary_min").and_then(|v| v.as_f64()),
        salary_max: input.get("salary_max").and_then(|v| v.as_f64()),
        salary_currency: input.get("salary_currency").and_then(|v| v.as_str()).unwrap_or("USD").to_string(),
        department: input.get("department").and_then(|v| v.as_str()).map(|s| s.to_string()),
        requirements: input.get("requirements").and_then(|v| v.as_str()).map(|s| s.to_string()),
        responsibilities: input.get("responsibilities").and_then(|v| v.as_str()).map(|s| s.to_string()),
        employment_type: input.get("employment_type").and_then(|v| v.as_str()).unwrap_or("full-time").to_string(),
        status: input.get("status").and_then(|v| v.as_str()).unwrap_or("draft").to_string(),
        posted_by: input.get("posted_by").and_then(|v| v.as_str()).map(|s| s.to_string()),
        views: 0,
        created_at: now.clone(),
        updated_at: now,
    };
    s.db.create_job(&job)?;
    let job = s.db.job_by_id(&id)?;
    Ok((StatusCode::CREATED, Json(job)))
}

pub async fn get_job(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<db::Job>, E> {
    let job = s.db.job_by_id(&id)?;
    Ok(Json(job))
}

pub async fn update_job(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Path(id): Path<String>,
    Json(input): Json<Value>,
) -> Result<Json<db::Job>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let existing = s.db.job_by_id(&id)?;
    let merged = db::Job {
        id: id.clone(),
        title: input.get("title").and_then(|v| v.as_str()).unwrap_or(&existing.title).to_string(),
        description: input.get("description").and_then(|v| v.as_str()).map(|s| s.to_string()).or(existing.description),
        location: input.get("location").and_then(|v| v.as_str()).map(|s| s.to_string()).or(existing.location),
        salary_min: input.get("salary_min").and_then(|v| v.as_f64()).or(existing.salary_min),
        salary_max: input.get("salary_max").and_then(|v| v.as_f64()).or(existing.salary_max),
        salary_currency: input.get("salary_currency").and_then(|v| v.as_str()).unwrap_or(&existing.salary_currency).to_string(),
        department: input.get("department").and_then(|v| v.as_str()).map(|s| s.to_string()).or(existing.department),
        requirements: input.get("requirements").and_then(|v| v.as_str()).map(|s| s.to_string()).or(existing.requirements),
        responsibilities: input.get("responsibilities").and_then(|v| v.as_str()).map(|s| s.to_string()).or(existing.responsibilities),
        employment_type: input.get("employment_type").and_then(|v| v.as_str()).unwrap_or(&existing.employment_type).to_string(),
        status: input.get("status").and_then(|v| v.as_str()).unwrap_or(&existing.status).to_string(),
        posted_by: input.get("posted_by").and_then(|v| v.as_str()).map(|s| s.to_string()).or(existing.posted_by),
        views: existing.views,
        created_at: existing.created_at,
        updated_at: chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
    };
    s.db.update_job(&id, &merged)?;
    let job = s.db.job_by_id(&id)?;
    Ok(Json(job))
}

pub async fn delete_job(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Path(id): Path<String>,
) -> Result<(StatusCode, Json<Value>), E> {
    auth::check_role(&auth_user, &["admin"])?;
    s.db.delete_job(&id)?;
    Ok((StatusCode::OK, Json(serde_json::json!({"deleted": true}))))
}

pub async fn list_applications(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Vec<db::JobApplication>>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let apps = s.db.list_applications(Some(&id), None)?;
    Ok(Json(apps))
}

pub async fn update_application_status(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Path(id): Path<String>,
    Json(input): Json<StatusInput>,
) -> Result<Json<db::JobApplication>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    s.db.update_application_status(&id, &input.status)?;
    let app = s.db.application_by_id(&id)?;
    Ok(Json(app))
}
