import React, { useEffect, useState } from 'react';
import { Table, Button, Typography, Spin, Modal, Form, Input, Select, Tag, DatePicker, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { Employee, Candidate } from '../../api/client';
import StatusTag from '../../components/StatusTag';

const EmployeeList: React.FC = () => {
  const [data, setData] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [form] = Form.useForm();

  const fetchData = () => {
    setLoading(true);
    api.employees.list()
      .then(setData)
      .catch(() => message.error('Failed to load employees'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const openCreateModal = async () => {
    try {
      const all = await api.candidates.list({ status: 'offered' });
      setCandidates(all);
      setModalOpen(true);
    } catch {
      message.error('Failed to load candidates');
    }
  };

  const handleCreate = async (values: { candidate_id: string; employee_code?: string; department?: string; position?: string; contract_start?: any; contract_end?: any }) => {
    try {
      const payload = {
        ...values,
        contract_start: values.contract_start ? values.contract_start.format('YYYY-MM-DD') : undefined,
        contract_end: values.contract_end ? values.contract_end.format('YYYY-MM-DD') : undefined,
      };
      await api.employees.create(payload);
      message.success('Employee created');
      setModalOpen(false);
      form.resetFields();
      fetchData();
    } catch {
      message.error('Failed to create employee');
    }
  };

  const columns = [
    { title: 'Code', dataIndex: 'employee_code', key: 'employee_code' },
    { title: 'Candidate ID', dataIndex: 'candidate_id', key: 'candidate_id', ellipsis: true },
    { title: 'Department', dataIndex: 'department', key: 'department' },
    { title: 'Position', dataIndex: 'position', key: 'position' },
    { title: 'Hired At', dataIndex: 'hired_at', key: 'hired_at', render: (d: string) => d ? new Date(d).toLocaleDateString() : '-' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    {
      title: 'SF Sync',
      dataIndex: 'sf_sync_status',
      key: 'sf_sync',
      render: (v?: string) => {
        if (!v) return <Tag>unknown</Tag>;
        const colors: Record<string, string> = { synced: 'green', pending: 'orange', failed: 'red' };
        return <Tag color={colors[v] || 'default'}>{v}</Tag>;
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>Employees</Typography.Title>
        <Button icon={<PlusOutlined />} onClick={openCreateModal}>Hire from Candidate</Button>
      </div>
      <Spin spinning={loading}>
        <Table dataSource={data} columns={columns} rowKey="id" pagination={{ pageSize: 20 }} size="middle" />
      </Spin>

      <Modal title="Hire Employee" open={modalOpen} onCancel={() => setModalOpen(false)} footer={null}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="candidate_id" label="Candidate" rules={[{ required: true }]}>
            <Select showSearch placeholder="Select offered candidate" optionFilterProp="children">
              {candidates.map((c) => (
                <Select.Option key={c.id} value={c.id}>{c.name} ({c.id.slice(0, 8)})</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="employee_code" label="Employee Code">
            <Input placeholder="Auto-generated if empty" />
          </Form.Item>
          <Form.Item name="department" label="Department">
            <Input placeholder="e.g. Production" />
          </Form.Item>
          <Form.Item name="position" label="Position">
            <Input placeholder="e.g. Factory Worker" />
          </Form.Item>
          <Form.Item name="contract_start" label="Contract Start">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="contract_end" label="Contract End">
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">Create Employee</Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default EmployeeList;
