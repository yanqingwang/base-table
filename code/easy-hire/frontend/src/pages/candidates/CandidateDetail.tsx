import React, { useLayoutEffect, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Spin, Button, Space, Typography, Table, message, Select,
  Input, Form, DatePicker, InputNumber, Collapse,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api, { Candidate, Interview } from '../../api/client';
import StatusTag from '../../components/StatusTag';

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

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form] = Form.useForm();

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [c, ivs, tl] = await Promise.all([
        api.candidates.get(id),
        api.interviews.list(),
        api.candidates.timeline(id),
      ]);
      setCandidate(c);
      setInterviews(ivs.filter((iv) => iv.candidate_id === id));
      setTimeline(tl || []);
    } catch {
      message.error('Failed to load candidate');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  useLayoutEffect(() => {
    if (editing && candidate) {
      const values: Record<string, unknown> = { ...candidate };
      if (candidate.skills) {
        try { values.skills = JSON.parse(candidate.skills); } catch { values.skills = []; }
      } else {
        values.skills = [];
      }
      if (candidate.date_of_birth) {
        values.date_of_birth = dayjs(candidate.date_of_birth);
      }
      form.resetFields();
      form.setFieldsValue(values);
    }
  }, [editing, candidate, form]);

  const handleUpdate = async (values: Record<string, unknown>) => {
    if (!id) return;
    try {
      const payload: Record<string, unknown> = { ...values };
      if (payload.date_of_birth && dayjs.isDayjs(payload.date_of_birth)) {
        payload.date_of_birth = (payload.date_of_birth as dayjs.Dayjs).format('YYYY-MM-DD');
      }
      if (Array.isArray(payload.skills)) {
        payload.skills = JSON.stringify(payload.skills);
      }
      await api.candidates.update(id, payload as Partial<Candidate>);
      message.success('Updated');
      setEditing(false);
      fetchData();
    } catch {
      message.error('Update failed');
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!id) return;
    try {
      await api.candidates.update(id, { status } as Partial<Candidate>);
      message.success(`Status changed to ${status}`);
      fetchData();
    } catch {
      message.error('Status change failed');
    }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!candidate) return <Typography.Text type="danger">Candidate not found</Typography.Text>;

  const statusOptions = ['new', 'screened', 'interviewing', 'offered', 'hired', 'rejected'];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/candidates')}>Back</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>Candidate Details</Typography.Title>
      </Space>

      <Card
        title={candidate.name}
        extra={
          <Space>
            <Select value={candidate.status} onChange={handleStatusChange} style={{ width: 140 }}
              options={statusOptions.map((s) => ({ value: s, label: s }))}
            />
            <Button type="primary" onClick={() => setEditing(!editing)}>
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </Space>
        }
      >
        {editing ? (
          <Form form={form} layout="vertical" onFinish={handleUpdate}>
            <Collapse
              defaultActiveKey={['basic']}
              style={{ marginBottom: 16 }}
              items={[
                {
                  key: 'basic',
                  label: 'Basic Information',
                  children: (<>
                    <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
                      <Input />
                    </Form.Item>
                    <Form.Item name="phone" label="Phone"><Input /></Form.Item>
                    <Form.Item name="email" label="Email"><Input /></Form.Item>
                    <Form.Item name="id_number" label="ID Number"><Input /></Form.Item>
                    <Form.Item name="country_code" label="Country">
                      <Select options={countryOptions} />
                    </Form.Item>
                    <Form.Item name="date_of_birth" label="Date of Birth">
                      <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="gender" label="Gender">
                      <Select options={genderOptions} placeholder="Select gender" allowClear />
                    </Form.Item>
                    <Form.Item name="nationality" label="Nationality"><Input /></Form.Item>
                  </>),
                },
                {
                  key: 'address',
                  label: 'Address',
                  children: (<>
                    <Form.Item name="address" label="Address"><Input /></Form.Item>
                    <Form.Item name="city" label="City"><Input /></Form.Item>
                    <Form.Item name="province" label="Province"><Input /></Form.Item>
                    <Form.Item name="postal_code" label="Postal Code"><Input /></Form.Item>
                  </>),
                },
                {
                  key: 'education',
                  label: 'Education',
                  children: (<>
                    <Form.Item name="education_level" label="Education Level">
                      <Select options={educationLevelOptions} placeholder="Select level" allowClear />
                    </Form.Item>
                    <Form.Item name="education_school" label="School"><Input /></Form.Item>
                    <Form.Item name="education_major" label="Major"><Input /></Form.Item>
                    <Form.Item name="education_year" label="Graduation Year"><Input placeholder="e.g. 2020" /></Form.Item>
                  </>),
                },
                {
                  key: 'work',
                  label: 'Work Experience',
                  children: (<>
                    <Form.Item name="work_experience_years" label="Years of Experience">
                      <InputNumber min={0} precision={0} style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="previous_employer" label="Previous Employer"><Input /></Form.Item>
                    <Form.Item name="previous_position" label="Previous Position"><Input /></Form.Item>
                    <Form.Item name="previous_duration" label="Previous Duration"><Input placeholder="e.g. 2 years" /></Form.Item>
                    <Form.Item name="previous_duties" label="Previous Duties">
                      <TextArea rows={2} />
                    </Form.Item>
                  </>),
                },
                {
                  key: 'skills',
                  label: 'Skills & Certifications',
                  children: (<>
                    <Form.Item name="skills" label="Skills">
                      <Select mode="tags" placeholder="Type and press Enter to add skills" />
                    </Form.Item>
                    <Form.Item name="languages" label="Languages"><Input /></Form.Item>
                    <Form.Item name="certifications" label="Certifications"><Input /></Form.Item>
                  </>),
                },
                {
                  key: 'emergency',
                  label: 'Emergency Contact',
                  children: (<>
                    <Form.Item name="emergency_contact_name" label="Contact Name"><Input /></Form.Item>
                    <Form.Item name="emergency_contact_phone" label="Contact Phone"><Input /></Form.Item>
                    <Form.Item name="emergency_contact_relation" label="Relation"><Input /></Form.Item>
                  </>),
                },
                {
                  key: 'other',
                  label: 'Other',
                  children: (<>
                    <Form.Item name="source" label="Source">
                      <Select options={sourceOptions} />
                    </Form.Item>
                    <Form.Item name="resume_text" label="Resume Text">
                      <TextArea rows={3} />
                    </Form.Item>
                    <Form.Item name="resume_file_url" label="Resume File URL"><Input /></Form.Item>
                    <Form.Item name="profile_photo_url" label="Profile Photo URL"><Input /></Form.Item>
                    <Form.Item name="notes" label="Notes">
                      <TextArea rows={3} />
                    </Form.Item>
                  </>),
                },
              ]}
            />
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save Changes</Button>
          </Form>
        ) : (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Name">{candidate.name}</Descriptions.Item>
            <Descriptions.Item label="Status"><StatusTag status={candidate.status} /></Descriptions.Item>
            <Descriptions.Item label="Phone">{candidate.phone ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Email">{candidate.email ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="ID Number">{candidate.id_number ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Country">{candidate.country_code}</Descriptions.Item>
            <Descriptions.Item label="Date of Birth">{candidate.date_of_birth ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Gender">{candidate.gender ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Nationality">{candidate.nationality ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Address">{candidate.address ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="City">{candidate.city ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Province">{candidate.province ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Postal Code">{candidate.postal_code ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Education Level">{candidate.education_level ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="School">{candidate.education_school ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Major">{candidate.education_major ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Graduation Year">{candidate.education_year ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Years of Experience">{candidate.work_experience_years ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Previous Employer">{candidate.previous_employer ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Previous Position">{candidate.previous_position ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Previous Duration">{candidate.previous_duration ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Previous Duties">{candidate.previous_duties ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Languages">{candidate.languages ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Certifications">{candidate.certifications ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Emergency Contact">{candidate.emergency_contact_name ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Emergency Phone">{candidate.emergency_contact_phone ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Emergency Relation">{candidate.emergency_contact_relation ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Source">{candidate.source}</Descriptions.Item>
            <Descriptions.Item label="Skills">{candidate.skills}</Descriptions.Item>
            <Descriptions.Item label="Notes">{candidate.notes ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Created">{new Date(candidate.created_at).toLocaleString()}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      <Card title="Interviews" style={{ marginTop: 16 }}>
        <Table dataSource={interviews} rowKey="id" pagination={false} size="small"
          columns={[
            { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
            { title: 'Scheduled', dataIndex: 'scheduled_at', key: 'scheduled_at', render: (d: string) => d ? new Date(d).toLocaleString() : '-' },
            { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
            { title: 'Score', dataIndex: 'overall_score', key: 'score', render: (s: number | null) => s ?? '-' },
            { title: 'Result', dataIndex: 'result', key: 'result', render: (r: string | null) => r ? <StatusTag status={r} /> : '-' },
          ]}
        />
      </Card>

      <Card title="Activity Timeline" style={{ marginTop: 16 }}>
        <Table dataSource={timeline} rowKey="id" pagination={false} size="small"
          columns={[
            { title: 'Action', dataIndex: 'action', key: 'action', render: (a: string) => <Tag>{a}</Tag> },
            { title: 'Details', dataIndex: 'details', key: 'details', ellipsis: true },
            { title: 'Time', dataIndex: 'created_at', key: 'created_at', render: (d: string) => new Date(d).toLocaleString() },
          ]}
        />
      </Card>
    </div>
  );
};

export default CandidateDetail;
