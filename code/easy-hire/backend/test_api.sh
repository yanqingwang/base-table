#!/bin/bash
# Easy Hire Comprehensive API Integration Test Script
BASE="http://localhost:3201"
PASS=0
FAIL=0
ERRORS=""

assert() {
    local desc="$1" expected="$2" actual="$3"
    if echo "$actual" | grep -q "$expected"; then
        echo "  ✅ PASS: $desc"
        ((PASS++))
    else
        echo "  ❌ FAIL: $desc (expected to contain: $expected)"
        echo "     Actual: $actual"
        ((FAIL++))
        ERRORS="$ERRORS\n  - $desc"
    fi
}

echo ""
echo "==================================="
echo "  Easy Hire Integration Tests"
echo "==================================="
echo ""

# ============================================
# 1. HEALTH CHECK
# ============================================
echo "--- 1. Health Check ---"
R=$(curl -s $BASE/api/v1/health)
assert "Health check returns OK" "OK" "$R"

# ============================================
# 2. AUTH
# ============================================
echo ""
echo "--- 2. Authentication ---"

# Register admin
R=$(curl -s -X POST $BASE/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Admin","email":"admin@final.com","password":"password123","role":"admin"}')
TOKEN=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])" 2>/dev/null)
assert "Register admin returns token" "eyJ" "$TOKEN"

# Login
R=$(curl -s -X POST $BASE/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"admin@final.com","password":"password123"}')
assert "Login works" "token" "$R"

# Register interviewer
R=$(curl -s -X POST $BASE/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"name":"Interviewer","email":"ivr@final.com","password":"password123","role":"manager"}')
IV_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['user']['id'])" 2>/dev/null)
assert "Register interviewer" "$IV_ID" "$R"

# ============================================
# 3. JOBS MODULE
# ============================================
echo ""
echo "--- 3. Jobs Module ---"

# Create job
R=$(curl -s -X POST $BASE/api/v1/jobs \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Full Stack Developer","description":"Build web apps","location":"Singapore","salary_min":6000,"salary_max":10000,"salary_currency":"SGD","department":"Engineering","requirements":"3+ years","responsibilities":"Full stack dev","employment_type":"full-time","status":"active"}')
JOB_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
assert "Create job returns ID" "$JOB_ID" "$R"
assert "Job has active status" "active" "$R"

# Public job listing
R=$(curl -s $BASE/api/v1/jobs/public)
assert "Public listing shows job" "Full Stack" "$R"

# Public job detail
R=$(curl -s "$BASE/api/v1/jobs/public/$JOB_ID")
assert "Public job detail" "Build web apps" "$R"

# Apply to job
R=$(curl -s -X POST $BASE/api/v1/jobs/apply \
  -H 'Content-Type: application/json' \
  -d "{\"job_id\":\"$JOB_ID\",\"name\":\"Jane Smith\",\"email\":\"jane@apply.com\",\"phone\":\"+6511111111\",\"resume_text\":\"Experienced dev\",\"cover_letter\":\"Please hire me\"}")
APP_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
assert "Application created" "$APP_ID" "$R"
assert "Application status is applied" "applied" "$R"

# Update application status
R=$(curl -s -X PUT "$BASE/api/v1/jobs/applications/$APP_ID/status" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"status":"screened"}')
assert "Application status updated" "screened" "$R"

# Update job
R=$(curl -s -X PUT "$BASE/api/v1/jobs/$JOB_ID" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"title":"Full Stack Developer (Senior)","salary_max":15000}')
assert "Job updated" "Senior" "$R"

# Admin list jobs
R=$(curl -s "$BASE/api/v1/jobs" -H "Authorization: Bearer $TOKEN")
assert "Admin lists jobs" "Full Stack" "$R"

# Job applications list
R=$(curl -s "$BASE/api/v1/jobs/$JOB_ID/applications" -H "Authorization: Bearer $TOKEN")
assert "List applications" "Jane" "$R"

# ============================================
# 4. CANDIDATES
# ============================================
echo ""
echo "--- 4. Candidates ---"

# Create candidate
R=$(curl -s -X POST $BASE/api/v1/candidates \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"name":"Bob Builder","email":"bob@test.com","phone":"+6522222222","skills":"[\"Rust\",\"React\"]"}')
CAND_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
assert "Candidate created" "$CAND_ID" "$R"

# ============================================
# 5. ENHANCED INTERVIEWS
# ============================================
echo ""
echo "--- 5. Enhanced Interviews ---"

# Create interview
R=$(curl -s -X POST $BASE/api/v1/interviews \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"candidate_id\":\"$CAND_ID\",\"scheduled_date\":\"2026-06-15\",\"interview_type\":\"technical\"}")
IVIEW_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
assert "Interview created" "$IVIEW_ID" "$R"

# Create interview round
R=$(curl -s -X POST "$BASE/api/v1/interviews/$IVIEW_ID/rounds" \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"interview_id\":\"$IVIEW_ID\",\"round_number\":1,\"round_type\":\"technical\"}")
ROUND_ID=$(echo "$R" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])" 2>/dev/null)
assert "Round created" "$ROUND_ID" "$R"

# Assign interviewer
R=$(curl -s -X POST $BASE/api/v1/interviews/assign \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"interview_id\":\"$IVIEW_ID\",\"round_id\":\"$ROUND_ID\",\"interviewer_id\":\"$IV_ID\"}")
assert "Interviewer assigned" "assigned" "$R"

# Submit evaluation 1
R=$(curl -s -X POST $BASE/api/v1/evaluations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"interview_id\":\"$IVIEW_ID\",\"round_id\":\"$ROUND_ID\",\"overall_score\":90,\"recommendation\":\"strong_hire\",\"comments\":\"Excellent!\"}")
assert "Evaluation 1 submitted" "strong_hire" "$R"

# Submit evaluation 2
R=$(curl -s -X POST $BASE/api/v1/evaluations \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d "{\"interview_id\":\"$IVIEW_ID\",\"round_id\":\"$ROUND_ID\",\"overall_score\":75,\"recommendation\":\"hire\",\"comments\":\"Good skills\"}")
assert "Evaluation 2 submitted" "hire" "$R"

# Aggregate evaluations
R=$(curl -s "$BASE/api/v1/interviews/$IVIEW_ID/aggregate" \
  -H "Authorization: Bearer $TOKEN")
assert "Aggregate has evaluations" "total_evaluations" "$R"
assert "Average score computed" "82.5" "$R"

# ============================================
# 6. DOCUSIGN
# ============================================
echo ""
echo "--- 6. DocuSign ---"

R=$(curl -s -X POST $BASE/api/v1/docusign/envelope \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"document_id":"doc-final","signer_email":"s@test.com","signer_name":"Signer"}')
assert "DocuSign create envelope" "envelope_id" "$R"
assert "DocuSign status sent" "sent" "$R"

R=$(curl -s -X POST $BASE/api/v1/docusign/batch \
  -H "Authorization: Bearer $TOKEN" \
  -H 'Content-Type: application/json' \
  -d '{"document_ids":["d1","d2"]}')
assert "DocuSign batch send" "total" "$R"

# ============================================
# 7. SUCCESSFACTORS
# ============================================
echo ""
echo "--- 7. SuccessFactors ---"

R=$(curl -s -X POST $BASE/api/v1/sf/sync-all \
  -H "Authorization: Bearer $TOKEN")
assert "SF sync-all" "total_pending" "$R"

# ============================================
# 8. DATA EXPORT
# ============================================
echo ""
echo "--- 8. Data Export ---"

R=$(curl -s -o /dev/null -w "%{http_code}" "$BASE/api/v1/export/candidates" \
  -H "Authorization: Bearer $TOKEN")
assert "Export candidates 200" "200" "$R"

R=$(curl -s "$BASE/api/v1/export/employees" \
  -H "Authorization: Bearer $TOKEN" | head -1)
assert "Export employees has headers" "id,code" "$R"

R=$(curl -s "$BASE/api/v1/export/interviews" \
  -H "Authorization: Bearer $TOKEN" | head -1)
assert "Export interviews has headers" "id,candidate_id" "$R"

# ============================================
# 9. ENHANCED DASHBOARD STATS
# ============================================
echo ""
echo "--- 9. Enhanced Stats ---"

R=$(curl -s "$BASE/api/v1/stats" -H "Authorization: Bearer $TOKEN")
assert "Stats has candidates" "total_candidates" "$R"
assert "Stats has jobs" "active" "$R"
assert "Stats has applications" "total" "$R"
assert "Stats has interviews" "completed" "$R"
assert "Stats has employees" "active" "$R"
assert "Stats has funnel" "conversion_rate" "$R"
assert "Stats has evaluations" "average_score" "$R"

# ============================================
# SUMMARY
# ============================================
echo ""
echo "==================================="
echo "  Test Results"
echo "==================================="
echo "  ✅ Passed: $PASS"
echo "  ❌ Failed: $FAIL"
echo "  Total:    $((PASS + FAIL))"
if [ "$FAIL" -gt 0 ]; then
    echo ""
    echo "  Failed tests:"
    echo -e "$ERRORS"
fi
echo "==================================="

# Exit with appropriate code
[ "$FAIL" -eq 0 ]
