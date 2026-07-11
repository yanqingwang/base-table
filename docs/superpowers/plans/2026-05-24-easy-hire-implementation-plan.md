# Easy Hire Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the "Easy Hire" recruitment system as a fork of DL Hire with jobs module, public job board, enhanced multi-interviewer evaluation, DocuSign/SuccessFactors integrations, and data export.

**Architecture:** Fork existing DL Hire (Rust+Axum backend, React+Vite+Ant Design frontend) into `/code/easy-hire/`, then incrementally add features in 4 waves. Each wave produces a running, testable system. Wave 1 = project foundation + jobs. Wave 2 = enhanced interviews. Wave 3 = external integrations. Wave 4 = final polish.

**Tech Stack:** Rust (axum 0.7, rusqlite, serde, jsonwebtoken, bcrypt), React 18 + Vite + TypeScript + Ant Design 5, Zustand, Axios, SQLite.

---

## File Structure Overview (all paths under `/home/wang/wk/code/easy-hire/`)

```
easy-hire/
├── backend/
│   ├── Cargo.toml                    # [MODIFY] rename package, add csv dep
│   ├── src/
│   │   ├── main.rs                   # [MODIFY] port 3201, rename
│   │   ├── lib.rs                    # [MODIFY] rename, add routes
│   │   ├── auth.rs                   # [MODIFY] rename env vars, add roles
│   │   ├── db.rs                     # [MODIFY] add jobs/applications/rounds etc.
│   │   ├── error.rs                  # [REUSE] unchanged
│   │   ├── jobs.rs                   # [NEW] jobs module handlers
│   │   ├── export.rs                 # [NEW] CSV export handlers
│   │   ├── docusign.rs               # [NEW] DocuSign integration
│   │   └── successfactors.rs         # [NEW] SuccessFactors integration
│   └── test_api.sh                   # [MODIFY] new endpoints
└── frontend/
    ├── package.json                  # [MODIFY] rename
    ├── vite.config.ts                # [MODIFY] proxy port 3201
    ├── src/
    │   ├── main.tsx                  # [MODIFY] rename title
    │   ├── App.tsx                   # [MODIFY] add routes
    │   ├── api/client.ts             # [MODIFY] new API methods
    │   ├── store/auth.ts             # [MODIFY] rename localStorage keys
    │   ├── components/Layout.tsx      # [MODIFY] rename brand, add menu items
    │   ├── pages/
    │   │   ├── Login.tsx             # [MODIFY] rename
    │   │   ├── Register.tsx          # [MODIFY] rename
    │   │   ├── Dashboard.tsx         # [MODIFY] enhanced stats
    │   │   ├── jobs/
    │   │   │   ├── JobBoard.tsx      # [NEW] public job listing
    │   │   │   ├── JobDetail.tsx     # [NEW] public job detail
    │   │   │   └── AdminJobList.tsx  # [NEW] admin job CRUD
    │   │   ├── apply/
    │   │   │   └── ApplyForm.tsx     # [NEW] structured application
    │   │   ├── interviews/
    │   │   │   ├── InterviewList.tsx # [MODIFY] add round support
    │   │   │   └── InterviewDetail.tsx # [NEW] round + evaluation view
    │   │   ├── evaluations/
    │   │   │   └── EvaluationForm.tsx # [NEW] interviewer feedback form
    │   │   ├── docusign/
    │   │   │   └── DocuSignPanel.tsx # [NEW] envelope management
    │   │   └── export/
    │   │       └── ExportPanel.tsx   # [NEW] data export UI
    └── ... (reuse existing pages)
```

---

## Candidate Status Flow (Easy Hire)

```
new → applied → screened → interviewing → offered → signed → hired → rejected
```

The new `applied` status is set when a candidate applies via the public job board. The `signed` status is set when offer documents are DocuSign-completed. Existing DL Hire statuses remain but the flow is extended.

---

## Wave 1: Foundation + Jobs Module + Public API + Job Board

### Task 1.1: Project Setup — Fork DL Hire into Easy Hire

**Files:**
- Copy: `/home/wang/wk/code/dl-hire/` → `/home/wang/wk/code/easy-hire/`
- Remove: `dl_hire.db`, `backend/target/`

- [ ] **Step 1: Copy the project**

```bash
cp -r /home/wang/wk/code/dl-hire /home/wang/wk/code/easy-hire
cd /home/wang/wk/code/easy-hire
rm -f backend/dl_hire.db
rm -rf backend/target
```

- [ ] **Step 2: Rename package in Cargo.toml**

Edit `backend/Cargo.toml`: change `name = "dl-hire"` to `name = "easy-hire"`.

Add the `csv` dependency:
```toml
csv = "1.3"
```

- [ ] **Step 3: Verify copy compiles**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: `Compiling easy-hire v0.1.0` and `Finished` without errors.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/
git commit -m "feat: fork dl-hire to easy-hire project scaffold"
```

### Task 1.2: Background — Rename DL Hire references to Easy Hire backend

**Files:**
- Modify: `backend/src/main.rs`
- Modify: `backend/src/lib.rs`
- Modify: `backend/src/auth.rs`

- [ ] **Step 1: Update main.rs**

```rust
#[tokio::main]
async fn main() {
    if let Err(e) = easy_hire::run().await {
        eprintln!("Error: {}", e);
        std::process::exit(1);
    }
}
```

- [ ] **Step 2: Update lib.rs — rename module, DB file, port**

Change the `path()` function:
```rust
pub fn path() -> PathBuf {
    std::env::var("EASY_HIRE_DB")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from("easy_hire.db"))
}
```

Change port in `run()`:
```rust
let addr = SocketAddr::from(([0, 0, 0, 0], 3201));
println!("Easy Hire API listening on {}", addr);
```

Make modules public:
```rust
pub mod auth;
pub mod db;
pub mod error;
```

Change CORS origin:
```rust
.allow_origin("http://localhost:5174".parse::<axum::http::HeaderValue>().unwrap())
```

- [ ] **Step 3: Update auth.rs — rename env var and add applicant role**

```rust
fn jwt_secret() -> String {
    std::env::var("EASY_HIRE_JWT_SECRET").unwrap_or_else(|_| "easy-hire-jwt-secret-2026".into())
}
```

Add `"applicant"` to valid roles in `register_handler`:
```rust
let valid_roles = ["admin", "recruiter", "manager", "agency", "trainer", "worker", "applicant"];
```

- [ ] **Step 4: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add code/easy-hire/backend/
git commit -m "refactor: rename dl-hire to easy-hire backend (port 3201, easy_hire.db)"
```

### Task 1.3: Backend — Add Jobs table and DB methods

**Files:**
- Modify: `backend/src/db.rs`

- [ ] **Step 1: Add Job struct and JobApplication struct in db.rs**

Insert after the `Employee` struct:

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Job {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub salary_min: Option<f64>,
    pub salary_max: Option<f64>,
    pub salary_currency: String,
    pub department: Option<String>,
    pub requirements: Option<String>,
    pub responsibilities: Option<String>,
    pub employment_type: String,
    pub status: String,
    pub posted_by: Option<String>,
    pub views: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobApplication {
    pub id: String,
    pub job_id: String,
    pub candidate_id: Option<String>,
    pub name: String,
    pub email: String,
    pub phone: Option<String>,
    pub resume_text: Option<String>,
    pub resume_file_url: Option<String>,
    pub cover_letter: Option<String>,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
}
```

- [ ] **Step 2: Add tables to init() SQL**

Add to the `execute_batch` call before the closing parenthesis:

```sql
CREATE TABLE IF NOT EXISTS jobs (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    location TEXT,
    salary_min REAL,
    salary_max REAL,
    salary_currency TEXT DEFAULT 'USD',
    department TEXT,
    requirements TEXT,
    responsibilities TEXT,
    employment_type TEXT DEFAULT 'full-time' CHECK(employment_type IN ('full-time','part-time','contract','temporary')),
    status TEXT DEFAULT 'draft' CHECK(status IN ('active','draft','closed','filled')),
    posted_by TEXT,
    views INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS job_applications (
    id TEXT PRIMARY KEY,
    job_id TEXT NOT NULL,
    candidate_id TEXT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    resume_text TEXT,
    resume_file_url TEXT,
    cover_letter TEXT,
    status TEXT DEFAULT 'applied' CHECK(status IN ('applied','screened','interviewing','offered','rejected','withdrawn')),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id),
    FOREIGN KEY (candidate_id) REFERENCES candidates(id)
);
```

Update the candidates status CHECK to include `applied` and `signed`:
```sql
status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','applied','screened','interviewing','offered','signed','hired','rejected')),
```

- [ ] **Step 3: Add Job DB methods to `impl D`**

Add the following methods following existing patterns:
- `list_jobs(&self, status, q) -> Vec<Job>` — parameterized query with optional filters
- `job_by_id(&self, id) -> Job` — single job lookup
- `create_job(&self, j) -> ()` — INSERT
- `update_job(&self, id, j) -> ()` — UPDATE with affected check
- `delete_job(&self, id) -> ()` — DELETE with affected check
- `increment_job_views(&self, id) -> ()` — UPDATE views += 1
- `list_applications(&self, job_id) -> Vec<JobApplication>` — filterable
- `application_by_id(&self, id) -> JobApplication` — single lookup
- `create_application(&self, a) -> ()` — INSERT
- `update_application_status(&self, id, status) -> ()` — status update

Each method should follow the exact same parameterized query pattern as existing `list_candidates`, `candidate_by_id`, etc.

- [ ] **Step 4: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add code/easy-hire/backend/src/db.rs code/easy-hire/backend/Cargo.toml
git commit -m "feat: add jobs and job_applications tables with CRUD methods"
```

### Task 1.4: Backend — Create jobs.rs module with handlers

**Files:**
- Create: `backend/src/jobs.rs`
- Modify: `backend/src/lib.rs`

- [ ] **Step 1: Create `backend/src/jobs.rs`**

This module contains:

**Public endpoints (no auth):**
- `public_list_jobs` — GET, returns only active jobs, supports `?q=` search
- `public_get_job` — GET, returns job detail, auto-increments view count
- `public_apply` — POST, accepts name/email/phone/resume/cover_letter, auto-creates candidate if new email, creates job_application

**Admin endpoints (auth required):**
- `list_jobs` — GET, returns all jobs (draft/active/closed/filled)
- `create_job` — POST, creates job with title/description/location/salary/etc.
- `get_job` — GET, returns any job by ID
- `update_job` — PUT, partial update on any field
- `delete_job` — DELETE, admin only
- `list_applications` — GET, returns applications for a job
- `update_application_status` — PUT, change application status

- [ ] **Step 2: Register routes in lib.rs**

Add pub mod declaration and route registrations:
```rust
pub mod jobs;

// In router():
.route("/api/v1/jobs/public", get(jobs::public_list_jobs))
.route("/api/v1/jobs/public/:id", get(jobs::public_get_job))
.route("/api/v1/jobs/apply", post(jobs::public_apply))
.route("/api/v1/jobs", get(jobs::list_jobs).post(jobs::create_job))
.route("/api/v1/jobs/:id", get(jobs::get_job).put(jobs::update_job).delete(jobs::delete_job))
.route("/api/v1/jobs/:id/applications", get(jobs::list_applications))
.route("/api/v1/jobs/applications/:id/status", put(jobs::update_application_status))
```

Make `S` struct public and also `path()`:
```rust
pub struct S {
    pub db: D,
}
```

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/backend/src/jobs.rs code/easy-hire/backend/src/lib.rs
git commit -m "feat: add jobs module with public API and admin CRUD handlers"
```

### Task 1.5: Frontend — Rename DL Hire to Easy Hire

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/src/main.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/api/client.ts` (interface only, not API methods)
- Modify: `frontend/src/store/auth.ts`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/pages/Login.tsx`

- [ ] **Step 1: Update package.json**

```json
"name": "easy-hire-frontend",
```

- [ ] **Step 2: Update vite.config.ts**

```ts
server: {
    port: 5174,
    strictPort: true,
    proxy: {
        '/api': {
            target: 'http://localhost:3201',
            changeOrigin: true,
        },
    },
},
```

- [ ] **Step 3: Update store/auth.ts**

Replace all `dl_hire_token` → `easy_hire_token` and `dl_hire_user` → `easy_hire_user`.

- [ ] **Step 4: Update Layout.tsx**

Replace `DL Hire` → `Easy Hire`

- [ ] **Step 5: Update Login.tsx**

Replace `DL Hire` → `Easy Hire`, `Blue Collar Onboarding Platform` → `Recruitment Management Platform`

- [ ] **Step 6: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npm install 2>&1 | tail -3
npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 7: Commit**

```bash
git add code/easy-hire/frontend/
git commit -m "refactor: rename dl-hire to easy-hire frontend (port 5174)"
```

### Task 1.6: Frontend — Add API client methods for jobs

**Files:**
- Modify: `frontend/src/api/client.ts`

- [ ] **Step 1: Add Job and JobApplication interfaces**

```typescript
export interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  department: string | null;
  requirements: string | null;
  responsibilities: string | null;
  employment_type: string;
  status: string;
  posted_by: string | null;
  views: number;
  created_at: string;
  updated_at: string;
}

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: string | null;
  name: string;
  email: string;
  phone: string | null;
  resume_text: string | null;
  resume_file_url: string | null;
  cover_letter: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}
```

- [ ] **Step 2: Add jobs section to the API object**

```typescript
jobs: {
  publicList: (params?: { q?: string }) =>
    client.get<Job[]>('/jobs/public', { params }).then((r) => r.data),
  publicGet: (id: string) =>
    client.get<Job>(`/jobs/public/${id}`).then((r) => r.data),
  apply: (data: { job_id: string; name: string; email: string; phone?: string; resume_text?: string; cover_letter?: string }) =>
    client.post<JobApplication>('/jobs/apply', data).then((r) => r.data),
  list: (params?: { status?: string; q?: string }) =>
    client.get<Job[]>('/jobs', { params }).then((r) => r.data),
  get: (id: string) =>
    client.get<Job>(`/jobs/${id}`).then((r) => r.data),
  create: (data: Partial<Job>) =>
    client.post<Job>('/jobs', data).then((r) => r.data),
  update: (id: string, data: Partial<Job>) =>
    client.put<Job>(`/jobs/${id}`, data).then((r) => r.data),
  delete: (id: string) =>
    client.delete(`/jobs/${id}`),
  applications: (id: string) =>
    client.get<JobApplication[]>(`/jobs/${id}/applications`).then((r) => r.data),
  updateApplicationStatus: (id: string, status: string) =>
    client.put<JobApplication>(`/jobs/applications/${id}/status`, { status }).then((r) => r.data),
},
```

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/frontend/src/api/client.ts
git commit -m "feat: add jobs API client methods"
```

### Task 1.7: Frontend — Create Job Board and Apply Page (public)

**Files:**
- Create: `frontend/src/pages/jobs/JobBoard.tsx`
- Create: `frontend/src/pages/jobs/JobDetail.tsx`
- Create: `frontend/src/pages/apply/ApplyForm.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `JobBoard.tsx`**

Public-facing page listing all active jobs in a card grid layout with:
- Title "Easy Hire" and subtitle "Find your next opportunity"
- Search input filtering by job title
- Cards showing title, department tag, employment type tag, location, salary range
- Click navigates to `/jobs/:id`

- [ ] **Step 2: Create `JobDetail.tsx`**

Public job detail page with:
- Back button to `/jobs`
- Job title, tags (type, department, status)
- "Apply Now" button linking to `/apply/:jobId`
- Description, Responsibilities, Requirements sections
- Salary and location in Descriptions component

- [ ] **Step 3: Create `ApplyForm.tsx`**

Public application form with fields:
- Full Name (required)
- Email (required, validated)
- Phone (optional)
- Resume/Experience (textarea)
- Cover Letter (textarea)
- Submit button

On submit: calls `api.jobs.apply()`, creates candidate + application, shows success message.

- [ ] **Step 4: Register routes in App.tsx**

Add routes OUTSIDE the ProtectedRoute Layout (these are public):
```tsx
<Route path="/jobs" element={<JobBoard />} />
<Route path="/jobs/:id" element={<JobDetail />} />
<Route path="/apply/:jobId" element={<ApplyForm />} />
```

- [ ] **Step 5: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors. (If `noUnusedLocals` triggers, prefix unused params with `_`)

- [ ] **Step 6: Commit**

```bash
git add code/easy-hire/frontend/src/pages/jobs/ code/easy-hire/frontend/src/pages/apply/ code/easy-hire/frontend/src/App.tsx
git commit -m "feat: add public job board, job detail, and apply form pages"
```

### Task 1.8: Frontend — Create Admin Job Management page

**Files:**
- Create: `frontend/src/pages/jobs/AdminJobList.tsx`
- Modify: `frontend/src/components/Layout.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `AdminJobList.tsx`**

Full CRUD table with:
- Jobs list table (title, department, location, type, status, views, created date)
- "Create Job" button opening modal with form (title, description, location, salary_min/max/currency, department, requirements, responsibilities, employment_type, status)
- Edit button per row opening same modal pre-filled
- "Applications" button per row showing application list in info modal
- Status tags with color coding (green=active, orange=draft, red=closed/filled)

- [ ] **Step 2: Add to sidebar menu in Layout.tsx**

```typescript
{ key: '/admin/jobs', icon: <FileTextOutlined />, label: 'Jobs' },
```

- [ ] **Step 3: Add route in App.tsx**

```tsx
<Route path="/admin/jobs" element={<AdminJobList />} />
```

- [ ] **Step 4: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add code/easy-hire/frontend/src/pages/jobs/AdminJobList.tsx code/easy-hire/frontend/src/components/ code/easy-hire/frontend/src/App.tsx
git commit -m "feat: add admin job management page with CRUD"
```

### Wave 1 Verification

- [ ] **Step 1: Start backend**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo run &
sleep 4
curl -s http://localhost:3201/api/v1/health
```

Expected: `OK`

- [ ] **Step 2: Test public job API**

```bash
# Register admin
TOKEN=$(curl -s -X POST http://localhost:3201/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Admin","email":"admin@test.com","password":"password123","role":"admin"}' | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

# Create a job
curl -s -X POST http://localhost:3201/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Factory Worker","description":"Assembly line position","location":"Manila","employment_type":"full-time","status":"active"}'

# Public list
curl -s http://localhost:3201/api/v1/jobs/public | python3 -m json.tool
```

Expected: Job visible in public listing.

- [ ] **Step 3: Start frontend**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npm run dev &
```

Expected: Vite dev server on port 5174.

---

## Wave 2: Enhanced Interviews + Multi-Interviewer Evaluation

### Task 2.1: Backend — Add interview_rounds, interview_assignments, interview_evaluations tables

**Files:**
- Modify: `backend/src/db.rs`

- [ ] **Step 1: Add new structs to db.rs**

```rust
#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InterviewRound {
    pub id: String,
    pub interview_id: String,
    pub round_number: i64,
    pub round_type: String,
    pub scheduled_at: Option<String>,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InterviewAssignment {
    pub id: String,
    pub interview_id: String,
    pub round_id: Option<String>,
    pub interviewer_id: String,
    pub status: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InterviewEvaluation {
    pub id: String,
    pub interview_id: String,
    pub round_id: Option<String>,
    pub interviewer_id: String,
    pub skill_scores: String,
    pub overall_score: Option<f64>,
    pub comments: Option<String>,
    pub recommendation: String,
    pub submitted_at: Option<String>,
    pub created_at: String,
}
```

- [ ] **Step 2: Add tables to init()**

```sql
CREATE TABLE IF NOT EXISTS interview_rounds (
    id TEXT PRIMARY KEY,
    interview_id TEXT NOT NULL,
    round_number INTEGER NOT NULL,
    round_type TEXT DEFAULT 'technical' CHECK(round_type IN ('technical','hr','behavioral','manager','final')),
    scheduled_at TEXT,
    status TEXT DEFAULT 'pending' CHECK(status IN ('pending','scheduled','completed','cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (interview_id) REFERENCES interviews(id)
);

CREATE TABLE IF NOT EXISTS interview_assignments (
    id TEXT PRIMARY KEY,
    interview_id TEXT NOT NULL,
    round_id TEXT,
    interviewer_id TEXT NOT NULL,
    status TEXT DEFAULT 'assigned' CHECK(status IN ('assigned','confirmed','completed','cancelled')),
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (interview_id) REFERENCES interviews(id),
    FOREIGN KEY (round_id) REFERENCES interview_rounds(id),
    FOREIGN KEY (interviewer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS interview_evaluations (
    id TEXT PRIMARY KEY,
    interview_id TEXT NOT NULL,
    round_id TEXT,
    interviewer_id TEXT NOT NULL,
    skill_scores TEXT DEFAULT '{}',
    overall_score REAL,
    comments TEXT,
    recommendation TEXT DEFAULT 'pending' CHECK(recommendation IN ('strong_hire','hire','maybe','no','pending')),
    submitted_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (interview_id) REFERENCES interviews(id),
    FOREIGN KEY (round_id) REFERENCES interview_rounds(id),
    FOREIGN KEY (interviewer_id) REFERENCES users(id)
);
```

- [ ] **Step 3: Add DB methods**

For each new table, add the standard CRUD pattern:
- `create_round`, `list_rounds(interview_id)` — for interview_rounds
- `create_assignment`, `list_assignments(interview_id)` — for interview_assignments
- `create_evaluation`, `list_evaluations(interview_id)` — for interview_evaluations
- `evaluation_aggregate(interview_id)` — computes avg score, recommendation counts

The aggregate method:
```rust
pub fn evaluation_aggregate(&self, interview_id: &str) -> Result<Value, E> {
    let evals = self.list_evaluations(interview_id)?;
    if evals.is_empty() {
        return Ok(serde_json::json!({
            "interview_id": interview_id,
            "total_evaluations": 0,
            "average_score": null,
            "recommendations": {},
            "evaluations": [],
        }));
    }
    let scores: Vec<f64> = evals.iter().filter_map(|e| e.overall_score).collect();
    let avg = if scores.is_empty() { None } else { Some(scores.iter().sum::<f64>() / scores.len() as f64) };
    let mut recs = std::collections::HashMap::new();
    for e in &evals {
        *recs.entry(e.recommendation.clone()).or_insert(0) += 1;
    }
    Ok(serde_json::json!({
        "interview_id": interview_id,
        "total_evaluations": evals.len(),
        "average_score": avg,
        "recommendations": recs,
        "evaluations": evals,
    }))
}
```

- [ ] **Step 4: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add code/easy-hire/backend/src/db.rs
git commit -m "feat: add interview_rounds, assignments, evaluations tables"
```

### Task 2.2: Backend — Add interview round/assignment/evaluation route handlers

**Files:**
- Modify: `backend/src/lib.rs`

- [ ] **Step 1: Add input structs and handlers in lib.rs**

Input structs:
- `RoundInput` — interview_id, round_number, round_type, scheduled_at
- `AssignInput` — interview_id, round_id, interviewer_id
- `EvalInput` — interview_id, round_id, skill_scores, overall_score, comments, recommendation

Handlers:
- `create_round` — POST, creates round for interview
- `assign_interviewer` — POST, assigns interviewer (stored in /interviews/assign to avoid :id conflict)
- `list_rounds` — GET /interviews/:id/rounds
- `list_assignments` — GET /interviews/:id/assignments
- `submit_evaluation` — POST /evaluations
- `list_evaluations` — GET /interviews/:id/evaluations
- `aggregate_evaluations` — GET /interviews/:id/aggregate

- [ ] **Step 2: Register routes**

Place `assign` route BEFORE `:id` routes:
```rust
.route("/api/v1/interviews/assign", post(assign_interviewer))
.route("/api/v1/interviews/:id/rounds", get(list_rounds).post(create_round))
.route("/api/v1/interviews/:id/assignments", get(list_assignments))
.route("/api/v1/interviews/:id/evaluations", get(list_evaluations))
.route("/api/v1/interviews/:id/aggregate", get(aggregate_evaluations))
.route("/api/v1/evaluations", post(submit_evaluation))
```

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/backend/src/lib.rs
git commit -m "feat: add interview round/assignment/evaluation routes"
```

### Task 2.3: Frontend — Enhanced Interview Detail page

**Files:**
- Modify: `frontend/src/api/client.ts`
- Create: `frontend/src/pages/interviews/InterviewDetail.tsx`
- Modify: `frontend/src/pages/interviews/InterviewList.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add new interfaces and API methods to client.ts**

```typescript
export interface InterviewRound { /* id, interview_id, round_number, round_type, scheduled_at, status, created_at */ }
export interface InterviewAssignment { /* id, interview_id, round_id, interviewer_id, status, created_at */ }
export interface InterviewEvaluation { /* id, interview_id, round_id, interviewer_id, skill_scores, overall_score, comments, recommendation, submitted_at, created_at */ }
export interface EvalAggregate { /* interview_id, total_evaluations, average_score, recommendations, evaluations */ }
```

API methods:
```typescript
rounds: {
  list: (interviewId: string) => client.get<InterviewRound[]>(`/interviews/${interviewId}/rounds`).then(r => r.data),
  create: (data) => client.post<InterviewRound>(`/interviews/${data.interview_id}/rounds`, data).then(r => r.data),
},
assignments: {
  list: (interviewId) => client.get<InterviewAssignment[]>(`/interviews/${interviewId}/assignments`).then(r => r.data),
  create: (data) => client.post<InterviewAssignment>('/interviews/assign', data).then(r => r.data),
},
evaluations: {
  list: (interviewId) => client.get<InterviewEvaluation[]>(`/interviews/${interviewId}/evaluations`).then(r => r.data),
  submit: (data) => client.post<InterviewEvaluation>('/evaluations', data).then(r => r.data),
  aggregate: (interviewId) => client.get<EvalAggregate>(`/interviews/${interviewId}/aggregate`).then(r => r.data),
},
```

- [ ] **Step 2: Update InterviewList.tsx**

Add "Details" button to each row that navigates to `/interviews/:id`.

- [ ] **Step 3: Create `InterviewDetail.tsx`**

Page showing:
- Interview ID at top
- Aggregate stats cards (total evaluations, average score, recommendation breakdown)
- Interview Rounds table (round number, type tag, scheduled date, status)
- Interviewer Assignments table (interviewer ID, round ID, status)
- Evaluations table (interviewer, score, recommendation, comments, submitted date)
- "Submit Evaluation" button linking to `/evaluations/:interviewId`

- [ ] **Step 4: Add route in App.tsx**

```tsx
<Route path="/interviews/:id" element={<InterviewDetail />} />
```

- [ ] **Step 5: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add code/easy-hire/frontend/src/
git commit -m "feat: add interview detail page with rounds and evaluation aggregation"
```

### Task 2.4: Frontend — Create Interviewer Evaluation Form

**Files:**
- Create: `frontend/src/pages/evaluations/EvaluationForm.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Create `EvaluationForm.tsx`**

Simple form with:
- Overall Score slider (0-100)
- Skill Scores JSON textarea (optional)
- Recommendation dropdown (Strong Hire / Hire / Maybe / No)
- Comments textarea
- Submit button → calls `api.interviews.evaluations.submit()`

- [ ] **Step 2: Add route**

```tsx
<Route path="/evaluations/:interviewId" element={<EvaluationForm />} />
```

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/frontend/src/pages/evaluations/ code/easy-hire/frontend/src/App.tsx
git commit -m "feat: add interviewer evaluation form page"
```

### Wave 2 Verification

- [ ] **Step 1: Test interview round creation**

```bash
curl -s -X POST http://localhost:3201/api/v1/interviews/<id>/rounds \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"interview_id":"<id>","round_number":1,"round_type":"technical"}'
```

Expected: Round created.

- [ ] **Step 2: Test evaluation submission**

```bash
curl -s -X POST http://localhost:3201/api/v1/evaluations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"interview_id":"<id>","overall_score":85,"recommendation":"hire"}'
```

Expected: Evaluation created.

- [ ] **Step 3: Test aggregate endpoint**

```bash
curl -s http://localhost:3201/api/v1/interviews/<id>/aggregate | python3 -m json.tool
```

Expected: JSON with average_score and recommendations breakdown.

---

## Wave 3: DocuSign + SuccessFactors + Data Export

### Task 3.1: Backend — Add DocuSign/SF columns to employees and documents

**Files:**
- Modify: `backend/src/db.rs`

- [ ] **Step 1: Add new fields to Employee struct**

```rust
pub sf_sync_status: Option<String>,     // pending/synced/failed
pub sf_synced_at: Option<String>,
pub docusign_envelope_id: Option<String>,
pub docusign_status: Option<String>,     // pending/sent/delivered/signed/completed/declined/voided
```

- [ ] **Step 2: Add new fields to Document struct**

```rust
pub docusign_envelope_id: Option<String>,
pub docusign_status: Option<String>,
pub docusign_webhook_data: String,
```

- [ ] **Step 3: Add migration SQL to init()**

After the main `execute_batch`, add ALTER TABLE statements. Since SQLite doesn't support IF NOT EXISTS for ALTER TABLE, catch the error if column exists:

```rust
for (table, column, def) in &[
    ("employees", "sf_sync_status", "TEXT DEFAULT 'pending'"),
    ("employees", "sf_synced_at", "TEXT"),
    ("employees", "docusign_envelope_id", "TEXT"),
    ("employees", "docusign_status", "TEXT DEFAULT 'pending'"),
    ("documents", "docusign_envelope_id", "TEXT"),
    ("documents", "docusign_status", "TEXT DEFAULT 'pending'"),
    ("documents", "docusign_webhook_data", "TEXT DEFAULT '{}'"),
] {
    let _ = c.execute(
        &format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, def),
        [],
    );
}
```

- [ ] **Step 4: Update all Employee/Document query methods to include new columns**

Update SELECT, INSERT, and UPDATE statements for both structs.

- [ ] **Step 5: Add new DB methods**

```rust
pub fn update_docusign_status(&self, envelope_id: &str, status: &str, webhook_data: Option<&str>) -> Result<(), E>
pub fn update_sf_sync_status(&self, employee_id: &str, status: &str) -> Result<(), E>
pub fn pending_sf_sync(&self) -> Result<Vec<Employee>, E>
```

- [ ] **Step 6: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 7: Commit**

```bash
git add code/easy-hire/backend/src/db.rs
git commit -m "feat: add docusign and sf_sync fields to employees and documents"
```

### Task 3.2: Backend — Create docusign.rs module

**Files:**
- Create: `backend/src/docusign.rs`
- Modify: `backend/src/lib.rs`

- [ ] **Step 1: Create `backend/src/docusign.rs`**

Handlers:
- `create_envelope` — POST, creates envelope for a document, stores envelope_id, marks document/employee as "sent"
- `batch_send_envelopes` — POST, takes array of document_ids, creates envelopes for each
- `envelope_status` — GET, returns current envelope status for a document
- `docusign_webhook` — POST, DocuSign Connect webhook receiver, updates document/employee status

All handlers use UUID envelope IDs as placeholders. Real DocuSign API integration requires credentials — the stubs return correct response shapes.

- [ ] **Step 2: Register routes in lib.rs**

```rust
mod docusign;

.route("/api/v1/docusign/envelope", post(docusign::create_envelope))
.route("/api/v1/docusign/batch", post(docusign::batch_send_envelopes))
.route("/api/v1/docusign/status/:id", get(docusign::envelope_status))
.route("/api/v1/webhooks/docusign", post(docusign::docusign_webhook))
```

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/backend/src/docusign.rs code/easy-hire/backend/src/lib.rs
git commit -m "feat: add DocuSign integration module with envelope creation and webhook"
```

### Task 3.3: Backend — Create successfactors.rs module

**Files:**
- Create: `backend/src/successfactors.rs`
- Modify: `backend/src/lib.rs`

- [ ] **Step 1: Create `backend/src/successfactors.rs`**

Config from environment variables:
- `SF_BASE_URL` — SuccessFactors API base URL
- `SF_API_KEY` — API key/credentials
- `SF_COMPANY_ID` — Company identifier

Handlers:
- `sync_employee(id)` — POST, maps employee+candidate data to SF format, calls OData API
- `sync_all_pending()` — POST, syncs all employees with pending/null sf_sync_status

Employee field mapping for SF:
```json
{
  "employeeId": "...",
  "firstName": "...",
  "lastName": "...",
  "department": "...",
  "position": "...",
  "hireDate": "...",
  "employmentType": "full-time",
  "companyId": "...",
  "status": "active",
  "email": "...",
  "phone": "..."
}
```

If API key is not configured, operate in mock mode — mark as synced without API call.

- [ ] **Step 2: Register routes in lib.rs**

```rust
mod successfactors;

.route("/api/v1/sf/sync/:id", post(successfactors::sync_employee))
.route("/api/v1/sf/sync-all", post(successfactors::sync_all_pending))
```

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/backend/src/successfactors.rs code/easy-hire/backend/src/lib.rs
git commit -m "feat: add SuccessFactors integration module with sync endpoints"
```

### Task 3.4: Backend — Create export.rs module

**Files:**
- Create: `backend/src/export.rs`
- Modify: `backend/src/lib.rs`

- [ ] **Step 1: Create `backend/src/export.rs`**

Helper function `make_csv(headers, rows) -> String` that produces CSV with proper quoting.

Export handlers (all CSV format, all require auth):
- `export_candidates` — GET, returns CSV with id/name/phone/email/status/source/country/skills/created
- `export_employees` — GET, returns CSV with id/code/candidate_id/dept/position/hired_at/status/training/ehs/sf_sync
- `export_interviews` — GET, returns CSV with id/candidate_id/job_title/scheduled/status/result/score

Each returns `Content-Type: text/csv` with `Content-Disposition: attachment`.

- [ ] **Step 2: Register routes**

```rust
mod export;

.route("/api/v1/export/candidates", get(export::export_candidates))
.route("/api/v1/export/employees", get(export::export_employees))
.route("/api/v1/export/interviews", get(export::export_interviews))
```

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/backend/src/export.rs code/easy-hire/backend/src/lib.rs
git commit -m "feat: add CSV export module for candidates, employees, interviews"
```

### Task 3.5: Frontend — DocuSign Management UI

**Files:**
- Modify: `frontend/src/api/client.ts`
- Create: `frontend/src/pages/docusign/DocuSignPanel.tsx`
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/components/Layout.tsx`

- [ ] **Step 1: Add DocuSign API methods**

```typescript
docusign: {
  createEnvelope: (data: { document_id: string; signer_email: string; signer_name: string }) =>
    client.post('/docusign/envelope', data).then(r => r.data),
  batchSend: (data: { document_ids: string[] }) =>
    client.post('/docusign/batch', data).then(r => r.data),
  status: (id: string) =>
    client.get(`/docusign/status/${id}`).then(r => r.data),
},

sf: {
  sync: (employeeId: string) =>
    client.post(`/sf/sync/${employeeId}`).then(r => r.data),
  syncAll: () =>
    client.post('/sf/sync-all').then(r => r.data),
},
```

- [ ] **Step 2: Create `DocuSignPanel.tsx`**

Simple panel with:
- Inline form: Document ID, Signer Email, Signer Name → "Send" button
- Result message after sending

- [ ] **Step 3: Add route and sidebar items**

```tsx
<Route path="/admin/docusign" element={<DocuSignPanel />} />
```

In Layout.tsx sidebar:
```tsx
{ key: '/admin/docusign', icon: <FileProtectOutlined />, label: 'DocuSign' },
```

- [ ] **Step 4: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 5: Commit**

```bash
git add code/easy-hire/frontend/src/
git commit -m "feat: add DocuSign management UI panel"
```

### Task 3.6: Frontend — Data Export UI + Employee Sync Status

**Files:**
- Modify: `frontend/src/api/client.ts`
- Create: `frontend/src/pages/export/ExportPanel.tsx`
- Modify: `frontend/src/pages/employees/EmployeeList.tsx`
- Modify: `frontend/src/App.tsx`

- [ ] **Step 1: Add export API methods that trigger file download**

```typescript
exportData: {
  candidates: () => client.get('/export/candidates', { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'candidates.csv'; a.click();
  }),
  employees: () => client.get('/export/employees', { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'employees.csv'; a.click();
  }),
  interviews: () => client.get('/export/interviews', { responseType: 'blob' }).then(r => {
    const url = window.URL.createObjectURL(new Blob([r.data]));
    const a = document.createElement('a'); a.href = url; a.download = 'interviews.csv'; a.click();
  }),
},
```

- [ ] **Step 2: Create `ExportPanel.tsx`**

Card grid with three export buttons (Candidates, Employees, Interviews). Each triggers CSV download. Also includes a "Sync All Pending to SuccessFactors" button.

- [ ] **Step 3: Update EmployeeList.tsx**

Add `sf_sync_status` column with color-coded tags (green=synced, red=failed, orange=pending).

- [ ] **Step 4: Add route**

```tsx
<Route path="/admin/export" element={<ExportPanel />} />
```

Add sidebar item in Layout.tsx:
```tsx
{ key: '/admin/export', icon: <DownloadOutlined />, label: 'Export' },
```

- [ ] **Step 5: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 6: Commit**

```bash
git add code/easy-hire/frontend/src/
git commit -m "feat: add data export UI and SuccessFactors sync button"
```

### Wave 3 Verification

- [ ] **Step 1: Test export endpoint**

```bash
curl -s -o /tmp/candidates.csv http://localhost:3201/api/v1/export/candidates \
  -H "Authorization: Bearer $TOKEN"
head -3 /tmp/candidates.csv
```

Expected: CSV with header row + data.

- [ ] **Step 2: Test docusign envelope creation**

```bash
curl -s -X POST http://localhost:3201/api/v1/docusign/envelope \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"document_id":"test-doc","signer_email":"test@test.com","signer_name":"Test"}'
```

Expected: Response with envelope_id.

- [ ] **Step 3: Test SF sync**

```bash
curl -s -X POST http://localhost:3201/api/v1/sf/sync-all \
  -H "Authorization: Bearer $TOKEN"
```

Expected: Response with total_pending and synced count.

---

## Wave 4: Dashboard Enhancement + Integration Tests + QA

### Task 4.1: Backend — Enhanced dashboard stats

**Files:**
- Modify: `backend/src/db.rs`
- Modify: `backend/src/lib.rs`

- [ ] **Step 1: Add `enhanced_stats()` method to db.rs**

Extends the existing `stats()` method to include:
- Jobs stats: active jobs count, total jobs, total views
- Applications stats: total applications, breakdown by status
- Interview stats: total interviews, completed count
- Employee stats: total employees, active count
- Funnel: hired, rejected, conversion rate, average time-to-hire in days
  - Time-to-hire query: `AVG(julianday(e.hired_at) - julianday(c.created_at)) FROM employees e JOIN candidates c`

- [ ] **Step 2: Update stats handler in lib.rs**

Replace `s.db.stats()` with `s.db.enhanced_stats()`.

- [ ] **Step 3: Keep old `stats()` method for backward compatibility** — the frontend stats endpoint now returns richer data.

- [ ] **Step 4: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo build 2>&1 | tail -5
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add code/easy-hire/backend/src/db.rs code/easy-hire/backend/src/lib.rs
git commit -m "feat: enhanced dashboard stats with jobs, applications, time-to-hire"
```

### Task 4.2: Frontend — Enhanced Dashboard with Charts

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/api/client.ts`

- [ ] **Step 1: Update StatsResponse interface**

```typescript
export interface StatsResponse {
  total_candidates: number;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  jobs: { active: number; total: number; total_views: number };
  applications: { total: number; by_status: Record<string, number> };
  interviews: { total: number; completed: number };
  employees: { total: number; active: number };
  funnel: { hired: number; rejected: number; conversion_rate: string; avg_time_to_hire_days: number | null };
}
```

- [ ] **Step 2: Rewrite Dashboard.tsx with 4 stat rows**

Row 1 — Candidates: Total, New, Hired, Rejected (Statistic cards)
Row 2 — Jobs & Applications: Active Jobs, Total Views, Applications, Conversion Rate
Row 3 — Operations: Interviews Total, Completed, Active Employees, Avg Time-to-Hire
Row 4 — Candidate Status Table (same as before)

Keep existing StatusTag import for status column.

- [ ] **Step 3: Verify build**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npx tsc --noEmit 2>&1 | tail -10
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add code/easy-hire/frontend/src/
git commit -m "feat: enhanced dashboard with jobs, interviews, and time-to-hire stats"
```

### Task 4.3: Full integration test

- [ ] **Step 1: Create comprehensive test script**

```bash
cat > /home/wang/wk/code/easy-hire/backend/test_api.sh << 'TESTEOF'
#!/bin/bash
# Easy Hire API Test Script
BASE="http://localhost:3201"
PASS=0
FAIL=0

assert() {
    local desc="$1" expected="$2" actual="$3"
    if echo "$actual" | grep -q "$expected"; then
        echo "  PASS: $desc"
        ((PASS++))
    else
        echo "  FAIL: $desc (expected: $expected)"
        ((FAIL++))
    fi
}

echo "=== Easy Hire API Integration Tests ==="

# 1. Health
R=$(curl -s $BASE/api/v1/health)
assert "Health check" "OK" "$R"

# 2. Register
R=$(curl -s -X POST $BASE/api/v1/auth/register -H 'Content-Type: application/json' \
  -d '{"name":"Admin","email":"admin@test.com","password":"password123","role":"admin"}')
TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
assert "Register returns token" "eyJ" "$TOKEN"

# 3. Login
R=$(curl -s -X POST $BASE/api/v1/auth/login -H 'Content-Type: application/json' \
  -d '{"email":"admin@test.com","password":"password123"}')
assert "Login works" "token" "$R"

# 4. Create Job
R=$(curl -s -X POST $BASE/api/v1/jobs -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Test Engineer","description":"Test role","location":"Remote","employment_type":"full-time","status":"active"}')
JOB_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
assert "Job created with ID" "$JOB_ID" "$R"

# 5. List Jobs (public)
R=$(curl -s $BASE/api/v1/jobs/public)
assert "Public job listing" "Test Engineer" "$R"

# 6. Apply to job
R=$(curl -s -X POST $BASE/api/v1/jobs/apply -H 'Content-Type: application/json' \
  -d "{\"job_id\":\"$JOB_ID\",\"name\":\"Applicant\",\"email\":\"app@test.com\",\"phone\":\"123456\"}")
assert "Application submitted" "applied" "$R"

# 7. Dashboard stats
R=$(curl -s $BASE/api/v1/stats)
assert "Stats include jobs" "active" "$R"

# 8. Export candidates
R=$(curl -s -o /dev/null -w "%{http_code}" $BASE/api/v1/export/candidates \
  -H "Authorization: Bearer $TOKEN")
assert "Export returns 200" "200" "$R"

# Summary
echo "=================="
echo "Results: $PASS passed, $FAIL failed"
echo "=================="
TESTEOF
chmod +x /home/wang/wk/code/easy-hire/backend/test_api.sh
```

- [ ] **Step 2: Run integration tests**

```bash
cd /home/wang/wk/code/easy-hire/backend && cargo run &
sleep 4
bash test_api.sh
```

Expected: All tests pass.

- [ ] **Step 3: Verify clean build of frontend**

```bash
cd /home/wang/wk/code/easy-hire/frontend && npm run build 2>&1 | tail -10
```

Expected: Build succeeds without errors.

- [ ] **Step 4: Final commit**

```bash
git add code/easy-hire/
git commit -m "feat: complete Easy Hire implementation with all 4 waves"
```

---

## Verification Checklist (Final)

- [ ] Backend compiles (`cargo build`)
- [ ] Backend starts on port 3201
- [ ] Health endpoint returns OK
- [ ] Registration + login + JWT auth works
- [ ] Public job board API returns active jobs
- [ ] Job application creates candidate + application
- [ ] Interview rounds + assignments + evaluations endpoints work
- [ ] Evaluation aggregation computes average score
- [ ] CSV export returns downloadable files
- [ ] DocuSign envelope creation stores envelope_id
- [ ] SuccessFactors sync marks employees as synced
- [ ] Dashboard shows enhanced stats (jobs, applications, time-to-hire)
- [ ] Frontend compiles (`npm run build`)
- [ ] Frontend starts on port 5174 with proxy to 3201
- [ ] Public job board page loads and shows jobs
- [ ] Apply form submits successfully
- [ ] Interview detail page shows rounds, assignments, evaluations
- [ ] Evaluation form submits feedback
- [ ] All existing DL Hire features still work (candidates, interviews, approvals, training)
