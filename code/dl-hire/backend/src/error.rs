use axum::response::{IntoResponse, Response};
use axum::http::StatusCode;

#[derive(Debug)]
pub struct E(pub String);

impl std::fmt::Display for E {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}

impl std::error::Error for E {}

impl IntoResponse for E {
    fn into_response(self) -> Response {
        let msg = self.0;
        if msg.contains("not found") {
            (StatusCode::NOT_FOUND, msg).into_response()
        } else if msg.contains("unauthorized") || msg.contains("invalid token") || msg.contains("expired") {
            (StatusCode::UNAUTHORIZED, msg).into_response()
        } else if msg.contains("invalid") || msg.contains("required") || msg.contains("must be") || msg.contains("already") {
            (StatusCode::BAD_REQUEST, msg).into_response()
        } else {
            (StatusCode::INTERNAL_SERVER_ERROR, msg).into_response()
        }
    }
}

impl From<rusqlite::Error> for E {
    fn from(e: rusqlite::Error) -> Self {
        E(e.to_string())
    }
}

impl From<std::io::Error> for E {
    fn from(e: std::io::Error) -> Self {
        E(e.to_string())
    }
}

impl From<serde_json::Error> for E {
    fn from(e: serde_json::Error) -> Self {
        E(e.to_string())
    }
}
