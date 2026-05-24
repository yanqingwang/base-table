import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('easy_hire_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('easy_hire_token');
      localStorage.removeItem('easy_hire_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string | null;
  name: string;
  role: string;
  company_id: string | null;
}

export interface Candidate {
  id: string;
  user_id: string | null;
  agency_id: string | null;
  name: string;
  phone: string | null;
  email: string | null;
  id_number: string | null;
  country_code: string;
  date_of_birth: string | null;
  gender: string | null;
  nationality: string | null;
  address: string | null;
  city: string | null;
  province: string | null;
  postal_code: string | null;
  education_level: string | null;
  education_school: string | null;
  education_major: string | null;
  education_year: string | null;
  work_experience_years: number | null;
  previous_employer: string | null;
  previous_position: string | null;
  previous_duration: string | null;
  previous_duties: string | null;
  languages: string | null;
  certifications: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  emergency_contact_relation: string | null;
  skills: string;
  resume_text: string | null;
  resume_file_url: string | null;
  profile_photo_url: string | null;
  status: string;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CandidateEducation {
  id: string;
  candidate_id: string;
  level: string;
  school?: string;
  major?: string;
  graduation_year?: number;
  notes?: string;
  created_at: string;
}

export interface CandidateWorkExperience {
  id: string;
  candidate_id: string;
  employer: string;
  position?: string;
  start_date?: string;
  end_date?: string;
  duration?: string;
  duties?: string;
  created_at: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
  job_id: string | null;
  job_title: string | null;
  scheduled_at: string | null;
  check_in_at: string | null;
  interviewer_id: string | null;
  skill_scores: string;
  overall_score: number | null;
  comments: string | null;
  status: string;
  result: string | null;
  created_at: string;
  updated_at: string;
}

export interface InterviewRound {
  id: string;
  interview_id: string;
  round_number: number;
  round_type: string;
  scheduled_at: string | null;
  status: string;
  created_at: string;
}

export interface InterviewAssignment {
  id: string;
  interview_id: string;
  round_id: string | null;
  interviewer_id: string;
  status: string;
  created_at: string;
}

export interface InterviewEvaluation {
  id: string;
  interview_id: string;
  round_id: string | null;
  interviewer_id: string;
  skill_scores: string;
  overall_score: number | null;
  comments: string | null;
  recommendation: string;
  submitted_at: string | null;
  created_at: string;
}

export interface EvalAggregate {
  interview_id: string;
  total_evaluations: number;
  average_score: number | null;
  recommendations: Record<string, number>;
  evaluations: InterviewEvaluation[];
}

export interface Approval {
  id: string;
  candidate_id: string;
  request_type: string;
  requested_by: string;
  assigned_to: string;
  status: string;
  comments: string | null;
  escalated_at: string | null;
  decided_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Employee {
  id: string;
  candidate_id: string | null;
  employee_code: string | null;
  company_id: string | null;
  department: string | null;
  position: string | null;
  hired_at: string | null;
  contract_start: string | null;
  contract_end: string | null;
  created_at: string;
  updated_at: string;
}

export interface Doc {
  id: string;
  entity_type: string;
  entity_id: string;
  doc_type: string;
  file_url: string | null;
  signed_at: string | null;
  signature_method: string | null;
  ocr_data: string;
  status: string;
  created_at: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ImportResult {
  imported: number;
  errors: string[];
}

export interface StatsResponse {
  total_candidates: number;
  by_status: Record<string, number>;
  by_source: Record<string, number>;
  jobs: { active: number; total: number; total_views: number };
  applications: { total: number; by_status: Record<string, number> };
  interviews: { total: number; completed: number };
  employees: { total: number; active: number };
  funnel: { hired: number; rejected: number; conversion_rate: string; avg_time_to_hire_days: number | null };
  evaluations: { total: number; average_score: number | null };
}

export interface HiringFunnelReport {
  total: number;
  interviewing: number;
  offered: number;
  hired: number;
  rejected: number;
  conversion_rate: number;
}

export interface Job {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  country_code: string;
  city: string | null;
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
  department_id: string | null;
  location_id: string | null;
  category_id: string | null;
  currency_id: string | null;
  headcount: number;
  hiring_manager_id: string | null;
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

const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
    register: (data: { name: string; email: string; password: string; role: string; company_id?: string }) =>
      client.post<AuthResponse>('/auth/register', data).then((r) => r.data),
    me: () => client.get<User>('/auth/me').then((r) => r.data),
  },
  users: {
    list: (role?: string) =>
      client.get<User[]>('/users', { params: { role } }).then((r) => r.data),
  },
  candidates: {
    list: (params?: { status?: string; source?: string; q?: string }) =>
      client.get<Candidate[]>('/candidates', { params }).then((r) => r.data),
    get: (id: string) => client.get<Candidate>(`/candidates/${id}`).then((r) => r.data),
    create: (data: Partial<Candidate>) =>
      client.post<Candidate>('/candidates', data).then((r) => r.data),
    update: (id: string, data: Partial<Candidate>) =>
      client.put<Candidate>(`/candidates/${id}`, data).then((r) => r.data),
    delete: (id: string) => client.delete(`/candidates/${id}`),
    import: (csv: string) =>
      client.post<ImportResult>('/candidates/import', csv, {
        headers: { 'Content-Type': 'text/plain' },
      }).then((r) => r.data),
    timeline: (id: string) => client.get(`/candidates/${id}/timeline`).then((r) => r.data),
    educations: {
      list: (candidateId: string) => client.get<CandidateEducation[]>(`/candidates/${candidateId}/educations`).then(r => r.data),
      create: (candidateId: string, data: Partial<CandidateEducation>) => client.post<CandidateEducation>(`/candidates/${candidateId}/educations`, data).then(r => r.data),
      delete: (candidateId: string, id: string) => client.delete(`/candidates/${candidateId}/educations/${id}`).then(r => r.data),
    },
    workExperiences: {
      list: (candidateId: string) => client.get<CandidateWorkExperience[]>(`/candidates/${candidateId}/work-experiences`).then(r => r.data),
      create: (candidateId: string, data: Partial<CandidateWorkExperience>) => client.post<CandidateWorkExperience>(`/candidates/${candidateId}/work-experiences`, data).then(r => r.data),
      delete: (candidateId: string, id: string) => client.delete(`/candidates/${candidateId}/work-experiences/${id}`).then(r => r.data),
    },
  },
  interviews: {
    list: (params?: { status?: string }) =>
      client.get<Interview[]>('/interviews', { params }).then((r) => r.data),
    create: (data: { candidate_id: string; job_id?: string; job_title?: string; scheduled_at?: string; interviewer_id?: string }) =>
      client.post<Interview>('/interviews', data).then((r) => r.data),
    checkin: (id: string) =>
      client.put(`/interviews/${id}/checkin`).then((r) => r.data),
    evaluate: (id: string, data: { skill_scores?: string; overall_score?: number; comments?: string; result?: string }) =>
      client.put(`/interviews/${id}/evaluate`, data).then((r) => r.data),
    rounds: {
      list: (interviewId: string) =>
        client.get<InterviewRound[]>(`/interviews/${interviewId}/rounds`).then(r => r.data),
      create: (data: { interview_id: string; round_number: number; round_type?: string; scheduled_at?: string }) =>
        client.post<InterviewRound>(`/interviews/${data.interview_id}/rounds`, data).then(r => r.data),
    },
    assignments: {
      list: (interviewId: string) =>
        client.get<InterviewAssignment[]>(`/interviews/${interviewId}/assignments`).then(r => r.data),
      create: (data: { interview_id: string; round_id?: string; interviewer_id: string }) =>
        client.post<InterviewAssignment>('/interviews/assign', data).then(r => r.data),
    },
    evaluations: {
      list: (interviewId: string) =>
        client.get<InterviewEvaluation[]>(`/interviews/${interviewId}/evaluations`).then(r => r.data),
      submit: (data: { interview_id: string; round_id?: string; overall_score?: number; comments?: string; recommendation?: string }) =>
        client.post<InterviewEvaluation>('/evaluations', data).then(r => r.data),
      aggregate: (interviewId: string) =>
        client.get<EvalAggregate>(`/interviews/${interviewId}/aggregate`).then(r => r.data),
    },
  },
  approvals: {
    pending: () =>
      client.get<Approval[]>('/approvals/pending').then((r) => r.data),
    create: (data: { candidate_id: string; request_type?: string; assigned_to: string }) =>
      client.post<Approval>('/approvals', data).then((r) => r.data),
    approve: (id: string, comments?: string) =>
      client.post(`/approvals/${id}/approve`, { comments }).then((r) => r.data),
    reject: (id: string, comments?: string) =>
      client.post(`/approvals/${id}/reject`, { comments }).then((r) => r.data),
    transfer: (id: string, assigned_to: string, comments?: string) =>
      client.post(`/approvals/${id}/transfer`, { assigned_to, comments }).then((r) => r.data),
  },
  agency: {
    candidates: () =>
      client.get<Candidate[]>('/agency/candidates').then((r) => r.data),
    import: (csv: string) =>
      client.post<ImportResult>('/agency/import', csv, {
        headers: { 'Content-Type': 'text/plain' },
      }).then((r) => r.data),
  },
  employees: {
    list: () => client.get<Employee[]>('/employees').then((r) => r.data),
    create: (data: { candidate_id: string; employee_code?: string; department?: string; position?: string; contract_start?: string; contract_end?: string }) =>
      client.post<Employee>('/employees', data).then((r) => r.data),
    get: (id: string) => client.get<Employee>(`/employees/${id}`).then((r) => r.data),
  },
  documents: {
    upload: (data: { entity_type: string; entity_id: string; doc_type: string; file_url?: string }) =>
      client.post<Doc>('/documents/upload', data).then((r) => r.data),
    sign: (id: string, signature_method?: string) =>
      client.post(`/documents/${id}/sign`, { signature_method }).then((r) => r.data),
  },
  stats: () => client.get<StatsResponse>('/stats').then((r) => r.data),
  reports: {
    hiringFunnel: () =>
      client.get<HiringFunnelReport>('/reports/hiring-funnel').then((r) => r.data),
  },
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
    deleteJob: (id: string) =>
      client.delete(`/jobs/${id}`),
    applications: (id: string) =>
      client.get<JobApplication[]>(`/jobs/${id}/applications`).then((r) => r.data),
    updateApplicationStatus: (id: string, status: string) =>
      client.put<JobApplication>(`/jobs/applications/${id}/status`, { status }).then((r) => r.data),
  },
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
};

export default api;
