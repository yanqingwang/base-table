import React from 'react';
import { Tag } from 'antd';

const statusColors: Record<string, string> = {
  new: 'blue',
  screening: 'cyan',
  queue_waiting: 'orange',
  interviewing: 'orange',
  evaluated: 'purple',
  offered: 'gold',
  document_signing: 'geekblue',
  signed: 'green',
  pre_onboarding: 'lime',
  ready_to_sync: 'cyan',
  synced: 'green',
  hired: 'green',
  rejected: 'red',
  pending: 'orange',
  approved: 'green',
  transferred: 'purple',
  scheduled: 'blue',
  completed: 'green',
  cancelled: 'default',
  no_show: 'red',
  pass: 'green',
  fail: 'red',
  active: 'green',
  inactive: 'default',
  terminated: 'red',
  expired: 'red',
};

interface Props {
  status: string;
}

const StatusTag: React.FC<Props> = ({ status }) => {
  const color = statusColors[status] || 'default';
  return <Tag color={color}>{status}</Tag>;
};

export default StatusTag;
