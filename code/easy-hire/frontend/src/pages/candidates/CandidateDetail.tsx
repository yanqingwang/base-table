import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Descriptions, Tag, Spin, Button, Space, Typography, Table, message, Select, Input, Form } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import api, { Candidate, Interview } from '../../api/client';
import StatusTag from '../../components/StatusTag';

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

  const handleUpdate = async (values: any) => {
    if (!id) return;
    try {
      await api.candidates.update(id, values);
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
      await api.candidates.update(id, { status } as any);
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
            <Button type="primary" onClick={() => { form.setFieldsValue(candidate); setEditing(!editing); }}>
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </Space>
        }
      >
        {editing ? (
          <Form form={form} layout="vertical" onFinish={handleUpdate} initialValues={candidate}>
            <Form.Item name="name" label="Name" rules={[{ required: true }]}>
              <Input />
            </Form.Item>
            <Form.Item name="phone" label="Phone"><Input /></Form.Item>
            <Form.Item name="email" label="Email"><Input /></Form.Item>
            <Form.Item name="notes" label="Notes"><Input.TextArea rows={3} /></Form.Item>
            <Button type="primary" htmlType="submit" icon={<SaveOutlined />}>Save</Button>
          </Form>
        ) : (
          <Descriptions column={2} size="small">
            <Descriptions.Item label="Phone">{candidate.phone || '-'}</Descriptions.Item>
            <Descriptions.Item label="Email">{candidate.email || '-'}</Descriptions.Item>
            <Descriptions.Item label="ID Number">{candidate.id_number || '-'}</Descriptions.Item>
            <Descriptions.Item label="Country">{candidate.country_code}</Descriptions.Item>
            <Descriptions.Item label="Status"><StatusTag status={candidate.status} /></Descriptions.Item>
            <Descriptions.Item label="Source">{candidate.source}</Descriptions.Item>
            <Descriptions.Item label="Skills">{candidate.skills}</Descriptions.Item>
            <Descriptions.Item label="Notes">{candidate.notes || '-'}</Descriptions.Item>
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
