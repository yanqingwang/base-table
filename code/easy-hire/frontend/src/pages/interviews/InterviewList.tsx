import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Select, Typography, Spin, Modal, Form, Input, InputNumber, message, DatePicker } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { Interview, Job, Candidate } from '../../api/client';
import StatusTag from '../../components/StatusTag';
import dayjs from 'dayjs';

const InterviewList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const [evaluateModal, setEvaluateModal] = useState<{ open: boolean; id: string }>({ open: false, id: '' });
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [form] = Form.useForm();
  const [evalForm] = Form.useForm();

  const loadJobs = () => api.jobs.list().then(setJobs).catch(() => {});
  const loadCandidates = () => api.candidates.list({}).then(setCandidates).catch(() => {});

  const fetchData = () => {
    setLoading(true);
    api.interviews.list({ status: statusFilter })
      .then(setData)
      .catch(() => message.error('Failed to load interviews'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter]);

  const handleCreate = async (values: { candidate_id: string; job_id: string; scheduled_at: string }) => {
    try {
      const payload = {
        candidate_id: values.candidate_id,
        job_id: values.job_id,
        scheduled_at: values.scheduled_at ? dayjs(values.scheduled_at).format('YYYY-MM-DDTHH:mm:ss') : undefined,
      };
      await api.interviews.create(payload);
      message.success('Interview created');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('Failed to create interview');
    }
  };

  const handleEvaluate = async (values: { skill_scores: string; overall_score: number; comments: string; result: string }) => {
    try {
      await api.interviews.evaluate(evaluateModal.id, values);
      message.success('Evaluation saved');
      setEvaluateModal({ open: false, id: '' });
      evalForm.resetFields();
      fetchData();
    } catch {
      message.error('Failed to save evaluation');
    }
  };

  const handleCheckin = async (id: string) => {
    try {
      await api.interviews.checkin(id);
      message.success('Check-in recorded');
      fetchData();
    } catch {
      message.error('Check-in failed');
    }
  };

  const columns = [
    { title: 'Candidate ID', dataIndex: 'candidate_id', key: 'candidate_id', ellipsis: true },
    { title: 'Job Title', dataIndex: 'job_title', key: 'job_title' },
    { title: 'Scheduled', dataIndex: 'scheduled_at', key: 'scheduled_at', render: (d: string) => d ? new Date(d).toLocaleString() : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    { title: 'Result', dataIndex: 'result', key: 'result', render: (r: string | null) => r ? <StatusTag status={r} /> : '-' },
    { title: 'Score', dataIndex: 'overall_score', key: 'overall_score', render: (s: number | null) => s !== null ? s : '-' },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, r: Interview) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/interviews/${r.id}`)}>Details</Button>
          {r.status === 'scheduled' && (
            <>
              <Button size="small" onClick={() => handleCheckin(r.id)}>Check-in</Button>
              <Button size="small" type="primary" onClick={() => setEvaluateModal({ open: true, id: r.id })}>Evaluate</Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Interviews</Typography.Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>Schedule Interview</Button>
        </Space>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Select
          placeholder="Filter status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 150 }}
          options={[
            { value: 'scheduled', label: 'Scheduled' },
            { value: 'completed', label: 'Completed' },
            { value: 'cancelled', label: 'Cancelled' },
            { value: 'no_show', label: 'No Show' },
          ]}
        />
      </Space>
      <Spin spinning={loading}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} size="middle" />
      </Spin>

      <Modal title="Schedule Interview" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="job_id" label="Job" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select a job"
              onFocus={loadJobs}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={jobs.map(j => ({ value: j.id, label: j.title }))}
            />
          </Form.Item>
          <Form.Item name="candidate_id" label="Candidate" rules={[{ required: true }]}>
            <Select
              showSearch
              placeholder="Select a candidate"
              onFocus={loadCandidates}
              filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              options={candidates.map(c => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item name="scheduled_at" label="Scheduled Time">
            <DatePicker showTime style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Create</Button>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Evaluate Interview" open={evaluateModal.open} onCancel={() => setEvaluateModal({ open: false, id: '' })} footer={null}>
        <Form form={evalForm} layout="vertical" onFinish={handleEvaluate}>
          <Form.Item name="skill_scores" label="Skill Scores (JSON)">
            <Input.TextArea rows={3} placeholder='{"welding": 85, "assembly": 90}' />
          </Form.Item>
          <Form.Item name="overall_score" label="Overall Score (0-100)">
            <InputNumber min={0} max={100} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="comments" label="Comments">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="result" label="Result" rules={[{ required: true }]}>
            <Select options={[{ value: 'pass', label: 'Pass' }, { value: 'fail', label: 'Fail' }]} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Save Evaluation</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InterviewList;
