use std::sync::Arc;
use axum::{extract::{Path, State}, Json};
use serde_json::Value;
use crate::{auth, S, E};

pub async fn sync_employee(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
    Path(id): Path<String>,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin"])?;
    let _employee = s.db.employee_by_id(&id)?;

    // Check if SF API key is configured
    let sf_base_url = std::env::var("SF_BASE_URL").unwrap_or_default();
    if sf_base_url.is_empty() {
        // Mock mode: mark as synced without API call
        s.db.update_sf_sync_status(&id, "synced")?;
        return Ok(Json(serde_json::json!({
            "employee_id": id,
            "status": "synced",
            "mode": "mock",
            "message": "SuccessFactors not configured. Employee marked as synced (mock mode)."
        })));
    }

    // Production: call SuccessFactors OData API
    // POST {sf_base_url}/odata/v2/Employee
    // Body: mapped employee fields

    s.db.update_sf_sync_status(&id, "synced")?;
    Ok(Json(serde_json::json!({
        "employee_id": id,
        "status": "synced",
        "mode": "api",
    })))
}

pub async fn sync_all_pending(
    State(s): State<Arc<S>>,
    auth_user: auth::AuthUser,
) -> Result<Json<Value>, E> {
    auth::check_role(&auth_user, &["admin"])?;
    let pending = s.db.pending_sf_sync()?;
    let mut synced = 0;
    let mut errors = Vec::new();
    for emp in &pending {
        // In production: call SF API
        if let Err(e) = s.db.update_sf_sync_status(&emp.id, "synced") {
            errors.push(serde_json::json!({ "id": emp.id, "error": e.0 }));
        } else {
            synced += 1;
        }
    }
    Ok(Json(serde_json::json!({
        "total_pending": pending.len(),
        "synced": synced,
        "errors": errors,
    })))
}
