use std::sync::Arc;
use std::net::SocketAddr;
use std::path::PathBuf;

use axum::{
    Router,
    extract::{Path, Query, State},
    http::{Method, StatusCode},
    routing::{get, post, put},
    Json,
};
use serde::Deserialize;
use serde_json::Value;
use tower_http::cors::{CorsLayer, Any};

pub mod auth;
pub mod db;
pub mod docusign;
pub mod error;
pub mod export;
pub mod jobs;
pub mod successfactors;

use auth::AuthUser;
use db::{D, Candidate, Interview, InterviewRound, InterviewAssignment, InterviewEvaluation, Approval, Employee, Document, TrainingCourse, TrainingRecord};
use error::E;

pub struct S {
    pub db: D,
}

#[derive(Deserialize)]
pub struct CandidateQuery {
    pub status: Option<String>,
    pub source: Option<String>,
    pub q: Option<String>,
}

#[derive(Deserialize)]
pub struct InterviewQuery {
    pub status: Option<String>,
}

#[derive(Deserialize)]
pub struct InterviewInput {
    pub candidate_id: String,
    pub job_title: Option<String>,
    pub scheduled_at: Option<String>,
    pub interviewer_id: Option<String>,
}

#[derive(Deserialize)]
pub struct EvaluateInput {
    pub skill_scores: Option<String>,
    pub overall_score: Option<f64>,
    pub comments: Option<String>,
    pub result: Option<String>,
}

#[derive(Deserialize)]
pub struct ApprovalInput {
    pub candidate_id: String,
    pub request_type: Option<String>,
    pub assigned_to: String,
}

#[derive(Deserialize)]
pub struct ApprovalAction {
    pub comments: Option<String>,
}

#[derive(Deserialize)]
pub struct ApprovalTransfer {
    pub assigned_to: String,
    pub comments: Option<String>,
}

#[derive(Deserialize)]
pub struct EmployeeInput {
    pub candidate_id: String,
    pub employee_code: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
}

#[derive(Deserialize)]
pub struct DocInput {
    pub entity_type: String,
    pub entity_id: String,
    pub doc_type: String,
    pub file_url: Option<String>,
}

#[derive(Deserialize)]
pub struct SignInput {
    pub signature_method: Option<String>,
}

#[derive(Deserialize)]
pub struct CourseInput {
    pub title: String,
    pub course_type: Option<String>,
    pub country: Option<String>,
    pub content_type: Option<String>,
    pub content_url: Option<String>,
    pub mandatory: Option<i64>,
    pub duration_minutes: Option<i64>,
    pub pass_score: Option<i64>,
}

#[derive(Deserialize)]
pub struct TrainingStartInput {
    pub employee_id: String,
    pub course_id: String,
}

#[derive(Deserialize)]
pub struct TrainingCompleteInput {
    pub record_id: String,
    pub score: Option<i64>,
    pub passed: Option<i64>,
    pub certificate_url: Option<String>,
}

#[derive(Deserialize)]
pub struct EmployeeUpdate {
    pub department: Option<String>,
    pub position: Option<String>,
    pub contract_start: Option<String>,
    pub contract_end: Option<String>,
    pub status: Option<String>,
}

#[derive(Deserialize)]
pub struct OcrInput {
    pub document_id: String,
    pub image_url: Option<String>,
}

#[derive(Deserialize)]
pub struct WhatsAppInput {
    pub from: Option<String>,
    pub body: Option<String>,
    pub message_type: Option<String>,
}

#[derive(Deserialize)]
struct RoundInput {
    interview_id: String,
    round_number: i64,
    round_type: Option<String>,
    scheduled_at: Option<String>,
}

#[derive(Deserialize)]
struct AssignInput {
    interview_id: String,
    round_id: Option<String>,
    interviewer_id: String,
}

#[derive(Deserialize)]
struct EvalInput {
    interview_id: String,
    round_id: Option<String>,
    skill_scores: Option<String>,
    overall_score: Option<f64>,
    comments: Option<String>,
    recommendation: Option<String>,
}

pub fn path() -> PathBuf {
    std::env::var("EASY_HIRE_DB")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("easy_hire.db"))
}

pub async fn run() -> Result<(), E> {
    let d = D::new(path())?;
    let state = Arc::new(S { db: d });
    let addr = SocketAddr::from(([0, 0, 0, 0], 3201));
    let listener = tokio::net::TcpListener::bind(addr)
        .await
        .map_err(|e| E(e.to_string()))?;
    println!("Easy Hire API listening on {}", addr);
    axum::serve(listener, router(state))
        .await
        .map_err(|e| E(e.to_string()))?;
    Ok(())
}

pub fn router(state: Arc<S>) -> Router {
    let cors = CorsLayer::new()
        .allow_origin("http://localhost:5174".parse::<axum::http::HeaderValue>().unwrap())
        .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
        .allow_headers(Any);

    Router::new()
        .route("/api/v1/health", get(health))
        .route("/api/v1/stats", get(stats))
        .route("/api/v1/auth/login", post(auth_login))
        .route("/api/v1/auth/register", post(auth_register))
        .route("/api/v1/auth/refresh", post(auth_refresh))
        .route("/api/v1/auth/me", get(auth_me))
        .route("/api/v1/candidates", get(list_candidates).post(create_candidate))
        .route("/api/v1/candidates/import", post(import_candidates))
        .route("/api/v1/candidates/:id", get(get_candidate).put(update_candidate).delete(delete_candidate))
        .route("/api/v1/candidates/:id/timeline", get(candidate_timeline))
        .route("/api/v1/interviews", get(list_interviews).post(create_interview))
        .route("/api/v1/interviews/assign", post(assign_interviewer))
        .route("/api/v1/interviews/calendar", get(interview_calendar))
        .route("/api/v1/interviews/:id/checkin", put(checkin_interview))
        .route("/api/v1/interviews/:id/evaluate", put(evaluate_interview))
        .route("/api/v1/interviews/:id/rounds", get(list_rounds).post(create_round))
        .route("/api/v1/interviews/:id/assignments", get(list_assignments))
        .route("/api/v1/interviews/:id/evaluations", get(list_evaluations))
        .route("/api/v1/interviews/:id/aggregate", get(aggregate_evaluations))
        .route("/api/v1/evaluations", post(submit_evaluation))
        .route("/api/v1/reports/hiring-funnel", get(report_hiring_funnel))
        .route("/api/v1/reports/training-status", get(report_training_status))
        .route("/api/v1/reports/ehs-compliance", get(report_ehs_compliance))
        .route("/api/v1/courses", get(list_courses).post(create_course))
        .route("/api/v1/courses/:id", get(get_course).put(update_course))
        .route("/api/v1/training/start", post(start_training))
        .route("/api/v1/training/complete", post(complete_training))
        .route("/api/v1/training/records", get(training_records))
        .route("/api/v1/approvals", post(create_approval))
        .route("/api/v1/approvals/pending", get(pending_approvals))
        .route("/api/v1/approvals/:id/approve", post(approve_approval))
        .route("/api/v1/approvals/:id/reject", post(reject_approval))
        .route("/api/v1/approvals/:id/transfer", post(transfer_approval))
        .route("/api/v1/agency/candidates", get(agency_candidates))
        .route("/api/v1/agency/import", post(agency_import))
        .route("/api/v1/employees", get(list_employees).post(create_employee))
        .route("/api/v1/employees/:id", get(get_employee).put(update_employee_handler))
        .route("/api/v1/documents/upload", post(upload_document))
        .route("/api/v1/documents/:id/sign", post(sign_document))
        .route("/api/v1/documents/:id/generate", post(generate_contract))
        .route("/api/v1/documents/:id/download", get(download_document))
        .route("/api/v1/documents/ocr", post(ocr_document))
        .route("/api/v1/training/certificate/:id", get(get_certificate))
        .route("/api/v1/webhooks/whatsapp", post(whatsapp_webhook))
        .route("/api/v1/jobs/public", get(jobs::public_list_jobs))
        .route("/api/v1/jobs/public/:id", get(jobs::public_get_job))
        .route("/api/v1/jobs/apply", post(jobs::public_apply))
        .route("/api/v1/jobs", get(jobs::list_jobs).post(jobs::create_job))
        .route("/api/v1/jobs/:id", get(jobs::get_job).put(jobs::update_job).delete(jobs::delete_job))
        .route("/api/v1/jobs/:id/applications", get(jobs::list_applications))
        .route("/api/v1/jobs/applications/:id/status", put(jobs::update_application_status))
        .route("/api/v1/docusign/envelope", post(docusign::create_envelope))
        .route("/api/v1/docusign/batch", post(docusign::batch_send_envelopes))
        .route("/api/v1/docusign/status/:id", get(docusign::envelope_status))
        .route("/api/v1/webhooks/docusign", post(docusign::docusign_webhook))
        .route("/api/v1/sf/sync/:id", post(successfactors::sync_employee))
        .route("/api/v1/sf/sync-all", post(successfactors::sync_all_pending))
        .route("/api/v1/export/candidates", get(export::export_candidates))
        .route("/api/v1/export/employees", get(export::export_employees))
        .route("/api/v1/export/interviews", get(export::export_interviews))
        .layer(cors)
        .with_state(state)
}

async fn health() -> &'static str {
    "OK"
}

async fn stats(State(s): State<Arc<S>>) -> Result<Json<Value>, E> {
    s.db.stats().map(Json)
}

async fn auth_login(
    State(s): State<Arc<S>>,
    Json(input): Json<auth::LoginInput>,
) -> Result<Json<auth::AuthResponse>, E> {
    auth::login_handler(Arc::new(s.db.clone()), Json(input)).await
}

async fn auth_register(
    State(s): State<Arc<S>>,
    Json(input): Json<auth::RegisterInput>,
) -> Result<Json<auth::AuthResponse>, E> {
    auth::register_handler(Arc::new(s.db.clone()), Json(input)).await
}

async fn auth_me(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
) -> Result<Json<auth::UserResponse>, E> {
    auth::me_handler(Arc::new(s.db.clone()), auth_user).await
}

async fn auth_refresh(
    auth_user: AuthUser,
) -> Result<Json<serde_json::Value>, E> {
    let token = auth::create_token(&auth_user.id, &auth_user.role)?;
    Ok(Json(serde_json::json!({"token": token})))
}

async fn list_candidates(
    State(s): State<Arc<S>>,
    Query(q): Query<CandidateQuery>,
) -> Json<Vec<Candidate>> {
    Json(
        s.db.list_candidates(q.status.as_deref(), q.source.as_deref(), q.q.as_deref())
            .unwrap_or_default(),
    )
}

async fn create_candidate(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<Value>,
) -> Result<Json<Candidate>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "agency"])?;
    let phone = input.get("phone").and_then(|v| v.as_str());
    let email = input.get("email").and_then(|v| v.as_str());
    if !phone.is_some() && !email.is_some() {
        return Err(E("phone or email required".into()));
    }
    let dup = s.db.candidate_by_phone_or_email(phone, email)?;
    if !dup.is_empty() {
        return Err(E("candidate with this phone or email already exists".into()));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    let candidate = Candidate {
        id: id.clone(),
        user_id: input.get("user_id").and_then(|v| v.as_str().map(String::from)),
        agency_id: input.get("agency_id").and_then(|v| v.as_str().map(String::from)),
        name: input.get("name").and_then(|v| v.as_str()).ok_or(E("name required".into()))?.to_string(),
        phone: input.get("phone").and_then(|v| v.as_str().map(String::from)),
        email: input.get("email").and_then(|v| v.as_str().map(String::from)),
        id_number: input.get("id_number").and_then(|v| v.as_str().map(String::from)),
        country_code: input.get("country_code").and_then(|v| v.as_str().map(String::from)).unwrap_or_else(|| "PH".to_string()),
        date_of_birth: input.get("date_of_birth").and_then(|v| v.as_str().map(String::from)),
        gender: input.get("gender").and_then(|v| v.as_str().map(String::from)),
        nationality: input.get("nationality").and_then(|v| v.as_str().map(String::from)),
        address: input.get("address").and_then(|v| v.as_str().map(String::from)),
        city: input.get("city").and_then(|v| v.as_str().map(String::from)),
        province: input.get("province").and_then(|v| v.as_str().map(String::from)),
        postal_code: input.get("postal_code").and_then(|v| v.as_str().map(String::from)),
        education_level: input.get("education_level").and_then(|v| v.as_str().map(String::from)),
        education_school: input.get("education_school").and_then(|v| v.as_str().map(String::from)),
        education_major: input.get("education_major").and_then(|v| v.as_str().map(String::from)),
        education_year: input.get("education_year").and_then(|v| v.as_str().map(String::from)),
        work_experience_years: input.get("work_experience_years").and_then(|v| v.as_i64()),
        previous_employer: input.get("previous_employer").and_then(|v| v.as_str().map(String::from)),
        previous_position: input.get("previous_position").and_then(|v| v.as_str().map(String::from)),
        previous_duration: input.get("previous_duration").and_then(|v| v.as_str().map(String::from)),
        previous_duties: input.get("previous_duties").and_then(|v| v.as_str().map(String::from)),
        languages: input.get("languages").and_then(|v| v.as_str().map(String::from)),
        certifications: input.get("certifications").and_then(|v| v.as_str().map(String::from)),
        emergency_contact_name: input.get("emergency_contact_name").and_then(|v| v.as_str().map(String::from)),
        emergency_contact_phone: input.get("emergency_contact_phone").and_then(|v| v.as_str().map(String::from)),
        emergency_contact_relation: input.get("emergency_contact_relation").and_then(|v| v.as_str().map(String::from)),
        skills: input.get("skills").map(|v| v.to_string()).unwrap_or_else(|| "[]".to_string()),
        resume_text: input.get("resume_text").and_then(|v| v.as_str().map(String::from)),
        resume_file_url: input.get("resume_file_url").and_then(|v| v.as_str().map(String::from)),
        profile_photo_url: input.get("profile_photo_url").and_then(|v| v.as_str().map(String::from)),
        status: "new".to_string(),
        source: input.get("source").and_then(|v| v.as_str().map(String::from)).unwrap_or_else(|| "direct".to_string()),
        notes: input.get("notes").and_then(|v| v.as_str().map(String::from)),
        created_at: now.clone(),
        updated_at: now,
    };

    s.db.create_candidate(&candidate)?;
    let _ = s.db.log_audit(&auth_user.id, "create_candidate", "candidate", &id, "{}");
    s.db.candidate_by_id(&id).map(Json)
}

async fn get_candidate(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<Candidate>, E> {
    s.db.candidate_by_id(&id).map(Json)
}

async fn update_candidate(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
    Json(input): Json<Value>,
) -> Result<Json<Candidate>, E> {
    let mut candidate = s.db.candidate_by_id(&id)?;
    if let Some(name) = input.get("name").and_then(|v| v.as_str()) { candidate.name = name.to_string(); }
    if let Some(phone) = input.get("phone").and_then(|v| v.as_str()) { candidate.phone = Some(phone.to_string()); }
    if let Some(email) = input.get("email").and_then(|v| v.as_str()) { candidate.email = Some(email.to_string()); }
    if let Some(v) = input.get("id_number").and_then(|v| v.as_str()) { candidate.id_number = Some(v.to_string()); }
    if let Some(v) = input.get("country_code").and_then(|v| v.as_str()) { candidate.country_code = v.to_string(); }
    if let Some(v) = input.get("date_of_birth").and_then(|v| v.as_str()) { candidate.date_of_birth = Some(v.to_string()); }
    if let Some(v) = input.get("gender").and_then(|v| v.as_str()) { candidate.gender = Some(v.to_string()); }
    if let Some(v) = input.get("nationality").and_then(|v| v.as_str()) { candidate.nationality = Some(v.to_string()); }
    if let Some(v) = input.get("address").and_then(|v| v.as_str()) { candidate.address = Some(v.to_string()); }
    if let Some(v) = input.get("city").and_then(|v| v.as_str()) { candidate.city = Some(v.to_string()); }
    if let Some(v) = input.get("province").and_then(|v| v.as_str()) { candidate.province = Some(v.to_string()); }
    if let Some(v) = input.get("postal_code").and_then(|v| v.as_str()) { candidate.postal_code = Some(v.to_string()); }
    if let Some(v) = input.get("education_level").and_then(|v| v.as_str()) { candidate.education_level = Some(v.to_string()); }
    if let Some(v) = input.get("education_school").and_then(|v| v.as_str()) { candidate.education_school = Some(v.to_string()); }
    if let Some(v) = input.get("education_major").and_then(|v| v.as_str()) { candidate.education_major = Some(v.to_string()); }
    if let Some(v) = input.get("education_year").and_then(|v| v.as_str()) { candidate.education_year = Some(v.to_string()); }
    if let Some(v) = input.get("work_experience_years").and_then(|v| v.as_i64()) { candidate.work_experience_years = Some(v); }
    if let Some(v) = input.get("previous_employer").and_then(|v| v.as_str()) { candidate.previous_employer = Some(v.to_string()); }
    if let Some(v) = input.get("previous_position").and_then(|v| v.as_str()) { candidate.previous_position = Some(v.to_string()); }
    if let Some(v) = input.get("previous_duration").and_then(|v| v.as_str()) { candidate.previous_duration = Some(v.to_string()); }
    if let Some(v) = input.get("previous_duties").and_then(|v| v.as_str()) { candidate.previous_duties = Some(v.to_string()); }
    if let Some(v) = input.get("languages").and_then(|v| v.as_str()) { candidate.languages = Some(v.to_string()); }
    if let Some(v) = input.get("certifications").and_then(|v| v.as_str()) { candidate.certifications = Some(v.to_string()); }
    if let Some(v) = input.get("emergency_contact_name").and_then(|v| v.as_str()) { candidate.emergency_contact_name = Some(v.to_string()); }
    if let Some(v) = input.get("emergency_contact_phone").and_then(|v| v.as_str()) { candidate.emergency_contact_phone = Some(v.to_string()); }
    if let Some(v) = input.get("emergency_contact_relation").and_then(|v| v.as_str()) { candidate.emergency_contact_relation = Some(v.to_string()); }
    if let Some(v) = input.get("skills") { candidate.skills = v.to_string(); }
    if let Some(v) = input.get("resume_text").and_then(|v| v.as_str()) { candidate.resume_text = Some(v.to_string()); }
    if let Some(v) = input.get("resume_file_url").and_then(|v| v.as_str()) { candidate.resume_file_url = Some(v.to_string()); }
    if let Some(v) = input.get("profile_photo_url").and_then(|v| v.as_str()) { candidate.profile_photo_url = Some(v.to_string()); }
    if let Some(status) = input.get("status").and_then(|v| v.as_str()) { candidate.status = status.to_string(); }
    if let Some(source) = input.get("source").and_then(|v| v.as_str()) { candidate.source = source.to_string(); }
    if let Some(notes) = input.get("notes").and_then(|v| v.as_str()) { candidate.notes = Some(notes.to_string()); }
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    candidate.updated_at = now;
    s.db.update_candidate(&id, &candidate)?;
    let _ = s.db.log_audit(&auth_user.id, "update_candidate", "candidate", &id, "{}");
    s.db.candidate_by_id(&id).map(Json)
}

async fn delete_candidate(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    s.db.delete_candidate(&id)?;
    let _ = s.db.log_audit(&auth_user.id, "delete_candidate", "candidate", &id, "{}");
    Ok(Json(serde_json::json!({"deleted": id})))
}

async fn import_candidates(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    body: String,
) -> Result<Json<db::ImportResult>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let result = s.db.import_candidates_csv(&body, None)?;
    let _ = s.db.log_audit(&auth_user.id, "import_candidates", "candidate", "", &format!("{{\"imported\": {}}}", result.imported));
    Ok(Json(result))
}

async fn candidate_timeline(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<Vec<db::AuditEntry>>, E> {
    s.db.candidate_timeline(&id).map(Json)
}

async fn list_interviews(
    State(s): State<Arc<S>>,
    Query(q): Query<InterviewQuery>,
) -> Json<Vec<Interview>> {
    Json(s.db.list_interviews(q.status.as_deref()).unwrap_or_default())
}

async fn create_interview(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<InterviewInput>,
) -> Result<Json<Interview>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    let interview = Interview {
        id: id.clone(),
        candidate_id: input.candidate_id,
        job_title: input.job_title,
        scheduled_at: input.scheduled_at,
        check_in_at: None,
        interviewer_id: input.interviewer_id,
        skill_scores: "{}".to_string(),
        overall_score: None,
        comments: None,
        status: "scheduled".to_string(),
        result: None,
        created_at: now.clone(),
        updated_at: now,
    };

    s.db.create_interview(&interview)?;
    let _ = s.db.log_audit(&auth_user.id, "create_interview", "interview", &id, "{}");
    s.db.interview_by_id(&id).map(Json)
}

async fn checkin_interview(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, E> {
    s.db.checkin_interview(&id)?;
    let _ = s.db.log_audit(&auth_user.id, "checkin_interview", "interview", &id, "{}");
    Ok(Json(serde_json::json!({"checked_in": id})))
}

async fn evaluate_interview(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
    Json(input): Json<EvaluateInput>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "trainer"])?;
    let scores = input.skill_scores.unwrap_or_else(|| "{}".to_string());
    let score = input.overall_score.unwrap_or(0.0);
    let comments = input.comments.unwrap_or_default();
    let result = input.result.unwrap_or_else(|| "pending".to_string());
    s.db.evaluate_interview(&id, &scores, score, &comments, &result)?;
    let _ = s.db.log_audit(&auth_user.id, "evaluate_interview", "interview", &id, &format!("{{\"result\": \"{}\", \"score\": {}}}", result, score));
    if result == "pass" {
        let interview = s.db.interview_by_id(&id)?;
        let _ = s.db.update_candidate_status(&interview.candidate_id, "offered");
    }
    Ok(Json(serde_json::json!({"evaluated": id})))
}

async fn pending_approvals(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
) -> Result<Json<Vec<Approval>>, E> {
    s.db.pending_approvals(&auth_user.id).map(Json)
}

async fn create_approval(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<ApprovalInput>,
) -> Result<Json<Approval>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    let approval = Approval {
        id: id.clone(),
        candidate_id: input.candidate_id,
        request_type: input.request_type.unwrap_or_else(|| "hire".to_string()),
        requested_by: auth_user.id.clone(),
        assigned_to: input.assigned_to,
        status: "pending".to_string(),
        comments: None,
        escalated_at: None,
        decided_at: None,
        created_at: now.clone(),
        updated_at: now,
    };

    s.db.create_approval(&approval)?;
    let _ = s.db.log_audit(&auth_user.id, "create_approval", "approval", &id, "{}");
    s.db.approval_by_id(&id).map(Json)
}

async fn approve_approval(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
    Json(input): Json<ApprovalAction>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin", "manager"])?;
    let approval = s.db.approval_by_id(&id)?;
    let comments = input.comments.as_deref().unwrap_or("approved");
    s.db.approve_approval(&id, comments)?;
    s.db.update_candidate_status(&approval.candidate_id, "offered")?;
    let _ = s.db.log_audit(&auth_user.id, "approve_approval", "approval", &id, &format!("{{\"candidate_id\": \"{}\"}}", approval.candidate_id));
    Ok(Json(serde_json::json!({"approved": id})))
}

async fn reject_approval(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
    Json(input): Json<ApprovalAction>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin", "manager"])?;
    let comments = input.comments.as_deref().unwrap_or("rejected");
    s.db.reject_approval(&id, comments)?;
    let _ = s.db.log_audit(&auth_user.id, "reject_approval", "approval", &id, "{}");
    Ok(Json(serde_json::json!({"rejected": id})))
}

async fn transfer_approval(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
    Json(input): Json<ApprovalTransfer>,
) -> Result<Json<Value>, E> {
    let comments = input.comments.as_deref().unwrap_or("transferred");
    let (old, new) = s.db.transfer_approval(&id, &input.assigned_to, comments)?;
    let _ = s.db.log_audit(&auth_user.id, "transfer_approval", "approval", &id, &format!("{{\"to\": \"{}\"}}", input.assigned_to));
    Ok(Json(serde_json::json!({"transferred": old.id, "new_approval_id": new.id})))
}

async fn agency_candidates(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
) -> Result<Json<Vec<Candidate>>, E> {
    s.db.agency_candidates(&auth_user.id).map(Json)
}

async fn agency_import(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    body: String,
) -> Result<Json<db::ImportResult>, E> {
    auth::check_role(&auth_user, &["agency", "admin"])?;
    let result = s.db.import_candidates_csv(&body, Some(&auth_user.id))?;
    let _ = s.db.log_audit(&auth_user.id, "agency_import", "candidate", "", &format!("{{\"imported\": {}}}", result.imported));
    Ok(Json(result))
}

async fn list_employees(
    State(s): State<Arc<S>>,
) -> Result<Json<Vec<Employee>>, E> {
    s.db.list_employees().map(Json)
}

async fn create_employee(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<EmployeeInput>,
) -> Result<Json<Employee>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let candidate = s.db.candidate_by_id(&input.candidate_id)?;
    if candidate.status != "offered" {
        return Err(E(format!("candidate status must be 'offered' to hire, current: {}", candidate.status)));
    }

    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let code = input.employee_code.unwrap_or_else(|| format!("EMP-{}", &id[..8]));

    let employee = Employee {
        id: id.clone(),
        candidate_id: Some(input.candidate_id.clone()),
        employee_code: Some(code),
        company_id: None,
        department: input.department,
        position: input.position,
        hired_at: Some(now.clone()),
        contract_start: None,
        contract_end: None,
        training_completed: 0,
        ehs_certified: 0,
        status: "active".to_string(),
        created_at: now.clone(),
        updated_at: now.clone(),
        sf_sync_status: Some("pending".to_string()),
        sf_synced_at: None,
        docusign_envelope_id: None,
        docusign_status: None,
    };

    s.db.create_employee(&employee)?;
    s.db.update_candidate_status(&input.candidate_id, "hired")?;
    let _ = s.db.log_audit(&auth_user.id, "hire_employee", "employee", &id, &format!("{{\"candidate_id\": \"{}\"}}", input.candidate_id));
    s.db.employee_by_id(&id).map(Json)
}

async fn get_employee(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<Employee>, E> {
    s.db.employee_by_id(&id).map(Json)
}

async fn upload_document(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<DocInput>,
) -> Result<Json<Document>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "agency"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    let doc = Document {
        id: id.clone(),
        entity_type: input.entity_type,
        entity_id: input.entity_id,
        doc_type: input.doc_type,
        file_url: input.file_url,
        signed_at: None,
        signature_method: None,
        ocr_data: "{}".to_string(),
        status: "pending".to_string(),
        created_at: now,
        docusign_envelope_id: None,
        docusign_status: None,
        docusign_webhook_data: "{}".to_string(),
    };

    s.db.create_document(&doc)?;
    s.db.document_by_id(&id).map(Json)
}

async fn sign_document(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
    Json(input): Json<SignInput>,
) -> Result<Json<Value>, E> {
    let method = input.signature_method.as_deref().unwrap_or("electronic");
    s.db.sign_document(&id, method)?;
    Ok(Json(serde_json::json!({"signed": id})))
}

async fn generate_contract(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let doc = s.db.document_by_id(&id)?;
    if doc.doc_type != "contract" {
        return Err(E("document is not a contract".into()));
    }
    let candidate = s.db.candidate_by_id(&doc.entity_id)?;
    let country = candidate.country_code.to_uppercase();
    let legal_ref = match country.as_str() {
        "PH" => "Republic Act No. 8792 (E-Commerce Act of 2000)",
        "MY" => "Electronic Commerce Act 1997 (Act 569) + Digital Signature Act 1997",
        "TH" => "Electronic Transactions Act B.E. 2544 (2001)",
        _ => "Applicable local labor law",
    };
    let now = chrono::Utc::now().format("%Y-%m-%d").to_string();
    let contract_html = format!(
        r#"<!DOCTYPE html><html><head><meta charset="utf-8"><title>Employment Contract</title>
<style>body{{font-family:Arial,sans-serif;max-width:800px;margin:0 auto;padding:20px;line-height:1.6}}
h1{{text-align:center;color:#333}}h2{{color:#555;border-bottom:1px solid #ccc}}
.signature{{margin-top:40px}}.sig-line{{border-top:1px solid #000;width:200px;padding-top:5px}}</style></head>
<body>
<h1>EMPLOYMENT CONTRACT</h1>
<p><strong>Date:</strong> {now}</p>
<h2>1. Parties</h2>
<p><strong>Employer:</strong> [Company Name]<br>
<strong>Employee:</strong> {name}<br>
<strong>ID/Passport:</strong> {id_number}<br>
<strong>Phone:</strong> {phone}<br>
<strong>Email:</strong> {email}</p>
<h2>2. Position</h2>
<p>The Employee is engaged in the position of <strong>{position}</strong> in the <strong>{department}</strong> department.</p>
<h2>3. Compensation</h2>
<p>Salary and benefits shall be determined according to company policy and applicable labor laws.</p>
<h2>4. Working Hours</h2>
<p>Standard working hours: 48 hours per week, in accordance with {country} labor law.</p>
<h2>5. Legal Framework</h2>
<p>This contract is governed by {legal_ref}. Electronic signatures on this document carry the same legal weight as handwritten signatures.</p>
<h2>6. Data Privacy</h2>
<p>Personal data collected shall be processed in accordance with applicable data protection laws.</p>
<h2>7. Termination</h2>
<p>Either party may terminate this contract with written notice as required by local labor law.</p>
<div class="signature">
<p><strong>Employer Signature:</strong></p>
<div class="sig-line">Date: ____________</div>
<p style="margin-top:30px"><strong>Employee Signature:</strong></p>
<div class="sig-line">Date: ____________</div>
</div>
</body></html>"#,
        now = now,
        name = candidate.name,
        id_number = candidate.id_number.as_deref().unwrap_or("N/A"),
        phone = candidate.phone.as_deref().unwrap_or("N/A"),
        email = candidate.email.as_deref().unwrap_or("N/A"),
        position = "___________",
        department = "___________",
        country = country,
        legal_ref = legal_ref,
    );
    let _ = s.db.document_by_id(&id);
    Ok(Json(serde_json::json!({
        "document_id": id,
        "country": country,
        "legal_framework": legal_ref,
        "contract_html": contract_html,
    })))
}

async fn download_document(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<Document>, E> {
    s.db.document_by_id(&id).map(Json)
}

async fn ocr_document(
    auth_user: AuthUser,
    Json(_input): Json<OcrInput>,
) -> Result<Json<Value>, E> {
    let _ = auth_user;
    // OCR processing via PaddleOCR (to be integrated)
    Ok(Json(serde_json::json!({"status": "not_implemented", "message": "OCR integration pending - PaddleOCR"})))
}

async fn update_employee_handler(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
    Json(input): Json<EmployeeUpdate>,
) -> Result<Json<Employee>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let mut emp = s.db.employee_by_id(&id)?;
    if let Some(d) = input.department { emp.department = Some(d); }
    if let Some(p) = input.position { emp.position = Some(p); }
    if let Some(cs) = input.contract_start { emp.contract_start = Some(cs); }
    if let Some(ce) = input.contract_end { emp.contract_end = Some(ce); }
    if let Some(st) = input.status { emp.status = st; }
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    emp.updated_at = now;
    s.db.update_employee(&id, &emp)?;
    let _ = s.db.log_audit(&auth_user.id, "update_employee", "employee", &id, "{}");
    s.db.employee_by_id(&id).map(Json)
}

async fn get_certificate(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<Value>, E> {
    let record = s.db.training_record_by_id(&id)?;
    if let Some(ref url) = record.certificate_url {
        Ok(Json(serde_json::json!({
            "record_id": id,
            "certificate_url": url,
            "issued": record.completed_at,
        })))
    } else {
        Ok(Json(serde_json::json!({
            "record_id": id,
            "certificate_url": null,
            "status": "pending",
            "message": "Certificate not yet generated. Complete training with passing score to generate.",
        })))
    }
}

async fn whatsapp_webhook(
    Json(input): Json<WhatsAppInput>,
) -> Result<Json<Value>, E> {
    // WhatsApp Business API webhook (to be integrated)
    Ok(Json(serde_json::json!({
        "status": "received",
        "from": input.from,
        "message_type": input.message_type,
        "ack": true,
    })))
}

async fn interview_calendar(
    State(s): State<Arc<S>>,
) -> Result<Json<Value>, E> {
    let interviews = s.db.list_interviews(None)?;
    let calendar: Vec<Value> = interviews.into_iter().map(|iv| {
        serde_json::json!({
            "id": iv.id,
            "candidate_id": iv.candidate_id,
            "job_title": iv.job_title,
            "scheduled_at": iv.scheduled_at,
            "status": iv.status,
        })
    }).collect();
    Ok(Json(serde_json::json!({"interviews": calendar})))
}

async fn report_hiring_funnel(
    State(s): State<Arc<S>>,
) -> Result<Json<Value>, E> {
    let _stats = s.db.stats()?;
    let candidates = s.db.list_candidates(None, None, None)?;
    let total = candidates.len();
    let interviewing = candidates.iter().filter(|c| c.status == "interviewing").count();
    let offered = candidates.iter().filter(|c| c.status == "offered").count();
    let hired = candidates.iter().filter(|c| c.status == "hired").count();
    let rejected = candidates.iter().filter(|c| c.status == "rejected").count();
    Ok(Json(serde_json::json!({
        "total": total,
        "interviewing": interviewing,
        "offered": offered,
        "hired": hired,
        "rejected": rejected,
        "conversion_rate": if total > 0 { format!("{:.1}%", hired as f64 / total as f64 * 100.0) } else { "0%".to_string() },
    })))
}

async fn report_training_status(
    State(s): State<Arc<S>>,
) -> Result<Json<Value>, E> {
    let employees = s.db.list_employees()?;
    let total = employees.len();
    let trained = employees.iter().filter(|e| e.training_completed > 0).count();
    let certified = employees.iter().filter(|e| e.ehs_certified > 0).count();
    Ok(Json(serde_json::json!({
        "total_employees": total,
        "training_completed": trained,
        "ehs_certified": certified,
    })))
}

async fn report_ehs_compliance(
    State(s): State<Arc<S>>,
) -> Result<Json<Value>, E> {
    let employees = s.db.list_employees()?;
    let total = employees.len();
    let certified = employees.iter().filter(|e| e.ehs_certified > 0).count();
    let ehs_courses = s.db.list_courses()?;
    let courses = ehs_courses.iter().filter(|c| c.course_type == "ehs").count();
    Ok(Json(serde_json::json!({
        "total_employees": total,
        "ehs_certified": certified,
        "compliance_rate": if total > 0 { format!("{:.1}%", certified as f64 / total as f64 * 100.0) } else { "0%".to_string() },
        "ehs_courses_available": courses,
    })))
}

async fn list_courses(
    State(s): State<Arc<S>>,
) -> Result<Json<Vec<TrainingCourse>>, E> {
    s.db.list_courses().map(Json)
}

async fn create_course(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<CourseInput>,
) -> Result<Json<TrainingCourse>, E> {
    auth::check_role(&auth_user, &["admin", "trainer"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let course = TrainingCourse {
        id: id.clone(),
        title: input.title,
        course_type: input.course_type.unwrap_or_else(|| "onboarding".to_string()),
        country: input.country.unwrap_or_else(|| "all".to_string()),
        content_type: input.content_type.unwrap_or_else(|| "video".to_string()),
        content_url: input.content_url,
        mandatory: input.mandatory.unwrap_or(0),
        duration_minutes: input.duration_minutes,
        order_index: None,
        pass_score: input.pass_score,
        created_at: now,
    };
    s.db.create_course(&course)?;
    s.db.course_by_id(&id).map(Json)
}

async fn get_course(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
) -> Result<Json<TrainingCourse>, E> {
    s.db.course_by_id(&id).map(Json)
}

async fn update_course(
    State(s): State<Arc<S>>,
    Path(id): Path<String>,
    Json(input): Json<CourseInput>,
) -> Result<Json<TrainingCourse>, E> {
    let mut course = s.db.course_by_id(&id)?;
    course.title = input.title;
    if let Some(t) = input.course_type { course.course_type = t; }
    if let Some(c) = input.country { course.country = c; }
    if let Some(ct) = input.content_type { course.content_type = ct; }
    course.content_url = input.content_url;
    if let Some(m) = input.mandatory { course.mandatory = m; }
    course.duration_minutes = input.duration_minutes;
    course.pass_score = input.pass_score;
    s.db.update_course(&id, &course)?;
    s.db.course_by_id(&id).map(Json)
}

async fn start_training(
    State(s): State<Arc<S>>,
    Json(input): Json<TrainingStartInput>,
) -> Result<Json<TrainingRecord>, E> {
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let record = TrainingRecord {
        id: id.clone(),
        employee_id: input.employee_id,
        course_id: input.course_id,
        started_at: Some(now),
        completed_at: None,
        score: None,
        passed: 0,
        certificate_url: None,
        created_at: chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
    };
    s.db.create_training_record(&record)?;
    s.db.training_record_by_id(&id).map(Json)
}

async fn complete_training(
    State(s): State<Arc<S>>,
    Json(input): Json<TrainingCompleteInput>,
) -> Result<Json<TrainingRecord>, E> {
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    s.db.complete_training(&input.record_id, &now, input.score, input.passed.unwrap_or(0), input.certificate_url.as_deref())?;
    s.db.training_record_by_id(&input.record_id).map(Json)
}

async fn training_records(
    State(s): State<Arc<S>>,
    Query(q): Query<std::collections::HashMap<String, String>>,
) -> Result<Json<Vec<TrainingRecord>>, E> {
    let employee_id = q.get("employee_id").map(|s| s.as_str());
    s.db.list_training_records(employee_id).map(Json)
}

async fn create_round(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<RoundInput>,
) -> Result<(StatusCode, Json<InterviewRound>), E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "manager"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let round = InterviewRound {
        id: id.clone(),
        interview_id: input.interview_id,
        round_number: input.round_number,
        round_type: input.round_type.unwrap_or_else(|| "technical".to_string()),
        scheduled_at: input.scheduled_at,
        status: "pending".to_string(),
        created_at: now,
    };
    s.db.create_round(&round)?;
    let round = get_one_round(&s.db, &id)?;
    Ok((StatusCode::CREATED, Json(round)))
}

async fn list_rounds(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Vec<InterviewRound>>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "manager"])?;
    let rounds = s.db.list_rounds(&id)?;
    Ok(Json(rounds))
}

async fn assign_interviewer(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<AssignInput>,
) -> Result<(StatusCode, Json<InterviewAssignment>), E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "manager"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let assign = InterviewAssignment {
        id: id.clone(),
        interview_id: input.interview_id,
        round_id: input.round_id,
        interviewer_id: input.interviewer_id,
        status: "assigned".to_string(),
        created_at: now,
    };
    s.db.create_assignment(&assign)?;
    let assign = get_one_assignment(&s.db, &id)?;
    Ok((StatusCode::CREATED, Json(assign)))
}

async fn list_assignments(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Vec<InterviewAssignment>>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "manager"])?;
    let assignments = s.db.list_assignments(&id)?;
    Ok(Json(assignments))
}

async fn submit_evaluation(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Json(input): Json<EvalInput>,
) -> Result<(StatusCode, Json<InterviewEvaluation>), E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "manager"])?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
    let eval = InterviewEvaluation {
        id: id.clone(),
        interview_id: input.interview_id,
        round_id: input.round_id,
        interviewer_id: auth_user.id,
        skill_scores: input.skill_scores.unwrap_or_else(|| "{}".to_string()),
        overall_score: input.overall_score,
        comments: input.comments,
        recommendation: input.recommendation.unwrap_or_else(|| "pending".to_string()),
        submitted_at: Some(now.clone()),
        created_at: now,
    };
    s.db.create_evaluation(&eval)?;
    let eval = get_one_evaluation(&s.db, &id)?;
    Ok((StatusCode::CREATED, Json(eval)))
}

async fn list_evaluations(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Vec<InterviewEvaluation>>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "manager"])?;
    let evals = s.db.list_evaluations(&id)?;
    Ok(Json(evals))
}

async fn aggregate_evaluations(
    State(s): State<Arc<S>>,
    auth_user: AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter", "manager"])?;
    let agg = s.db.evaluation_aggregate(&id)?;
    Ok(Json(agg))
}

fn get_one_round(d: &D, id: &str) -> Result<InterviewRound, E> {
    let c = d.conn().map_err(|e| E(e.to_string()))?;
    c.query_row(
        "SELECT id, interview_id, round_number, round_type, scheduled_at, status, created_at FROM interview_rounds WHERE id=?1",
        rusqlite::params![id],
        |row| {
            Ok(InterviewRound {
                id: row.get(0)?,
                interview_id: row.get(1)?,
                round_number: row.get(2)?,
                round_type: row.get(3)?,
                scheduled_at: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get(6)?,
            })
        },
    ).map_err(|e| E(e.to_string()))
}

fn get_one_assignment(d: &D, id: &str) -> Result<InterviewAssignment, E> {
    let c = d.conn().map_err(|e| E(e.to_string()))?;
    c.query_row(
        "SELECT id, interview_id, round_id, interviewer_id, status, created_at FROM interview_assignments WHERE id=?1",
        rusqlite::params![id],
        |row| {
            Ok(InterviewAssignment {
                id: row.get(0)?,
                interview_id: row.get(1)?,
                round_id: row.get(2)?,
                interviewer_id: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
            })
        },
    ).map_err(|e| E(e.to_string()))
}

fn get_one_evaluation(d: &D, id: &str) -> Result<InterviewEvaluation, E> {
    let c = d.conn().map_err(|e| E(e.to_string()))?;
    c.query_row(
        "SELECT id, interview_id, round_id, interviewer_id, skill_scores, overall_score, comments, recommendation, submitted_at, created_at FROM interview_evaluations WHERE id=?1",
        rusqlite::params![id],
        |row| {
            Ok(InterviewEvaluation {
                id: row.get(0)?,
                interview_id: row.get(1)?,
                round_id: row.get(2)?,
                interviewer_id: row.get(3)?,
                skill_scores: row.get(4)?,
                overall_score: row.get(5)?,
                comments: row.get(6)?,
                recommendation: row.get(7)?,
                submitted_at: row.get(8)?,
                created_at: row.get(9)?,
            })
        },
    ).map_err(|e| E(e.to_string()))
}
