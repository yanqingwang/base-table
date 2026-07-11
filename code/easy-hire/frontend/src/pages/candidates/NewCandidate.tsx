import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Select, Button, Typography, Space, DatePicker,
  Collapse, message,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api from '../../api/client';

const { TextArea } = Input;

const countryOptions = [
  { value: 'PH', label: 'Philippines' },
  { value: 'MY', label: 'Malaysia' },
  { value: 'TH', label: 'Thailand' },
  { value: 'SG', label: 'Singapore' },
  { value: 'ID', label: 'Indonesia' },
  { value: 'VN', label: 'Vietnam' },
  { value: 'MM', label: 'Myanmar' },
  { value: 'KH', label: 'Cambodia' },
  { value: 'LA', label: 'Laos' },
  { value: 'BN', label: 'Brunei' },
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
];

const sourceOptions = [
  { value: 'direct', label: 'Direct' },
  { value: 'agency', label: 'Agency' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'applied', label: 'Applied' },
  { value: 'screened', label: 'Screened' },
  { value: 'interviewed', label: 'Interviewed' },
  { value: 'offered', label: 'Offered' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

// ponytail: core fields only — education/work/skills moved to CandidateDetail sub-tables
const coreFields = (
  <Space direction="vertical" style={{ width: '100%' }} size={12}>
    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
      <Input placeholder="Full name" />
    </Form.Item>
    <Form.Item name="phone" label="Phone" rules={[{ required: true, message: 'Phone is required' }]}>
      <Input placeholder="Phone number" />
    </Form.Item>
    <Form.Item name="email" label="Email">
      <Input placeholder="Email address" type="email" />
    </Form.Item>
    <Form.Item name="country_code" label="Country" initialValue="PH">
      <Select options={countryOptions} />
    </Form.Item>
    <Form.Item name="source" label="Source" initialValue="direct">
      <Select options={sourceOptions} />
    </Form.Item>
    <Form.Item name="notes" label="Notes">
      <TextArea rows={2} placeholder="Additional notes" />
    </Form.Item>
  </Space>
);

const moreFields = (
  <Space direction="vertical" style={{ width: '100%' }} size={12}>
    <Form.Item name="id_number" label="ID Number">
      <Input placeholder="Passport / ID number" />
    </Form.Item>
    <Form.Item name="date_of_birth" label="Date of Birth">
      <DatePicker style={{ width: '100%' }} placeholder="Select date of birth" />
    </Form.Item>
    <Form.Item name="gender" label="Gender">
      <Select options={genderOptions} placeholder="Select gender" allowClear />
    </Form.Item>
    <Form.Item name="nationality" label="Nationality">
      <Input placeholder="Nationality" />
    </Form.Item>
    <Form.Item name="address" label="Address">
      <Input placeholder="Street address" />
    </Form.Item>
    <Form.Item name="city" label="City">
      <Input placeholder="City" />
    </Form.Item>
    <Form.Item name="province" label="Province">
      <Input placeholder="Province / State" />
    </Form.Item>
    <Form.Item name="postal_code" label="Postal Code">
      <Input placeholder="Postal / ZIP code" />
    </Form.Item>
    <Form.Item name="status" label="Status" initialValue="applied">
      <Select options={statusOptions} />
    </Form.Item>
  </Space>
);

const NewCandidate: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();

  const handleSubmit = async (values: Record<string, unknown>) => {
    try {
      const payload: Record<string, unknown> = { ...values };

      // Convert dayjs DatePicker value to ISO string
      if (payload.date_of_birth && dayjs.isDayjs(payload.date_of_birth)) {
        payload.date_of_birth = (payload.date_of_birth as dayjs.Dayjs).format('YYYY-MM-DD');
      }

      // Convert skills array to JSON string
      if (Array.isArray(payload.skills)) {
        payload.skills = JSON.stringify(payload.skills);
      }

      // Default status if not provided
      if (!payload.status) {
        payload.status = 'applied';
      }

      await api.candidates.create(payload as Parameters<typeof api.candidates.create>[0]);
      message.success('Candidate created');
      navigate('/candidates');
    } catch (e: unknown) {
      const err = e as { response?: { data?: string } };
      message.error(err.response?.data || 'Failed to create candidate');
    }
  };

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/candidates')}>Back</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>New Candidate</Typography.Title>
      </Space>
      <Card style={{ maxWidth: 720 }}>
        <Form form={form} layout="vertical" onFinish={handleSubmit}>
          {coreFields}
          <Collapse defaultActiveKey={[]} items={[
            { key: 'more', label: 'Additional Info (optional)', children: moreFields }
          ]} style={{ marginBottom: 24 }} />
          <Button type="primary" htmlType="submit" size="large">Create</Button>
        </Form>
      </Card>
    </div>
  );
};

export default NewCandidate;
