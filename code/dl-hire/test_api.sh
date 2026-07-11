#!/bin/bash
# DL Hire API Comprehensive Test Suite
# Tests all endpoints against the product specification

BASE_URL="http://127.0.0.1:3200/api/v1"
PASS=0
FAIL=0
TOTAL=0

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

test_api() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local expected="$4"
    local token="${5:-}"
    local data="${6:-}"
    local content_type="${7:-application/json}"

    TOTAL=$((TOTAL + 1))

    local headers=()
    if [ -n "$token" ]; then
        headers+=("-H" "Authorization: Bearer $token")
    fi
    if [ -n "$data" ]; then
        headers+=("-H" "Content-Type: $content_type")
        headers+=("-d" "$data")
    fi

    local response
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "${BASE_URL}${endpoint}" "${headers[@]}")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "${BASE_URL}${endpoint}" "${headers[@]}")
    fi

    local http_code=$(echo "$response" | tail -1)
    local body=$(echo "$response" | sed '$d')

    if [ "$http_code" = "$expected" ]; then
        echo -e "${GREEN}PASS${NC} [$TOTAL] $name ($method $endpoint) -> $http_code"
        PASS=$((PASS + 1))
    else
        echo -e "${RED}FAIL${NC} [$TOTAL] $name ($method $endpoint) -> Expected $expected, got $http_code"
        echo "  Response: $body"
        FAIL=$((FAIL + 1))
    fi
}

echo "========================================="
echo "DL Hire API Test Suite"
echo "========================================="
echo ""

# ==========================================
# 1. System endpoints
# ==========================================
echo "--- System Endpoints ---"
test_api "Health check" "GET" "/health" "200"
test_api "Stats" "GET" "/stats" "200"

# ==========================================
# 2. Authentication
# ==========================================
echo ""
echo "--- Authentication ---"

# Register admin
ADMIN_RESP=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@dlhire.com","password":"admin123","name":"Admin User","role":"admin"}')
ADMIN_TOKEN=$(echo "$ADMIN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
ADMIN_USER_ID=$(echo "$ADMIN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['user']['id'])" 2>/dev/null)
if [ -n "$ADMIN_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC} [Register admin] -> Got token"
    PASS=$((PASS + 1))
    TOTAL=$((TOTAL + 1))
else
    echo -e "${RED}FAIL${NC} [Register admin] -> No token"
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
fi

# Register recruiter
REC_RESP=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"recruiter@dlhire.com","password":"recruit123","name":"Recruiter User","role":"recruiter"}')
REC_TOKEN=$(echo "$REC_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
REC_USER_ID=$(echo "$REC_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['user']['id'])" 2>/dev/null)
if [ -n "$REC_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC} [Register recruiter] -> Got token"
    PASS=$((PASS + 1))
    TOTAL=$((TOTAL + 1))
else
    echo -e "${RED}FAIL${NC} [Register recruiter] -> No token"
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
fi

# Register manager
MGR_RESP=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"manager@dlhire.com","password":"manager123","name":"Manager User","role":"manager"}')
MGR_TOKEN=$(echo "$MGR_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
MGR_USER_ID=$(echo "$MGR_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['user']['id'])" 2>/dev/null)
if [ -n "$MGR_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC} [Register manager] -> Got token"
    PASS=$((PASS + 1))
    TOTAL=$((TOTAL + 1))
else
    echo -e "${RED}FAIL${NC} [Register manager] -> No token"
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
fi

# Register agency
AGY_RESP=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"agency@dlhire.com","password":"agency123","name":"Agency User","role":"agency"}')
AGY_TOKEN=$(echo "$AGY_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
AGY_USER_ID=$(echo "$AGY_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['user']['id'])" 2>/dev/null)
if [ -n "$AGY_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC} [Register agency] -> Got token"
    PASS=$((PASS + 1))
    TOTAL=$((TOTAL + 1))
else
    echo -e "${RED}FAIL${NC} [Register agency] -> No token"
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
fi

# Register trainer
TRN_RESP=$(curl -s -X POST "${BASE_URL}/auth/register" \
    -H "Content-Type: application/json" \
    -d '{"email":"trainer@dlhire.com","password":"trainer123","name":"Trainer User","role":"trainer"}')
TRN_TOKEN=$(echo "$TRN_RESP" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
TRN_USER_ID=$(echo "$TRN_RESP" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d['user']['id'])" 2>/dev/null)
if [ -n "$TRN_TOKEN" ]; then
    echo -e "${GREEN}PASS${NC} [Register trainer] -> Got token"
    PASS=$((PASS + 1))
    TOTAL=$((TOTAL + 1))
else
    echo -e "${RED}FAIL${NC} [Register trainer] -> No token"
    FAIL=$((FAIL + 1))
    TOTAL=$((TOTAL + 1))
fi

# Login
test_api "Login" "POST" "/auth/login" "200" "" '{"email":"admin@dlhire.com","password":"admin123"}'
LOGIN_TOKEN=$(curl -s -X POST "${BASE_URL}/auth/login" \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@dlhire.com","password":"admin123"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Auth me
test_api "Auth me" "GET" "/auth/me" "200" "$LOGIN_TOKEN"

# Auth refresh
test_api "Auth refresh" "POST" "/auth/refresh" "200" "$LOGIN_TOKEN"

# ==========================================
# 3. Candidate Management (F-01)
# ==========================================
echo ""
echo "--- Candidate Management (F-01) ---"

# Create candidate
CAND_RESP=$(curl -s -X POST "${BASE_URL}/candidates" \
    -H "Authorization: Bearer $REC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Maria Santos","phone":"09171234567","email":"maria@example.com","country_code":"PH","source":"direct"}')
CAND_ID=$(echo "$CAND_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$CAND_ID" ]; then
    echo -e "${GREEN}PASS${NC} [Create candidate] -> Got ID: $CAND_ID"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Create candidate] -> No ID"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# Create second candidate
CAND2_RESP=$(curl -s -X POST "${BASE_URL}/candidates" \
    -H "Authorization: Bearer $REC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Juan Cruz","phone":"09189876543","email":"juan@example.com","country_code":"PH","source":"agency"}')
CAND2_ID=$(echo "$CAND2_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Get candidate by ID
test_api "Get candidate by ID" "GET" "/candidates/$CAND_ID" "200" "$REC_TOKEN"

# List candidates
test_api "List candidates" "GET" "/candidates" "200" "$REC_TOKEN"

# Filter by status
test_api "Filter candidates by status" "GET" "/candidates?status=new" "200" "$REC_TOKEN"

# Search candidates
test_api "Search candidates" "GET" "/candidates?q=Maria" "200" "$REC_TOKEN"

# Update candidate
test_api "Update candidate" "PUT" "/candidates/$CAND_ID" "200" "$REC_TOKEN" '{"status":"screened","notes":"Updated notes"}'

# Duplicate check (should fail)
test_api "Duplicate candidate (phone)" "POST" "/candidates" "400" "$REC_TOKEN" '{"name":"Duplicate","phone":"09171234567"}'

# CSV Import
CSV_DATA="name,phone,email,id_number,country_code,skills,source,notes
Pedro Reyes,09191111111,pedro@example.com,PH111111,PH,welding,direct,
Ana Garcia,09192222222,ana@example.com,PH222222,PH,assembly;packaging,agency,"

test_api "CSV Import candidates" "POST" "/candidates/import" "200" "$REC_TOKEN" "$CSV_DATA" "text/plain"

# Candidate timeline
test_api "Candidate timeline" "GET" "/candidates/$CAND_ID/timeline" "200" "$REC_TOKEN"

# ==========================================
# 4. Interview Management (F-03)
# ==========================================
echo ""
echo "--- Interview Management (F-03) ---"

# Create interview
INT_RESP=$(curl -s -X POST "${BASE_URL}/interviews" \
    -H "Authorization: Bearer $REC_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"candidate_id\":\"$CAND_ID\",\"job_title\":\"Factory Worker\",\"scheduled_at\":\"2026-05-20T10:00:00\"}")
INT_ID=$(echo "$INT_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$INT_ID" ]; then
    echo -e "${GREEN}PASS${NC} [Create interview] -> Got ID: $INT_ID"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Create interview] -> No ID"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# List interviews
test_api "List interviews" "GET" "/interviews" "200" "$REC_TOKEN"

# Interview check-in
test_api "Interview check-in" "PUT" "/interviews/$INT_ID/checkin" "200" "$REC_TOKEN"

# Interview evaluation (pass -> auto status to offered)
test_api "Interview evaluate (pass)" "PUT" "/interviews/$INT_ID/evaluate" "200" "$REC_TOKEN" '{"skill_scores":"{\"welding\":85}","overall_score":85,"comments":"Good candidate","result":"pass"}'

# Verify candidate status changed to offered
CAND_STATUS=$(curl -s "${BASE_URL}/candidates/$CAND_ID" -H "Authorization: Bearer $REC_TOKEN" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$CAND_STATUS" = "offered" ]; then
    echo -e "${GREEN}PASS${NC} [Auto status: offered after pass]"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Auto status: expected 'offered', got '$CAND_STATUS']"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# Interview calendar
test_api "Interview calendar" "GET" "/interviews/calendar" "200" "$REC_TOKEN"

# ==========================================
# 5. Approval Workflow (F-04)
# ==========================================
echo ""
echo "--- Approval Workflow (F-04) ---"

# Create approval for second candidate (use user IDs for FK)
APPR_RESP=$(curl -s -X POST "${BASE_URL}/approvals" \
    -H "Authorization: Bearer $REC_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"candidate_id\":\"$CAND2_ID\",\"request_type\":\"hire\",\"assigned_to\":\"$MGR_USER_ID\"}")
APPR_ID=$(echo "$APPR_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$APPR_ID" ]; then
    echo -e "${GREEN}PASS${NC} [Create approval] -> Got ID: $APPR_ID"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Create approval] -> No ID"
    echo "  Response: $APPR_RESP"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# Pending approvals
test_api "Pending approvals" "GET" "/approvals/pending" "200" "$MGR_TOKEN"

# Approve
test_api "Approve hire" "POST" "/approvals/$APPR_ID/approve" "200" "$MGR_TOKEN" '{"comments":"Approved"}'

# Verify candidate status changed to offered
CAND2_STATUS=$(curl -s "${BASE_URL}/candidates/$CAND2_ID" -H "Authorization: Bearer $REC_TOKEN" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$CAND2_STATUS" = "offered" ]; then
    echo -e "${GREEN}PASS${NC} [Auto status: offered after approval]"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Auto status: expected 'offered', got '$CAND2_STATUS']"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# ==========================================
# 6. Employee Onboarding (F-08)
# ==========================================
echo ""
echo "--- Employee Onboarding (F-08) ---"

# Create employee (candidate must be offered)
EMP_RESP=$(curl -s -X POST "${BASE_URL}/employees" \
    -H "Authorization: Bearer $REC_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"candidate_id\":\"$CAND2_ID\",\"department\":\"Production\",\"position\":\"Assembly Worker\"}")
EMP_ID=$(echo "$EMP_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$EMP_ID" ]; then
    echo -e "${GREEN}PASS${NC} [Create employee] -> Got ID: $EMP_ID"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Create employee] -> No ID"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# Verify candidate status changed to hired
CAND2_STATUS2=$(curl -s "${BASE_URL}/candidates/$CAND2_ID" -H "Authorization: Bearer $REC_TOKEN" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
if [ "$CAND2_STATUS2" = "hired" ]; then
    echo -e "${GREEN}PASS${NC} [Auto status: hired after employee creation]"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Auto status: expected 'hired', got '$CAND2_STATUS2']"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# List employees
test_api "List employees" "GET" "/employees" "200" "$REC_TOKEN"

# Get employee by ID
test_api "Get employee by ID" "GET" "/employees/$EMP_ID" "200" "$REC_TOKEN"

# Update employee
test_api "Update employee" "PUT" "/employees/$EMP_ID" "200" "$REC_TOKEN" '{"department":"Warehouse","status":"active"}'

# ==========================================
# 7. Document Management (F-05, F-09)
# ==========================================
echo ""
echo "--- Document Management (F-05, F-09) ---"

# Upload document
DOC_RESP=$(curl -s -X POST "${BASE_URL}/documents/upload" \
    -H "Authorization: Bearer $REC_TOKEN" \
    -H "Content-Type: application/json" \
    -d "{\"entity_type\":\"candidate\",\"entity_id\":\"$CAND_ID\",\"doc_type\":\"contract\",\"file_url\":\"/docs/contract.pdf\"}")
DOC_ID=$(echo "$DOC_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$DOC_ID" ]; then
    echo -e "${GREEN}PASS${NC} [Upload document] -> Got ID: $DOC_ID"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Upload document] -> No ID"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# Sign document
test_api "Sign document" "POST" "/documents/$DOC_ID/sign" "200" "$REC_TOKEN" '{"signature_method":"electronic"}'

# Generate contract
test_api "Generate contract" "POST" "/documents/$DOC_ID/generate" "200" "$REC_TOKEN"

# Download document
test_api "Download document" "GET" "/documents/$DOC_ID/download" "200" "$REC_TOKEN"

# OCR (stub) - requires auth
test_api "OCR document (stub)" "POST" "/documents/ocr" "200" "$REC_TOKEN" "{\"document_id\":\"$DOC_ID\"}"

# ==========================================
# 8. Training System (F-06, F-07)
# ==========================================
echo ""
echo "--- Training System (F-06, F-07) ---"

# Create EHS course
COURSE_RESP=$(curl -s -X POST "${BASE_URL}/courses" \
    -H "Authorization: Bearer $TRN_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"title":"PH OSH 8-Hour Safety Training","course_type":"ehs","country":"PH","mandatory":1,"pass_score":80}')
COURSE_ID=$(echo "$COURSE_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$COURSE_ID" ]; then
    echo -e "${GREEN}PASS${NC} [Create EHS course] -> Got ID: $COURSE_ID"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Create EHS course] -> No ID"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# List courses
test_api "List courses" "GET" "/courses" "200" "$TRN_TOKEN"

# Get course
test_api "Get course by ID" "GET" "/courses/$COURSE_ID" "200" "$TRN_TOKEN"

# Start training
TR_RESP=$(curl -s -X POST "${BASE_URL}/training/start" \
    -H "Content-Type: application/json" \
    -d "{\"employee_id\":\"$EMP_ID\",\"course_id\":\"$COURSE_ID\"}")
TR_ID=$(echo "$TR_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
if [ -n "$TR_ID" ]; then
    echo -e "${GREEN}PASS${NC} [Start training] -> Got ID: $TR_ID"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Start training] -> No ID"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# Complete training (passing score)
test_api "Complete training (pass)" "POST" "/training/complete" "200" "" "{\"record_id\":\"$TR_ID\",\"score\":90,\"passed\":1,\"certificate_url\":\"/certs/$EMP_ID.pdf\"}"

# Training records
test_api "Training records" "GET" "/training/records?employee_id=$EMP_ID" "200" "$TRN_TOKEN"

# Certificate
test_api "Get certificate" "GET" "/training/certificate/$TR_ID" "200" "$TRN_TOKEN"

# ==========================================
# 9. Agency Portal (F-02)
# ==========================================
echo ""
echo "--- Agency Portal (F-02) ---"

# Agency candidates (should be empty for new agency)
test_api "Agency candidates" "GET" "/agency/candidates" "200" "$AGY_TOKEN"

# Agency import
AGY_CSV="name,phone,email,id_number,country_code,skills,source,notes
Rosa Lima,09193333333,rosa@example.com,PH333333,PH,cooking,agency,"
test_api "Agency import CSV" "POST" "/agency/import" "200" "$AGY_TOKEN" "$AGY_CSV" "text/plain"

# Agency candidates after import
AGY_CAND_RESP=$(curl -s "${BASE_URL}/agency/candidates" -H "Authorization: Bearer $AGY_TOKEN")
AGY_COUNT=$(echo "$AGY_CAND_RESP" | grep -o '"id"' | wc -l)
if [ "$AGY_COUNT" -gt 0 ]; then
    echo -e "${GREEN}PASS${NC} [Agency candidates after import] -> Found $AGY_COUNT candidates"
    PASS=$((PASS + 1))
else
    echo -e "${RED}FAIL${NC} [Agency candidates after import] -> Found 0"
    FAIL=$((FAIL + 1))
fi
TOTAL=$((TOTAL + 1))

# ==========================================
# 10. Reports (F-15)
# ==========================================
echo ""
echo "--- Reports (F-15) ---"

test_api "Hiring funnel report" "GET" "/reports/hiring-funnel" "200" "$REC_TOKEN"
test_api "Training status report" "GET" "/reports/training-status" "200" "$REC_TOKEN"
test_api "EHS compliance report" "GET" "/reports/ehs-compliance" "200" "$REC_TOKEN"

# ==========================================
# 11. WhatsApp Webhook (F-12)
# ==========================================
echo ""
echo "--- WhatsApp Webhook (F-12) ---"

test_api "WhatsApp webhook" "POST" "/webhooks/whatsapp" "200" "" '{"from":"639171234567","body":"Hello","message_type":"text"}'

# ==========================================
# 12. Role-based Access Control
# ==========================================
echo ""
echo "--- RBAC Tests ---"

# Agency cannot create approvals (returns 401 for insufficient role)
test_api "Agency cannot create approvals" "POST" "/approvals" "401" "$AGY_TOKEN" '{"candidate_id":"test","assigned_to":"test"}'

# Trainer cannot create candidates (returns 401 for insufficient role)
test_api "Trainer cannot create candidates" "POST" "/candidates" "401" "$TRN_TOKEN" '{"name":"Test","phone":"1234567890"}'

# GET /candidates is public by design (no auth required)
test_api "Public candidate list access" "GET" "/candidates" "200" ""

# ==========================================
# 13. Delete candidate (with foreign key protection)
# ==========================================
echo ""
echo "--- Delete Tests ---"

# Create a candidate without related records for deletion
DEL_CAND_RESP=$(curl -s -X POST "${BASE_URL}/candidates" \
    -H "Authorization: Bearer $REC_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"ToDelete User","phone":"09199999999","email":"delete@example.com","country_code":"PH","source":"direct"}')
DEL_CAND_ID=$(echo "$DEL_CAND_RESP" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

# Delete candidate (should succeed for candidate without related records)
test_api "Delete candidate (no relations)" "DELETE" "/candidates/$DEL_CAND_ID" "200" "$REC_TOKEN"

# ==========================================
# Summary
# ==========================================
echo ""
echo "========================================="
echo "Test Results Summary"
echo "========================================="
echo -e "Total:  $TOTAL"
echo -e "${GREEN}Passed: $PASS${NC}"
echo -e "${RED}Failed: $FAIL${NC}"
echo ""

if [ "$FAIL" -eq 0 ]; then
    echo -e "${GREEN}ALL TESTS PASSED!${NC}"
    exit 0
else
    echo -e "${RED}SOME TESTS FAILED${NC}"
    exit 1
fi
