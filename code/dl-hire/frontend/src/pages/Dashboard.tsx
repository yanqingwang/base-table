import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Table, Typography } from 'antd';
import { TeamOutlined, UserAddOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import api, { StatsResponse } from '../api/client';
import StatusTag from '../components/StatusTag';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.stats()
      .then(setStats)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  const statusData = stats
    ? Object.entries(stats.by_status).map(([status, count]) => ({ status, count }))
    : [];

  const statusColumns = [
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    { title: 'Count', dataIndex: 'count', key: 'count' },
  ];

  return (
    <div>
      <Typography.Title level={4}>Dashboard</Typography.Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Total Candidates" value={stats?.total_candidates || 0} prefix={<TeamOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="New" value={stats?.by_status?.new || 0} prefix={<UserAddOutlined />} valueStyle={{ color: '#1890ff' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Hired" value={stats?.by_status?.hired || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic title="Rejected" value={stats?.by_status?.rejected || 0} prefix={<CloseCircleOutlined />} valueStyle={{ color: '#ff4d4f' }} />
          </Card>
        </Col>
      </Row>

      <Card title="Candidates by Status" style={{ marginTop: 24 }}>
        <Table
          dataSource={statusData}
          columns={statusColumns}
          rowKey="status"
          pagination={false}
          size="small"
        />
      </Card>
    </div>
  );
};

export default Dashboard;
