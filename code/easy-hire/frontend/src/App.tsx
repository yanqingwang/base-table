import React, { Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';

// Lazy-loaded pages
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const CandidateList = React.lazy(() => import('./pages/candidates/CandidateList'));
const CandidateDetail = React.lazy(() => import('./pages/candidates/CandidateDetail'));
const NewCandidate = React.lazy(() => import('./pages/candidates/NewCandidate'));
const CandidateImport = React.lazy(() => import('./pages/candidates/CandidateImport'));
const InterviewList = React.lazy(() => import('./pages/interviews/InterviewList'));
const InterviewDetail = React.lazy(() => import('./pages/interviews/InterviewDetail'));
const EvaluationForm = React.lazy(() => import('./pages/evaluations/EvaluationForm'));
const ApprovalList = React.lazy(() => import('./pages/approvals/ApprovalList'));
const AgencyCandidates = React.lazy(() => import('./pages/agency/AgencyCandidates'));
const EmployeeList = React.lazy(() => import('./pages/employees/EmployeeList'));
const Reports = React.lazy(() => import('./pages/Reports'));
const JobBoard = React.lazy(() => import('./pages/jobs/JobBoard'));
const JobDetail = React.lazy(() => import('./pages/jobs/JobDetail'));
const ApplyForm = React.lazy(() => import('./pages/apply/ApplyForm'));
const AdminJobList = React.lazy(() => import('./pages/jobs/AdminJobList'));
const DocuSignPanel = React.lazy(() => import('./pages/docusign/DocuSignPanel'));
const ExportPanel = React.lazy(() => import('./pages/export/ExportPanel'));
const QueueCalling = React.lazy(() => import('./pages/queue/QueueCalling'));

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = useAuthStore((s) => s.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const App: React.FC = () => {
  const { token, user, loadUser } = useAuthStore();

  useEffect(() => {
    if (token && !user) {
      loadUser();
    }
  }, [token, user, loadUser]);

  if (token && !user) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
      <Routes>
        <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
        <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
        <Route path="/jobs" element={<JobBoard />} />
        <Route path="/jobs/:id" element={<JobDetail />} />
        <Route path="/apply/:jobId" element={<ApplyForm />} />
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidates" element={<CandidateList />} />
          <Route path="/candidates/new" element={<NewCandidate />} />
          <Route path="/candidates/:id" element={<CandidateDetail />} />
          <Route path="/candidates/import" element={<CandidateImport />} />
          <Route path="/interviews" element={<InterviewList />} />
          <Route path="/interviews/:id" element={<InterviewDetail />} />
          <Route path="/evaluations/:interviewId" element={<EvaluationForm />} />
          <Route path="/approvals" element={<ApprovalList />} />
          <Route path="/agency/candidates" element={<AgencyCandidates />} />
          <Route path="/employees" element={<EmployeeList />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/admin/jobs" element={<AdminJobList />} />
          <Route path="/admin/docusign" element={<DocuSignPanel />} />
          <Route path="/admin/export" element={<ExportPanel />} />
          <Route path="/queue" element={<QueueCalling />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Suspense>
  );
};

export default App;
