import React, { useState, useEffect, useCallback } from 'react';
import { Card, Button, Tag, Space, Select, Table, message, Typography, Spin } from 'antd';
import { CheckOutlined, CloseOutlined, ReloadOutlined, PhoneOutlined } from '@ant-design/icons';
import { queueApi, InterviewQueue, Job } from '../../api/client';
import api from '../../api/client';

const { Title, Text } = Typography;

const QueueCalling: React.FC = () => {
  const [queue, setQueue] = useState<InterviewQueue[]>([]);
  const [currentCall, setCurrentCall] = useState<InterviewQueue | null>(null);
  const [jobFilter, setJobFilter] = useState<string | undefined>(undefined);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [candidateNames, setCandidateNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [calling, setCalling] = useState(false);

  const loadJobs = useCallback(async () => {
    try {
      const data = await api.jobs.list();
      setJobs(data);
    } catch { /* non-critical */ }
  }, []);

  const loadCandidateName = useCallback(async (id: string) => {
    if (candidateNames[id]) return;
    try {
      const c = await api.candidates.get(id);
      setCandidateNames(prev => ({ ...prev, [id]: c.name }));
    } catch {
      setCandidateNames(prev => ({ ...prev, [id]: id.slice(0, 8) }));
    }
  }, [candidateNames]);

  const loadQueue = useCallback(async () => {
    try {
      const res = await queueApi.list({ job_id: jobFilter, status: 'waiting' });
      setQueue(res.data);
      res.data.forEach(q => loadCandidateName(q.candidate_id));
    } catch {
      message.error('Failed to load queue');
    }
  }, [jobFilter, loadCandidateName]);

  const loadCurrentCall = useCallback(async () => {
    try {
      const res = await queueApi.list({ status: 'called' });
      if (res.data.length > 0) {
        setCurrentCall(res.data[0]);
        loadCandidateName(res.data[0].candidate_id);
      } else {
        setCurrentCall(null);
      }
    } catch { /* ignore */ }
  }, [loadCandidateName]);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadQueue(), loadCurrentCall(), loadJobs()]).finally(() => setLoading(false));

    // SSE real-time queue stream — replaces 5s polling
    const es = new EventSource(`/api/v1/queue/stream${jobFilter ? `?job_id=${jobFilter}` : ''}`);
    es.onmessage = (e) => {
      try {
        const data: InterviewQueue[] = JSON.parse(e.data);
        setQueue(prev => {
          // Only update if data actually changed (avoid unnecessary re-renders)
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            data.forEach(q => loadCandidateName(q.candidate_id));
            return data;
          }
          return prev;
        });
        // Derive current call from stream data
        const called = data.find(q => q.status === 'called');
        if (called) setCurrentCall(called);
        else if (currentCall) setCurrentCall(null);
      } catch { /* ignore parse errors */ }
    };
    es.onerror = () => {
      // Fallback to polling if SSE fails
      const interval = setInterval(() => { loadQueue(); loadCurrentCall(); }, 5000);
      return () => clearInterval(interval);
    };
    return () => es.close();
  }, [jobFilter, loadQueue, loadCurrentCall, loadJobs, loadCandidateName]);

  const handleCallNext = async () => {
    if (!jobFilter) { message.warning('Please select a job first'); return; }
    setCalling(true);
    try {
      const res = await queueApi.callNext(jobFilter);
      setCurrentCall(res.data);
      loadCandidateName(res.data.candidate_id);
      loadQueue();
      message.success(`Called #${res.data.queue_number}`);
    } catch (e: any) {
      message.error(e?.response?.data || 'No waiting candidates');
    } finally {
      setCalling(false);
    }
  };

  const handleComplete = async () => {
    if (!currentCall) return;
    try {
      await queueApi.updateStatus(currentCall.id, 'completed');
      message.success('Interview completed');
      setCurrentCall(null);
      loadQueue();
    } catch {
      message.error('Failed to complete');
    }
  };

  const handleSkip = async () => {
    if (!currentCall) return;
    try {
      await queueApi.updateStatus(currentCall.id, 'skipped');
      message.info('Candidate skipped');
      setCurrentCall(null);
      loadQueue();
    } catch {
      message.error('Failed to skip');
    }
  };

  const candidateDisplay = (id: string) => candidateNames[id] || id.slice(0, 8);

  return (
    <div style={{ padding: 24 }}>
      <Title level={2}>
        <PhoneOutlined /> Queue Calling
      </Title>
      
      <Space style={{ marginBottom: 24 }} wrap>
        <Select
          placeholder="Select job to filter"
          style={{ width: 300 }}
          allowClear
          value={jobFilter}
          onChange={(v) => setJobFilter(v)}
          options={jobs.filter(j => j.status === 'active').map(j => ({ value: j.id, label: j.title }))}
        />
        <Button type="primary" icon={<PhoneOutlined />} onClick={handleCallNext} loading={calling}>
          Call Next
        </Button>
        <Button icon={<ReloadOutlined />} onClick={() => { loadQueue(); loadCurrentCall(); }}>
          Refresh
        </Button>
      </Space>

      <Spin spinning={loading}>
        {/* Current Call - Big Display */}
        {currentCall && (
          <Card 
            style={{ marginBottom: 24, background: '#e6f7ff', border: '2px solid #1890ff' }}
            title={<Text strong style={{ fontSize: 18 }}>Now Calling</Text>}
            extra={
              <Space>
                <Button type="primary" danger icon={<CloseOutlined />} onClick={handleSkip}>
                  Skip
                </Button>
                <Button type="primary" icon={<CheckOutlined />} onClick={handleComplete}>
                  Complete
                </Button>
              </Space>
            }
          >
            <div style={{ textAlign: 'center', padding: '30px 0' }}>
              <Title level={1} style={{ margin: 0, fontSize: 72 }}>
                #{currentCall.queue_number}
              </Title>
              <Title level={2} style={{ margin: '12px 0 0', color: '#333' }}>
                {candidateDisplay(currentCall.candidate_id)}
              </Title>
              <Text type="secondary">
                Called at {currentCall.called_at ? new Date(currentCall.called_at).toLocaleTimeString() : '-'}
              </Text>
            </div>
          </Card>
        )}

        {!currentCall && !loading && (
          <Card style={{ marginBottom: 24, background: '#fafafa', border: '1px dashed #d9d9d9' }}>
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <Title level={4} type="secondary">No active call</Title>
              <Text type="secondary">Select a job and click "Call Next" to bring in the next candidate</Text>
            </div>
          </Card>
        )}

        {/* Waiting Queue */}
        <Card title={`Waiting Queue (${queue.length})`}>
          <Table
            dataSource={queue}
            rowKey="id"
            pagination={false}
            size="large"
            columns={[
              {
                title: '#',
                dataIndex: 'queue_number',
                key: 'queue_number',
                width: 80,
                render: (n: number) => <Text strong style={{ fontSize: 18 }}>{n}</Text>,
              },
              {
                title: 'Candidate',
                dataIndex: 'candidate_id',
                key: 'candidate_id',
                render: (id: string) => <Text strong>{candidateDisplay(id)}</Text>,
              },
              {
                title: 'Status',
                dataIndex: 'status',
                key: 'status',
                render: (s: string) => <Tag color={s === 'waiting' ? 'orange' : 'blue'}>{s.toUpperCase()}</Tag>,
              },
              {
                title: 'Queued At',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (t: string) => new Date(t).toLocaleTimeString(),
              },
            ]}
          />
        </Card>
      </Spin>
    </div>
  );
};

export default QueueCalling;
