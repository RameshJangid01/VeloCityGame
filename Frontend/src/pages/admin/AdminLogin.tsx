import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Card, Form, Input, Button, Alert, Typography, Space } from 'antd';
import { MailOutlined, LockOutlined, EyeOutlined } from '@ant-design/icons';
import { Logo } from '../../components/Logo';
import { useAdminAuth } from '../../hooks/useAdminAuth';

const { Content } = Layout;
const { Text } = Typography;

export function AdminLogin() {
  const { login, loading, error } = useAdminAuth();
  const [form] = Form.useForm();

  function handleSubmit(values: { email: string; password: string }) {
    login(values.email, values.password);
  }

  return (
    <Layout style={{ minHeight: '100vh', background: '#F5F7FA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Content style={{ maxWidth: 380, width: '100%', padding: '24px 16px' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <Logo size={32} variant="light" />
          </div>
          <Text type="secondary">Admin Control Panel</Text>
        </div>

        <Card style={{ borderRadius: 18, boxShadow: '0 12px 40px -12px rgba(16,24,40,0.15)' }}>
          {error && <Alert type="error" message={error} showIcon style={{ marginBottom: 16 }} />}

          <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
            <Form.Item
              name="email"
              label="Email"
              rules={[{ required: true, message: 'Enter a valid email.' }, { type: 'email', message: 'Enter a valid email.' }]}
            >
              <Input prefix={<MailOutlined />} placeholder="user@gmail.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Password is required.' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Button type="primary" htmlType="submit" block size="large" loading={loading} style={{ fontWeight: 700, marginTop: 8 }}>
              LOGIN
            </Button>
          </Form>
        </Card>

        <Space direction="vertical" size={4} style={{ width: '100%', textAlign: 'center', marginTop: 20 }}>

          <Link to="/" style={{ fontSize: 13 }}>
            <EyeOutlined /> Back to live race
          </Link>
        </Space>
      </Content>
    </Layout>
  );
}
