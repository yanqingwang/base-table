import React, { useState, useEffect } from 'react';
import { Table, Button, Modal, Form, Input, InputNumber, Select, message, Tag } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api, { Course as ApiCourse } from '../../api/client';

const { Option } = Select;

const CourseList: React.FC = () => {
  const [courses, setCourses] = useState<ApiCourse[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.courses.list();
      setCourses(res);
    } catch (e) {
      message.error('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCourses(); }, []);

  const handleCreate = async (values: any) => {
    try {
      await api.courses.create(values);
      message.success('Course created');
      setModalVisible(false);
      form.resetFields();
      fetchCourses();
    } catch (e) {
      message.error('Failed to create course');
    }
  };

  const typeColor: Record<string, string> = { ehs: 'red', onboarding: 'blue', skills: 'green', compliance: 'orange' };

  const columns = [
    { title: 'Title', dataIndex: 'title', key: 'title' },
    { title: 'Type', dataIndex: 'course_type', key: 'course_type', render: (t: string) => <Tag color={typeColor[t] || 'default'}>{t}</Tag> },
    { title: 'Country', dataIndex: 'country', key: 'country' },
    { title: 'Duration (min)', dataIndex: 'duration_minutes', key: 'duration_minutes' },
    { title: 'Pass Score', dataIndex: 'pass_score', key: 'pass_score', render: (s: number) => s ? `${s}%` : '-' },
    { title: 'Mandatory', dataIndex: 'mandatory', key: 'mandatory', render: (m: number) => m ? <Tag color="red">Yes</Tag> : 'No' },
  ];

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>Training Courses</h2>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>New Course</Button>
      </div>
      <Table dataSource={courses} columns={columns} rowKey="id" loading={loading} />
      <Modal title="Create Course" open={modalVisible} onCancel={() => setModalVisible(false)} onOk={() => form.submit()}>
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item name="title" label="Title" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="course_type" label="Type" initialValue="onboarding">
            <Select><Option value="onboarding">Onboarding</Option><Option value="ehs">EHS</Option><Option value="skills">Skills</Option><Option value="compliance">Compliance</Option></Select>
          </Form.Item>
          <Form.Item name="country" label="Country" initialValue="all">
            <Select><Option value="all">All</Option><Option value="PH">Philippines</Option><Option value="MY">Malaysia</Option><Option value="TH">Thailand</Option></Select>
          </Form.Item>
          <Form.Item name="duration_minutes" label="Duration (minutes)"><InputNumber min={0} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="pass_score" label="Pass Score (%)" initialValue={80}><InputNumber min={0} max={100} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="mandatory" label="Mandatory" valuePropName="checked" getValueFromEvent={(e: any) => e ? 1 : 0}>
            <Select><Option value={1}>Yes</Option><Option value={0}>No</Option></Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CourseList;
