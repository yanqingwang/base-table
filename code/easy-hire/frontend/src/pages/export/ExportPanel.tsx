import React, { useState } from 'react';
import { Typography, Button, Card, Space, message } from 'antd';
import { DownloadOutlined, SyncOutlined } from '@ant-design/icons';
import api from '../../api/client';

const { Title, Text } = Typography;

const ExportPanel: React.FC = () => {
  const [syncing, setSyncing] = useState(false);

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await api.sf.syncAll();
      message.success('Sync completed successfully');
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Sync failed');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
      <Title level={3}>Data Export</Title>
      <Card title="Export Data" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Text>Download data as CSV files:</Text>
          <Button icon={<DownloadOutlined />} onClick={api.exportData.candidates} block>
            Export Candidates
          </Button>
          <Button icon={<DownloadOutlined />} onClick={api.exportData.employees} block>
            Export Employees
          </Button>
          <Button icon={<DownloadOutlined />} onClick={api.exportData.interviews} block>
            Export Interviews
          </Button>
        </Space>
      </Card>
      <Card title="SuccessFactors Sync">
        <Button icon={<SyncOutlined />} onClick={handleSyncAll} loading={syncing} type="primary" block>
          Sync All Pending to SuccessFactors
        </Button>
      </Card>
    </div>
  );
};

export default ExportPanel;
