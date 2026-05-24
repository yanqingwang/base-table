import React, { useState, useEffect } from 'react';
import { Table, Input, Button, Space, Tag } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import api, { TrainingRecord as ApiTrainingRecord } from '../../api/client';

const TrainingRecords: React.FC = () => {
  const [records, setRecords] = useState<ApiTrainingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState('');

  const fetchRecords = async (empId?: string) => {
    setLoading(true);
    try {
      const res = await api.training.records({ employee_id: empId || undefined });
      setRecords(res);
    } catch (e) {
      console.error('Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRecords(); }, []);

  const columns = [
    { title: 'Record ID', dataIndex: 'id', key: 'id', ellipsis: true },
    { title: 'Employee ID', dataIndex: 'employee_id', key: 'employee_id', ellipsis: true },
    { title: 'Course ID', dataIndex: 'course_id', key: 'course_id', ellipsis: true },
    { title: 'Started', dataIndex: 'started_at', key: 'started_at' },
    { title: 'Completed', dataIndex: 'completed_at', key: 'completed_at' },
    { title: 'Score', dataIndex: 'score', key: 'score', render: (s: number | null) => s !== null ? `${s}%` : '-' },
    { title: 'Status', dataIndex: 'passed', key: 'passed', render: (p: number | null, r: ApiTrainingRecord) => r.completed_at ? (p ? <Tag color="green">Passed</Tag> : <Tag color="red">Failed</Tag>) : <Tag color="blue">In Progress</Tag> },
    { title: 'Certificate', dataIndex: 'certificate_url', key: 'certificate_url', render: (url: string | null) => url ? <a href={url} target="_blank" rel="noreferrer">View</a> : '-' },
  ];

  return (
    <div>
      <h2>Training Records</h2>
      <Space style={{ marginBottom: 16 }}>
        <Input placeholder="Filter by Employee ID" value={employeeId} onChange={e => setEmployeeId(e.target.value)} style={{ width: 300 }} />
        <Button type="primary" icon={<SearchOutlined />} onClick={() => fetchRecords(employeeId || undefined)}>Search</Button>
        <Button onClick={() => { setEmployeeId(''); fetchRecords(); }}>Clear</Button>
      </Space>
      <Table dataSource={records} columns={columns} rowKey="id" loading={loading} />
    </div>
  );
};

export default TrainingRecords;
