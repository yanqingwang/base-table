import React, { useEffect, useState } from 'react';
import { Table, Button, Space, Typography, Spin, Modal, Input, Card, Descriptions, message } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, SwapOutlined } from '@ant-design/icons';
import api, { Approval, Candidate } from '../../api/client';
import StatusTag from '../../components/StatusTag';

const ApprovalList: React.FC = () => {
  const [pending, setPending] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateMap, setCandidateMap] = useState<Record<string, Candidate>>({});
  const [actionModal, setActionModal] = useState<{ open: boolean; id: string; action: 'approve' | 'reject' | 'transfer' }>({ open: false, id: '', action: 'approve' });
  const [comments, setComments] = useState('');
  const [transferTo, setTransferTo] = useState('');

  const fetchData = () => {
    setLoading(true);
    api.approvals.pending()
      .then(async (approvals) => {
        setPending(approvals);
        const map: Record<string, Candidate> = {};
        for (const a of approvals) {
          try {
            const c = await api.candidates.get(a.candidate_id);
            map[a.candidate_id] = c;
          } catch { void a; }
        }
        setCandidateMap(map);
      })
      .catch(() => message.error('Failed to load approvals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleAction = async () => {
    const { id, action } = actionModal;
    try {
      if (action === 'approve') {
        await api.approvals.approve(id, comments);
        message.success('Approved');
      } else if (action === 'reject') {
        await api.approvals.reject(id, comments);
        message.success('Rejected');
      } else if (action === 'transfer') {
        if (!transferTo) { message.warning('Select user to transfer to'); return; }
        await api.approvals.transfer(id, transferTo, comments);
        message.success('Transferred');
      }
      setActionModal({ open: false, id: '', action: 'approve' });
      setComments('');
      setTransferTo('');
      fetchData();
    } catch {
      message.error('Action failed');
    }
  };

  const columns = [
    { title: 'Candidate', dataIndex: 'candidate_id', key: 'candidate', render: (id: string) => candidateMap[id]?.name || id.slice(0, 8) },
    { title: 'Type', dataIndex: 'request_type', key: 'request_type' },
    { title: 'Status', dataIndex: 'status', key: 'status', render: (s: string) => <StatusTag status={s} /> },
    { title: 'Created', dataIndex: 'created_at', key: 'created_at', render: (d: string) => new Date(d).toLocaleString() },
    { title: 'Current Status', key: 'candidate_status', render: (_: unknown, r: Approval) => {
      const c = candidateMap[r.candidate_id];
      return c ? <StatusTag status={c.status} /> : '-';
    }},
    {
      title: 'Actions', key: 'actions',
      render: (_: unknown, r: Approval) => (
        <Space>
          <Button type="primary" size="small" icon={<CheckCircleOutlined />}
            onClick={() => setActionModal({ open: true, id: r.id, action: 'approve' })}>
            Approve
          </Button>
          <Button danger size="small" icon={<CloseCircleOutlined />}
            onClick={() => setActionModal({ open: true, id: r.id, action: 'reject' })}>
            Reject
          </Button>
          <Button size="small" icon={<SwapOutlined />}
            onClick={() => setActionModal({ open: true, id: r.id, action: 'transfer' })}>
            Transfer
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Typography.Title level={4}>Approvals</Typography.Title>
      <Spin spinning={loading}>
        <Card title={`Pending Approvals (${pending.length})`}>
          <Table
            dataSource={pending}
            columns={columns}
            rowKey="id"
            pagination={false}
            size="middle"
            expandable={{
              expandedRowRender: (r) => (
                <Descriptions size="small" column={1}>
                  <Descriptions.Item label="Candidate ID">{r.candidate_id}</Descriptions.Item>
                  <Descriptions.Item label="Requested By">{r.requested_by}</Descriptions.Item>
                  <Descriptions.Item label="Assigned To">{r.assigned_to}</Descriptions.Item>
                  {candidateMap[r.candidate_id]?.notes && (
                    <Descriptions.Item label="Notes">{candidateMap[r.candidate_id].notes}</Descriptions.Item>
                  )}
                </Descriptions>
              ),
            }}
          />
        </Card>
      </Spin>

      <Modal
        title={actionModal.action === 'approve' ? 'Approve' : actionModal.action === 'reject' ? 'Reject' : 'Transfer'}
        open={actionModal.open}
        onOk={handleAction}
        onCancel={() => setActionModal({ open: false, id: '', action: 'approve' })}
      >
        {actionModal.action === 'transfer' && (
          <div style={{ marginBottom: 16 }}>
            <Typography.Text>Transfer to User ID:</Typography.Text>
            <Input placeholder="User UUID" value={transferTo} onChange={(e) => setTransferTo(e.target.value)} style={{ marginTop: 8 }} />
          </div>
        )}
        <Typography.Text>Comments:</Typography.Text>
        <Input.TextArea rows={3} value={comments} onChange={(e) => setComments(e.target.value)} style={{ marginTop: 8 }} />
      </Modal>
    </div>
  );
};

export default ApprovalList;
