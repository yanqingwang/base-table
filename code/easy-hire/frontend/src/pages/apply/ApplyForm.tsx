import React, { useState } from 'react';
import { Typography, Form, Input, Button, Alert, Card, Space, Select, Upload, message } from 'antd';
import { ArrowLeftOutlined, UploadOutlined } from '@ant-design/icons';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/client';

const { Title } = Typography;

const countryOptions = [
  { value: 'PH', label: 'Philippines' }, { value: 'MY', label: 'Malaysia' },
  { value: 'TH', label: 'Thailand' }, { value: 'SG', label: 'Singapore' },
  { value: 'ID', label: 'Indonesia' }, { value: 'VN', label: 'Vietnam' },
];

const ApplyForm: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: Record<string, unknown>) => {
    if (!jobId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.jobs.apply({ job_id: jobId, ...values } as any);
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
        <Alert type="success" message="Application Submitted!" description="We've received your application. Your queue number will be assigned shortly." showIcon />
        <Button type="primary" onClick={() => navigate('/jobs')} style={{ marginTop: 16 }}>Back to Jobs</Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto', padding: '24px' }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate(`/jobs/${jobId}`)}>Back to Job</Button>
      </Space>
      <Card>
        <Title level={3}>Apply for Position</Title>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="name" label="Full Name" rules={[{ required: true, message: 'Please enter your name' }]}>
            <Input placeholder="Your full name" />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Please enter your phone number' }]}>
            <Input placeholder="Phone number" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Email address (optional)" type="email" />
          </Form.Item>
          <Form.Item name="id_number" label="ID / Passport Number">
            <Input placeholder="ID or passport number (optional)" />
          </Form.Item>
          <Form.Item name="country_code" label="Country" initialValue="PH">
            <Select options={countryOptions} />
          </Form.Item>
          <Form.Item name="address" label="Address">
            <Input placeholder="Street address (optional)" />
          </Form.Item>
          <Form.Item name="city" label="City">
            <Input placeholder="City (optional)" />
          </Form.Item>

          <Form.Item name="skills" label="Skills">
            <Select mode="tags" placeholder="Type and press Enter to add skills (optional)" />
          </Form.Item>

          <Form.Item name="resume_text" label="Resume / Experience">
            <Input.TextArea rows={4} placeholder="Paste your resume or describe your experience (optional)" />
          </Form.Item>

          <Form.Item name="resume_file_url" label="Upload Resume">
            <Upload
              name="file"
              maxCount={1}
              accept=".pdf,.doc,.docx"
              beforeUpload={(file) => {
                const reader = new FileReader();
                reader.onload = (e) => {
                  form.setFieldValue('resume_text', e.target?.result as string);
                };
                reader.readAsText(file);
                form.setFieldValue('resume_file_url', file.name);
                message.info(`File selected: ${file.name}`);
                return false;
              }}
            >
              <Button icon={<UploadOutlined />}>Select Resume (PDF, DOC)</Button>
            </Upload>
          </Form.Item>

          <Form.Item name="notes" label="Additional Notes">
            <Input.TextArea rows={2} placeholder="Any additional information (optional)" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} size="large" block>
              Submit Application
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default ApplyForm;
