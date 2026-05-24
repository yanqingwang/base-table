import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, Form, Input, Button, Typography, Select, message } from 'antd';
import { useAuthStore } from '../store/auth';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { register, loading } = useAuthStore();
  const [form] = Form.useForm();

  const handleSubmit = async (values: { name: string; email: string; password: string; role: string; company_id?: string }) => {
    try {
      await register(values);
      message.success('Registration successful');
      navigate('/dashboard');
    } catch {
      message.error('Registration failed. Email may already be in use.');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#f0f2f5' }}>
      <Card style={{ width: 400 }}>
        <Typography.Title level={3} style={{ textAlign: 'center', marginBottom: 24 }}>
          Create Account
        </Typography.Title>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item name="name" label="Name" rules={[{ required: true }]}>
            <Input placeholder="Full name" size="large" />
          </Form.Item>
          <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="Email" size="large" />
          </Form.Item>
          <Form.Item name="password" label="Password" rules={[{ required: true, min: 6 }]}>
            <Input.Password placeholder="Min 6 characters" size="large" />
          </Form.Item>
          <Form.Item name="role" label="Role" rules={[{ required: true }]}>
            <Select size="large">
              <Select.Option value="admin">Admin</Select.Option>
              <Select.Option value="recruiter">Recruiter</Select.Option>
              <Select.Option value="manager">Manager</Select.Option>
              <Select.Option value="agency">Agency</Select.Option>
              <Select.Option value="trainer">Trainer</Select.Option>
              <Select.Option value="worker">Worker</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="company_id" label="Company ID">
            <Input placeholder="Optional" size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              Register
            </Button>
          </Form.Item>
        </Form>
        <div style={{ textAlign: 'center' }}>
          <Link to="/login">Already have an account? Log in</Link>
        </div>
      </Card>
    </div>
  );
};

export default Register;
