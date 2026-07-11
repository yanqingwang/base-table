# Easy Hire v2.0 Upgrade Plan
# Based on 设计需求文档 v2.0 (2026-05-24)

## Priority 1: Schema & Status Changes (Backend)

### 1.1 Status Enum Update
- candidates.status: new→screening→queue_waiting→interviewing→evaluated→offered→document_signing→signed→pre_onboarding→ready_to_sync→synced→hired (add rejected everywhere)
- Add: id_type, degree enum values
- interview_queue: waiting→called→interviewing→completed→skipped→absent

### 1.2 New Master Data Tables
- countries (id, code, name, phone_code, has_special_fields, is_active)
- currencies (id, code, name, symbol)  
- departments (id, name, parent_id, is_active)
- locations (id, name, country_id, city, address, is_active)
- job_categories (id, name, is_active)

### 1.3 New Business Tables
- job_required_skills (job_id, skill_name, weight)
- job_board_postings (job_id, board_id, external_posting_id)
- interview_queue (candidate_id, job_id, queue_number, status, called_at)
- interview_interviewers (interview_id, user_id, role)
- evaluation_skill_scores (evaluation_id, skill_name, score)
- candidate_skills (proper table: candidate_id, skill_name, proficiency, years)
- candidate_certificates (candidate_id, cert_name, issuing_authority, dates)
- candidate_addresses (candidate_id, address_type, is_primary, country, state...)
- candidate_family_members (candidate_id, name, relationship, is_emergency...)
- candidate_bank_accounts (candidate_id, bank_name, account_number...)
- candidate_country_fields (candidate_id, country, field_name, field_value)

### 1.4 Existing Table Modifications
- jobs: add department_id, location_id, category_id, headcount, hiring_manager_id
- interviews: add round, interview_type, location, meeting_link
- evaluations: add UNIQUE(interview_id, interviewer_id)
- documents: add template_id, envelope_id, signing_provider

## Priority 2: Frontend Pages

### 2.1 Interview Queue / Calling System (KEY NEW)
- QueueManager page: display waiting queue, call next, skip/absent
- QueueDisplay screen: big screen showing current number + waiting list

### 2.2 Master Data Management
- Departments/Locations/Countries/Currencies CRUD pages

### 2.3 Pre-Onboarding Data Collection
- Address management, family members, bank accounts forms on CandidateDetail

### 2.4 Status Display Updates
- Updated status tags across all pages for new status values

## Priority 3: Deployment Manual
- Complete setup guide with architecture, ports, dependencies, env vars
