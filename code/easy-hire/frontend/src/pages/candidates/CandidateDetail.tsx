import React, { useLayoutEffect, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Card, Descriptions, Tag, Spin, Button, Space, Typography, Table, message, Select,
  Input, Form, DatePicker, InputNumber, Collapse, Popconfirm, Modal, Checkbox,
} from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import api, { Candidate, Interview, CandidateEducation, CandidateWorkExperience, CandidateAddress, CandidateFamilyMember, CandidateBankAccount } from '../../api/client';
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
  const [educations, setEducations] = useState<CandidateEducation[]>([]);
  const [workExperiences, setWorkExperiences] = useState<CandidateWorkExperience[]>([]);
  const [eduModalOpen, setEduModalOpen] = useState(false);
  const [workModalOpen, setWorkModalOpen] = useState(false);
  const [eduForm] = Form.useForm();
  const [workForm] = Form.useForm();
  const [addresses, setAddresses] = useState<CandidateAddress[]>([]);
  const [familyMembers, setFamilyMembers] = useState<CandidateFamilyMember[]>([]);
  const [bankAccounts, setBankAccounts] = useState<CandidateBankAccount[]>([]);

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
      loadEducations();
      loadWorkExperiences();
      const [addrRes, familyRes, bankRes] = await Promise.all([
        api.candidates.addresses.list(id),
        api.candidates.familyMembers.list(id),
        api.candidates.bankAccounts.list(id),
      ]);
      setAddresses(addrRes);
      setFamilyMembers(familyRes);
      setBankAccounts(bankRes);
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

  const loadEducations = () => { if (id) api.candidates.educations.list(id).then(setEducations).catch(() => {}); };
  const loadWorkExperiences = () => { if (id) api.candidates.workExperiences.list(id).then(setWorkExperiences).catch(() => {}); };

  const handleDeleteEdu = async (eduId: string) => {
    if (!id) return;
    try {
      await api.candidates.educations.delete(id, eduId);
      message.success('Education deleted');
      loadEducations();
    } catch {
      message.error('Failed to delete education');
    }
  };

  const handleAddEdu = async () => {
    if (!id) return;
    try {
      const values = await eduForm.validateFields();
      if (values.graduation_year) values.graduation_year = Number(values.graduation_year);
      await api.candidates.educations.create(id, values);
      message.success('Education added');
      setEduModalOpen(false);
      loadEducations();
    } catch {
      message.error('Failed to add education');
    }
  };

  const handleDeleteWork = async (workId: string) => {
    if (!id) return;
    try {
      await api.candidates.workExperiences.delete(id, workId);
      message.success('Work experience deleted');
      loadWorkExperiences();
    } catch {
      message.error('Failed to delete work experience');
    }
  };

  const handleAddWork = async () => {
    if (!id) return;
    try {
      const values = await workForm.validateFields();
      await api.candidates.workExperiences.create(id, values);
      message.success('Work experience added');
      setWorkModalOpen(false);
      loadWorkExperiences();
    } catch {
      message.error('Failed to add work experience');
    }
  };

  const handleAddAddress = async (values: any) => {
    if (!id) return;
    try {
      await api.candidates.addresses.create(id, values);
      message.success('Address added');
      const res = await api.candidates.addresses.list(id);
      setAddresses(res);
    } catch { message.error('Failed to add address'); }
  };

  const handleDeleteAddress = async (aid: string) => {
    if (!id) return;
    try {
      await api.candidates.addresses.delete(id, aid);
      message.success('Address deleted');
      setAddresses(prev => prev.filter(a => a.id !== aid));
    } catch { message.error('Failed to delete address'); }
  };

  const handleAddFamilyMember = async (values: any) => {
    if (!id) return;
    try {
      const payload = { ...values, is_emergency_contact: values.is_emergency_contact ? 1 : 0 };
      await api.candidates.familyMembers.create(id, payload);
      message.success('Family member added');
      const res = await api.candidates.familyMembers.list(id);
      setFamilyMembers(res);
    } catch { message.error('Failed to add family member'); }
  };

  const handleDeleteFamilyMember = async (fid: string) => {
    if (!id) return;
    try {
      await api.candidates.familyMembers.delete(id, fid);
      message.success('Family member deleted');
      setFamilyMembers(prev => prev.filter(f => f.id !== fid));
    } catch { message.error('Failed to delete family member'); }
  };

  const handleAddBankAccount = async (values: any) => {
    if (!id) return;
    try {
      await api.candidates.bankAccounts.create(id, values);
      message.success('Bank account added');
      const res = await api.candidates.bankAccounts.list(id);
      setBankAccounts(res);
    } catch { message.error('Failed to add bank account'); }
  };

  const handleDeleteBankAccount = async (bid: string) => {
    if (!id) return;
    try {
      await api.candidates.bankAccounts.delete(id, bid);
      message.success('Bank account deleted');
      setBankAccounts(prev => prev.filter(b => b.id !== bid));
    } catch { message.error('Failed to delete bank account'); }
  };

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!candidate) return <Typography.Text type="danger">Candidate not found</Typography.Text>;

  const statusOptions = ['new', 'screening', 'queue_waiting', 'interviewing', 'evaluated', 'offered', 'document_signing', 'signed', 'pre_onboarding', 'ready_to_sync', 'synced', 'hired', 'rejected'];

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

      <Card title="Education History" style={{ marginTop: 16 }}
        extra={<Button type="primary" size="small" onClick={() => { setEduModalOpen(true); eduForm.resetFields(); }}>Add Education</Button>}>
        <Table dataSource={educations} rowKey="id" pagination={false} size="small"
          columns={[
            { title: 'Level', dataIndex: 'level', key: 'level' },
            { title: 'School', dataIndex: 'school', key: 'school', render: (v: string) => v || '-' },
            { title: 'Major', dataIndex: 'major', key: 'major', render: (v: string) => v || '-' },
            { title: 'Year', dataIndex: 'graduation_year', key: 'year', render: (v: number) => v || '-' },
            { title: '', key: 'actions', render: (_: any, r: CandidateEducation) => (
              <Popconfirm title="Delete?" onConfirm={() => handleDeleteEdu(r.id)}>
                <Button type="link" danger size="small">Delete</Button>
              </Popconfirm>
            )},
          ]}
        />
      </Card>

      <Modal title="Add Education" open={eduModalOpen} onOk={handleAddEdu} onCancel={() => setEduModalOpen(false)}>
        <Form form={eduForm} layout="vertical">
          <Form.Item name="level" label="Level" rules={[{ required: true, message: 'Level is required' }]}>
            <Select options={[
              { value: 'high_school', label: 'High School' }, { value: 'vocational', label: 'Vocational' },
              { value: 'bachelor', label: 'Bachelor' }, { value: 'master', label: 'Master' },
              { value: 'doctorate', label: 'Doctorate' }, { value: 'other', label: 'Other' },
            ]} />
          </Form.Item>
          <Form.Item name="school" label="School"><Input /></Form.Item>
          <Form.Item name="major" label="Major"><Input /></Form.Item>
          <Form.Item name="graduation_year" label="Graduation Year"><InputNumber min={1950} max={2030} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="notes" label="Notes"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Card title="Work Experience" style={{ marginTop: 16 }}
        extra={<Button type="primary" size="small" onClick={() => { setWorkModalOpen(true); workForm.resetFields(); }}>Add Work Experience</Button>}>
        <Table dataSource={workExperiences} rowKey="id" pagination={false} size="small"
          columns={[
            { title: 'Employer', dataIndex: 'employer', key: 'employer' },
            { title: 'Position', dataIndex: 'position', key: 'position', render: (v: string) => v || '-' },
            { title: 'Start', dataIndex: 'start_date', key: 'start_date', render: (v: string) => v || '-' },
            { title: 'End', dataIndex: 'end_date', key: 'end_date', render: (v: string) => v || '-' },
            { title: 'Duration', dataIndex: 'duration', key: 'duration', render: (v: string) => v || '-' },
            { title: '', key: 'actions', render: (_: any, r: CandidateWorkExperience) => (
              <Popconfirm title="Delete?" onConfirm={() => handleDeleteWork(r.id)}>
                <Button type="link" danger size="small">Delete</Button>
              </Popconfirm>
            )},
          ]}
        />
      </Card>

      <Modal title="Add Work Experience" open={workModalOpen} onOk={handleAddWork} onCancel={() => setWorkModalOpen(false)}>
        <Form form={workForm} layout="vertical">
          <Form.Item name="employer" label="Employer" rules={[{ required: true, message: 'Employer is required' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="position" label="Position"><Input /></Form.Item>
          <Form.Item name="start_date" label="Start Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="end_date" label="End Date"><DatePicker style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="duration" label="Duration"><Input placeholder="e.g. 2 years" /></Form.Item>
          <Form.Item name="duties" label="Duties"><Input.TextArea rows={2} /></Form.Item>
        </Form>
      </Modal>

      <Card title="Interviews" style={{ marginTop: 16 }}>
        <Table dataSource={interviews} rowKey="id" pagination={false} size="small"
          columns={[
            { title: 'Job', dataIndex: 'job_id', key: 'job_id', render: (id: string) => id?.substring(0, 8) || '-' },
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

      <Card title="Pre-onboarding Data" style={{ marginTop: 16 }}>
        <Collapse>
          <Collapse.Panel header={`Addresses (${addresses.length})`} key="addresses">
            {addresses.map(addr => (
              <div key={addr.id} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                <Space>
                  <Tag>{addr.address_type}</Tag>
                  {addr.is_primary ? <Tag color="blue">Primary</Tag> : null}
                  <span>{[addr.street, addr.city, addr.state, addr.country].filter(Boolean).join(', ')}</span>
                  <Popconfirm title="Delete?" onConfirm={() => handleDeleteAddress(addr.id)}>
                    <Button danger size="small" type="text">Delete</Button>
                  </Popconfirm>
                </Space>
              </div>
            ))}
            <Form layout="inline" onFinish={handleAddAddress} style={{ marginTop: 8 }}>
              <Form.Item name="address_type" initialValue="home">
                <Select style={{ width: 100 }} options={[{value:'home',label:'Home'},{value:'current',label:'Current'},{value:'mailing',label:'Mailing'}]} />
              </Form.Item>
              <Form.Item name="street"><Input placeholder="Street" /></Form.Item>
              <Form.Item name="city"><Input placeholder="City" /></Form.Item>
              <Form.Item name="country"><Input placeholder="Country" /></Form.Item>
              <Form.Item><Button type="primary" htmlType="submit">Add</Button></Form.Item>
            </Form>
          </Collapse.Panel>

          <Collapse.Panel header={`Family Members (${familyMembers.length})`} key="family">
            {familyMembers.map(fm => (
              <div key={fm.id} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                <Space>
                  <span>{fm.name}</span>
                  {fm.relationship && <Tag>{fm.relationship}</Tag>}
                  {fm.is_emergency_contact ? <Tag color="red">Emergency</Tag> : null}
                  {fm.phone && <span>{fm.phone}</span>}
                  <Popconfirm title="Delete?" onConfirm={() => handleDeleteFamilyMember(fm.id)}>
                    <Button danger size="small" type="text">Delete</Button>
                  </Popconfirm>
                </Space>
              </div>
            ))}
            <Form layout="inline" onFinish={handleAddFamilyMember} style={{ marginTop: 8 }}>
              <Form.Item name="name" rules={[{required:true}]}><Input placeholder="Name" /></Form.Item>
              <Form.Item name="relationship"><Input placeholder="Relationship" /></Form.Item>
              <Form.Item name="phone"><Input placeholder="Phone" /></Form.Item>
              <Form.Item name="is_emergency_contact" valuePropName="checked"><Checkbox>Emergency</Checkbox></Form.Item>
              <Form.Item><Button type="primary" htmlType="submit">Add</Button></Form.Item>
            </Form>
          </Collapse.Panel>

          <Collapse.Panel header={`Bank Accounts (${bankAccounts.length})`} key="bank">
            {bankAccounts.map(bank => (
              <div key={bank.id} style={{ marginBottom: 12, padding: 8, background: '#fafafa', borderRadius: 4 }}>
                <Space>
                  <span>{bank.bank_name}</span>
                  <span>••••{bank.account_number.slice(-4)}</span>
                  {bank.currency && <Tag>{bank.currency}</Tag>}
                  {bank.is_primary ? <Tag color="green">Primary</Tag> : null}
                  <Popconfirm title="Delete?" onConfirm={() => handleDeleteBankAccount(bank.id)}>
                    <Button danger size="small" type="text">Delete</Button>
                  </Popconfirm>
                </Space>
              </div>
            ))}
            <Form layout="inline" onFinish={handleAddBankAccount} style={{ marginTop: 8 }}>
              <Form.Item name="bank_name" rules={[{required:true}]}><Input placeholder="Bank Name" /></Form.Item>
              <Form.Item name="account_number" rules={[{required:true}]}><Input placeholder="Account Number" /></Form.Item>
              <Form.Item name="account_holder"><Input placeholder="Account Holder" /></Form.Item>
              <Form.Item name="currency"><Input placeholder="Currency" /></Form.Item>
              <Form.Item><Button type="primary" htmlType="submit">Add</Button></Form.Item>
            </Form>
          </Collapse.Panel>
        </Collapse>
      </Card>
    </div>
  );
};

export default CandidateDetail;
