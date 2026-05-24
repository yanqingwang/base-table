import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Input, Button, Typography, Alert, Space, message } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import api from '../../api/client';

const { TextArea } = Input;
const SAMPLE_CSV = `name,phone,email,id_number,country_code,skills,source,notes
Juan Dela Cruz,09171234567,juan@example.com,PH123456789,PH,welding;assembly,direct,Experienced welder
Maria Santos,09189876543,maria@example.com,PH987654321,PH,forklift;packaging,agency,Referral from agency`;

const CandidateImport: React.FC = () => {
  const navigate = useNavigate();
  const [csvData, setCsvData] = useState('');
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; errors: string[] } | null>(null);

  const handleImport = async () => {
    if (!csvData.trim()) {
      message.warning('Please enter CSV data');
      return;
    }
    setImporting(true);
    try {
      const res = await api.candidates.import(csvData);
      setResult(res);
      message.success(`Imported ${res.imported} candidates`);
    } catch {
      message.error('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/candidates')}>Back</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>Import Candidates (CSV)</Typography.Title>
      </Space>

      <Card style={{ marginBottom: 16 }}>
        <Typography.Text strong>CSV Format:</Typography.Text>
        <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
          Columns: <code>name, phone, email, id_number, country_code, skills, source, notes</code><br />
          Skills separated by semicolons (;)<br />
          Supported sources: agency, direct, referral, other
        </Typography.Paragraph>
      </Card>

      <Card title="Paste CSV Data" style={{ marginBottom: 16 }}>
        <TextArea
          rows={10}
          value={csvData}
          onChange={(e) => setCsvData(e.target.value)}
          placeholder={SAMPLE_CSV}
          style={{ fontFamily: 'monospace' }}
        />
        <Button
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleImport}
          loading={importing}
          style={{ marginTop: 16 }}
        >
          Import
        </Button>
      </Card>

      {result && (
        <Card title="Import Results">
          <Alert
            type={result.errors.length === 0 ? 'success' : 'warning'}
            message={`Successfully imported ${result.imported} candidates`}
            showIcon
          />
          {result.errors.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Typography.Text type="danger">Errors:</Typography.Text>
              <ul>
                {result.errors.map((err, i) => (
                  <li key={i}><Typography.Text type="danger">{err}</Typography.Text></li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}
    </div>
  );
};

export default CandidateImport;
