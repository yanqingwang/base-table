use std::sync::Arc;
use axum::{extract::{Path, State}, http::StatusCode, Json};
use serde::Deserialize;
use serde_json::Value;
use crate::{auth, S, E};

#[derive(Deserialize)]
pub struct EnvelopeInput {
    pub document_id: String,
    pub signer_email: String,
    pub signer_name: String,
}

#[derive(Deserialize)]
pub struct BatchInput {
    pub document_ids: Vec<String>,
}

pub async fn create_envelope(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Json(input): Json<EnvelopeInput>,
) -> Result<(StatusCode, Json<Value>), E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let envelope_id = uuid::Uuid::new_v4().to_string();
    // In production, call DocuSign API here:
    // POST https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes
    let _ = &s.db.update_docusign_status(&envelope_id, "sent", None);
    Ok((StatusCode::CREATED, Json(serde_json::json!({
        "envelope_id": envelope_id,
        "status": "sent",
        "document_id": input.document_id,
        "signer_email": input.signer_email,
        "signer_name": input.signer_name,
    }))))
}

pub async fn batch_send_envelopes(
    State(_s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Json(input): Json<BatchInput>,
) -> Result<(StatusCode, Json<Value>), E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    let envelopes: Vec<Value> = input.document_ids.iter().map(|doc_id| {
        let envelope_id = uuid::Uuid::new_v4().to_string();
        serde_json::json!({ "envelope_id": envelope_id, "document_id": doc_id, "status": "sent" })
    }).collect();
    Ok((StatusCode::CREATED, Json(serde_json::json!({
        "total": envelopes.len(),
        "envelopes": envelopes,
    }))))
}

pub async fn envelope_status(
    State(_s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin", "recruiter"])?;
    // In production, call DocuSign API to get real status
    Ok(Json(serde_json::json!({
        "envelope_id": id,
        "status": "sent",
        "last_checked": chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string(),
    })))
}

pub async fn docusign_webhook(
    State(s): State<Arc<S>>,
    Json(input): Json<Value>,
) -> Result<StatusCode, E> {
    // Receive DocuSign Connect webhook
    let envelope_id = input.get("envelopeId")
        .or_else(|| input.get("envelope_id"))
        .and_then(|v| v.as_str())
        .unwrap_or("");
    let status = input.get("status")
        .and_then(|v| v.as_str())
        .unwrap_or("unknown");
    let _ = s.db.update_docusign_status(envelope_id, status, Some(&input.to_string()));
    Ok(StatusCode::OK)
}
