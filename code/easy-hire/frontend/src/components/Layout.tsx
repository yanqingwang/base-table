import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { Layout as AntLayout, Menu, Button, Typography, Dropdown } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  ScheduleOutlined,
  CheckCircleOutlined,
  UserOutlined,
  LogoutOutlined,
  ImportOutlined,
  BookOutlined,
  FileTextOutlined,
  FileProtectOutlined,
  DownloadOutlined,
} from '@ant-design/icons';
import { useAuthStore } from '../store/auth';

const { Header, Sider, Content } = AntLayout;

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = (() => {
    const base: { key: string; icon?: React.ReactNode; label: string; children?: { key: string; label: string }[] }[] = [
      { key: '/dashboard', icon: <DashboardOutlined />, label: 'Dashboard' },
    ];

    if (user?.role === 'agency') {
      base.push({ key: '/agency/candidates', icon: <ImportOutlined />, label: 'My Candidates' });
    } else {
      base.push(
        { key: '/candidates', icon: <TeamOutlined />, label: 'Candidates' },
        { key: '/interviews', icon: <ScheduleOutlined />, label: 'Interviews' },
        { key: '/approvals', icon: <CheckCircleOutlined />, label: 'Approvals' },
        { key: '/employees', icon: <UserOutlined />, label: 'Employees' },
        {
          key: 'training',
          icon: <BookOutlined />,
          label: 'Training',
          children: [
            { key: '/training/courses', label: 'Courses' },
            { key: '/training/records', label: 'Records' },
            { key: '/training/certificate', label: 'Certificates' },
          ],
        },
        { key: '/reports', icon: <FileTextOutlined />, label: 'Reports' },
        { key: '/admin/jobs', icon: <FileTextOutlined />, label: 'Jobs' },
        { key: '/admin/docusign', icon: <FileProtectOutlined />, label: 'DocuSign' },
        { key: '/admin/export', icon: <DownloadOutlined />, label: 'Export' }
      );
    }
    return base;
  })();

  const selectedKey = (() => {
    const parts = location.pathname.split('/').filter(Boolean);
    if (parts[0] === 'training' && parts[1]) return `/training/${parts[1]}`;
    return '/' + parts[0];
  })();

  return (
    <AntLayout style={{ minHeight: '100vh' }}>
      <Sider collapsible breakpoint="lg" theme="dark">
        <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Typography.Title level={4} style={{ color: '#fff', margin: 0 }}>
            Easy Hire
          </Typography.Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey || '/dashboard']}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <AntLayout>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Dropdown
            menu={{
              items: [
                { key: 'profile', label: `${user?.name} (${user?.role})`, disabled: true },
                { type: 'divider' },
                { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', onClick: handleLogout },
              ],
            }}
          >
            <Button type="text" icon={<UserOutlined />}>
              {user?.name}
            </Button>
          </Dropdown>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </AntLayout>
    </AntLayout>
  );
};

export default Layout;
