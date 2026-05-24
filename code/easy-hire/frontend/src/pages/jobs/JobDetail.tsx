import React, { useEffect, useState } from 'react';
import { Typography, Button, Descriptions, Tag, Spin, Alert, Card, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api, { Job } from '../../api/client';

const { Title, Paragraph } = Typography;

const JobDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    api.jobs.publicGet(id)
      .then(setJob)
      .catch(e => setError(e?.response?.data?.message || 'Failed to load job'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '48px auto' }} />;
  if (error) return <Alert type="error" message={error} />;
  if (!job) return <Alert type="warning" message="Job not found" />;

  const typeColor: Record<string, string> = {
    'full-time': 'blue', 'part-time': 'orange', 'contract': 'purple', 'temporary': 'cyan'
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/jobs')}>Back to Jobs</Button>
      </Space>
      <Card>
        <Title level={2}>{job.title}</Title>
        <Space>
          {job.department && <Tag color="geekblue">{job.department}</Tag>}
          <Tag color={typeColor[job.employment_type] || 'default'}>{job.employment_type}</Tag>
          <Tag color={job.status === 'active' ? 'green' : 'default'}>{job.status}</Tag>
        </Space>
        <Descriptions column={2} style={{ marginTop: 16 }}>
          <Descriptions.Item label="Location">{([job.city, job.country_code].filter(Boolean).join(', ') || job.location || '-')}</Descriptions.Item>
          {job.salary_min && job.salary_max && (
            <Descriptions.Item label="Salary">
              {job.salary_currency} {job.salary_min} - {job.salary_max}
            </Descriptions.Item>
          )}
        </Descriptions>
        <Button type="primary" size="large" onClick={() => navigate(`/apply/${job.id}`)} style={{ marginTop: 16 }}>
          Apply Now
        </Button>
      </Card>
      {job.description && (
        <Card title="Description" style={{ marginTop: 16 }}>
          <Paragraph>{job.description}</Paragraph>
        </Card>
      )}
      {job.responsibilities && (
        <Card title="Responsibilities" style={{ marginTop: 16 }}>
          <Paragraph>{job.responsibilities}</Paragraph>
        </Card>
      )}
      {job.requirements && (
        <Card title="Requirements" style={{ marginTop: 16 }}>
          <Paragraph>{job.requirements}</Paragraph>
        </Card>
      )}
    </div>
  );
};

export default JobDetail;
