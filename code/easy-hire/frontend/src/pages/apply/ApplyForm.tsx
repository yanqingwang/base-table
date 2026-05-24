import React, { useState } from 'react';
import { Typography, Form, Input, Button, Alert, Card, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

const { Title } = Typography;

const ApplyForm: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { name: string; email: string; phone?: string; resume_text?: string; cover_letter?: string }) => {
    if (!jobId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.jobs.apply({ job_id: jobId, ...values });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit application');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 600, margin: '48px auto', padding: '24px', textAlign: 'center' }}>
        <Alert type="success" message="Application Submitted!" description="We've received your application. We'll be in touch soon." showIcon />
        <Button type="primary" onClick={() => navigate('/jobs')} style={{ marginTop: 16 }}>Back to Jobs</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/jobs/${jobId}`)}>Back to Job</Button>
      </Space>
      <Card>
        <Title level={3}>Apply for Position</Title>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="phone" label="Phone">
            <Input />
          </Form.Item>
          <Form.Item name="resume_text" label="Resume / Experience">
            <Input.TextArea rows={4} placeholder="Paste your resume or describe your experience" />
          </Form.Item>
          <Form.Item name="cover_letter" label="Cover Letter">
            <Input.TextArea rows={4} placeholder="Optional cover letter" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} size="large">
              Submit Application
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ApplyForm;
