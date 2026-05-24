import React, { useEffect, useState } from 'react';
import { Card, Input, Tag, Typography, Row, Col, Spin, Alert } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import api, { Job } from '../../api/client';

const { Title, Text } = Typography;

const JobBoard: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.jobs.publicList({ q: search || undefined })
      .then(setJobs)
      .catch(e => setError(e?.response?.data?.message || 'Failed to load jobs'))
      .finally(() => setLoading(false));
  }, [search]);

  const typeColor: Record<string, string> = {
    'full-time': 'blue', 'part-time': 'orange', 'contract': 'purple', 'temporary': 'cyan'
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <Title level={2} style={{ textAlign: 'center' }}>Easy Hire</Title>
      <Text type="secondary" style={{ display: 'block', textAlign: 'center', marginBottom: 24, fontSize: 16 }}>
        Find your next opportunity
      </Text>
      <Input
        placeholder="Search jobs by title..."
        prefix={<SearchOutlined />}
        value={search}
        onChange={e => { setSearch(e.target.value); setLoading(true); }}
        style={{ marginBottom: 24, maxWidth: 500, display: 'block', margin: '0 auto 24px' }}
      />
      {loading && <Spin size="large" style={{ display: 'block', margin: '48px auto' }} />}
      {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
      <Row gutter={[16, 16]}>
        {jobs.map(job => (
          <Col xs={24} sm={12} md={8} key={job.id}>
            <Card
              hoverable
              title={job.title}
              onClick={() => navigate(`/jobs/${job.id}`)}
              extra={
                job.department ? <Tag color="geekblue">{job.department}</Tag> : null
              }
            >
              {job.location && <Text>📍 {job.location}</Text>}
              <div style={{ marginTop: 8 }}>
                <Tag color={typeColor[job.employment_type] || 'default'}>
                  {job.employment_type}
                </Tag>
                {job.salary_min && job.salary_max && (
                  <Text type="secondary">
                    💰 {job.salary_currency} {job.salary_min} - {job.salary_max}
                  </Text>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default JobBoard;
