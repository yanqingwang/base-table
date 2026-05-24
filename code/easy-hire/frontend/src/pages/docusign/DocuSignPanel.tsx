import React, { useState } from 'react';
import { Typography, Form, Input, Button, Card, message } from 'antd';
import api from '../../api/client';

const { Title } = Typography;

const DocuSignPanel: React.FC = () => {
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const onFinish = async (values: { document_id: string; signer_email: string; signer_name: string }) => {
    setSubmitting(true);
    try {
      await api.docusign.createEnvelope(values);
      message.success('Envelope sent successfully');
      form.resetFields();
    } catch (e: any) {
      message.error(e?.response?.data?.message || 'Failed to send envelope');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px' }}>
      <Title level={3}>DocuSign Management</Title>
      <Card title="Send Envelope">
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="document_id" label="Document ID" rules={[{ required: true, message: 'Please enter document ID' }]}>
            <Input placeholder="Enter document ID" />
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
      </Card>
    </div>
  );
};

export default DocuSignPanel;
