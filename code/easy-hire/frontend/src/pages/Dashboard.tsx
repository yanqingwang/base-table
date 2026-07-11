import React from 'react';
import { Card, Row, Col, Statistic, Table, Tag, Spin, Alert } from 'antd';
import {
  TeamOutlined, UserAddOutlined, CheckCircleOutlined, CloseCircleOutlined,
  FileTextOutlined, EyeOutlined, ScheduleOutlined,
  RiseOutlined, ClockCircleOutlined
} from '@ant-design/icons';
import { useStats } from '../hooks/useQueries';

const statusColors: Record<string, string> = {
  applied: 'blue', screened: 'cyan', interviewed: 'orange', offered: 'gold',
  hired: 'green', rejected: 'red', withdrawn: 'default',
};

const Dashboard: React.FC = () => {
  const { data: stats, isLoading, error } = useStats();

  if (isLoading) return <Spin size="large" style={{ display: 'block', margin: '48px auto' }} />;
  if (error) return <Alert type="error" message={(error as any)?.message || 'Failed to load stats'} />;
  if (!stats) return <Alert type="warning" message="No stats available" />;

  const statusData = Object.entries(stats.by_status || {}).map(([status, count]) => ({
    key: status, status, count,
  }));

  const statusColumns = [
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag> },
    { title: 'Count', dataIndex: 'count', key: 'count' },
  ];

  return (
    <div>
      <h2>Dashboard</h2>

      {/* Row 1: Candidates */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Total Candidates" value={stats.total_candidates} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Hired" value={stats.funnel?.hired || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#3f8600' }} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Rejected" value={stats.funnel?.rejected || 0} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#cf1322' }} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Conversion Rate" value={stats.funnel?.conversion_rate || '0.0%'} prefix={<RiseOutlined />} /></Card>
        </Col>
      </Row>

      {/* Row 2: Jobs & Applications */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Active Jobs" value={stats.jobs?.active || 0} prefix={<FileTextOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Total Job Views" value={stats.jobs?.total_views || 0} prefix={<EyeOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Applications" value={stats.applications?.total || 0} prefix={<UserAddOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Avg Time-to-Hire"
              value={stats.funnel?.avg_time_to_hire_days ?? '-'}
              suffix="days"
              prefix={<ClockCircleOutlined />}
            />
          </Card>
        </Col>
      </Row>

      {/* Row 3: Operations */}
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Total Interviews" value={stats.interviews?.total || 0} prefix={<ScheduleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Completed Interviews" value={stats.interviews?.completed || 0} prefix={<CheckCircleOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Active Employees" value={stats.employees?.active || 0} prefix={<TeamOutlined />} /></Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card><Statistic title="Evaluations" value={stats.evaluations?.total || 0} prefix={<ScheduleOutlined />} /></Card>
        </Col>
      </Row>

      {/* Candidate Status Table */}
      <Card title="Candidates by Status">
        <Table dataSource={statusData} columns={statusColumns} pagination={false} />
      </Card>
    </div>
  );
};

export default Dashboard;
