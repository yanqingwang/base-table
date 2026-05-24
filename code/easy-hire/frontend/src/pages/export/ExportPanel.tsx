import React, { useState } from 'react';
import { Typography, Button, Card, Row, Col, Alert, Space } from 'antd';
import { DownloadOutlined, SyncOutlined, TeamOutlined, UserOutlined, ScheduleOutlined } from '@ant-design/icons';
import api from '../../api/client';

const { Title } = Typography;

const StatCard: React.FC<{ icon: React.ReactNode; title: string; onClick: () => void }> = ({ icon, title, onClick }) => (
  <div style={{ textAlign: 'center' }}>
    <div>{icon}</div>
    <Title level={4} style={{ marginTop: 12, marginBottom: 16 }}>{title}</Title>
    <Button type="primary" icon={<DownloadOutlined />} onClick={onClick}>
      Download CSV
    </Button>
  </div>
);

const ExportPanel: React.FC = () => {
  const [syncResult, setSyncResult] = useState<string | null>(null);
  const [syncError, setSyncError] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const handleSyncAll = async () => {
    setSyncing(true);
    setSyncResult(null);
    setSyncError(false);
    try {
      const res = await api.sf.syncAll() as { synced?: number; total_pending?: number };
      setSyncResult(`Synced: ${res.synced ?? '?'} / ${res.total_pending ?? '?'} employees`);
    } catch (e: any) {
      setSyncResult('Sync failed: ' + (e?.response?.data?.message || e?.message || 'Unknown error'));
      setSyncError(true);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div>
      <Title level={3}>Data Export</Title>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <StatCard
              icon={<TeamOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
              title="Export Candidates"
              onClick={() => api.exportData.candidates()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <StatCard
              icon={<UserOutlined style={{ fontSize: 32, color: '#52c41a' }} />}
              title="Export Employees"
              onClick={() => api.exportData.employees()}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <StatCard
              icon={<ScheduleOutlined style={{ fontSize: 32, color: '#722ed1' }} />}
              title="Export Interviews"
              onClick={() => api.exportData.interviews()}
            />
          </Card>
        </Col>
      </Row>

      <Card title="SuccessFactors Integration" style={{ marginTop: 16 }}>
        <Space>
          <Button type="primary" icon={<SyncOutlined />} loading={syncing} onClick={handleSyncAll}>
            Sync All Pending to SuccessFactors
          </Button>
        </Space>
        {syncResult && (
          <Alert
            message={syncResult}
            type={syncError ? 'error' : 'success'}
            style={{ marginTop: 12 }}
            closable
            onClose={() => { setSyncResult(null); setSyncError(false); }}
          />
        )}
      </Card>
    </div>
  );
};

export default ExportPanel;
