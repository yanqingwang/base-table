import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, Form, Input, Select, Button, Typography, Space, message } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import api from '../../api/client';

const NewCandidate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: any) => {
    try {
      await api.candidates.create(values);
      message.success('Candidate created');
      navigate('/candidates');
    } catch (e: any) {
      message.error(e.response?.data || 'Failed to create candidate');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/candidates')}>Back</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>New Candidate</Typography.Title>
      </Space>
      <Card style={{ maxWidth: 600 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Full name" />
          </Form.Item>
          <Form.Item name="phone" label="Phone" rules={[{ required: true }]}>
            <Input placeholder="Phone number" />
          </Form.Item>
          <Form.Item name="email" label="Email">
            <Input placeholder="Email address" />
          </Form.Item>
          <Form.Item name="id_number" label="ID Number">
            <Input placeholder="Passport/ID number" />
          </Form.Item>
          <Form.Item name="country_code" label="Country" initialValue="PH">
            <Select options={[
              { value: 'PH', label: 'Philippines' },
              { value: 'MY', label: 'Malaysia' },
              { value: 'TH', label: 'Thailand' },
            ]} />
          </Form.Item>
          <Form.Item name="source" label="Source" initialValue="direct">
            <Select options={[
              { value: 'direct', label: 'Direct' },
              { value: 'agency', label: 'Agency' },
              { value: 'referral', label: 'Referral' },
              { value: 'other', label: 'Other' },
            ]} />
          </Form.Item>
          <Form.Item name="notes" label="Notes">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Button type="primary" htmlType="submit">Create</Button>
        </Form>
      </Card>
    </div>
  );
};

export default NewCandidate;
