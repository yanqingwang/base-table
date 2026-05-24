import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card, Form, Input, Select, Button, Typography, Space, DatePicker,
  InputNumber, Collapse, message,
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

const educationLevelOptions = [
  { value: 'none', label: 'None' },
  { value: 'primary', label: 'Primary' },
  { value: 'secondary', label: 'Secondary' },
  { value: 'high_school', label: 'High School' },
  { value: 'vocational', label: 'Vocational' },
  { value: 'bachelor', label: 'Bachelor' },
  { value: 'master', label: 'Master' },
  { value: 'doctorate', label: 'Doctorate' },
];

const sourceOptions = [
  { value: 'direct', label: 'Direct' },
  { value: 'agency', label: 'Agency' },
  { value: 'referral', label: 'Referral' },
  { value: 'other', label: 'Other' },
];

const statusOptions = [
  { value: 'new', label: 'New' },
  { value: 'applied', label: 'Applied' },
  { value: 'screened', label: 'Screened' },
  { value: 'interviewing', label: 'Interviewing' },
  { value: 'offered', label: 'Offered' },
  { value: 'signed', label: 'Signed' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Rejected' },
];

const collapseItems = [
  {
    key: 'basic',
    label: 'Basic Information',
    children: (
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
        <Form.Item name="id_number" label="ID Number">
          <Input placeholder="Passport / ID number" />
        </Form.Item>
        <Form.Item name="country_code" label="Country" initialValue="PH">
          <Select options={countryOptions} />
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
      </Space>
    ),
  },
  {
    key: 'address',
    label: 'Address',
    children: (
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
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
      </Space>
    ),
  },
  {
    key: 'education',
    label: 'Education',
    children: (
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Form.Item name="education_level" label="Education Level">
          <Select options={educationLevelOptions} placeholder="Select education level" allowClear />
        </Form.Item>
        <Form.Item name="education_school" label="School">
          <Input placeholder="School / institution name" />
        </Form.Item>
        <Form.Item name="education_major" label="Major">
          <Input placeholder="Field of study / major" />
        </Form.Item>
        <Form.Item name="education_year" label="Graduation Year">
          <Input placeholder="e.g. 2020" />
        </Form.Item>
      </Space>
    ),
  },
  {
    key: 'work',
    label: 'Work Experience',
    children: (
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Form.Item name="work_experience_years" label="Years of Experience">
          <InputNumber min={0} precision={0} style={{ width: '100%' }} placeholder="Total years of experience" />
        </Form.Item>
        <Form.Item name="previous_employer" label="Previous Employer">
          <Input placeholder="Company name" />
        </Form.Item>
        <Form.Item name="previous_position" label="Previous Position">
          <Input placeholder="Job title" />
        </Form.Item>
        <Form.Item name="previous_duration" label="Previous Duration">
          <Input placeholder="e.g. 2 years" />
        </Form.Item>
        <Form.Item name="previous_duties" label="Previous Duties">
          <TextArea rows={2} placeholder="Describe previous responsibilities" />
        </Form.Item>
      </Space>
    ),
  },
  {
    key: 'skills',
    label: 'Skills & Certifications',
    children: (
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Form.Item name="skills" label="Skills" initialValue={[]}>
          <Select
            mode="tags"
            placeholder="Type and press Enter to add skills"
          />
        </Form.Item>
        <Form.Item name="languages" label="Languages">
          <Input placeholder="Comma-separated (e.g. English, Tagalog)" />
        </Form.Item>
        <Form.Item name="certifications" label="Certifications">
          <Input placeholder="Comma-separated certifications" />
        </Form.Item>
      </Space>
    ),
  },
  {
    key: 'emergency',
    label: 'Emergency Contact',
    children: (
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Form.Item name="emergency_contact_name" label="Contact Name">
          <Input placeholder="Emergency contact name" />
        </Form.Item>
        <Form.Item name="emergency_contact_phone" label="Contact Phone">
          <Input placeholder="Emergency contact phone" />
        </Form.Item>
        <Form.Item name="emergency_contact_relation" label="Relation">
          <Input placeholder="e.g. Spouse, Parent, Sibling" />
        </Form.Item>
      </Space>
    ),
  },
  {
    key: 'other',
    label: 'Other',
    children: (
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        <Form.Item name="source" label="Source" initialValue="direct">
          <Select options={sourceOptions} />
        </Form.Item>
        <Form.Item name="status" label="Status" initialValue="new">
          <Select options={statusOptions} />
        </Form.Item>
        <Form.Item name="resume_text" label="Resume Text">
          <TextArea rows={3} placeholder="Paste or type resume content" />
        </Form.Item>
        <Form.Item name="resume_file_url" label="Resume File URL">
          <Input placeholder="Link to uploaded resume file" />
        </Form.Item>
        <Form.Item name="profile_photo_url" label="Profile Photo URL">
          <Input placeholder="Link to profile photo" />
        </Form.Item>
        <Form.Item name="notes" label="Notes">
          <TextArea rows={3} placeholder="Additional notes" />
        </Form.Item>
      </Space>
    ),
  },
];

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
        payload.status = 'new';
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
          <Collapse
            defaultActiveKey={['basic']}
            items={collapseItems}
            style={{ marginBottom: 24 }}
          />
          <Button type="primary" htmlType="submit" size="large">Create</Button>
        </Form>
      </Card>
    </div>
  );
};

export default NewCandidate;
