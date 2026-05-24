use std::collections::HashMap;
use std::path::PathBuf;
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use serde_json::Value;

use crate::error::E;

#[derive(Debug, Clone)]
pub struct D {
    pub p: PathBuf,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct User {
    pub id: String,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub password_hash: String,
    pub role: String,
    pub name: String,
    pub company_id: Option<String>,
    pub language_pref: String,
    pub active: i64,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Candidate {
    pub id: String,
    pub user_id: Option<String>,
    pub agency_id: Option<String>,
    pub name: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub id_number: Option<String>,
    pub country_code: String,
    pub date_of_birth: Option<String>,
    pub gender: Option<String>,
    pub nationality: Option<String>,
    pub address: Option<String>,
    pub city: Option<String>,
    pub province: Option<String>,
    pub postal_code: Option<String>,
    pub education_level: Option<String>,
    pub education_school: Option<String>,
    pub education_major: Option<String>,
    pub education_year: Option<String>,
    pub work_experience_years: Option<i64>,
    pub previous_employer: Option<String>,
    pub previous_position: Option<String>,
    pub previous_duration: Option<String>,
    pub previous_duties: Option<String>,
    pub languages: Option<String>,
    pub certifications: Option<String>,
    pub emergency_contact_name: Option<String>,
    pub emergency_contact_phone: Option<String>,
    pub emergency_contact_relation: Option<String>,
    pub skills: String,
    pub resume_text: Option<String>,
    pub resume_file_url: Option<String>,
    pub profile_photo_url: Option<String>,
    pub status: String,
    pub source: String,
    pub notes: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Interview {
    pub id: String,
    pub candidate_id: String,
    pub job_title: Option<String>,
    pub job_id: Option<String>,
    pub scheduled_at: Option<String>,
    pub check_in_at: Option<String>,
    pub interviewer_id: Option<String>,
    pub skill_scores: String,
    pub overall_score: Option<f64>,
    pub comments: Option<String>,
    pub status: String,
    pub result: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Document {
    pub id: String,
    pub entity_type: String,
    pub entity_id: String,
    pub doc_type: String,
    pub file_url: Option<String>,
    pub signed_at: Option<String>,
    pub signature_method: Option<String>,
    pub ocr_data: String,
    pub status: String,
    pub created_at: String,
    pub docusign_envelope_id: Option<String>,
    pub docusign_status: Option<String>,
    pub docusign_webhook_data: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub id: String,
    pub candidate_id: Option<String>,
    pub employee_code: Option<String>,
    pub company_id: Option<String>,
    pub department: Option<String>,
    pub position: Option<String>,
    pub hired_at: Option<String>,
    pub contract_start: Option<String>,
    pub contract_end: Option<String>,
    pub training_completed: i64,
    pub ehs_certified: i64,
    pub status: String,
    pub created_at: String,
    pub updated_at: String,
    pub sf_sync_status: Option<String>,
    pub sf_synced_at: Option<String>,
    pub docusign_envelope_id: Option<String>,
    pub docusign_status: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Job {
    pub id: String,
    pub title: String,
    pub description: Option<String>,
    pub location: Option<String>,
    pub country_code: String,
    pub city: Option<String>,
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
    pub department_id: Option<String>,
    pub location_id: Option<String>,
    pub category_id: Option<String>,
    pub currency_id: Option<String>,
    pub headcount: i64,
    pub hiring_manager_id: Option<String>,
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Approval {
    pub id: String,
    pub candidate_id: String,
    pub request_type: String,
    pub requested_by: String,
    pub assigned_to: String,
    pub status: String,
    pub comments: Option<String>,
    pub escalated_at: Option<String>,
    pub decided_at: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct AuditEntry {
    pub id: String,
    pub user_id: Option<String>,
    pub action: String,
    pub entity_type: Option<String>,
    pub entity_id: Option<String>,
    pub details: String,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrainingCourse {
    pub id: String,
    pub title: String,
    pub course_type: String,
    pub country: String,
    pub content_type: String,
    pub content_url: Option<String>,
    pub mandatory: i64,
    pub duration_minutes: Option<i64>,
    pub order_index: Option<i64>,
    pub pass_score: Option<i64>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct TrainingRecord {
    pub id: String,
    pub employee_id: String,
    pub course_id: String,
    pub started_at: Option<String>,
    pub completed_at: Option<String>,
    pub score: Option<i64>,
    pub passed: i64,
    pub certificate_url: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateEducation {
    pub id: String,
    pub candidate_id: String,
    pub level: String,
    pub school: Option<String>,
    pub major: Option<String>,
    pub graduation_year: Option<i64>,
    pub notes: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateWorkExperience {
    pub id: String,
    pub candidate_id: String,
    pub employer: String,
    pub position: Option<String>,
    pub start_date: Option<String>,
    pub end_date: Option<String>,
    pub duration: Option<String>,
    pub duties: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct InterviewQueue {
    pub id: String,
    pub candidate_id: String,
    pub job_id: Option<String>,
    pub queue_number: i64,
    pub status: String,
    pub called_at: Option<String>,
    pub completed_at: Option<String>,
    pub created_at: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateSkill {
    pub id: String,
    pub candidate_id: String,
    pub skill_name: String,
    pub proficiency: Option<String>,
    pub years_of_experience: Option<f64>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateCertificate {
    pub id: String,
    pub candidate_id: String,
    pub certificate_name: String,
    pub issuing_authority: Option<String>,
    pub issue_date: Option<String>,
    pub expiry_date: Option<String>,
    pub certificate_number: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Country {
    pub id: String,
    pub code: String,
    pub name: String,
    pub phone_code: Option<String>,
    pub has_special_fields: i64,
    pub is_active: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Currency {
    pub id: String,
    pub code: String,
    pub name: String,
    pub symbol: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Department {
    pub id: String,
    pub name: String,
    pub parent_id: Option<String>,
    pub is_active: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Location {
    pub id: String,
    pub name: String,
    pub country_id: Option<String>,
    pub city: Option<String>,
    pub address: Option<String>,
    pub is_active: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct JobCategory {
    pub id: String,
    pub name: String,
    pub is_active: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateAddress {
    pub id: String,
    pub candidate_id: String,
    pub address_type: String,
    pub is_primary: i64,
    pub country: Option<String>,
    pub state: Option<String>,
    pub city: Option<String>,
    pub district: Option<String>,
    pub street: Option<String>,
    pub postal_code: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateFamilyMember {
    pub id: String,
    pub candidate_id: String,
    pub name: String,
    pub relationship: String,
    pub phone: Option<String>,
    pub email: Option<String>,
    pub is_emergency_contact: i64,
    pub is_default: i64,
    pub address: Option<String>,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateBankAccount {
    pub id: String,
    pub candidate_id: String,
    pub bank_name: String,
    pub account_number: String,
    pub account_holder: String,
    pub account_type: Option<String>,
    pub bank_country: Option<String>,
    pub currency: Option<String>,
    pub swift_code: Option<String>,
    pub iban: Option<String>,
    pub is_primary: i64,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct CandidateCountryField {
    pub id: String,
    pub candidate_id: String,
    pub country: String,
    pub field_name: String,
    pub field_value: Option<String>,
    pub field_type: String,
    pub sort_order: i64,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ImportResult {
    pub imported: usize,
    pub errors: Vec<String>,
}

impl D {
    pub fn new(p: PathBuf) -> Result<Self, E> {
        if let Some(pp) = p.parent() {
            std::fs::create_dir_all(pp)?;
        }
        let db = D { p };
        db.init()?;
        Ok(db)
    }

    pub fn conn(&self) -> Result<Connection, E> {
        Ok(Connection::open(&self.p)?)
    }

    fn init(&self) -> Result<(), E> {
        let c = self.conn()?;
        c.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                phone TEXT,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL CHECK(role IN ('admin','recruiter','manager','agency','trainer','worker')),
                name TEXT NOT NULL,
                company_id TEXT,
                language_pref TEXT DEFAULT 'en',
                active INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS candidates (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                agency_id TEXT,
                name TEXT NOT NULL,
                phone TEXT,
                email TEXT,
                id_number TEXT,
                country_code TEXT DEFAULT 'PH',
                date_of_birth TEXT,
                gender TEXT,
                nationality TEXT,
                address TEXT,
                city TEXT,
                province TEXT,
                postal_code TEXT,
                education_level TEXT,
                education_school TEXT,
                education_major TEXT,
                education_year TEXT,
                work_experience_years INTEGER,
                previous_employer TEXT,
                previous_position TEXT,
                previous_duration TEXT,
                previous_duties TEXT,
                languages TEXT,
                certifications TEXT,
                emergency_contact_name TEXT,
                emergency_contact_phone TEXT,
                emergency_contact_relation TEXT,
                skills TEXT DEFAULT '[]',
                resume_text TEXT,
                resume_file_url TEXT,
                profile_photo_url TEXT,
                status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','screening','queue_waiting','interviewing','evaluated','offered','document_signing','signed','pre_onboarding','ready_to_sync','synced','hired','rejected')),
                source TEXT DEFAULT 'direct' CHECK(source IN ('agency','direct','referral','other')),
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (agency_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS interviews (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL,
                job_title TEXT,
                job_id TEXT REFERENCES jobs(id) ON DELETE SET NULL,
                scheduled_at TEXT,
                check_in_at TEXT,
                interviewer_id TEXT,
                skill_scores TEXT DEFAULT '{}',
                overall_score REAL,
                comments TEXT,
                status TEXT DEFAULT 'scheduled' CHECK(status IN ('scheduled','completed','cancelled','no_show')),
                result TEXT CHECK(result IN ('pass','fail','pending')),
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (candidate_id) REFERENCES candidates(id),
                FOREIGN KEY (interviewer_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS documents (
                id TEXT PRIMARY KEY,
                entity_type TEXT NOT NULL CHECK(entity_type IN ('candidate','employee')),
                entity_id TEXT NOT NULL,
                doc_type TEXT NOT NULL CHECK(doc_type IN ('contract','id_card','bank_card','certificate','other')),
                file_url TEXT,
                signed_at TEXT,
                signature_method TEXT CHECK(signature_method IN ('electronic','digital','wet')),
                ocr_data TEXT DEFAULT '{}',
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending','signed','expired')),
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS employees (
                id TEXT PRIMARY KEY,
                candidate_id TEXT UNIQUE,
                employee_code TEXT UNIQUE,
                company_id TEXT,
                department TEXT,
                position TEXT,
                hired_at TEXT,
                contract_start TEXT,
                contract_end TEXT,
                training_completed INTEGER DEFAULT 0,
                ehs_certified INTEGER DEFAULT 0,
                status TEXT DEFAULT 'active' CHECK(status IN ('active','inactive','terminated')),
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (candidate_id) REFERENCES candidates(id)
            );

            CREATE TABLE IF NOT EXISTS approvals (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL,
                request_type TEXT NOT NULL DEFAULT 'hire' CHECK(request_type IN ('hire','termination','transfer','other')),
                requested_by TEXT NOT NULL,
                assigned_to TEXT NOT NULL,
                status TEXT DEFAULT 'pending' CHECK(status IN ('pending','approved','rejected','transferred')),
                comments TEXT,
                escalated_at TEXT,
                decided_at TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                updated_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (candidate_id) REFERENCES candidates(id),
                FOREIGN KEY (requested_by) REFERENCES users(id),
                FOREIGN KEY (assigned_to) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT NOT NULL,
                entity_type TEXT,
                entity_id TEXT,
                details TEXT DEFAULT '{}',
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (user_id) REFERENCES users(id)
            );

            CREATE TABLE IF NOT EXISTS training_courses (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                course_type TEXT NOT NULL DEFAULT 'onboarding' CHECK(course_type IN ('onboarding','ehs','skills','compliance')),
                country TEXT DEFAULT 'all',
                content_type TEXT DEFAULT 'video' CHECK(content_type IN ('video','animation','document','quiz')),
                content_url TEXT,
                mandatory INTEGER DEFAULT 0,
                duration_minutes INTEGER,
                order_index INTEGER,
                pass_score INTEGER DEFAULT 80,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS training_records (
                id TEXT PRIMARY KEY,
                employee_id TEXT NOT NULL,
                course_id TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                score INTEGER,
                passed INTEGER DEFAULT 0,
                certificate_url TEXT,
                created_at TEXT DEFAULT (datetime('now')),
                FOREIGN KEY (employee_id) REFERENCES employees(id),
                FOREIGN KEY (course_id) REFERENCES training_courses(id)
            );

            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                title TEXT NOT NULL,
                description TEXT,
                location TEXT,
                country_code TEXT DEFAULT 'PH',
                city TEXT,
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
                FOREIGN KEY (interviewer_id) REFERENCES users(id),
                UNIQUE(interview_id, interviewer_id)
            );

            CREATE TABLE IF NOT EXISTS candidate_educations (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                level TEXT NOT NULL DEFAULT 'high_school',
                school TEXT,
                major TEXT,
                graduation_year INTEGER,
                notes TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS candidate_work_experiences (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                employer TEXT NOT NULL,
                position TEXT,
                start_date TEXT,
                end_date TEXT,
                duration TEXT,
                duties TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS interview_queue (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id),
                job_id TEXT REFERENCES jobs(id),
                queue_number INTEGER NOT NULL,
                status TEXT DEFAULT 'waiting' CHECK(status IN ('waiting','called','interviewing','completed','skipped','absent')),
                called_at TEXT,
                completed_at TEXT,
                created_at TEXT DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS candidate_skills (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                skill_name TEXT NOT NULL,
                proficiency TEXT,
                years_of_experience REAL,
                UNIQUE(candidate_id, skill_name)
            );

            CREATE TABLE IF NOT EXISTS candidate_certificates (
                id TEXT PRIMARY KEY,
                candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                certificate_name TEXT NOT NULL,
                issuing_authority TEXT,
                issue_date TEXT,
                expiry_date TEXT,
                certificate_number TEXT
            );

            CREATE TABLE IF NOT EXISTS countries (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                phone_code TEXT,
                has_special_fields INTEGER DEFAULT 0,
                is_active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS currencies (
                id TEXT PRIMARY KEY,
                code TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                symbol TEXT
            );

            CREATE TABLE IF NOT EXISTS departments (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                parent_id TEXT,
                is_active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS locations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                country_id TEXT,
                city TEXT,
                address TEXT,
                is_active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS job_categories (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                is_active INTEGER DEFAULT 1
            );

            CREATE TABLE IF NOT EXISTS candidate_addresses (
                id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                address_type TEXT NOT NULL DEFAULT 'home', is_primary INTEGER DEFAULT 0,
                country TEXT, state TEXT, city TEXT, district TEXT, street TEXT, postal_code TEXT,
                sort_order INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS candidate_family_members (
                id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                name TEXT NOT NULL, relationship TEXT NOT NULL DEFAULT 'other', phone TEXT, email TEXT,
                is_emergency_contact INTEGER DEFAULT 0, is_default INTEGER DEFAULT 0, address TEXT,
                sort_order INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS candidate_bank_accounts (
                id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                bank_name TEXT NOT NULL, account_number TEXT NOT NULL, account_holder TEXT NOT NULL,
                account_type TEXT, bank_country TEXT, currency TEXT, swift_code TEXT, iban TEXT,
                is_primary INTEGER DEFAULT 0, sort_order INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS candidate_country_fields (
                id TEXT PRIMARY KEY, candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
                country TEXT NOT NULL, field_name TEXT NOT NULL, field_value TEXT,
                field_type TEXT DEFAULT 'text', sort_order INTEGER DEFAULT 0
            );
            "
        )?;
        // Add v2.0 FK columns to jobs table (safe to run if columns already exist)
        let _ = c.execute_batch("
            ALTER TABLE jobs ADD COLUMN department_id TEXT;
            ALTER TABLE jobs ADD COLUMN location_id TEXT;
            ALTER TABLE jobs ADD COLUMN category_id TEXT;
            ALTER TABLE jobs ADD COLUMN currency_id TEXT;
            ALTER TABLE jobs ADD COLUMN headcount INTEGER DEFAULT 1;
            ALTER TABLE jobs ADD COLUMN hiring_manager_id TEXT;
        ");
        // Add DocuSign and SF columns (safe to run if columns already exist)
        for (table, column, def) in &[
            ("employees", "sf_sync_status", "TEXT DEFAULT 'pending'"),
            ("employees", "sf_synced_at", "TEXT"),
            ("employees", "docusign_envelope_id", "TEXT"),
            ("employees", "docusign_status", "TEXT DEFAULT 'pending'"),
            ("documents", "docusign_envelope_id", "TEXT"),
            ("documents", "docusign_status", "TEXT DEFAULT 'pending'"),
            ("documents", "docusign_webhook_data", "TEXT DEFAULT '{}'"),
        ] {
            let sql = format!("ALTER TABLE {} ADD COLUMN {} {}", table, column, def);
            let _ = c.execute(&sql, []);
        }
        // Seed master data
        let _ = c.execute_batch("
            INSERT OR IGNORE INTO countries (id, code, name, phone_code) VALUES
                ('cn','CN','China','86'),
                ('us','US','United States','1'),
                ('sg','SG','Singapore','65'),
                ('ph','PH','Philippines','63'),
                ('my','MY','Malaysia','60'),
                ('th','TH','Thailand','66'),
                ('vn','VN','Vietnam','84'),
                ('id','ID','Indonesia','62'),
                ('jp','JP','Japan','81'),
                ('kr','KR','South Korea','82');
            INSERT OR IGNORE INTO currencies (id, code, name, symbol) VALUES
                ('cny','CNY','Chinese Yuan','¥'),
                ('usd','USD','US Dollar','$'),
                ('eur','EUR','Euro','€'),
                ('jpy','JPY','Japanese Yen','¥'),
                ('gbp','GBP','British Pound','£'),
                ('sgd','SGD','Singapore Dollar','S$'),
                ('php','PHP','Philippine Peso','₱'),
                ('myr','MYR','Malaysian Ringgit','RM'),
                ('thb','THB','Thai Baht','฿'),
                ('idr','IDR','Indonesian Rupiah','Rp'),
                ('vnd','VND','Vietnamese Dong','₫');
            INSERT OR IGNORE INTO departments (id, name) VALUES
                ('eng','Engineering'),
                ('prod','Product'),
                ('sales','Sales'),
                ('mkt','Marketing'),
                ('hr','HR'),
                ('fin','Finance'),
                ('ops','Operations');
        ");
        Ok(())
    }

    pub fn user_by_email(&self, email: &str) -> Result<User, E> {
        self.conn()?.query_row(
            "SELECT id, email, phone, password_hash, role, name, company_id, language_pref, active, created_at, updated_at FROM users WHERE email = ?",
            params![email],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    email: row.get(1)?,
                    phone: row.get(2)?,
                    password_hash: row.get(3)?,
                    role: row.get(4)?,
                    name: row.get(5)?,
                    company_id: row.get(6)?,
                    language_pref: row.get(7)?,
                    active: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        ).map_err(|_| E("user not found".into()))
    }

    pub fn user_by_id(&self, id: &str) -> Result<User, E> {
        self.conn()?.query_row(
            "SELECT id, email, phone, password_hash, role, name, company_id, language_pref, active, created_at, updated_at FROM users WHERE id = ?",
            params![id],
            |row| {
                Ok(User {
                    id: row.get(0)?,
                    email: row.get(1)?,
                    phone: row.get(2)?,
                    password_hash: row.get(3)?,
                    role: row.get(4)?,
                    name: row.get(5)?,
                    company_id: row.get(6)?,
                    language_pref: row.get(7)?,
                    active: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        ).map_err(|_| E("user not found".into()))
    }

    pub fn create_user(&self, u: &User) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO users (id, email, phone, password_hash, role, name, company_id, language_pref, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            params![u.id, u.email, u.phone, u.password_hash, u.role, u.name, u.company_id, u.language_pref, u.active, u.created_at, u.updated_at],
        )?;
        Ok(())
    }

    pub fn list_candidates(&self, status: Option<&str>, source: Option<&str>, q: Option<&str>) -> Result<Vec<Candidate>, E> {
        let c = self.conn()?;
        let mut sql = "SELECT id, user_id, agency_id, name, phone, email, id_number, country_code, date_of_birth, gender, nationality, address, city, province, postal_code, education_level, education_school, education_major, education_year, work_experience_years, previous_employer, previous_position, previous_duration, previous_duties, languages, certifications, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, skills, resume_text, resume_file_url, profile_photo_url, status, source, notes, created_at, updated_at FROM candidates WHERE 1=1".to_string();
        let mut p: Vec<Box<dyn rusqlite::ToSql>> = vec![];
        if let Some(s) = status {
            sql.push_str(" AND status=?");
            p.push(Box::new(s.to_string()));
        }
        if let Some(s) = source {
            sql.push_str(" AND source=?");
            p.push(Box::new(s.to_string()));
        }
        if let Some(qs) = q {
            sql.push_str(" AND (name LIKE ? OR phone LIKE ? OR email LIKE ?)");
            let pattern = format!("%{}%", qs);
            p.push(Box::new(pattern.clone()));
            p.push(Box::new(pattern.clone()));
            p.push(Box::new(pattern));
        }
        sql.push_str(" ORDER BY created_at DESC");
        let mut stmt = c.prepare(&sql)?;
        let refs: Vec<&dyn rusqlite::ToSql> = p.iter().map(|b| b.as_ref()).collect();
        let rows = stmt.query_map(refs.as_slice(), |row| {
            Ok(Candidate {
                id: row.get(0)?,
                user_id: row.get(1)?,
                agency_id: row.get(2)?,
                name: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                id_number: row.get(6)?,
                country_code: row.get(7)?,
                date_of_birth: row.get(8)?,
                gender: row.get(9)?,
                nationality: row.get(10)?,
                address: row.get(11)?,
                city: row.get(12)?,
                province: row.get(13)?,
                postal_code: row.get(14)?,
                education_level: row.get(15)?,
                education_school: row.get(16)?,
                education_major: row.get(17)?,
                education_year: row.get(18)?,
                work_experience_years: row.get(19)?,
                previous_employer: row.get(20)?,
                previous_position: row.get(21)?,
                previous_duration: row.get(22)?,
                previous_duties: row.get(23)?,
                languages: row.get(24)?,
                certifications: row.get(25)?,
                emergency_contact_name: row.get(26)?,
                emergency_contact_phone: row.get(27)?,
                emergency_contact_relation: row.get(28)?,
                skills: row.get(29)?,
                resume_text: row.get(30)?,
                resume_file_url: row.get(31)?,
                profile_photo_url: row.get(32)?,
                status: row.get(33)?,
                source: row.get(34)?,
                notes: row.get(35)?,
                created_at: row.get(36)?,
                updated_at: row.get(37)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn candidate_by_phone_or_email(&self, phone: Option<&str>, email: Option<&str>) -> Result<Vec<Candidate>, E> {
        let c = self.conn()?;
        let mut sql = "SELECT id, user_id, agency_id, name, phone, email, id_number, country_code, date_of_birth, gender, nationality, address, city, province, postal_code, education_level, education_school, education_major, education_year, work_experience_years, previous_employer, previous_position, previous_duration, previous_duties, languages, certifications, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, skills, resume_text, resume_file_url, profile_photo_url, status, source, notes, created_at, updated_at FROM candidates WHERE 1=0".to_string();
        if let Some(p) = phone {
            sql.push_str(&format!(" OR phone='{}'", p.replace('\'', "''")));
        }
        if let Some(e) = email {
            sql.push_str(&format!(" OR email='{}'", e.replace('\'', "''")));
        }
        let mut stmt = c.prepare(&sql)?;
        let rows = stmt.query_map([], |row| {
            Ok(Candidate {
                id: row.get(0)?,
                user_id: row.get(1)?,
                agency_id: row.get(2)?,
                name: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                id_number: row.get(6)?,
                country_code: row.get(7)?,
                date_of_birth: row.get(8)?,
                gender: row.get(9)?,
                nationality: row.get(10)?,
                address: row.get(11)?,
                city: row.get(12)?,
                province: row.get(13)?,
                postal_code: row.get(14)?,
                education_level: row.get(15)?,
                education_school: row.get(16)?,
                education_major: row.get(17)?,
                education_year: row.get(18)?,
                work_experience_years: row.get(19)?,
                previous_employer: row.get(20)?,
                previous_position: row.get(21)?,
                previous_duration: row.get(22)?,
                previous_duties: row.get(23)?,
                languages: row.get(24)?,
                certifications: row.get(25)?,
                emergency_contact_name: row.get(26)?,
                emergency_contact_phone: row.get(27)?,
                emergency_contact_relation: row.get(28)?,
                skills: row.get(29)?,
                resume_text: row.get(30)?,
                resume_file_url: row.get(31)?,
                profile_photo_url: row.get(32)?,
                status: row.get(33)?,
                source: row.get(34)?,
                notes: row.get(35)?,
                created_at: row.get(36)?,
                updated_at: row.get(37)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn candidate_by_id(&self, id: &str) -> Result<Candidate, E> {
        self.conn()?.query_row(
            "SELECT id, user_id, agency_id, name, phone, email, id_number, country_code, date_of_birth, gender, nationality, address, city, province, postal_code, education_level, education_school, education_major, education_year, work_experience_years, previous_employer, previous_position, previous_duration, previous_duties, languages, certifications, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, skills, resume_text, resume_file_url, profile_photo_url, status, source, notes, created_at, updated_at FROM candidates WHERE id=?",
            params![id],
            |row| {
                Ok(Candidate {
                    id: row.get(0)?,
                    user_id: row.get(1)?,
                    agency_id: row.get(2)?,
                    name: row.get(3)?,
                    phone: row.get(4)?,
                    email: row.get(5)?,
                    id_number: row.get(6)?,
                    country_code: row.get(7)?,
                    date_of_birth: row.get(8)?,
                    gender: row.get(9)?,
                    nationality: row.get(10)?,
                    address: row.get(11)?,
                    city: row.get(12)?,
                    province: row.get(13)?,
                    postal_code: row.get(14)?,
                    education_level: row.get(15)?,
                    education_school: row.get(16)?,
                    education_major: row.get(17)?,
                    education_year: row.get(18)?,
                    work_experience_years: row.get(19)?,
                    previous_employer: row.get(20)?,
                    previous_position: row.get(21)?,
                    previous_duration: row.get(22)?,
                    previous_duties: row.get(23)?,
                    languages: row.get(24)?,
                    certifications: row.get(25)?,
                    emergency_contact_name: row.get(26)?,
                    emergency_contact_phone: row.get(27)?,
                    emergency_contact_relation: row.get(28)?,
                    skills: row.get(29)?,
                    resume_text: row.get(30)?,
                    resume_file_url: row.get(31)?,
                    profile_photo_url: row.get(32)?,
                    status: row.get(33)?,
                    source: row.get(34)?,
                    notes: row.get(35)?,
                    created_at: row.get(36)?,
                    updated_at: row.get(37)?,
                })
            },
        ).map_err(|_| E("candidate not found".into()))
    }

    pub fn create_candidate(&self, c: &Candidate) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidates (id, user_id, agency_id, name, phone, email, id_number, country_code, date_of_birth, gender, nationality, address, city, province, postal_code, education_level, education_school, education_major, education_year, work_experience_years, previous_employer, previous_position, previous_duration, previous_duties, languages, certifications, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, skills, resume_text, resume_file_url, profile_photo_url, status, source, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            params![
                c.id, c.user_id, c.agency_id, c.name, c.phone, c.email, c.id_number, c.country_code,
                c.date_of_birth, c.gender, c.nationality, c.address, c.city, c.province, c.postal_code,
                c.education_level, c.education_school, c.education_major, c.education_year,
                c.work_experience_years, c.previous_employer, c.previous_position, c.previous_duration, c.previous_duties,
                c.languages, c.certifications, c.emergency_contact_name, c.emergency_contact_phone, c.emergency_contact_relation,
                c.skills, c.resume_text, c.resume_file_url, c.profile_photo_url,
                c.status, c.source, c.notes, c.created_at, c.updated_at,
            ],
        )?;
        Ok(())
    }

    pub fn update_candidate(&self, id: &str, c: &Candidate) -> Result<(), E> {
        let affected = self.conn()?.execute(
            "UPDATE candidates SET name=?, phone=?, email=?, id_number=?, country_code=?, date_of_birth=?, gender=?, nationality=?, address=?, city=?, province=?, postal_code=?, education_level=?, education_school=?, education_major=?, education_year=?, work_experience_years=?, previous_employer=?, previous_position=?, previous_duration=?, previous_duties=?, languages=?, certifications=?, emergency_contact_name=?, emergency_contact_phone=?, emergency_contact_relation=?, skills=?, resume_text=?, resume_file_url=?, profile_photo_url=?, status=?, source=?, notes=?, updated_at=? WHERE id=?",
            params![
                c.name, c.phone, c.email, c.id_number, c.country_code,
                c.date_of_birth, c.gender, c.nationality, c.address, c.city, c.province, c.postal_code,
                c.education_level, c.education_school, c.education_major, c.education_year,
                c.work_experience_years, c.previous_employer, c.previous_position, c.previous_duration, c.previous_duties,
                c.languages, c.certifications, c.emergency_contact_name, c.emergency_contact_phone, c.emergency_contact_relation,
                c.skills, c.resume_text, c.resume_file_url, c.profile_photo_url,
                c.status, c.source, c.notes, c.updated_at, id,
            ],
        )?;
        if affected == 0 {
            return Err(E("candidate not found".into()));
        }
        Ok(())
    }

    pub fn delete_candidate(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidates WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate not found".into()));
        }
        Ok(())
    }

    pub fn update_candidate_status(&self, id: &str, status: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let affected = self.conn()?.execute(
            "UPDATE candidates SET status=?, updated_at=? WHERE id=?",
            params![status, now, id],
        )?;
        if affected == 0 {
            return Err(E("candidate not found".into()));
        }
        Ok(())
    }

    pub fn import_candidates_csv(&self, csv_data: &str, agency_id: Option<&str>) -> Result<ImportResult, E> {
        let mut imported = 0;
        let mut errors = vec![];
        let c = self.conn()?;
        for (i, line) in csv_data.lines().enumerate() {
            if i == 0 && line.to_lowercase().contains("name") {
                continue;
            }
            let line = line.trim();
            if line.is_empty() {
                continue;
            }
            let fields = parse_csv_line(line);
            if fields.len() < 3 {
                errors.push(format!("line {}: insufficient fields", i + 1));
                continue;
            }
            let name = fields[0].trim();
            if name.is_empty() {
                errors.push(format!("line {}: name required", i + 1));
                continue;
            }
            let phone = fields.get(1).map(|s| s.trim().to_string());
            let email = fields.get(2).map(|s| s.trim().to_string());
            let id_number = fields.get(3).map(|s| s.trim().to_string());
            let country_code = fields.get(4).map(|s| s.trim().to_string()).unwrap_or_else(|| "PH".to_string());
            let skills = fields.get(5).map(|s| s.trim().to_string()).unwrap_or_default();
            let skills_json = if skills.is_empty() {
                "[]".to_string()
            } else {
                let parts: Vec<String> = skills.split(';').map(|s| format!("\"{}\"", s.trim())).collect();
                format!("[{}]", parts.join(","))
            };
            let source = fields.get(6).map(|s| s.trim().to_string()).unwrap_or_else(|| "direct".to_string());
            let notes = fields.get(7).map(|s| s.trim().to_string());

            if let (Some(ref p), Some(ref e)) = (&phone, &email) {
                let mut dup_check = c.prepare("SELECT COUNT(*) FROM candidates WHERE phone=? OR email=?")?;
                let dup_count: i64 = dup_check.query_row(params![p, e], |r| r.get(0))?;
                if dup_count > 0 {
                    errors.push(format!("line {}: duplicate phone or email (skipped)", i + 1));
                    continue;
                }
            } else if let Some(ref p) = &phone {
                let mut dup_check = c.prepare("SELECT COUNT(*) FROM candidates WHERE phone=?")?;
                let dup_count: i64 = dup_check.query_row(params![p], |r| r.get(0))?;
                if dup_count > 0 {
                    errors.push(format!("line {}: duplicate phone (skipped)", i + 1));
                    continue;
                }
            }

            let id = uuid::Uuid::new_v4().to_string();
            let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();

            let result = c.execute(
                "INSERT INTO candidates (id, agency_id, name, phone, email, id_number, country_code, skills, status, source, notes, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                params![
                    id,
                    agency_id,
                    name,
                    phone,
                    email,
                    id_number,
                    country_code,
                    skills_json,
                    "new",
                    if agency_id.is_some() { "agency" } else { &source },
                    notes,
                    now,
                    now,
                ],
            );
            match result {
                Ok(_) => imported += 1,
                Err(e) => errors.push(format!("line {}: {}", i + 1, e)),
            }
        }
        Ok(ImportResult { imported, errors })
    }

    pub fn agency_candidates(&self, agency_id: &str) -> Result<Vec<Candidate>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, user_id, agency_id, name, phone, email, id_number, country_code, date_of_birth, gender, nationality, address, city, province, postal_code, education_level, education_school, education_major, education_year, work_experience_years, previous_employer, previous_position, previous_duration, previous_duties, languages, certifications, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, skills, resume_text, resume_file_url, profile_photo_url, status, source, notes, created_at, updated_at FROM candidates WHERE agency_id=? ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map(params![agency_id], |row| {
            Ok(Candidate {
                id: row.get(0)?,
                user_id: row.get(1)?,
                agency_id: row.get(2)?,
                name: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                id_number: row.get(6)?,
                country_code: row.get(7)?,
                date_of_birth: row.get(8)?,
                gender: row.get(9)?,
                nationality: row.get(10)?,
                address: row.get(11)?,
                city: row.get(12)?,
                province: row.get(13)?,
                postal_code: row.get(14)?,
                education_level: row.get(15)?,
                education_school: row.get(16)?,
                education_major: row.get(17)?,
                education_year: row.get(18)?,
                work_experience_years: row.get(19)?,
                previous_employer: row.get(20)?,
                previous_position: row.get(21)?,
                previous_duration: row.get(22)?,
                previous_duties: row.get(23)?,
                languages: row.get(24)?,
                certifications: row.get(25)?,
                emergency_contact_name: row.get(26)?,
                emergency_contact_phone: row.get(27)?,
                emergency_contact_relation: row.get(28)?,
                skills: row.get(29)?,
                resume_text: row.get(30)?,
                resume_file_url: row.get(31)?,
                profile_photo_url: row.get(32)?,
                status: row.get(33)?,
                source: row.get(34)?,
                notes: row.get(35)?,
                created_at: row.get(36)?,
                updated_at: row.get(37)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_interviews(&self, status: Option<&str>, job_id: Option<&str>) -> Result<Vec<Interview>, E> {
        let c = self.conn()?;
        let mut sql = "SELECT id, candidate_id, job_title, job_id, scheduled_at, check_in_at, interviewer_id, skill_scores, overall_score, comments, status, result, created_at, updated_at FROM interviews WHERE 1=1".to_string();
        let mut p: Vec<Box<dyn rusqlite::ToSql>> = vec![];
        if let Some(s) = status {
            sql.push_str(" AND status=?");
            p.push(Box::new(s.to_string()));
        }
        if let Some(j) = job_id {
            sql.push_str(" AND job_id=?");
            p.push(Box::new(j.to_string()));
        }
        sql.push_str(" ORDER BY created_at DESC");
        let mut stmt = c.prepare(&sql)?;
        let refs: Vec<&dyn rusqlite::ToSql> = p.iter().map(|b| b.as_ref()).collect();
        let rows = stmt.query_map(refs.as_slice(), |row| {
            Ok(Interview {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                job_title: row.get(2)?,
                job_id: row.get(3)?,
                scheduled_at: row.get(4)?,
                check_in_at: row.get(5)?,
                interviewer_id: row.get(6)?,
                skill_scores: row.get(7)?,
                overall_score: row.get(8)?,
                comments: row.get(9)?,
                status: row.get(10)?,
                result: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn interview_by_id(&self, id: &str) -> Result<Interview, E> {
        self.conn()?.query_row(
            "SELECT id, candidate_id, job_title, job_id, scheduled_at, check_in_at, interviewer_id, skill_scores, overall_score, comments, status, result, created_at, updated_at FROM interviews WHERE id=?",
            params![id],
            |row| {
                Ok(Interview {
                    id: row.get(0)?,
                    candidate_id: row.get(1)?,
                    job_title: row.get(2)?,
                    job_id: row.get(3)?,
                    scheduled_at: row.get(4)?,
                    check_in_at: row.get(5)?,
                    interviewer_id: row.get(6)?,
                    skill_scores: row.get(7)?,
                    overall_score: row.get(8)?,
                    comments: row.get(9)?,
                    status: row.get(10)?,
                    result: row.get(11)?,
                    created_at: row.get(12)?,
                    updated_at: row.get(13)?,
                })
            },
        ).map_err(|_| E("interview not found".into()))
    }

    pub fn create_interview(&self, iv: &Interview) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO interviews (id, candidate_id, job_title, job_id, scheduled_at, check_in_at, interviewer_id, skill_scores, overall_score, comments, status, result, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            params![iv.id, iv.candidate_id, iv.job_title, iv.job_id, iv.scheduled_at, iv.check_in_at, iv.interviewer_id, iv.skill_scores, iv.overall_score, iv.comments, iv.status, iv.result, iv.created_at, iv.updated_at],
        )?;
        Ok(())
    }

    pub fn checkin_interview(&self, id: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let affected = self.conn()?.execute(
            "UPDATE interviews SET check_in_at=?, updated_at=? WHERE id=?",
            params![now, now, id],
        )?;
        if affected == 0 {
            return Err(E("interview not found".into()));
        }
        Ok(())
    }

    pub fn evaluate_interview(&self, id: &str, skill_scores: &str, overall_score: f64, comments: &str, result: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let affected = self.conn()?.execute(
            "UPDATE interviews SET skill_scores=?, overall_score=?, comments=?, result=?, status='completed', updated_at=? WHERE id=?",
            params![skill_scores, overall_score, comments, result, now, id],
        )?;
        if affected == 0 {
            return Err(E("interview not found".into()));
        }
        Ok(())
    }

    pub fn pending_approvals(&self, user_id: &str) -> Result<Vec<Approval>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, request_type, requested_by, assigned_to, status, comments, escalated_at, decided_at, created_at, updated_at FROM approvals WHERE assigned_to=? AND status='pending' ORDER BY created_at ASC"
        )?;
        let rows = stmt.query_map(params![user_id], |row| {
            Ok(Approval {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                request_type: row.get(2)?,
                requested_by: row.get(3)?,
                assigned_to: row.get(4)?,
                status: row.get(5)?,
                comments: row.get(6)?,
                escalated_at: row.get(7)?,
                decided_at: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn approval_by_id(&self, id: &str) -> Result<Approval, E> {
        self.conn()?.query_row(
            "SELECT id, candidate_id, request_type, requested_by, assigned_to, status, comments, escalated_at, decided_at, created_at, updated_at FROM approvals WHERE id=?",
            params![id],
            |row| {
                Ok(Approval {
                    id: row.get(0)?,
                    candidate_id: row.get(1)?,
                    request_type: row.get(2)?,
                    requested_by: row.get(3)?,
                    assigned_to: row.get(4)?,
                    status: row.get(5)?,
                    comments: row.get(6)?,
                    escalated_at: row.get(7)?,
                    decided_at: row.get(8)?,
                    created_at: row.get(9)?,
                    updated_at: row.get(10)?,
                })
            },
        ).map_err(|_| E("approval not found".into()))
    }

    pub fn create_approval(&self, a: &Approval) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO approvals (id, candidate_id, request_type, requested_by, assigned_to, status, comments, escalated_at, decided_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            params![a.id, a.candidate_id, a.request_type, a.requested_by, a.assigned_to, a.status, a.comments, a.escalated_at, a.decided_at, a.created_at, a.updated_at],
        )?;
        Ok(())
    }

    pub fn approve_approval(&self, id: &str, comments: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let affected = self.conn()?.execute(
            "UPDATE approvals SET status='approved', comments=?, decided_at=?, updated_at=? WHERE id=? AND status='pending'",
            params![comments, now, now, id],
        )?;
        if affected == 0 {
            return Err(E("approval not found or already processed".into()));
        }
        Ok(())
    }

    pub fn transfer_approval(&self, id: &str, new_assigned_to: &str, comments: &str) -> Result<(Approval, Approval), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let c = self.conn()?;
        let original = self.approval_by_id(id)?;

        c.execute(
            "UPDATE approvals SET status='transferred', comments=?, updated_at=? WHERE id=? AND status='pending'",
            params![comments, now, id],
        )?;

        let new_id = uuid::Uuid::new_v4().to_string();
        let new_approval = Approval {
            id: new_id.clone(),
            candidate_id: original.candidate_id.clone(),
            request_type: original.request_type.clone(),
            requested_by: original.requested_by.clone(),
            assigned_to: new_assigned_to.to_string(),
            status: "pending".to_string(),
            comments: Some(comments.to_string()),
            escalated_at: None,
            decided_at: None,
            created_at: now.clone(),
            updated_at: now.clone(),
        };
        c.execute(
            "INSERT INTO approvals (id, candidate_id, request_type, requested_by, assigned_to, status, comments, escalated_at, decided_at, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            params![new_approval.id, new_approval.candidate_id, new_approval.request_type, new_approval.requested_by, new_approval.assigned_to, new_approval.status, new_approval.comments, new_approval.escalated_at, new_approval.decided_at, new_approval.created_at, new_approval.updated_at],
        )?;

        Ok((original, new_approval))
    }

    pub fn reject_approval(&self, id: &str, comments: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let affected = self.conn()?.execute(
            "UPDATE approvals SET status='rejected', comments=?, decided_at=?, updated_at=? WHERE id=? AND status='pending'",
            params![comments, now, now, id],
        )?;
        if affected == 0 {
            return Err(E("approval not found or already processed".into()));
        }
        Ok(())
    }

    pub fn list_employees(&self) -> Result<Vec<Employee>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, employee_code, company_id, department, position, hired_at, contract_start, contract_end, training_completed, ehs_certified, status, created_at, updated_at, sf_sync_status, sf_synced_at, docusign_envelope_id, docusign_status FROM employees ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Employee {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                employee_code: row.get(2)?,
                company_id: row.get(3)?,
                department: row.get(4)?,
                position: row.get(5)?,
                hired_at: row.get(6)?,
                contract_start: row.get(7)?,
                contract_end: row.get(8)?,
                training_completed: row.get(9)?,
                ehs_certified: row.get(10)?,
                status: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                sf_sync_status: row.get(14)?,
                sf_synced_at: row.get(15)?,
                docusign_envelope_id: row.get(16)?,
                docusign_status: row.get(17)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn employee_by_id(&self, id: &str) -> Result<Employee, E> {
        self.conn()?.query_row(
            "SELECT id, candidate_id, employee_code, company_id, department, position, hired_at, contract_start, contract_end, training_completed, ehs_certified, status, created_at, updated_at, sf_sync_status, sf_synced_at, docusign_envelope_id, docusign_status FROM employees WHERE id=?",
            params![id],
            |row| {
                Ok(Employee {
                    id: row.get(0)?,
                    candidate_id: row.get(1)?,
                    employee_code: row.get(2)?,
                    company_id: row.get(3)?,
                    department: row.get(4)?,
                    position: row.get(5)?,
                    hired_at: row.get(6)?,
                    contract_start: row.get(7)?,
                    contract_end: row.get(8)?,
                    training_completed: row.get(9)?,
                    ehs_certified: row.get(10)?,
                    status: row.get(11)?,
                    created_at: row.get(12)?,
                    updated_at: row.get(13)?,
                    sf_sync_status: row.get(14)?,
                    sf_synced_at: row.get(15)?,
                    docusign_envelope_id: row.get(16)?,
                    docusign_status: row.get(17)?,
                })
            },
        ).map_err(|_| E("employee not found".into()))
    }

    pub fn create_employee(&self, emp: &Employee) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO employees (id, candidate_id, employee_code, company_id, department, position, hired_at, contract_start, contract_end, training_completed, ehs_certified, status, created_at, updated_at, sf_sync_status, sf_synced_at, docusign_envelope_id, docusign_status) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
            params![emp.id, emp.candidate_id, emp.employee_code, emp.company_id, emp.department, emp.position, emp.hired_at, emp.contract_start, emp.contract_end, emp.training_completed, emp.ehs_certified, emp.status, emp.created_at, emp.updated_at, emp.sf_sync_status, emp.sf_synced_at, emp.docusign_envelope_id, emp.docusign_status],
        )?;
        Ok(())
    }

    pub fn document_by_id(&self, id: &str) -> Result<Document, E> {
        self.conn()?.query_row(
            "SELECT id, entity_type, entity_id, doc_type, file_url, signed_at, signature_method, ocr_data, status, created_at, docusign_envelope_id, docusign_status, docusign_webhook_data FROM documents WHERE id=?",
            params![id],
            |row| {
                Ok(Document {
                    id: row.get(0)?,
                    entity_type: row.get(1)?,
                    entity_id: row.get(2)?,
                    doc_type: row.get(3)?,
                    file_url: row.get(4)?,
                    signed_at: row.get(5)?,
                    signature_method: row.get(6)?,
                    ocr_data: row.get(7)?,
                    status: row.get(8)?,
                    created_at: row.get(9)?,
                    docusign_envelope_id: row.get(10)?,
                    docusign_status: row.get(11)?,
                    docusign_webhook_data: row.get(12)?,
                })
            },
        ).map_err(|_| E("document not found".into()))
    }

    pub fn create_document(&self, doc: &Document) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO documents (id, entity_type, entity_id, doc_type, file_url, signed_at, signature_method, ocr_data, status, created_at, docusign_envelope_id, docusign_status, docusign_webhook_data) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
            params![doc.id, doc.entity_type, doc.entity_id, doc.doc_type, doc.file_url, doc.signed_at, doc.signature_method, doc.ocr_data, doc.status, doc.created_at, doc.docusign_envelope_id, doc.docusign_status, doc.docusign_webhook_data],
        )?;
        Ok(())
    }

    pub fn sign_document(&self, id: &str, method: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let affected = self.conn()?.execute(
            "UPDATE documents SET status='signed', signed_at=?, signature_method=? WHERE id=? AND status='pending'",
            params![now, method, id],
        )?;
        if affected == 0 {
            return Err(E("document not found or already signed".into()));
        }
        Ok(())
    }

    pub fn stats(&self) -> Result<Value, E> {
        let c = self.conn()?;
        let total: i64 = c.query_row("SELECT COUNT(*) FROM candidates", [], |r| r.get(0))?;

        let mut by_status = HashMap::new();
        let mut stmt = c.prepare("SELECT status, COUNT(*) FROM candidates GROUP BY status")?;
        let rows = stmt.query_map([], |r| {
            let s: String = r.get(0)?;
            let n: i64 = r.get(1)?;
            Ok((s, n))
        })?;
        for row in rows.flatten() {
            by_status.insert(row.0, row.1);
        }

        let mut by_source = HashMap::new();
        let mut stmt2 = c.prepare("SELECT source, COUNT(*) FROM candidates GROUP BY source")?;
        let rows2 = stmt2.query_map([], |r| {
            let s: String = r.get(0)?;
            let n: i64 = r.get(1)?;
            Ok((s, n))
        })?;
        for row in rows2.flatten() {
            by_source.insert(row.0, row.1);
        }

        Ok(serde_json::json!({
            "total_candidates": total,
            "by_status": by_status,
            "by_source": by_source,
        }))
    }

    pub fn log_audit(&self, user_id: &str, action: &str, entity_type: &str, entity_id: &str, details: &str) -> Result<(), E> {
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        self.conn()?.execute(
            "INSERT INTO audit_logs (id, user_id, action, entity_type, entity_id, details, created_at) VALUES (?,?,?,?,?,?,?)",
            params![id, user_id, action, entity_type, entity_id, details, now],
        )?;
        Ok(())
    }

    pub fn candidate_timeline(&self, candidate_id: &str) -> Result<Vec<AuditEntry>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, user_id, action, entity_type, entity_id, details, created_at FROM audit_logs WHERE entity_id=? ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(AuditEntry {
                id: row.get(0)?,
                user_id: row.get(1)?,
                action: row.get(2)?,
                entity_type: row.get(3)?,
                entity_id: row.get(4)?,
                details: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_courses(&self) -> Result<Vec<TrainingCourse>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, title, course_type, country, content_type, content_url, mandatory, duration_minutes, order_index, pass_score, created_at FROM training_courses ORDER BY order_index ASC, created_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(TrainingCourse {
                id: row.get(0)?,
                title: row.get(1)?,
                course_type: row.get(2)?,
                country: row.get(3)?,
                content_type: row.get(4)?,
                content_url: row.get(5)?,
                mandatory: row.get(6)?,
                duration_minutes: row.get(7)?,
                order_index: row.get(8)?,
                pass_score: row.get(9)?,
                created_at: row.get(10)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn course_by_id(&self, id: &str) -> Result<TrainingCourse, E> {
        self.conn()?.query_row(
            "SELECT id, title, course_type, country, content_type, content_url, mandatory, duration_minutes, order_index, pass_score, created_at FROM training_courses WHERE id=?",
            params![id],
            |row| {
                Ok(TrainingCourse {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    course_type: row.get(2)?,
                    country: row.get(3)?,
                    content_type: row.get(4)?,
                    content_url: row.get(5)?,
                    mandatory: row.get(6)?,
                    duration_minutes: row.get(7)?,
                    order_index: row.get(8)?,
                    pass_score: row.get(9)?,
                    created_at: row.get(10)?,
                })
            },
        ).map_err(|_| E("course not found".into()))
    }

    pub fn create_course(&self, c: &TrainingCourse) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO training_courses (id, title, course_type, country, content_type, content_url, mandatory, duration_minutes, order_index, pass_score, created_at) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
            params![c.id, c.title, c.course_type, c.country, c.content_type, c.content_url, c.mandatory, c.duration_minutes, c.order_index, c.pass_score, c.created_at],
        )?;
        Ok(())
    }

    pub fn update_course(&self, id: &str, c: &TrainingCourse) -> Result<(), E> {
        self.conn()?.execute(
            "UPDATE training_courses SET title=?, course_type=?, country=?, content_type=?, content_url=?, mandatory=?, duration_minutes=?, pass_score=? WHERE id=?",
            params![c.title, c.course_type, c.country, c.content_type, c.content_url, c.mandatory, c.duration_minutes, c.pass_score, id],
        )?;
        Ok(())
    }

    pub fn create_training_record(&self, r: &TrainingRecord) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO training_records (id, employee_id, course_id, started_at, completed_at, score, passed, certificate_url, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            params![r.id, r.employee_id, r.course_id, r.started_at, r.completed_at, r.score, r.passed, r.certificate_url, r.created_at],
        )?;
        Ok(())
    }

    pub fn training_record_by_id(&self, id: &str) -> Result<TrainingRecord, E> {
        self.conn()?.query_row(
            "SELECT id, employee_id, course_id, started_at, completed_at, score, passed, certificate_url, created_at FROM training_records WHERE id=?",
            params![id],
            |row| {
                Ok(TrainingRecord {
                    id: row.get(0)?,
                    employee_id: row.get(1)?,
                    course_id: row.get(2)?,
                    started_at: row.get(3)?,
                    completed_at: row.get(4)?,
                    score: row.get(5)?,
                    passed: row.get(6)?,
                    certificate_url: row.get(7)?,
                    created_at: row.get(8)?,
                })
            },
        ).map_err(|_| E("training record not found".into()))
    }

    pub fn complete_training(&self, id: &str, completed_at: &str, score: Option<i64>, passed: i64, certificate_url: Option<&str>) -> Result<(), E> {
        self.conn()?.execute(
            "UPDATE training_records SET completed_at=?, score=?, passed=?, certificate_url=? WHERE id=?",
            params![completed_at, score, passed, certificate_url, id],
        )?;
        let record = self.training_record_by_id(id)?;
        let course = self.course_by_id(&record.course_id)?;
        let c = self.conn()?;
        if passed > 0 {
            c.execute(
                "UPDATE employees SET training_completed=1 WHERE id=?",
                params![record.employee_id],
            )?;
            if course.course_type == "ehs" {
                c.execute(
                    "UPDATE employees SET ehs_certified=1 WHERE id=?",
                    params![record.employee_id],
                )?;
            }
        }
        Ok(())
    }

    pub fn update_employee(&self, id: &str, emp: &Employee) -> Result<(), E> {
        let affected = self.conn()?.execute(
            "UPDATE employees SET department=?, position=?, contract_start=?, contract_end=?, status=?, updated_at=? WHERE id=?",
            params![emp.department, emp.position, emp.contract_start, emp.contract_end, emp.status, emp.updated_at, id],
        )?;
        if affected == 0 {
            return Err(E("employee not found".into()));
        }
        Ok(())
    }

    pub fn list_training_records(&self, employee_id: Option<&str>) -> Result<Vec<TrainingRecord>, E> {
        let c = self.conn()?;
        let mut sql = "SELECT id, employee_id, course_id, started_at, completed_at, score, passed, certificate_url, created_at FROM training_records WHERE 1=1".to_string();
        let mut p: Vec<Box<dyn rusqlite::ToSql>> = vec![];
        if let Some(eid) = employee_id {
            sql.push_str(" AND employee_id=?");
            p.push(Box::new(eid.to_string()));
        }
        sql.push_str(" ORDER BY created_at DESC");
        let mut stmt = c.prepare(&sql)?;
        let refs: Vec<&dyn rusqlite::ToSql> = p.iter().map(|b| b.as_ref()).collect();
        let rows = stmt.query_map(refs.as_slice(), |row| {
            Ok(TrainingRecord {
                id: row.get(0)?,
                employee_id: row.get(1)?,
                course_id: row.get(2)?,
                started_at: row.get(3)?,
                completed_at: row.get(4)?,
                score: row.get(5)?,
                passed: row.get(6)?,
                certificate_url: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_jobs(&self, status: Option<&str>, q: Option<&str>) -> Result<Vec<Job>, E> {
        let c = self.conn()?;
        let sql = "SELECT id, title, description, location, country_code, city, salary_min, salary_max, salary_currency, department, requirements, responsibilities, employment_type, status, posted_by, views, created_at, updated_at, department_id, location_id, category_id, currency_id, headcount, hiring_manager_id FROM jobs WHERE (?1 IS NULL OR status=?1) AND (?2 IS NULL OR title LIKE '%'||?2||'%') ORDER BY created_at DESC".to_string();
        let mut stmt = c.prepare(&sql)?;
        let rows = stmt.query_map(params![status, q], |row| {
            Ok(Job {
                id: row.get(0)?,
                title: row.get(1)?,
                description: row.get(2)?,
                location: row.get(3)?,
                country_code: row.get(4)?,
                city: row.get(5)?,
                salary_min: row.get(6)?,
                salary_max: row.get(7)?,
                salary_currency: row.get(8)?,
                department: row.get(9)?,
                requirements: row.get(10)?,
                responsibilities: row.get(11)?,
                employment_type: row.get(12)?,
                status: row.get(13)?,
                posted_by: row.get(14)?,
                views: row.get(15)?,
                created_at: row.get(16)?,
                updated_at: row.get(17)?,
                department_id: row.get(18)?,
                location_id: row.get(19)?,
                category_id: row.get(20)?,
                currency_id: row.get(21)?,
                headcount: row.get(22)?,
                hiring_manager_id: row.get(23)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn job_by_id(&self, id: &str) -> Result<Job, E> {
        self.conn()?.query_row(
            "SELECT id, title, description, location, country_code, city, salary_min, salary_max, salary_currency, department, requirements, responsibilities, employment_type, status, posted_by, views, created_at, updated_at, department_id, location_id, category_id, currency_id, headcount, hiring_manager_id FROM jobs WHERE id=?",
            params![id],
            |row| {
                Ok(Job {
                    id: row.get(0)?,
                    title: row.get(1)?,
                    description: row.get(2)?,
                    location: row.get(3)?,
                    country_code: row.get(4)?,
                    city: row.get(5)?,
                    salary_min: row.get(6)?,
                    salary_max: row.get(7)?,
                    salary_currency: row.get(8)?,
                    department: row.get(9)?,
                    requirements: row.get(10)?,
                    responsibilities: row.get(11)?,
                    employment_type: row.get(12)?,
                    status: row.get(13)?,
                    posted_by: row.get(14)?,
                    views: row.get(15)?,
                    created_at: row.get(16)?,
                    updated_at: row.get(17)?,
                    department_id: row.get(18)?,
                    location_id: row.get(19)?,
                    category_id: row.get(20)?,
                    currency_id: row.get(21)?,
                    headcount: row.get(22)?,
                    hiring_manager_id: row.get(23)?,
                })
            },
        ).map_err(|_| E("job not found".into()))
    }

    pub fn create_job(&self, j: &Job) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO jobs (id, title, description, location, country_code, city, salary_min, salary_max, salary_currency, department, requirements, responsibilities, employment_type, status, posted_by, department_id, location_id, category_id, currency_id, headcount, hiring_manager_id) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14,?15,?16,?17,?18,?19,?20,?21)",
            params![j.id, j.title, j.description, j.location, j.country_code, j.city, j.salary_min, j.salary_max, j.salary_currency, j.department, j.requirements, j.responsibilities, j.employment_type, j.status, j.posted_by, j.department_id, j.location_id, j.category_id, j.currency_id, j.headcount, j.hiring_manager_id],
        )?;
        Ok(())
    }

    pub fn update_job(&self, id: &str, j: &Job) -> Result<(), E> {
        let affected = self.conn()?.execute(
            "UPDATE jobs SET title=?1,description=?2,location=?3,country_code=?4,city=?5,salary_min=?6,salary_max=?7,salary_currency=?8,department=?9,requirements=?10,responsibilities=?11,employment_type=?12,status=?13,department_id=?14,location_id=?15,category_id=?16,currency_id=?17,headcount=?18,hiring_manager_id=?19,updated_at=datetime('now') WHERE id=?20",
            params![j.title, j.description, j.location, j.country_code, j.city, j.salary_min, j.salary_max, j.salary_currency, j.department, j.requirements, j.responsibilities, j.employment_type, j.status, j.department_id, j.location_id, j.category_id, j.currency_id, j.headcount, j.hiring_manager_id, id],
        )?;
        if affected == 0 {
            return Err(E("job not found".into()));
        }
        Ok(())
    }

    pub fn delete_job(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM jobs WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("job not found".into()));
        }
        Ok(())
    }

    pub fn increment_job_views(&self, id: &str) -> Result<(), E> {
        self.conn()?.execute(
            "UPDATE jobs SET views=views+1 WHERE id=?",
            params![id],
        )?;
        Ok(())
    }

    pub fn list_applications(&self, job_id: Option<&str>, status: Option<&str>) -> Result<Vec<JobApplication>, E> {
        let c = self.conn()?;
        let mut sql = "SELECT id, job_id, candidate_id, name, email, phone, resume_text, resume_file_url, cover_letter, status, created_at, updated_at FROM job_applications WHERE 1=1".to_string();
        let mut p: Vec<Box<dyn rusqlite::ToSql>> = vec![];
        if let Some(jid) = job_id {
            sql.push_str(" AND job_id=?");
            p.push(Box::new(jid.to_string()));
        }
        if let Some(s) = status {
            sql.push_str(" AND status=?");
            p.push(Box::new(s.to_string()));
        }
        sql.push_str(" ORDER BY created_at DESC");
        let mut stmt = c.prepare(&sql)?;
        let refs: Vec<&dyn rusqlite::ToSql> = p.iter().map(|b| b.as_ref()).collect();
        let rows = stmt.query_map(refs.as_slice(), |row| {
            Ok(JobApplication {
                id: row.get(0)?,
                job_id: row.get(1)?,
                candidate_id: row.get(2)?,
                name: row.get(3)?,
                email: row.get(4)?,
                phone: row.get(5)?,
                resume_text: row.get(6)?,
                resume_file_url: row.get(7)?,
                cover_letter: row.get(8)?,
                status: row.get(9)?,
                created_at: row.get(10)?,
                updated_at: row.get(11)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn application_by_id(&self, id: &str) -> Result<JobApplication, E> {
        self.conn()?.query_row(
            "SELECT id, job_id, candidate_id, name, email, phone, resume_text, resume_file_url, cover_letter, status, created_at, updated_at FROM job_applications WHERE id=?",
            params![id],
            |row| {
                Ok(JobApplication {
                    id: row.get(0)?,
                    job_id: row.get(1)?,
                    candidate_id: row.get(2)?,
                    name: row.get(3)?,
                    email: row.get(4)?,
                    phone: row.get(5)?,
                    resume_text: row.get(6)?,
                    resume_file_url: row.get(7)?,
                    cover_letter: row.get(8)?,
                    status: row.get(9)?,
                    created_at: row.get(10)?,
                    updated_at: row.get(11)?,
                })
            },
        ).map_err(|_| E("application not found".into()))
    }

    pub fn create_application(&self, a: &JobApplication) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO job_applications (id, job_id, candidate_id, name, email, phone, resume_text, resume_file_url, cover_letter, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
            params![a.id, a.job_id, a.candidate_id, a.name, a.email, a.phone, a.resume_text, a.resume_file_url, a.cover_letter, a.status, a.created_at, a.updated_at],
        )?;
        Ok(())
    }

    pub fn update_application_status(&self, id: &str, status: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let affected = self.conn()?.execute(
            "UPDATE job_applications SET status=?, updated_at=? WHERE id=?",
            params![status, now, id],
        )?;
        if affected == 0 {
            return Err(E("application not found".into()));
        }
        Ok(())
    }

    pub fn list_users(&self, role: Option<&str>) -> Result<Vec<User>, E> {
        let c = self.conn()?;
        let map_row = |row: &rusqlite::Row| -> rusqlite::Result<User> {
            Ok(User {
                id: row.get(0)?,
                email: row.get(1)?,
                phone: row.get(2)?,
                password_hash: row.get(3)?,
                role: row.get(4)?,
                name: row.get(5)?,
                company_id: row.get(6)?,
                language_pref: row.get(7)?,
                active: row.get(8)?,
                created_at: row.get(9)?,
                updated_at: row.get(10)?,
            })
        };
        match role {
            Some(r) => {
                let mut stmt = c.prepare(
                    "SELECT id, email, phone, password_hash, role, name, company_id, language_pref, active, created_at, updated_at FROM users WHERE role = ?1 ORDER BY created_at DESC"
                )?;
                let rows = stmt.query_map(params![r], map_row)?;
                Ok(rows.filter_map(|r| r.ok()).collect())
            }
            None => {
                let mut stmt = c.prepare(
                    "SELECT id, email, phone, password_hash, role, name, company_id, language_pref, active, created_at, updated_at FROM users ORDER BY created_at DESC"
                )?;
                let rows = stmt.query_map([], map_row)?;
                Ok(rows.filter_map(|r| r.ok()).collect())
            }
        }
    }

    pub fn create_round(&self, r: &InterviewRound) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO interview_rounds (id, interview_id, round_number, round_type, scheduled_at, status, created_at) VALUES (?,?,?,?,?,?,?)",
            params![r.id, r.interview_id, r.round_number, r.round_type, r.scheduled_at, r.status, r.created_at],
        )?;
        Ok(())
    }

    pub fn list_rounds(&self, interview_id: &str) -> Result<Vec<InterviewRound>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, interview_id, round_number, round_type, scheduled_at, status, created_at FROM interview_rounds WHERE interview_id=?1 ORDER BY round_number"
        )?;
        let rows = stmt.query_map(params![interview_id], |row| {
            Ok(InterviewRound {
                id: row.get(0)?,
                interview_id: row.get(1)?,
                round_number: row.get(2)?,
                round_type: row.get(3)?,
                scheduled_at: row.get(4)?,
                status: row.get(5)?,
                created_at: row.get(6)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_assignment(&self, a: &InterviewAssignment) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO interview_assignments (id, interview_id, round_id, interviewer_id, status, created_at) VALUES (?,?,?,?,?,?)",
            params![a.id, a.interview_id, a.round_id, a.interviewer_id, a.status, a.created_at],
        )?;
        Ok(())
    }

    pub fn list_assignments(&self, interview_id: &str) -> Result<Vec<InterviewAssignment>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, interview_id, round_id, interviewer_id, status, created_at FROM interview_assignments WHERE interview_id=?1"
        )?;
        let rows = stmt.query_map(params![interview_id], |row| {
            Ok(InterviewAssignment {
                id: row.get(0)?,
                interview_id: row.get(1)?,
                round_id: row.get(2)?,
                interviewer_id: row.get(3)?,
                status: row.get(4)?,
                created_at: row.get(5)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_evaluation(&self, e: &InterviewEvaluation) -> Result<(), E> {
        let c = self.conn()?;
        let _ = c.execute(
            "DELETE FROM interview_evaluations WHERE interview_id = ?1 AND interviewer_id = ?2",
            params![e.interview_id, e.interviewer_id],
        );
        c.execute(
            "INSERT INTO interview_evaluations (id, interview_id, round_id, interviewer_id, skill_scores, overall_score, comments, recommendation, submitted_at, created_at) VALUES (?,?,?,?,?,?,?,?,?,?)",
            params![e.id, e.interview_id, e.round_id, e.interviewer_id, e.skill_scores, e.overall_score, e.comments, e.recommendation, e.submitted_at, e.created_at],
        )?;
        Ok(())
    }

    pub fn list_evaluations(&self, interview_id: &str) -> Result<Vec<InterviewEvaluation>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, interview_id, round_id, interviewer_id, skill_scores, overall_score, comments, recommendation, submitted_at, created_at FROM interview_evaluations WHERE interview_id=?1"
        )?;
        let rows = stmt.query_map(params![interview_id], |row| {
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
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn evaluation_aggregate(&self, interview_id: &str) -> Result<Value, E> {
        let evals = self.list_evaluations(interview_id)?;
        if evals.is_empty() {
            return Ok(serde_json::json!({
                "interview_id": interview_id,
                "total_evaluations": 0,
                "average_score": serde_json::Value::Null,
                "recommendations": {},
                "evaluations": [],
            }));
        }
        let scores: Vec<f64> = evals.iter().filter_map(|e| e.overall_score).collect();
        let avg = if scores.is_empty() { None } else { Some(scores.iter().sum::<f64>() / scores.len() as f64) };
        let mut recs = std::collections::HashMap::new();
        for e in &evals {
            *recs.entry(e.recommendation.clone()).or_insert(0i64) += 1;
        }
        Ok(serde_json::json!({
            "interview_id": interview_id,
            "total_evaluations": evals.len(),
            "average_score": avg,
            "recommendations": recs,
            "evaluations": evals,
        }))
    }

    pub fn update_docusign_status(&self, envelope_id: &str, status: &str, webhook_data: Option<&str>) -> Result<(), E> {
        let c = self.conn()?;
        c.execute(
            "UPDATE documents SET docusign_status=?1, docusign_webhook_data=?2 WHERE docusign_envelope_id=?3",
            params![status, webhook_data, envelope_id],
        )?;
        // Also update employee docusign_status if an employee has this envelope_id
        let _ = c.execute(
            "UPDATE employees SET docusign_status=?1 WHERE docusign_envelope_id=?2",
            params![status, envelope_id],
        );
        Ok(())
    }

    pub fn update_sf_sync_status(&self, employee_id: &str, status: &str) -> Result<(), E> {
        self.conn()?.execute(
            "UPDATE employees SET sf_sync_status=?1, sf_synced_at=datetime('now') WHERE id=?2",
            params![status, employee_id],
        )?;
        Ok(())
    }

    pub fn pending_sf_sync(&self) -> Result<Vec<Employee>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, employee_code, company_id, department, position, hired_at, contract_start, contract_end, training_completed, ehs_certified, status, created_at, updated_at, sf_sync_status, sf_synced_at, docusign_envelope_id, docusign_status FROM employees WHERE sf_sync_status IS NULL OR sf_sync_status='pending'"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Employee {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                employee_code: row.get(2)?,
                company_id: row.get(3)?,
                department: row.get(4)?,
                position: row.get(5)?,
                hired_at: row.get(6)?,
                contract_start: row.get(7)?,
                contract_end: row.get(8)?,
                training_completed: row.get(9)?,
                ehs_certified: row.get(10)?,
                status: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                sf_sync_status: row.get(14)?,
                sf_synced_at: row.get(15)?,
                docusign_envelope_id: row.get(16)?,
                docusign_status: row.get(17)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_all_employees(&self) -> Result<Vec<Employee>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, employee_code, company_id, department, position, hired_at, contract_start, contract_end, training_completed, ehs_certified, status, created_at, updated_at, sf_sync_status, sf_synced_at, docusign_envelope_id, docusign_status FROM employees ORDER BY hired_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Employee {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                employee_code: row.get(2)?,
                company_id: row.get(3)?,
                department: row.get(4)?,
                position: row.get(5)?,
                hired_at: row.get(6)?,
                contract_start: row.get(7)?,
                contract_end: row.get(8)?,
                training_completed: row.get(9)?,
                ehs_certified: row.get(10)?,
                status: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
                sf_sync_status: row.get(14)?,
                sf_synced_at: row.get(15)?,
                docusign_envelope_id: row.get(16)?,
                docusign_status: row.get(17)?,
            })
        })?;
        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| E(e.to_string()))?);
        }
        Ok(result)
    }

    pub fn list_all_candidates(&self) -> Result<Vec<Candidate>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, user_id, agency_id, name, phone, email, id_number, country_code, date_of_birth, gender, nationality, address, city, province, postal_code, education_level, education_school, education_major, education_year, work_experience_years, previous_employer, previous_position, previous_duration, previous_duties, languages, certifications, emergency_contact_name, emergency_contact_phone, emergency_contact_relation, skills, resume_text, resume_file_url, profile_photo_url, status, source, notes, created_at, updated_at FROM candidates ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Candidate {
                id: row.get(0)?,
                user_id: row.get(1)?,
                agency_id: row.get(2)?,
                name: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                id_number: row.get(6)?,
                country_code: row.get(7)?,
                date_of_birth: row.get(8)?,
                gender: row.get(9)?,
                nationality: row.get(10)?,
                address: row.get(11)?,
                city: row.get(12)?,
                province: row.get(13)?,
                postal_code: row.get(14)?,
                education_level: row.get(15)?,
                education_school: row.get(16)?,
                education_major: row.get(17)?,
                education_year: row.get(18)?,
                work_experience_years: row.get(19)?,
                previous_employer: row.get(20)?,
                previous_position: row.get(21)?,
                previous_duration: row.get(22)?,
                previous_duties: row.get(23)?,
                languages: row.get(24)?,
                certifications: row.get(25)?,
                emergency_contact_name: row.get(26)?,
                emergency_contact_phone: row.get(27)?,
                emergency_contact_relation: row.get(28)?,
                skills: row.get(29)?,
                resume_text: row.get(30)?,
                resume_file_url: row.get(31)?,
                profile_photo_url: row.get(32)?,
                status: row.get(33)?,
                source: row.get(34)?,
                notes: row.get(35)?,
                created_at: row.get(36)?,
                updated_at: row.get(37)?,
            })
        })?;
        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| E(e.to_string()))?);
        }
        Ok(result)
    }

    pub fn list_all_interviews(&self) -> Result<Vec<Interview>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, job_title, job_id, scheduled_at, check_in_at, interviewer_id, skill_scores, overall_score, comments, status, result, created_at, updated_at FROM interviews ORDER BY created_at DESC"
        )?;
        let rows = stmt.query_map([], |row| {
            Ok(Interview {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                job_title: row.get(2)?,
                job_id: row.get(3)?,
                scheduled_at: row.get(4)?,
                check_in_at: row.get(5)?,
                interviewer_id: row.get(6)?,
                skill_scores: row.get(7)?,
                overall_score: row.get(8)?,
                comments: row.get(9)?,
                status: row.get(10)?,
                result: row.get(11)?,
                created_at: row.get(12)?,
                updated_at: row.get(13)?,
            })
        })?;
        let mut result = Vec::new();
        for row in rows {
            result.push(row.map_err(|e| E(e.to_string()))?);
        }
        Ok(result)
    }

    pub fn enhanced_stats(&self) -> Result<Value, E> {
        let c = self.conn()?;

        // Basic candidate stats
        let total_candidates: i64 = c.query_row("SELECT COUNT(*) FROM candidates", [], |r| r.get(0))?;

        // Candidates by status
        let mut by_status = HashMap::new();
        let mut stmt = c.prepare("SELECT status, COUNT(*) FROM candidates GROUP BY status")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;
        for row in rows.flatten() {
            by_status.insert(row.0, row.1);
        }

        // Candidates by source
        let mut by_source = HashMap::new();
        let mut stmt = c.prepare("SELECT source, COUNT(*) FROM candidates GROUP BY source")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;
        for row in rows.flatten() {
            by_source.insert(row.0, row.1);
        }

        // Jobs stats
        let active_jobs: i64 = c.query_row("SELECT COUNT(*) FROM jobs WHERE status='active'", [], |r| r.get(0))?;
        let total_jobs: i64 = c.query_row("SELECT COUNT(*) FROM jobs", [], |r| r.get(0))?;
        let total_views: i64 = c.query_row("SELECT COALESCE(SUM(views), 0) FROM jobs", [], |r| r.get(0))?;

        // Applications stats
        let total_apps: i64 = c.query_row("SELECT COUNT(*) FROM job_applications", [], |r| r.get(0))?;
        let mut apps_by_status = HashMap::new();
        let mut stmt = c.prepare("SELECT status, COUNT(*) FROM job_applications GROUP BY status")?;
        let rows = stmt.query_map([], |row| {
            Ok((row.get::<_, String>(0)?, row.get::<_, i64>(1)?))
        })?;
        for row in rows.flatten() {
            apps_by_status.insert(row.0, row.1);
        }

        // Interview stats
        let total_interviews: i64 = c.query_row("SELECT COUNT(*) FROM interviews", [], |r| r.get(0))?;
        let completed_interviews: i64 = c.query_row("SELECT COUNT(*) FROM interviews WHERE status='completed'", [], |r| r.get(0))?;

        // Employee stats
        let total_employees: i64 = c.query_row("SELECT COUNT(*) FROM employees", [], |r| r.get(0))?;
        let active_employees: i64 = c.query_row("SELECT COUNT(*) FROM employees WHERE status='active'", [], |r| r.get(0))?;

        // Funnel: hired, rejected
        let hired: i64 = c.query_row("SELECT COUNT(*) FROM candidates WHERE status='hired'", [], |r| r.get(0))?;
        let rejected: i64 = c.query_row("SELECT COUNT(*) FROM candidates WHERE status='rejected'", [], |r| r.get(0))?;
        let conversion_rate = if total_candidates > 0 {
            format!("{:.1}%", (hired as f64 / total_candidates as f64) * 100.0)
        } else {
            "0.0%".to_string()
        };

        // Average time-to-hire (days between candidate creation and employee hired_at)
        let avg_days: Option<f64> = c.query_row(
            "SELECT AVG(julianday(e.hired_at) - julianday(c.created_at)) FROM employees e JOIN candidates c ON e.candidate_id = c.id WHERE e.hired_at IS NOT NULL",
            [],
            |r| r.get(0),
        ).ok().flatten();

        // Interview evaluations stats
        let total_evaluations: i64 = c.query_row("SELECT COUNT(*) FROM interview_evaluations", [], |r| r.get(0))?;
        let avg_eval_score: Option<f64> = c.query_row(
            "SELECT AVG(overall_score) FROM interview_evaluations WHERE overall_score IS NOT NULL",
            [],
            |r| r.get(0),
        ).ok().flatten();

        Ok(serde_json::json!({
            "total_candidates": total_candidates,
            "by_status": by_status,
            "by_source": by_source,
            "jobs": {
                "active": active_jobs,
                "total": total_jobs,
                "total_views": total_views,
            },
            "applications": {
                "total": total_apps,
                "by_status": apps_by_status,
            },
            "interviews": {
                "total": total_interviews,
                "completed": completed_interviews,
            },
            "employees": {
                "total": total_employees,
                "active": active_employees,
            },
            "funnel": {
                "hired": hired,
                "rejected": rejected,
                "conversion_rate": conversion_rate,
                "avg_time_to_hire_days": avg_days,
            },
            "evaluations": {
                "total": total_evaluations,
                "average_score": avg_eval_score,
            },
        }))
    }

    pub fn create_candidate_education(&self, e: &CandidateEducation) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_educations (id, candidate_id, level, school, major, graduation_year, notes, created_at) VALUES (?,?,?,?,?,?,?,?)",
            params![e.id, e.candidate_id, e.level, e.school, e.major, e.graduation_year, e.notes, e.created_at],
        )?;
        Ok(())
    }

    pub fn list_candidate_educations(&self, candidate_id: &str) -> Result<Vec<CandidateEducation>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, level, school, major, graduation_year, notes, created_at FROM candidate_educations WHERE candidate_id=? ORDER BY graduation_year DESC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateEducation {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                level: row.get(2)?,
                school: row.get(3)?,
                major: row.get(4)?,
                graduation_year: row.get(5)?,
                notes: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn delete_candidate_education(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_educations WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate education not found".into()));
        }
        Ok(())
    }

    pub fn create_candidate_work_experience(&self, w: &CandidateWorkExperience) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_work_experiences (id, candidate_id, employer, position, start_date, end_date, duration, duties, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
            params![w.id, w.candidate_id, w.employer, w.position, w.start_date, w.end_date, w.duration, w.duties, w.created_at],
        )?;
        Ok(())
    }

    pub fn list_candidate_work_experiences(&self, candidate_id: &str) -> Result<Vec<CandidateWorkExperience>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, employer, position, start_date, end_date, duration, duties, created_at FROM candidate_work_experiences WHERE candidate_id=? ORDER BY start_date DESC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateWorkExperience {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                employer: row.get(2)?,
                position: row.get(3)?,
                start_date: row.get(4)?,
                end_date: row.get(5)?,
                duration: row.get(6)?,
                duties: row.get(7)?,
                created_at: row.get(8)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn delete_candidate_work_experience(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_work_experiences WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate work experience not found".into()));
        }
        Ok(())
    }

    pub fn enqueue_candidate(&self, candidate_id: &str, job_id: Option<&str>) -> Result<InterviewQueue, E> {
        let c = self.conn()?;
        let today = chrono::Utc::now().format("%Y-%m-%d").to_string();
        let max_queue: i64 = c.query_row(
            "SELECT COALESCE(MAX(queue_number), 0) FROM interview_queue WHERE job_id=?1 AND date(created_at)=?2",
            params![job_id, today],
            |r| r.get(0),
        )?;
        let queue_number = max_queue + 1;
        let id = uuid::Uuid::new_v4().to_string();
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        c.execute(
            "INSERT INTO interview_queue (id, candidate_id, job_id, queue_number, status, created_at) VALUES (?1,?2,?3,?4,'waiting',?5)",
            params![id, candidate_id, job_id, queue_number, now],
        )?;
        Ok(InterviewQueue {
            id,
            candidate_id: candidate_id.to_string(),
            job_id: job_id.map(String::from),
            queue_number,
            status: "waiting".to_string(),
            called_at: None,
            completed_at: None,
            created_at: now,
        })
    }

    pub fn call_next(&self, job_id: &str) -> Result<InterviewQueue, E> {
        let c = self.conn()?;
        let row = c.query_row(
            "SELECT id, candidate_id, job_id, queue_number, status, called_at, completed_at, created_at FROM interview_queue WHERE job_id=?1 AND status='waiting' ORDER BY queue_number ASC LIMIT 1",
            params![job_id],
            |row| {
                Ok(InterviewQueue {
                    id: row.get(0)?,
                    candidate_id: row.get(1)?,
                    job_id: row.get(2)?,
                    queue_number: row.get(3)?,
                    status: row.get(4)?,
                    called_at: row.get(5)?,
                    completed_at: row.get(6)?,
                    created_at: row.get(7)?,
                })
            },
        ).map_err(|_| E("no waiting candidates in queue".into()))?;
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        c.execute(
            "UPDATE interview_queue SET status='called', called_at=?1 WHERE id=?2",
            params![now, row.id],
        )?;
        Ok(InterviewQueue {
            status: "called".to_string(),
            called_at: Some(now),
            ..row
        })
    }

    pub fn list_queue(&self, job_id: Option<&str>, status: Option<&str>) -> Result<Vec<InterviewQueue>, E> {
        let c = self.conn()?;
        let mut sql = "SELECT id, candidate_id, job_id, queue_number, status, called_at, completed_at, created_at FROM interview_queue WHERE 1=1".to_string();
        let mut p: Vec<Box<dyn rusqlite::ToSql>> = vec![];
        if let Some(j) = job_id {
            sql.push_str(" AND job_id=?");
            p.push(Box::new(j.to_string()));
        }
        if let Some(s) = status {
            sql.push_str(" AND status=?");
            p.push(Box::new(s.to_string()));
        }
        sql.push_str(" ORDER BY queue_number ASC");
        let mut stmt = c.prepare(&sql)?;
        let refs: Vec<&dyn rusqlite::ToSql> = p.iter().map(|b| b.as_ref()).collect();
        let rows = stmt.query_map(refs.as_slice(), |row| {
            Ok(InterviewQueue {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                job_id: row.get(2)?,
                queue_number: row.get(3)?,
                status: row.get(4)?,
                called_at: row.get(5)?,
                completed_at: row.get(6)?,
                created_at: row.get(7)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn update_queue_status(&self, id: &str, status: &str) -> Result<(), E> {
        let now = chrono::Utc::now().format("%Y-%m-%dT%H:%M:%S").to_string();
        let mut extra = String::new();
        let mut extra_val: Option<String> = None;
        if status == "completed" {
            extra = ", completed_at=?".to_string();
            extra_val = Some(now.clone());
        }
        let sql = format!("UPDATE interview_queue SET status=?1{} WHERE id=?2", extra);
        let affected = match extra_val {
            Some(ref val) => self.conn()?.execute(&sql, params![status, val, id])?,
            None => self.conn()?.execute(&sql, params![status, id])?,
        };
        if affected == 0 {
            return Err(E("queue entry not found".into()));
        }
        Ok(())
    }

    pub fn list_candidate_skills(&self, candidate_id: &str) -> Result<Vec<CandidateSkill>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, skill_name, proficiency, years_of_experience FROM candidate_skills WHERE candidate_id=? ORDER BY skill_name"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateSkill {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                skill_name: row.get(2)?,
                proficiency: row.get(3)?,
                years_of_experience: row.get(4)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_candidate_skill(&self, s: &CandidateSkill) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_skills (id, candidate_id, skill_name, proficiency, years_of_experience) VALUES (?1,?2,?3,?4,?5)",
            params![s.id, s.candidate_id, s.skill_name, s.proficiency, s.years_of_experience],
        )?;
        Ok(())
    }

    pub fn delete_candidate_skill(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_skills WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate skill not found".into()));
        }
        Ok(())
    }

    pub fn list_candidate_certificates(&self, candidate_id: &str) -> Result<Vec<CandidateCertificate>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, certificate_name, issuing_authority, issue_date, expiry_date, certificate_number FROM candidate_certificates WHERE candidate_id=? ORDER BY issue_date DESC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateCertificate {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                certificate_name: row.get(2)?,
                issuing_authority: row.get(3)?,
                issue_date: row.get(4)?,
                expiry_date: row.get(5)?,
                certificate_number: row.get(6)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_candidate_certificate(&self, c: &CandidateCertificate) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_certificates (id, candidate_id, certificate_name, issuing_authority, issue_date, expiry_date, certificate_number) VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![c.id, c.candidate_id, c.certificate_name, c.issuing_authority, c.issue_date, c.expiry_date, c.certificate_number],
        )?;
        Ok(())
    }

    pub fn delete_candidate_certificate(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_certificates WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate certificate not found".into()));
        }
        Ok(())
    }

    // ── Candidate Addresses ──

    pub fn list_candidate_addresses(&self, candidate_id: &str) -> Result<Vec<CandidateAddress>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, address_type, is_primary, country, state, city, district, street, postal_code, sort_order FROM candidate_addresses WHERE candidate_id=? ORDER BY sort_order ASC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateAddress {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                address_type: row.get(2)?,
                is_primary: row.get(3)?,
                country: row.get(4)?,
                state: row.get(5)?,
                city: row.get(6)?,
                district: row.get(7)?,
                street: row.get(8)?,
                postal_code: row.get(9)?,
                sort_order: row.get(10)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_candidate_address(&self, a: &CandidateAddress) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_addresses (id, candidate_id, address_type, is_primary, country, state, city, district, street, postal_code, sort_order) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11)",
            params![a.id, a.candidate_id, a.address_type, a.is_primary, a.country, a.state, a.city, a.district, a.street, a.postal_code, a.sort_order],
        )?;
        Ok(())
    }

    pub fn delete_candidate_address(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_addresses WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate address not found".into()));
        }
        Ok(())
    }

    // ── Candidate Family Members ──

    pub fn list_candidate_family_members(&self, candidate_id: &str) -> Result<Vec<CandidateFamilyMember>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, name, relationship, phone, email, is_emergency_contact, is_default, address, sort_order FROM candidate_family_members WHERE candidate_id=? ORDER BY sort_order ASC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateFamilyMember {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                name: row.get(2)?,
                relationship: row.get(3)?,
                phone: row.get(4)?,
                email: row.get(5)?,
                is_emergency_contact: row.get(6)?,
                is_default: row.get(7)?,
                address: row.get(8)?,
                sort_order: row.get(9)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_candidate_family_member(&self, m: &CandidateFamilyMember) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_family_members (id, candidate_id, name, relationship, phone, email, is_emergency_contact, is_default, address, sort_order) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)",
            params![m.id, m.candidate_id, m.name, m.relationship, m.phone, m.email, m.is_emergency_contact, m.is_default, m.address, m.sort_order],
        )?;
        Ok(())
    }

    pub fn delete_candidate_family_member(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_family_members WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate family member not found".into()));
        }
        Ok(())
    }

    // ── Candidate Bank Accounts ──

    pub fn list_candidate_bank_accounts(&self, candidate_id: &str) -> Result<Vec<CandidateBankAccount>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, bank_name, account_number, account_holder, account_type, bank_country, currency, swift_code, iban, is_primary, sort_order FROM candidate_bank_accounts WHERE candidate_id=? ORDER BY sort_order ASC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateBankAccount {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                bank_name: row.get(2)?,
                account_number: row.get(3)?,
                account_holder: row.get(4)?,
                account_type: row.get(5)?,
                bank_country: row.get(6)?,
                currency: row.get(7)?,
                swift_code: row.get(8)?,
                iban: row.get(9)?,
                is_primary: row.get(10)?,
                sort_order: row.get(11)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_candidate_bank_account(&self, b: &CandidateBankAccount) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_bank_accounts (id, candidate_id, bank_name, account_number, account_holder, account_type, bank_country, currency, swift_code, iban, is_primary, sort_order) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)",
            params![b.id, b.candidate_id, b.bank_name, b.account_number, b.account_holder, b.account_type, b.bank_country, b.currency, b.swift_code, b.iban, b.is_primary, b.sort_order],
        )?;
        Ok(())
    }

    pub fn delete_candidate_bank_account(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_bank_accounts WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate bank account not found".into()));
        }
        Ok(())
    }

    // ── Candidate Country Fields ──

    pub fn list_candidate_country_fields(&self, candidate_id: &str) -> Result<Vec<CandidateCountryField>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare(
            "SELECT id, candidate_id, country, field_name, field_value, field_type, sort_order FROM candidate_country_fields WHERE candidate_id=? ORDER BY sort_order ASC"
        )?;
        let rows = stmt.query_map(params![candidate_id], |row| {
            Ok(CandidateCountryField {
                id: row.get(0)?,
                candidate_id: row.get(1)?,
                country: row.get(2)?,
                field_name: row.get(3)?,
                field_value: row.get(4)?,
                field_type: row.get(5)?,
                sort_order: row.get(6)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn create_candidate_country_field(&self, f: &CandidateCountryField) -> Result<(), E> {
        self.conn()?.execute(
            "INSERT INTO candidate_country_fields (id, candidate_id, country, field_name, field_value, field_type, sort_order) VALUES (?1,?2,?3,?4,?5,?6,?7)",
            params![f.id, f.candidate_id, f.country, f.field_name, f.field_value, f.field_type, f.sort_order],
        )?;
        Ok(())
    }

    pub fn delete_candidate_country_field(&self, id: &str) -> Result<(), E> {
        let affected = self.conn()?.execute("DELETE FROM candidate_country_fields WHERE id=?", params![id])?;
        if affected == 0 {
            return Err(E("candidate country field not found".into()));
        }
        Ok(())
    }

    pub fn list_countries(&self) -> Result<Vec<Country>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare("SELECT id, code, name, phone_code, has_special_fields, is_active FROM countries ORDER BY name")?;
        let rows = stmt.query_map([], |row| {
            Ok(Country {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                phone_code: row.get(3)?,
                has_special_fields: row.get(4)?,
                is_active: row.get(5)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_currencies(&self) -> Result<Vec<Currency>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare("SELECT id, code, name, symbol FROM currencies ORDER BY name")?;
        let rows = stmt.query_map([], |row| {
            Ok(Currency {
                id: row.get(0)?,
                code: row.get(1)?,
                name: row.get(2)?,
                symbol: row.get(3)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_departments(&self) -> Result<Vec<Department>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare("SELECT id, name, parent_id, is_active FROM departments ORDER BY name")?;
        let rows = stmt.query_map([], |row| {
            Ok(Department {
                id: row.get(0)?,
                name: row.get(1)?,
                parent_id: row.get(2)?,
                is_active: row.get(3)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_locations(&self) -> Result<Vec<Location>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare("SELECT id, name, country_id, city, address, is_active FROM locations ORDER BY name")?;
        let rows = stmt.query_map([], |row| {
            Ok(Location {
                id: row.get(0)?,
                name: row.get(1)?,
                country_id: row.get(2)?,
                city: row.get(3)?,
                address: row.get(4)?,
                is_active: row.get(5)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }

    pub fn list_job_categories(&self) -> Result<Vec<JobCategory>, E> {
        let c = self.conn()?;
        let mut stmt = c.prepare("SELECT id, name, is_active FROM job_categories ORDER BY name")?;
        let rows = stmt.query_map([], |row| {
            Ok(JobCategory {
                id: row.get(0)?,
                name: row.get(1)?,
                is_active: row.get(2)?,
            })
        })?;
        Ok(rows.filter_map(|r| r.ok()).collect())
    }
}

fn parse_csv_line(line: &str) -> Vec<String> {
    let mut fields = vec![];
    let mut in_quotes = false;
    let mut field = String::new();
    for ch in line.chars() {
        match ch {
            '"' => in_quotes = !in_quotes,
            ',' if !in_quotes => {
                fields.push(field.trim().to_string());
                field.clear();
            }
            _ => field.push(ch),
        }
    }
    fields.push(field.trim().to_string());
    fields
}
