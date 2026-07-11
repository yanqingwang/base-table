import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography, Progress } from 'antd';
import {
  FunnelPlotOutlined,
  BookOutlined,
  SafetyCertificateOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import api, { HiringFunnelReport, TrainingStatusReport, EhsComplianceReport } from '../api/client';

const Reports: React.FC = () => {
  const [funnel, setFunnel] = useState<HiringFunnelReport | null>(null);
  const [training, setTraining] = useState<TrainingStatusReport | null>(null);
  const [ehs, setEhs] = useState<EhsComplianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.reports.hiringFunnel().then(setFunnel).catch(() => {}),
      api.reports.trainingStatus().then(setTraining).catch(() => {}),
      api.reports.ehsCompliance().then(setEhs).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Typography.Title level={4}>Reports</Typography.Title>

      {/* Hiring Funnel */}
      <Card
        title={<span><FunnelPlotOutlined /> Hiring Funnel</span>}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic title="Total" value={funnel?.total || 0} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic title="Interviewing" value={funnel?.interviewing || 0} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic title="Offered" value={funnel?.offered || 0} valueStyle={{ color: '#faad14' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic title="Hired" value={funnel?.hired || 0} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic title="Rejected" value={funnel?.rejected || 0} valueStyle={{ color: '#ff4d4f' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={4}>
            <Card>
              <Statistic
                title="Conversion Rate"
                value={funnel?.conversion_rate || 0}
                suffix="%"
                prefix={<ArrowUpOutlined />}
                valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* Training Status */}
      <Card
        title={<span><BookOutlined /> Training Status</span>}
        style={{ marginBottom: 24 }}
      >
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Total Employees" value={training?.total_employees || 0} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="Training Completed" value={training?.training_completed || 0} valueStyle={{ color: '#1890ff' }} />
              <Progress
                percent={training?.total_employees ? Math.round((training.training_completed / training.total_employees) * 100) : 0}
                status="active"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={8}>
            <Card>
              <Statistic title="EHS Certified" value={training?.ehs_certified || 0} valueStyle={{ color: '#52c41a' }} />
              <Progress
                percent={training?.total_employees ? Math.round((training.ehs_certified / training.total_employees) * 100) : 0}
                status="active"
                strokeColor="#52c41a"
                style={{ marginTop: 8 }}
              />
            </Card>
          </Col>
        </Row>
      </Card>

      {/* EHS Compliance */}
      <Card
        title={<span><SafetyCertificateOutlined /> EHS Compliance</span>}
      >
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} lg={6}>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="circle"
                percent={ehs?.compliance_rate || 0}
                size={120}
                strokeColor={{ '0%': '#ff4d4f', '100%': '#52c41a' }}
                format={(percent) => `${percent}%`}
              />
              <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
                Compliance Rate
              </Typography.Text>
            </div>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Total Employees" value={ehs?.total_employees || 0} prefix={<TeamOutlined />} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="EHS Certified" value={ehs?.ehs_certified || 0} valueStyle={{ color: '#52c41a' }} />
            </Card>
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic title="Courses Available" value={ehs?.ehs_courses_available || 0} prefix={<BookOutlined />} valueStyle={{ color: '#1890ff' }} />
            </Card>
          </Col>
        </Row>
      </Card>
    </div>
  );
};

export default Reports;
