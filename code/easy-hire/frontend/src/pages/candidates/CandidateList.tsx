import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Button, Space, Input, Select, Typography, Spin, message } from 'antd';
import { PlusOutlined, ImportOutlined, SearchOutlined } from '@ant-design/icons';
import api, { Candidate } from '../../api/client';
import StatusTag from '../../components/StatusTag';

const CandidateList: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const [sourceFilter, setSourceFilter] = useState<string | undefined>();
  const [searchText, setSearchText] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.candidates.list({ status: statusFilter, q: searchText || undefined, source: sourceFilter })
      .then(setData)
      .catch(() => message.error('Failed to load candidates'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [statusFilter, sourceFilter, searchText]);

  const handleDelete = (id: string) => {
    api.candidates.delete(id)
      .then(() => { message.success('Deleted'); fetchData(); })
      .catch(() => message.error('Delete failed'));
  };

  const columns = [
    { title: 'Name', dataIndex: 'name', key: 'name', render: (n: string, r: Candidate) => <a onClick={() => navigate(`/candidates/${r.id}`)}>{n}</a> },
    { title: 'Phone', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    { title: 'Source', dataIndex: 'source', key: 'source' },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (d: string) => new Date(d).toLocaleDateString() },
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, r: Candidate) => (
        <Space>
          <Button size="small" onClick={() => navigate(`/candidates/${r.id}`)}>View</Button>
          <Button size="small" danger onClick={() => handleDelete(r.id)}>Delete</Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Candidates</Typography.Title>
        <Space>
          <Button icon={<PlusOutlined />} onClick={() => navigate('/candidates/new')}>New Candidate</Button>
          <Button icon={<ImportOutlined />} onClick={() => navigate('/candidates/import')}>Import CSV</Button>
        </Space>
      </div>
      <Space style={{ marginBottom: 16 }}>
        <Input
          placeholder="Search name/phone/email"
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 250 }}
          allowClear
        />
        <Select
          placeholder="Filter status"
          value={statusFilter}
          onChange={setStatusFilter}
          allowClear
          style={{ width: 150 }}
          options={[
            { value: 'new', label: 'New' },
            { value: 'screening', label: 'Screening' },
            { value: 'queue_waiting', label: 'Queue Waiting' },
            { value: 'interviewing', label: 'Interviewing' },
            { value: 'evaluated', label: 'Evaluated' },
            { value: 'offered', label: 'Offered' },
            { value: 'document_signing', label: 'Document Signing' },
            { value: 'signed', label: 'Signed' },
            { value: 'pre_onboarding', label: 'Pre Onboarding' },
            { value: 'ready_to_sync', label: 'Ready to Sync' },
            { value: 'synced', label: 'Synced' },
            { value: 'hired', label: 'Hired' },
            { value: 'rejected', label: 'Rejected' },
          ]}
        />
        <Select
          placeholder="Filter source"
          value={sourceFilter}
          onChange={setSourceFilter}
          allowClear
          style={{ width: 150 }}
          options={[
            { value: 'agency', label: 'Agency' },
            { value: 'direct', label: 'Direct' },
            { value: 'referral', label: 'Referral' },
            { value: 'other', label: 'Other' },
          ]}
        />
      </Space>
      <Spin spinning={loading}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} size="middle" />
      </Spin>
    </div>
  );
};

export default CandidateList;
