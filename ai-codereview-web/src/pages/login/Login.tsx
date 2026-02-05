import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Form, Input, Button, Card, Alert, ConfigProvider } from 'antd';
import { UserOutlined, LockOutlined, GithubOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/store/useAuthStore';
import './login.less';

function Login() {
  const navigate = useNavigate();
  const { login, isLoading } = useAuthStore();
  const [error, setError] = useState('');
  const [form] = Form.useForm();

  const handleSubmit = async (values: { username: string; password: string }) => {
    setError('');
    try {
      await login(values.username, values.password);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed, please check username and password');
    }
  };

  return (
    <ConfigProvider>
      <div className="login-container">
        <Card className="login-card" variant="borderless">
          <div className="login-header">
            <div className="logo">
              <GithubOutlined />
            </div>
            <h1 className="title">AI Code Review</h1>
            <p className="subtitle">Intelligent Code Review Platform</p>
          </div>

          {error && (
            <Alert
              message={error}
              type="error"
              closable
              showIcon
              className="mb-4"
              onClose={() => setError('')}
            />
          )}

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            autoComplete="off"
            className="login-form"
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: 'Please enter username' }]}
            >
              <Input
                prefix={<UserOutlined className="text-gray-400" />}
                placeholder="Username"
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Please enter password' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-gray-400" />}
                placeholder="Password"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoading}
                block
                className="submit-btn"
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </Form.Item>
          </Form>

          <div className="login-footer">
            <p className="hint">
              Default account: <span className="username">admin</span> / <span className="username">123456</span>
            </p>
          </div>
        </Card>
      </div>
    </ConfigProvider>
  );
}

export default Login;
