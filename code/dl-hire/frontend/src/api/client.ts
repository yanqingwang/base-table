import axios from 'axios';

const client = axios.create({
  baseURL: '/api/v1',
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('dl_hire_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('dl_hire_token');
      localStorage.removeItem('dl_hire_user');
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
  skills: string;
  resume_text: string | null;
  resume_file_url: string | null;
  status: string;
  source: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Interview {
  id: string;
  candidate_id: string;
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
  training_completed: number;
  ehs_certified: number;
  status: string;
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
}

export interface HiringFunnelReport {
  total: number;
  interviewing: number;
  offered: number;
  hired: number;
  rejected: number;
  conversion_rate: number;
}

export interface TrainingStatusReport {
  total_employees: number;
  training_completed: number;
  ehs_certified: number;
}

export interface EhsComplianceReport {
  total_employees: number;
  ehs_certified: number;
  compliance_rate: number;
  ehs_courses_available: number;
}

export interface Course {
  id: string;
  title: string;
  type: string;
  country: string;
  mandatory: number;
  duration: number;
  pass_score: number;
  created_at: string;
  updated_at: string;
}

export interface TrainingRecord {
  id: string;
  employee_id: string;
  course_id: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  passed: number | null;
  certificate_url: string | null;
}

export interface Certificate {
  id: string;
  employee_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string;
  score: number;
  status: string;
}

const api = {
  auth: {
    login: (email: string, password: string) =>
      client.post<AuthResponse>('/auth/login', { email, password }).then((r) => r.data),
    register: (data: { name: string; email: string; password: string; role: string; company_id?: string }) =>
      client.post<AuthResponse>('/auth/register', data).then((r) => r.data),
    me: () => client.get<User>('/auth/me').then((r) => r.data),
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
  },
  interviews: {
    list: (params?: { status?: string }) =>
      client.get<Interview[]>('/interviews', { params }).then((r) => r.data),
    create: (data: { candidate_id: string; job_title?: string; scheduled_at?: string; interviewer_id?: string }) =>
      client.post<Interview>('/interviews', data).then((r) => r.data),
    checkin: (id: string) =>
      client.put(`/interviews/${id}/checkin`).then((r) => r.data),
    evaluate: (id: string, data: { skill_scores?: string; overall_score?: number; comments?: string; result?: string }) =>
      client.put(`/interviews/${id}/evaluate`, data).then((r) => r.data),
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
    create: (data: { candidate_id: string; employee_code?: string; department?: string; position?: string }) =>
      client.post<Employee>('/employees', data).then((r) => r.data),
    get: (id: string) => client.get<Employee>(`/employees/${id}`).then((r) => r.data),
  },
  documents: {
    upload: (data: { entity_type: string; entity_id: string; doc_type: string; file_url?: string }) =>
      client.post<Doc>('/documents/upload', data).then((r) => r.data),
    sign: (id: string, signature_method?: string) =>
      client.post(`/documents/${id}/sign`, { signature_method }).then((r) => r.data),
  },
  courses: {
    list: () => client.get<Course[]>('/courses').then((r) => r.data),
    create: (data: Partial<Course>) =>
      client.post<Course>('/courses', data).then((r) => r.data),
    get: (id: string) => client.get<Course>(`/courses/${id}`).then((r) => r.data),
    update: (id: string, data: Partial<Course>) =>
      client.put<Course>(`/courses/${id}`, data).then((r) => r.data),
  },
  training: {
    start: (data: { employee_id: string; course_id: string }) =>
      client.post<TrainingRecord>('/training/start', data).then((r) => r.data),
    complete: (data: { employee_id: string; course_id: string; score: number }) =>
      client.post<TrainingRecord>('/training/complete', data).then((r) => r.data),
    records: (params?: { employee_id?: string }) =>
      client.get<TrainingRecord[]>('/training/records', { params }).then((r) => r.data),
  },
  certificates: {
    get: (id: string) => client.get<Certificate>(`/training/certificate/${id}`).then((r) => r.data),
  },
  stats: () => client.get<StatsResponse>('/stats').then((r) => r.data),
  reports: {
    hiringFunnel: () =>
      client.get<HiringFunnelReport>('/reports/hiring-funnel').then((r) => r.data),
    trainingStatus: () =>
      client.get<TrainingStatusReport>('/reports/training-status').then((r) => r.data),
    ehsCompliance: () =>
      client.get<EhsComplianceReport>('/reports/ehs-compliance').then((r) => r.data),
  },
};

export default api;
