import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Spin, Card, Alert, message, Space } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import api, { Candidate } from '../../api/client';
import StatusTag from '../../components/StatusTag';
import TextArea from 'antd/es/input/TextArea';

const AgencyCandidates: React.FC = () => {
  const [data, setData] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const fetchData = () => {
    setLoading(true);
    api.agency.candidates()
      .then(setData)
      .catch(() => message.error('Failed to load candidates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleImport = async () => {
    if (!csvData.trim()) {
      message.warning('Please enter CSV data');
      return;
    }
    setImporting(true);
    try {
      const res = await api.agency.import(csvData);
      setImportResult(res);
      message.success(`Imported ${res.imported} candidates`);
      fetchData();
    } catch {
      message.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (d: string) => new Date(d).toLocaleDateString() },
  ];

  return (
    <div>
      <Typography.Title level={4}>My Candidates (Agency Portal)</Typography.Title>

      <Card title="Batch Import" style={{ marginBottom: 16 }}>
        <Typography.Paragraph type="secondary">
          Format: name, phone, email, id_number, country_code, skills(semicolon separated)<br />
          Example: Juan Dela Cruz,09171234567,juan@example.com,PH123456789,PH,welding;assembly
        </Typography.Paragraph>
        <TextArea
          rows={6}
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder="name,phone,email,id_number,country_code,skills"
          style={{ fontFamily: 'monospace' }}
        />
        <Space style={{ marginTop: 12 }}>
          <Button type="primary" icon={<UploadOutlined />} onClick={handleImport} loading={importing}>
            Import My Candidates
          </Button>
        </Space>
        {importResult && (
          <Alert
            type={importResult.errors.length === 0 ? 'success' : 'warning'}
            message={`Imported ${importResult.imported} candidates`}
            showIcon
            style={{ marginTop: 12 }}
          />
        )}
      </Card>

      <Spin spinning={loading}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} size="middle" />
      </Spin>
    </div>
  );
};

export default AgencyCandidates;
