import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuthStore } from './store/auth';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CandidateList from './pages/candidates/CandidateList';
import CandidateDetail from './pages/candidates/CandidateDetail';
import NewCandidate from './pages/candidates/NewCandidate';
import CandidateImport from './pages/candidates/CandidateImport';
import InterviewList from './pages/interviews/InterviewList';
import ApprovalList from './pages/approvals/ApprovalList';
import AgencyCandidates from './pages/agency/AgencyCandidates';
import EmployeeList from './pages/employees/EmployeeList';
import Reports from './pages/Reports';
import CourseList from './pages/training/CourseList';
import TrainingRecords from './pages/training/TrainingRecords';
import CertificateView from './pages/training/CertificateView';

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
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/dashboard" replace /> : <Login />} />
      <Route path="/register" element={token ? <Navigate to="/dashboard" replace /> : <Register />} />
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
        <Route path="/approvals" element={<ApprovalList />} />
        <Route path="/agency/candidates" element={<AgencyCandidates />} />
        <Route path="/employees" element={<EmployeeList />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/training/courses" element={<CourseList />} />
        <Route path="/training/records" element={<TrainingRecords />} />
        <Route path="/training/certificate/:id" element={<CertificateView />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default App;
