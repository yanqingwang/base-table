import React, { useState } from 'react';
import { Typography, Form, Input, Button, Card, Alert } from 'antd';
import api from '../../api/client';

const { Title } = Typography;
const { TextArea } = Input;

const DocuSignPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [batchForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);
  const [batchSubmitting, setBatchSubmitting] = useState(false);
  const [result, setResult] = useState<{ envelope_id?: string; status?: string } | null>(null);
  const [batchResult, setBatchResult] = useState<{ total?: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (values: { document_id: string; signer_email: string; signer_name: string }) => {
    setSubmitting(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.docusign.createEnvelope(values);
      setResult(res as { envelope_id?: string; status?: string });
      form.resetFields();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed to send envelope');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBatch = async (values: { document_ids: string }) => {
    setBatchSubmitting(true);
    setError(null);
    setBatchResult(null);
    try {
      const ids = values.document_ids.split('\n').map((s) => s.trim()).filter(Boolean);
      const res = await api.docusign.batchSend({ document_ids: ids });
      setBatchResult(res as { total?: number });
      batchForm.resetFields();
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || 'Failed batch send');
    } finally {
      setBatchSubmitting(false);
    }
  };

  return (
    <div>
      <Title level={3}>DocuSign Management</Title>

      {error && (
        <Alert type="error" message={error} style={{ marginBottom: 16 }} closable onClose={() => setError(null)} />
      )}

      <Card title="Send Single Envelope" style={{ marginBottom: 16 }}>
        <Form form={form} layout="vertical" onFinish={handleSend}>
          <Form.Item name="document_id" label="Document ID" rules={[{ required: true, message: 'Please enter document ID' }]}>
            <Input placeholder="Enter document UUID" />
          </Form.Item>
          <Form.Item name="signer_email" label="Signer Email" rules={[{ required: true, type: 'email', message: 'Please enter a valid email' }]}>
            <Input placeholder="signer@example.com" />
          </Form.Item>
          <Form.Item name="signer_name" label="Signer Name" rules={[{ required: true, message: 'Please enter signer name' }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={submitting}>
              Send Envelope
            </Button>
          </Form.Item>
        </Form>
        {result && (
          <Alert
            type="success"
            message={`Envelope sent! ID: ${result.envelope_id}, Status: ${result.status}`}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>

      <Card title="Batch Send">
        <Form form={batchForm} layout="vertical" onFinish={handleBatch}>
          <Form.Item name="document_ids" label="Document IDs (one per line)" rules={[{ required: true, message: 'Please enter at least one document ID' }]}>
            <TextArea rows={4} placeholder="doc-id-1&#10;doc-id-2&#10;doc-id-3" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={batchSubmitting}>
              Batch Send
            </Button>
          </Form.Item>
        </Form>
        {batchResult && (
          <Alert
            type="success"
            message={`${batchResult.total} envelope(s) sent successfully!`}
            style={{ marginTop: 16 }}
          />
        )}
      </Card>
    </div>
  );
};

export default DocuSignPanel;
