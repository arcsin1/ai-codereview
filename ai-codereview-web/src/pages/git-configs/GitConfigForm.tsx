import React from 'react';
import { Form, Input, Select, Button, Space } from 'antd';
import type { GitConfig } from '@/services/system.service';
import { GitProvider } from '@/services/system.service';
import {
  GitlabOutlined,
  GithubOutlined,
  FolderOutlined,
  LinkOutlined,
} from '@ant-design/icons';

interface GitConfigFormProps {
  editingConfig: GitConfig | null;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  t: (key: string) => string;
}

const PROVIDERS = [
  { value: GitProvider.GITHUB, label: 'GitHub', icon: <GithubOutlined />, color: '#333' },
  { value: GitProvider.GITLAB, label: 'GitLab', icon: <GitlabOutlined />, color: '#e24329' },
  { value: GitProvider.GITEA, label: 'Gitea', icon: <FolderOutlined />, color: '#5d87c7' },
];

export const GitConfigForm: React.FC<GitConfigFormProps> = ({
  editingConfig,
  onSubmit,
  onCancel,
  t,
}) => {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      await onSubmit(values);
    } catch (error) {
      console.error('Form validation failed:', error);
    }
  };

  return (
    <Form form={form} layout="vertical" size="large">
      <Form.Item
        name="provider"
        label={t('gitConfigs.gitPlatform')}
        rules={[{ required: true, message: t('gitConfigs.gitPlatform') }]}
        initialValue={editingConfig?.provider}
      >
        <Select
          placeholder={t('gitConfigs.gitPlatform')}
          disabled={!!editingConfig}
          options={PROVIDERS.map((p) => ({
            value: p.value,
            label: (
              <Space>
                <span style={{ color: p.color, fontSize: 16 }}>{p.icon}</span>
                <span>{p.label}</span>
              </Space>
            ),
          }))}
        />
      </Form.Item>

      <Form.Item
        name="name"
        label={t('gitConfigs.configName')}
        rules={[{ required: true, message: t('gitConfigs.configName') }]}
        initialValue={editingConfig?.name}
      >
        <Input placeholder="e.g., default, production, staging" />
      </Form.Item>

      <Form.Item
        name="url"
        label={t('gitConfigs.serverUrl')}
        rules={[{ required: true, message: t('gitConfigs.serverUrl') }]}
        initialValue={editingConfig?.url}
      >
        <Input placeholder="e.g., https://api.github.com" prefix={<LinkOutlined />} />
      </Form.Item>

      <Form.Item
        name="accessToken"
        label={t('gitConfigs.accessToken')}
        rules={[{ required: !editingConfig, message: t('gitConfigs.accessToken') }]}
        extra={editingConfig ? t('gitConfigs.leaveEmptyToken') : t('gitConfigs.pat')}
        initialValue={editingConfig?.accessToken}
      >
        <Input.Password placeholder={t('gitConfigs.accessToken')} />
      </Form.Item>

      <Form.Item name="description" label={t('gitConfigs.description')} initialValue={editingConfig?.description}>
        <Input.TextArea rows={2} placeholder={t('gitConfigs.description')} />
      </Form.Item>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="primary" onClick={handleSubmit}>
          {t('common.submit')}
        </Button>
      </div>
    </Form>
  );
};
