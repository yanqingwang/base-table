import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Table, Tabs, Tag, Statistic, Row, Col, Button, Spin, Alert } from 'antd';
import api, { InterviewRound, InterviewAssignment, InterviewEvaluation, EvalAggregate } from '../../api/client';

const statusColors: Record<string, string> = {
  pending: 'orange',
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'red',
  assigned: 'orange',
  confirmed: 'blue',
};

const recColors: Record<string, string> = {
  strong_hire: 'green',
  hire: 'blue',
  maybe: 'orange',
  no: 'red',
  pending: 'default',
};

const InterviewDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [aggregate, setAggregate] = useState<EvalAggregate | null>(null);
  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [assignments, setAssignments] = useState<InterviewAssignment[]>([]);
  const [evaluations, setEvaluations] = useState<InterviewEvaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      api.interviews.evaluations.aggregate(id).catch(() => null),
      api.interviews.rounds.list(id).catch(() => [] as InterviewRound[]),
      api.interviews.assignments.list(id).catch(() => [] as InterviewAssignment[]),
      api.interviews.evaluations.list(id).catch(() => [] as InterviewEvaluation[]),
    ])
      .then(([agg, r, a, e]) => {
        if (agg) setAggregate(agg);
        setRounds(r);
        setAssignments(a);
        setEvaluations(e);
      })
      .catch((e) => setError(e?.response?.data?.message || 'Failed to load interview details'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '48px auto' }} />;
  if (error) return <Alert type="error" message={error} />;

  const roundColumns = [
    { title: 'Round', dataIndex: 'round_number', key: 'round' },
    { title: 'Type', dataIndex: 'round_type', key: 'type', render: (v: string) => <Tag>{v}</Tag> },
    {
      title: 'Scheduled',
      dataIndex: 'scheduled_at',
      key: 'scheduled',
      render: (v: string | null) => v?.substring(0, 10) || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
  ];

  const assignColumns = [
    { title: 'Interviewer ID', dataIndex: 'interviewer_id', key: 'interviewer' },
    {
      title: 'Round ID',
      dataIndex: 'round_id',
      key: 'round',
      render: (v: string | null) => v?.substring(0, 8) || '-',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (v: string) => <Tag color={statusColors[v]}>{v}</Tag>,
    },
  ];

  const evalColumns = [
    { title: 'Interviewer', dataIndex: 'interviewer_id', key: 'interviewer' },
    {
      title: 'Score',
      dataIndex: 'overall_score',
      key: 'score',
      render: (v: number | null) => (v != null ? `${v}/100` : '-'),
    },
    {
      title: 'Recommendation',
      dataIndex: 'recommendation',
      key: 'rec',
      render: (v: string) => <Tag color={recColors[v]}>{v}</Tag>,
    },
    {
      title: 'Comments',
      dataIndex: 'comments',
      key: 'comments',
      render: (v: string | null) => v || '-',
    },
    {
      title: 'Submitted',
      dataIndex: 'submitted_at',
      key: 'submitted',
      render: (v: string | null) => v?.substring(0, 10) || '-',
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2>Interview Detail: {id?.substring(0, 8)}</h2>
        <Button type="primary" onClick={() => navigate(`/evaluations/${id}`)}>
          Submit Evaluation
        </Button>
      </div>

      {aggregate && (
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}>
            <Card>
              <Statistic title="Total Evaluations" value={aggregate.total_evaluations} />
            </Card>
          </Col>
          <Col span={6}>
            <Card>
              <Statistic title="Average Score" value={aggregate.average_score ?? '-'} suffix="/100" />
            </Card>
          </Col>
          {Object.entries(aggregate.recommendations).map(([rec, count]) => (
            <Col span={4} key={rec}>
              <Card>
                <Statistic
                  title={rec}
                  value={count}
                  valueStyle={{
                    color:
                      recColors[rec] === 'green'
                        ? '#52c41a'
                        : recColors[rec] === 'red'
                          ? '#ff4d4f'
                          : undefined,
                  }}
                />
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <Tabs
        items={[
          {
            key: 'rounds',
            label: `Rounds (${rounds.length})`,
            children: <Table dataSource={rounds} columns={roundColumns} rowKey="id" />,
          },
          {
            key: 'assignments',
            label: `Assignments (${assignments.length})`,
            children: <Table dataSource={assignments} columns={assignColumns} rowKey="id" />,
          },
          {
            key: 'evaluations',
            label: `Evaluations (${evaluations.length})`,
            children: <Table dataSource={evaluations} columns={evalColumns} rowKey="id" />,
          },
        ]}
      />
    </div>
  );
};

export default InterviewDetail;
