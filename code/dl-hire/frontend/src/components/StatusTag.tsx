import React from 'react';
import { Tag } from 'antd';

const statusColors: Record<string, string> = {
  new: 'blue',
  screened: 'cyan',
  interviewing: 'orange',
  offered: 'gold',
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
  signed: 'green',
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
