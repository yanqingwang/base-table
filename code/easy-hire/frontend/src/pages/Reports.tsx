import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Statistic, Spin, Typography } from 'antd';
import {
  FunnelPlotOutlined,
  ArrowUpOutlined,
  CheckCircleOutlined,
  TeamOutlined,
} from '@ant-design/icons';
import api, { HiringFunnelReport } from '../api/client';

const Reports: React.FC = () => {
  const [funnel, setFunnel] = useState<HiringFunnelReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.allSettled([
      api.reports.hiringFunnel().then(setFunnel).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;

  return (
    <div>
      <Typography.Title level={4}>Reports</Typography.Title>

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
    </div>
  );
};

export default Reports;
