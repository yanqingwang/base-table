# DL Hire 使用手册对齐升级 — Gap Analysis & Implementation Plan

**基于文档**: DL_Hire_使用手册-2026-05-15.md  
**目标**: 对齐使用手册功能规格，修正 Select/Input 字段类型，补全缺失的表单字段

---

## 一、Candidate 候选人表单 — 最大缺口

### 现状 vs 手册

| 分类 | 手册字段 | 后端DB | 前端NewCandidate | 前端CandidateDetail(edit) |
|------|---------|--------|-------------|------|
| 基本信息 | name | ✅ | ✅ Input | ✅ Input |
| | phone | ✅ | ✅ Input | ✅ Input |
| | email | ✅ | ✅ Input | ✅ Input |
| | id_number | ✅ | ✅ Input | ❌ Missing |
| | country_code | ✅ | ✅ **Select** | ❌ Missing |
| | date_of_birth | ✅ | ❌ Missing | ❌ Missing |
| | gender | ✅ | ❌ Missing | ❌ Missing |
| | nationality | ✅ | ❌ Missing | ❌ Missing |
| 地址 | address | ✅ | ❌ Missing | ❌ Missing |
| | city | ✅ | ❌ Missing | ❌ Missing |
| | province | ✅ | ❌ Missing | ❌ Missing |
| | postal_code | ✅ | ❌ Missing | ❌ Missing |
| 教育 | education_level | ✅ | ❌ Missing | ❌ Missing |
| | education_school | ✅ | ❌ Missing | ❌ Missing |
| | education_major | ✅ | ❌ Missing | ❌ Missing |
| | education_year | ✅ | ❌ Missing | ❌ Missing |
| 工作经历 | work_experience_years | ✅ | ❌ Missing | ❌ Missing |
| | previous_employer | ✅ | ❌ Missing | ❌ Missing |
| | previous_position | ✅ | ❌ Missing | ❌ Missing |
| | previous_duration | ✅ | ❌ Missing | ❌ Missing |
| | previous_duties | ✅ | ❌ Missing | ❌ Missing |
| 技能 | skills | ✅ | ❌ Missing | ❌ Missing |
| | languages | ✅ | ❌ Missing | ❌ Missing |
| | certifications | ✅ | ❌ Missing | ❌ Missing |
| 紧急联系人 | emergency_contact_name | ✅ | ❌ Missing | ❌ Missing |
| | emergency_contact_phone | ✅ | ❌ Missing | ❌ Missing |
| | emergency_contact_relation | ✅ | ❌ Missing | ❌ Missing |
| 其他 | resume_text | ✅ | ❌ Missing | ❌ Missing |
| | resume_file_url | ✅ | ❌ Missing | ❌ Missing |
| | profile_photo_url | ✅ | ❌ Missing | ❌ Missing |
| | source | ✅ | ✅ **Select** | ❌ Missing |
| | notes | ✅ | ✅ TextArea | ✅ TextArea |
| | status | ✅ | ❌ Missing | ✅ **Select** (inline) |

### 改进方案

**NewCandidate.tsx**: 添加 status Select（默认 `new`）、skills（多选标签Select）、education/work/address/emergency 等分组表单（用 Collapse/Divider 分区）

**CandidateDetail.tsx**: Edit mode 补全所有字段，特别是 country_code、source、skills、education/work fields

**CandidateList.tsx**: 添加 source filter Select

**Select 选项定义**:
- status: `new`, `applied`, `screened`, `interviewing`, `offered`, `signed`, `hired`, `rejected`
- country_code: `PH`, `MY`, `TH`, `SG`, `ID`, `VN`, `MM`, `KH`, `LA`, `BN`
- gender: `male`, `female`, `other`
- education_level: `none`, `primary`, `secondary`, `high_school`, `vocational`, `bachelor`, `master`, `doctorate`
- source: `agency`, `direct`, `referral`, `other`

---

## 二、Course 课程表单 — Boolean 字段修复

**问题**: `mandatory` 字段使用 `<Select>` 带 `1`/`0` 值，不符合 Boolean 语义

**修复**: 改用 `<Switch>` 组件，参考 Ant Design Switch 用法

---

## 三、Approval 审批表单 — User 选择修复

**问题**: `transferTo` 使用自由文本 `<Input>` 填 UUID，体验差

**修复**: 改为 `<Select>` 下拉，调用 `GET /api/v1/users?role=manager` 获取可选审批人列表。需要在 backend 添加 list_users endpoint（按 role 筛选）。

---

## 四、Employee 员工表单 — 补全字段

**问题**: 缺少 `contract_start` 和 `contract_end` 日期字段

**修复**: 添加 `<DatePicker>` 组件用于合同起止日期。验证 DB schema — Employee 表已有 `contract_start`/`contract_end` 列。

---

## 五、Implementation Plan

### Phase 1: 候选人表单升级 (最大工作量)
- [ ] 1.1 改 `NewCandidate.tsx` — 使用 Collapse 分区（基本信息/地址/教育/工作经历/技能/紧急联系人/其他），每个字段用正确 Select/Input 类型
- [ ] 1.2 改 `CandidateDetail.tsx` — Edit mode 补全所有缺失字段
- [ ] 1.3 改 `CandidateList.tsx` — 添加 source filter Select

### Phase 2: 表单字段类型修正
- [ ] 2.1 改 `CourseList.tsx` — `mandatory` 用 Switch 替 Select
- [ ] 2.2 改 `ApprovalList.tsx` — `transferTo` 用 user Select 替 Input
- [ ] 2.3 改 `EmployeeList.tsx` — 添加 contract_start/contract_end DatePicker

### Phase 3: Backend 支撑
- [ ] 3.1 添加 `GET /api/v1/users` endpoint (支持 ?role= 筛选)
- [ ] 3.2 验证 Employee update 支持 date 字段

### Phase 4: 验证
- [ ] 4.1 TypeScript 编译检查
- [ ] 4.2 前端 build 检查
- [ ] 4.3 集成测试更新
