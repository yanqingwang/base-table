import React, { useState } from 'react';
import { Card, Input, Button, Descriptions, Tag, Typography, Space, Spin, Alert } from 'antd';
import { SearchOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '../../api/client';

const { Text } = Typography;

const CertificateView: React.FC = () => {
  const [recordId, setRecordId] = useState('');
  const [loading, setLoading] = useState(false);
  const [certificate, setCertificate] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!recordId.trim()) return;
    setLoading(true);
    setError(null);
    setCertificate(null);
    try {
      const data = await api.certificates.get(recordId);
      setCertificate(data);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to fetch certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Typography.Title level={4}>Certificate Viewer</Typography.Title>

      <Card style={{ marginBottom: 24 }}>
        <Space>
          <Input
            placeholder="Enter Training Record ID"
            value={recordId}
            onChange={e => setRecordId(e.target.value)}
            onPressEnter={handleSearch}
            style={{ width: 400 }}
          />
          <Button type="primary" icon={<SearchOutlined />} onClick={handleSearch} loading={loading}>
            Search
          </Button>
        </Space>
      </Card>

      {loading && <Spin size="large" style={{ display: 'block', margin: '40px auto' }} />}

      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {certificate && (
        <Card title="Certificate Details">
          {certificate.certificate_url ? (
            <>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Record ID">{certificate.record_id}</Descriptions.Item>
                <Descriptions.Item label="Issued At">{certificate.issued || '-'}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="green">Issued</Tag>
                </Descriptions.Item>
                <Descriptions.Item label="Certificate URL">
                  <Space>
                    <Text copyable={{ text: certificate.certificate_url }}>
                      {certificate.certificate_url}
                    </Text>
                    <Button
                      type="link"
                      icon={<DownloadOutlined />}
                      href={certificate.certificate_url}
                      target="_blank"
                    >
                      Download
                    </Button>
                  </Space>
                </Descriptions.Item>
              </Descriptions>
            </>
          ) : (
            <>
              <Descriptions bordered column={1}>
                <Descriptions.Item label="Record ID">{certificate.record_id}</Descriptions.Item>
                <Descriptions.Item label="Status">
                  <Tag color="orange">{certificate.status || 'Pending'}</Tag>
                </Descriptions.Item>
              </Descriptions>
              <Alert
                message="Certificate Not Available"
                description={certificate.message || 'Complete training with a passing score to generate a certificate.'}
                type="warning"
                showIcon
                style={{ marginTop: 16 }}
              />
            </>
          )}
        </Card>
      )}
    </div>
  );
};

export default CertificateView;
