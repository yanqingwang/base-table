import React, { useEffect, useState } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, Tag, Space, message, Popconfirm } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { Job, Department, Location, JobCategory, masterDataApi } from '../../api/client';

const statusColors: Record<string, string> = {
  active: 'green', draft: 'orange', closed: 'red', filled: 'blue'
};

const typeOptions = [
  { value: 'full-time', label: 'Full Time' },
  { value: 'part-time', label: 'Part Time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
];

const AdminJobList: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [form] = Form.useForm();
  const [applications, setApplications] = useState<any[]>([]);
  const [appModalOpen, setAppModalOpen] = useState(false);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [categories, setCategories] = useState<JobCategory[]>([]);

  const loadJobs = () => {
    setLoading(true);
    api.jobs.list().then(setJobs).catch(() => message.error('Failed to load jobs')).finally(() => setLoading(false));
  };

  useEffect(() => { loadJobs(); }, []);

  useEffect(() => {
    masterDataApi.listDepartments().then(r => setDepartments(r.data)).catch(() => {});
    masterDataApi.listLocations().then(r => setLocations(r.data)).catch(() => {});
    masterDataApi.listJobCategories().then(r => setCategories(r.data)).catch(() => {});
  }, []);

  const handleCreate = () => {
    setEditingJob(null);
    form.resetFields();
    setModalOpen(true);
  };

  const handleEdit = (job: Job) => {
    setEditingJob(job);
    form.setFieldsValue(job);
    setModalOpen(true);
  };

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      if (editingJob) {
        await api.jobs.update(editingJob.id, values);
        message.success('Job updated');
      } else {
        await api.jobs.create(values);
        message.success('Job created');
      }
      setModalOpen(false);
      loadJobs();
    } catch (e: any) {
      message.error(e?.response?.data || 'Failed to save job');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.jobs.deleteJob(id);
      message.success('Job deleted');
      loadJobs();
    } catch {
      message.error('Failed to delete job');
    }
  };

  const handleViewApplications = async (jobId: string) => {
    try {
      const apps = await api.jobs.applications(jobId);
      setApplications(apps);
      setAppModalOpen(true);
    } catch {
      message.error('Failed to load applications');
    }
  };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Department', dataIndex: 'department', key: 'department', render: (v: string) => v || '-' },
    { title: 'Location', key: 'location', render: (_: any, r: Job) => [r.city, r.country_code].filter(Boolean).join(', ') || r.location || '-' },
    { title: 'Type', dataIndex: 'employment_type', key: 'type', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag> },
    { title: 'Views', dataIndex: 'views', key: 'views' },
    { title: 'Created', dataIndex: 'created_at', key: 'created', render: (v: string) => v?.substring(0, 10) },
    {
      title: 'Actions', key: 'actions',
      render: (_: any, record: Job) => (
        <Space>
          <Button type="link" onClick={() => handleEdit(record)}>Edit</Button>
          <Button type="link" onClick={() => handleViewApplications(record.id)}>Applications</Button>
          <Popconfirm title="Delete this job?" onConfirm={() => handleDelete(record.id)}>
            <Button type="link" danger>Delete</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const appColumns = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Phone', dataIndex: 'phone', key: 'phone', render: (v: string) => v || '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (v: string) => <Tag>{v}</Tag> },
    { title: 'Applied', dataIndex: 'created_at', key: 'created', render: (v: string) => v?.substring(0, 10) },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Job Management</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>Create Job</Button>
      </div>
      <Table dataSource={jobs} columns={columns} rowKey="id" loading={loading} />
      
      <Modal title={editingJob ? 'Edit Job' : 'Create Job'} open={modalOpen} onOk={handleSave} onCancel={() => setModalOpen(false)} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="title" label="Title" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="description" label="Description"><Input.TextArea rows={3} /></Form.Item>
          <Space style={{ width: '100%' }}>
            <Form.Item name="country_code" label="Country" initialValue="PH" rules={[{ required: true }]}>
              <Select style={{ width: 180 }} options={[
                { value: 'PH', label: 'Philippines' }, { value: 'MY', label: 'Malaysia' },
                { value: 'TH', label: 'Thailand' }, { value: 'SG', label: 'Singapore' },
                { value: 'ID', label: 'Indonesia' }, { value: 'VN', label: 'Vietnam' },
                { value: 'MM', label: 'Myanmar' }, { value: 'KH', label: 'Cambodia' },
                { value: 'LA', label: 'Laos' }, { value: 'BN', label: 'Brunei' },
              ]} />
            </Form.Item>
            <Form.Item name="city" label="City"><Input style={{ width: 200 }} placeholder="City name" /></Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="salary_min" label="Salary Min"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="salary_max" label="Salary Max"><InputNumber style={{ width: 120 }} /></Form.Item>
            <Form.Item name="salary_currency" label="Currency" initialValue="USD" style={{ width: 120 }}>
              <Select options={[
                { value: 'USD', label: 'USD' }, { value: 'PHP', label: 'PHP' },
                { value: 'MYR', label: 'MYR' }, { value: 'THB', label: 'THB' },
                { value: 'SGD', label: 'SGD' }, { value: 'IDR', label: 'IDR' },
                { value: 'VND', label: 'VND' }, { value: 'MMK', label: 'MMK' },
                { value: 'KHR', label: 'KHR' }, { value: 'LAK', label: 'LAK' },
                { value: 'BND', label: 'BND' }, { value: 'EUR', label: 'EUR' },
                { value: 'GBP', label: 'GBP' }, { value: 'JPY', label: 'JPY' },
                { value: 'CNY', label: 'CNY' }, { value: 'AUD', label: 'AUD' },
              ]} />
            </Form.Item>
          </Space>
          <Space style={{ width: '100%' }}>
            <Form.Item name="department" label="Department">
              <Select placeholder="Select department" allowClear style={{ width: 180 }}>
                {departments.map(d => <Select.Option key={d.id} value={d.name}>{d.name}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="location" label="Location">
              <Select placeholder="Select location" allowClear style={{ width: 180 }}>
                {locations.map(l => <Select.Option key={l.id} value={l.name}>{l.name}</Select.Option>)}
              </Select>
            </Form.Item>
            <Form.Item name="category" label="Category">
              <Select placeholder="Select category" allowClear style={{ width: 180 }}>
                {categories.map(c => <Select.Option key={c.id} value={c.name}>{c.name}</Select.Option>)}
              </Select>
            </Form.Item>
          </Space>
          <Form.Item name="requirements" label="Requirements"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item name="responsibilities" label="Responsibilities"><Input.TextArea rows={3} /></Form.Item>
          <Space>
            <Form.Item name="employment_type" label="Type" initialValue="full-time" rules={[{ required: true }]}>
              <Select options={typeOptions} style={{ width: 150 }} />
            </Form.Item>
            <Form.Item name="status" label="Status" initialValue="draft">
              <Select options={[{value:'draft',label:'Draft'},{value:'active',label:'Active'},{value:'closed',label:'Closed'}]} style={{ width: 150 }} />
            </Form.Item>
          </Space>
        </Form>
      </Modal>

      <Modal title="Applications" open={appModalOpen} onCancel={() => setAppModalOpen(false)} footer={null} width={700}>
        <Table dataSource={applications} columns={appColumns} rowKey="id" />
      </Modal>
    </div>
  );
};

export default AdminJobList;
