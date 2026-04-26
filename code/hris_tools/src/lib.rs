use std::{net::SocketAddr, path::PathBuf, sync::Arc};
use axum::{Json, Router, extract::{Path, State, Query, RawQuery}, http::{HeaderMap, HeaderValue, StatusCode, header, Method, header:: HeaderName}, response::IntoResponse, routing::{get, post}, body::Body};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use serde_json::json;

pub struct S { pub db: D }
pub struct D { pub p: PathBuf }

#[derive(Debug, Clone, Serialize, Deserialize)] pub struct R { pub i: i64, pub m: String, pub c: String, pub v: String, pub ct: String, pub a: f64 }
#[derive(Debug, Clone, Serialize, Deserialize)] pub struct W { pub k: String, pub v: f64 }
#[derive(Debug, Deserialize)] pub struct Input { pub m: String, pub c: String, pub v: String, pub ct: String, pub a: f64 }
impl Input { pub fn validate(&self) -> Result<(), String> { if self.m.trim().is_empty() { return Err("month required".into()); } if self.c.trim().is_empty() { return Err("country required".into()); } if self.v.trim().is_empty() { return Err("vendor required".into()); } if self.ct.trim().is_empty() { return Err("contract required".into()); } if self.a < 0.0 { return Err("amount must be positive".into()); } Ok(()) } }
#[derive(Debug, Deserialize)] pub struct P { pub csv: String }
#[derive(Debug, Deserialize)] pub struct PMd { pub md: String }
#[derive(Debug, Deserialize)] pub struct Q { pub month: Option<String>, #[serde(rename = "country")] pub country: Option<String>, pub vendor: Option<String> }

impl D {
    pub fn new(p: PathBuf) -> Result<Self, E> { if let Some(pp) = p.parent() { std::fs::create_dir_all(pp)?; } let mut db = D { p }; db.init()?; Ok(db) }
    fn c(&self) -> Result<Connection, E> { Ok(Connection::open(&self.p)?) }
    fn init(&self) -> Result<(), E> { self.c()?.execute("CREATE TABLE IF NOT EXISTS r (i INTEGER PRIMARY KEY, m TEXT, c TEXT, v TEXT, ct TEXT, a REAL)", [])?; Ok(()) }
    pub fn list(&self) -> Result<Vec<R>, E> { let db = self.c()?; let mut s = db.prepare("SELECT i,m,c,v,ct,a FROM r")?; let rows = s.query_map([], |r| Ok(R{i:r.get(0)?, m:r.get(1)?, c:r.get(2)?, v:r.get(3)?, ct:r.get(4)?, a:r.get(5)?}))?; Ok(rows.filter_map(|r|r.ok()).collect()) }
    pub fn by_id(&self, id: i64) -> Result<R, E> { self.c()?.query_row("SELECT i,m,c,v,ct,a FROM r WHERE i=?", params![id], |r| Ok(R{i:r.get(0)?, m:r.get(1)?, c:r.get(2)?, v:r.get(3)?, ct:r.get(4)?, a:r.get(5)?})).map_err(|_| E("not found".into())) }
    pub fn add(&self, r: &R) -> Result<i64, E> { let c = self.c()?; c.execute("INSERT INTO r (m,c,v,ct,a) VALUES (?,?,?,?,?)", params![r.m, r.c, r.v, r.ct, r.a])?; Ok(c.last_insert_rowid()) }
    pub fn update(&self, id: i64, r: &R) -> Result<R, E> { let c = self.c()?; c.execute("UPDATE r SET m=?,c=?,v=?,ct=?,a=? WHERE i=?", params![r.m, r.c, r.v, r.ct, r.a, id])?; self.by_id(id) }
    pub fn delete(&self, id: i64) -> Result<(), E> { let c = self.c()?; let affected = c.execute("DELETE FROM r WHERE i=?", params![id])?; if affected == 0 { Err(E("not found".into())) } else { Ok(()) } }
    fn parse_csv_line(line: &str) -> Vec<String> { let mut fields = vec![]; let mut in_quotes = false; let mut field = String::new(); for ch in line.chars() { match ch { '"' => in_quotes = !in_quotes, ',' if !in_quotes => { fields.push(field.trim().to_string()); field.clear(); } _ => field.push(ch), } } fields.push(field.trim().to_string()); fields }

pub fn import_csv(&self, s: &str) -> Result<usize, E> { let mut n = 0; let c = self.c()?; for line in s.lines().skip(1) { let fields = Self::parse_csv_line(line); if fields.len() < 5 { continue; } let month = &fields[0]; let country = &fields[1]; let vendor = &fields[2]; let contract = &fields[3]; let amount: f64 = fields[4].parse().map_err(|_| E(format!("invalid amount: {}", fields[4])))?; let input = Input { m: month.to_string(), c: country.to_string(), v: vendor.to_string(), ct: contract.to_string(), a: amount }; input.validate().map_err(|e| E(e))?; c.execute("INSERT INTO r (m,c,v,ct,a) VALUES (?,?,?,?,?)", params![month, country, vendor, contract, amount])?; n += 1; } Ok(n) }
    pub fn export_csv(&self) -> Result<String, E> { let rs = self.list()?; let mut o = String::from("month,country,vendor,contract,amount\n"); for r in rs { let esc = |s: &str| if s.contains(',') || s.contains('"') || s.contains('\n') { format!("\"{}\"", s.replace('"', "\"\"")) } else { s.to_string() }; o.push_str(&format!("{},{},{},{},{}\n", esc(&r.m), esc(&r.c), esc(&r.v), esc(&r.ct), r.a)); } Ok(o) }
    pub fn import_md(&self, s: &str) -> Result<usize, E> { let mut n = 0; let c = self.c()?; let s = s.replace("\\n", "\n"); let mut header_done = false; for line in s.lines() { let line = line.trim(); if !line.starts_with('|') { continue; } if line.contains("---") { header_done = true; continue; } if !header_done { continue; } let fields: Vec<&str> = line.split('|').filter(|s| !s.trim().is_empty()).collect(); if fields.len() >= 5 { let month = fields[0].trim(); let country = fields[1].trim(); let vendor = fields[2].trim(); let contract = fields[3].trim(); let amount: f64 = fields[4].trim().replace(['$',','], "").parse().map_err(|_| E(format!("invalid amount: {}", fields[4])))?; let input = Input { m: month.to_string(), c: country.to_string(), v: vendor.to_string(), ct: contract.to_string(), a: amount }; input.validate().map_err(|e| E(e))?; c.execute("INSERT INTO r (m,c,v,ct,a) VALUES (?,?,?,?,?)", params![month, country, vendor, contract, amount])?; n += 1; } } Ok(n) }
    pub fn export_md(&self) -> Result<String, E> { let rs = self.list()?; let mut o = String::from("| Month | Country | Vendor | Contract | Amount |\n|---|---|---|---|---|\n"); for r in rs { o.push_str(&format!("| {} | {} | {} | {} | {} |\n", r.m, r.c, r.v, r.ct, r.a)); } Ok(o) }
    pub fn stats(&self) -> Result<Stat, E> { let c = self.c()?; let total: i64 = c.query_row("SELECT COUNT(*) FROM r", [], |r| r.get(0))?; let sum: f64 = c.query_row("SELECT COALESCE(SUM(a),0) FROM r", [], |r| r.get(0))?; Ok(Stat{total, sum}) }
    pub fn view(&self, by: &str) -> Result<Vec<W>, E> { let c = self.c()?; let sql = match by { "country" => "SELECT c, SUM(a) FROM r GROUP BY c", "vendor" => "SELECT v, SUM(a) FROM r GROUP BY v", "contract" => "SELECT ct, SUM(a) FROM r GROUP BY ct", _ => return Err(E("invalid view: use country, vendor, or contract".into())) }; let mut s = c.prepare(sql)?; let rows = s.query_map([], |r| Ok(W{k:r.get(0)?, v:r.get(1)?}))?; Ok(rows.filter_map(|r|r.ok()).collect()) }
    pub fn query(&self, month: Option<&str>, country: Option<&str>, vendor: Option<&str>) -> Result<Vec<R>, E> { let c = self.c()?; let mut sql = String::from("SELECT i,m,c,v,ct,a FROM r WHERE 1=1"); let mut params_vec: Vec<Box<dyn rusqlite::ToSql>> = vec![]; if let Some(m) = month { sql.push_str(" AND m=?"); params_vec.push(Box::new(m.to_string())); } if let Some(c) = country { sql.push_str(" AND c=?"); params_vec.push(Box::new(c.to_string())); } if let Some(v) = vendor { sql.push_str(" AND v=?"); params_vec.push(Box::new(v.to_string())); } let mut s = c.prepare(&sql)?; let params_refs: Vec<&dyn rusqlite::ToSql> = params_vec.iter().map(|b| b.as_ref()).collect(); let rows = s.query_map(params_refs.as_slice(), |r| Ok(R{i:r.get(0)?, m:r.get(1)?, c:r.get(2)?, v:r.get(3)?, ct:r.get(4)?, a:r.get(5)?}))?; Ok(rows.filter_map(|r|r.ok()).collect()) }
}

#[derive(Debug, Serialize)] pub struct Stat { pub total: i64, pub sum: f64 }

fn path() -> PathBuf { std::env::var("HRIS_DB").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from("hris.db")) }

pub async fn run() -> Result<(), E> {
    let state = Arc::new(S { db: D::new(path())? });
    let addr = SocketAddr::from(([127,0,0,1], 3100));
    let listener = tokio::net::TcpListener::bind(addr).await.map_err(|e| E(e.to_string()))?;
    println!("HRIS {}", addr);
    axum::serve(listener, router(state)).await.map_err(|e| E(e.to_string()))?;
    Ok(())
}

pub fn router(state: Arc<S>) -> Router {
    Router::new()
        .route("/", get(|| async { "HRIS Cost Management" }))
        .route("/health", get(|| async { "OK" }))
        .route("/records", get(lst).post(add))
        .route("/records/:i", get(byid).put(upd).delete(del))
        .route("/import", post(imp))
        .route("/import-csv", post(imp_csv_raw))
        .route("/import-md", post(imp_md))
        .route("/import-md-raw", post(imp_md_raw))
        .route("/export", get(exp))
        .route("/export-md", get(exp_md))
        .route("/stats", get(st))
        .route("/views/:v", get(vw))
        .route("/query", get(qry))
        .with_state(state)
}

async fn lst(State(s): State<Arc<S>>) -> Json<Vec<R>> { Json(s.db.list().unwrap_or_default()) }
async fn add(State(s): State<Arc<S>>, Json(r): Json<Input>) -> Result<Json<R>, E> { r.validate().map_err(|e| E(e))?; let rec = R{i:0, m:r.m, c:r.c, v:r.v, ct:r.ct, a:r.a}; let id = s.db.add(&rec)?; s.db.by_id(id).map(Json) }
async fn byid(Path(i): Path<i64>, State(s): State<Arc<S>>) -> Result<Json<R>, E> { s.db.by_id(i).map(Json) }
async fn upd(Path(i): Path<i64>, State(s): State<Arc<S>>, Json(r): Json<Input>) -> Result<Json<R>, E> { r.validate().map_err(|e| E(e))?; let rec = R{i:i, m:r.m, c:r.c, v:r.v, ct:r.ct, a:r.a}; s.db.update(i, &rec).map(Json) }
async fn del(Path(i): Path<i64>, State(s): State<Arc<S>>) -> Result<Json<serde_json::Value>, E> { s.db.delete(i).map(|_| Json(json!({"deleted":i}))) }
async fn imp(State(s): State<Arc<S>>, Json(p): Json<P>) -> Result<Json<serde_json::Value>, E> { Ok(Json(json!({"imported":s.db.import_csv(&p.csv)?}))) }
async fn imp_csv_raw(State(s): State<Arc<S>>, body: String) -> Result<Json<serde_json::Value>, E> { Ok(Json(json!({"imported":s.db.import_csv(&body)?}))) }
async fn imp_md(State(s): State<Arc<S>>, Json(p): Json<PMd>) -> Result<Json<serde_json::Value>, E> { Ok(Json(json!({"imported":s.db.import_md(&p.md)?}))) }
async fn imp_md_raw(State(s): State<Arc<S>>, body: String) -> Result<Json<serde_json::Value>, E> { Ok(Json(json!({"imported":s.db.import_md(&body)?}))) }
async fn exp(State(s): State<Arc<S>>) -> impl IntoResponse { match s.db.export_csv() { Ok(c) => { let mut h = HeaderMap::new(); h.insert(header::CONTENT_TYPE, HeaderValue::from_static("text/csv")); (h, c).into_response() } Err(e) => e.into_response() } }
async fn exp_md(State(s): State<Arc<S>>) -> impl IntoResponse { match s.db.export_md() { Ok(c) => { let mut h = HeaderMap::new(); h.insert(header::CONTENT_TYPE, HeaderValue::from_static("text/markdown")); (h, c).into_response() } Err(e) => e.into_response() } }
async fn st(State(s): State<Arc<S>>) -> Json<Stat> { Json(s.db.stats().unwrap_or(Stat{total:0, sum:0.0})) }
async fn vw(Path(v): Path<String>, State(s): State<Arc<S>>) -> Result<Json<Vec<W>>, E> { s.db.view(&v).map(Json) }
async fn qry(State(s): State<Arc<S>>, Query(Q{month, country, vendor}): Query<Q>) -> Json<Vec<R>> { Json(s.db.query(month.as_deref(), country.as_deref(), vendor.as_deref()).unwrap_or_default()) }

#[derive(Debug)] pub struct E(pub String);
impl std::fmt::Display for E { fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result { write!(f, "{}", self.0) } }
impl std::error::Error for E {}
impl From<rusqlite::Error> for E { fn from(e: rusqlite::Error) -> Self { E(e.to_string()) } }
impl From<std::io::Error> for E { fn from(e: std::io::Error) -> Self { E(e.to_string()) } }
impl IntoResponse for E { fn into_response(self) -> axum::response::Response { if self.0.contains("not found") { (StatusCode::NOT_FOUND, self.0).into_response() } else if self.0.contains("invalid") || self.0.contains("required") || self.0.contains("must be") { (StatusCode::BAD_REQUEST, self.0).into_response() } else { (StatusCode::INTERNAL_SERVER_ERROR, self.0).into_response() } } }
