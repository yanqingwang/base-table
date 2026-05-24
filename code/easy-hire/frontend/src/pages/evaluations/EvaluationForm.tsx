import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Form, Select, Input, Button, Alert, Typography, Slider } from 'antd';
import api from '../../api/client';

const { Title } = Typography;
const { TextArea } = Input;

const EvaluationForm: React.FC = () => {
  const { interviewId } = useParams<{ interviewId: string }>();
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFinish = async (values: { overall_score: number; comments?: string; recommendation: string }) => {
    if (!interviewId) return;
    setSubmitting(true);
    setError(null);
    try {
      await api.interviews.evaluations.submit({
        interview_id: interviewId,
        overall_score: values.overall_score,
        comments: values.comments,
        recommendation: values.recommendation,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit evaluation');
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <div style={{ maxWidth: 600, margin: '48px auto', textAlign: 'center' }}>
        <Alert type="success" message="Evaluation Submitted!" showIcon />
        <Button type="primary" onClick={() => navigate(`/interviews/${interviewId}`)} style={{ marginTop: 16 }}>
          Back to Interview
        </Button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: 24 }}>
      <Card>
        <Title level={3}>Interview Evaluation</Title>
        <p>Interview ID: {interviewId?.substring(0, 8)}</p>
        {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{ overall_score: 50, recommendation: 'maybe' }}
        >
          <Form.Item name="overall_score" label="Overall Score">
            <Slider min={0} max={100} marks={{ 0: '0', 25: '25', 50: '50', 75: '75', 100: '100' }} />
          </Form.Item>
          <Form.Item name="recommendation" label="Recommendation" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="strong_hire">Strong Hire</Select.Option>
              <Select.Option value="hire">Hire</Select.Option>
              <Select.Option value="maybe">Maybe</Select.Option>
              <Select.Option value="no">No</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="comments" label="Comments">
            <TextArea rows={4} placeholder="Enter your feedback and comments about the candidate..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting} size="large">
              Submit Evaluation
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EvaluationForm;
