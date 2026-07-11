use axum::{
    async_trait,
    extract::FromRequestParts,
    http::{request::Parts, StatusCode},
    response::{IntoResponse, Response},
    Json,
};
use bcrypt::{hash, verify, DEFAULT_COST};
use jsonwebtoken::{decode, encode, DecodingKey, EncodingKey, Header, Validation};
use serde::{Deserialize, Serialize};
use std::sync::Arc;

use crate::db::D;
use crate::error::E;

fn jwt_secret() -> String {
    std::env::var("DL_HIRE_JWT_SECRET").unwrap_or_else(|_| "dl-hire-jwt-secret-2026".into())
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Claims {
    pub sub: String,
    pub role: String,
    pub exp: usize,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct LoginInput {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct RegisterInput {
    pub name: String,
    pub email: String,
    pub password: String,
    pub role: String,
    pub company_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct AuthResponse {
    pub token: String,
    pub user: UserResponse,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct UserResponse {
    pub id: String,
    pub email: Option<String>,
    pub name: String,
    pub role: String,
    pub company_id: Option<String>,
}

pub fn hash_password(pw: &str) -> Result<String, E> {
    hash(pw, DEFAULT_COST).map_err(|e| E(format!("hash error: {}", e)))
}

pub fn verify_password(pw: &str, hash_str: &str) -> Result<bool, E> {
    verify(pw, hash_str).map_err(|e| E(format!("verify error: {}", e)))
}

pub fn create_token(user_id: &str, role: &str) -> Result<String, E> {
    let now = chrono::Utc::now();
    let exp = (now + chrono::Duration::hours(24)).timestamp() as usize;
    let claims = Claims {
        sub: user_id.to_string(),
        role: role.to_string(),
        exp,
    };
    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(jwt_secret().as_ref()),
    )
    .map_err(|e| E(format!("token create error: {}", e)))
}

fn decode_token(token: &str) -> Result<Claims, E> {
    decode::<Claims>(
        token,
        &DecodingKey::from_secret(jwt_secret().as_ref()),
        &Validation::default(),
    )
    .map(|data| data.claims)
    .map_err(|e| E(format!("invalid token: {}", e)))
}

#[derive(Debug, Clone)]
pub struct AuthUser {
    pub id: String,
    pub role: String,
}

#[async_trait]
impl<S> FromRequestParts<S> for AuthUser
where
    S: Send + Sync,
{
    type Rejection = AuthError;

    async fn from_request_parts(parts: &mut Parts, _state: &S) -> Result<Self, Self::Rejection> {
        let auth_header = parts
            .headers
            .get("Authorization")
            .and_then(|v| v.to_str().ok())
            .ok_or(AuthError("missing authorization header".into()))?;

        let token = auth_header
            .strip_prefix("Bearer ")
            .ok_or(AuthError("invalid authorization format".into()))?;

        let claims = decode_token(token).map_err(|_| AuthError("invalid token".into()))?;

        Ok(AuthUser {
            id: claims.sub,
            role: claims.role,
        })
    }
}

#[derive(Debug)]
pub struct AuthError(pub String);

impl IntoResponse for AuthError {
    fn into_response(self) -> Response {
        (StatusCode::UNAUTHORIZED, self.0).into_response()
    }
}

pub fn check_role(user: &AuthUser, allowed_roles: &[&str]) -> Result<(), E> {
    if allowed_roles.iter().any(|r| *r == user.role) {
        Ok(())
    } else {
        Err(E("unauthorized: insufficient role".into()))
    }
}

pub async fn login_handler(
    db: Arc<D>,
    Json(input): Json<LoginInput>,
) -> Result<Json<AuthResponse>, E> {
    let user = db.user_by_email(&input.email)?;

    let valid = verify_password(&input.password, &user.password_hash)?;
    if !valid {
        return Err(E("unauthorized: invalid password".into()));
    }

    let token = create_token(&user.id, &user.role)?;

    let _ = db.log_audit(
        &user.id,
        "login",
        "user",
        &user.id,
        &format!("{{\"email\": \"{}\"}}", &input.email),
    );

    Ok(Json(AuthResponse {
        token,
        user: UserResponse {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            company_id: user.company_id,
        },
    }))
}

pub async fn register_handler(
    db: Arc<D>,
    Json(input): Json<RegisterInput>,
) -> Result<Json<AuthResponse>, E> {
    if input.name.trim().is_empty() {
        return Err(E("name required".into()));
    }
    if input.email.trim().is_empty() {
        return Err(E("email required".into()));
    }
    if input.password.len() < 6 {
        return Err(E("password must be at least 6 characters".into()));
    }
    let valid_roles = ["admin", "recruiter", "manager", "agency", "trainer", "worker"];
    if !valid_roles.contains(&input.role.as_str()) {
        return Err(E(format!("invalid role: {}", input.role)));
    }

    let password_hash = hash_password(&input.password)?;
    let id = uuid::Uuid::new_v4().to_string();
    let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

    let user = crate::db::User {
        id: id.clone(),
        email: Some(input.email.clone()),
        phone: None,
        password_hash,
        role: input.role.clone(),
        name: input.name.clone(),
        company_id: input.company_id.clone(),
        language_pref: "en".to_string(),
        active: 1,
        created_at: now.clone(),
        updated_at: now,
    };

    db.create_user(&user)?;
    let token = create_token(&id, &input.role)?;

    Ok(Json(AuthResponse {
        token,
        user: UserResponse {
            id,
            email: Some(input.email),
            name: input.name,
            role: input.role,
            company_id: input.company_id,
        },
    }))
}

pub async fn me_handler(
    db: Arc<D>,
    auth: AuthUser,
) -> Result<Json<UserResponse>, E> {
    let user = db.user_by_id(&auth.id)?;
    Ok(Json(UserResponse {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        company_id: user.company_id,
    }))
}
