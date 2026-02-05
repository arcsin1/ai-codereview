import React from 'react';
import { Form, Input, Select, Switch, Button, Space, Tag } from 'antd';
import type { Project } from '@/services/project.service';
import type { ReviewConfig } from '@/types';
import {
  GitlabOutlined,
  GithubOutlined,
  FolderOutlined,
  LinkOutlined,
} from '@ant-design/icons';

interface ProjectFormProps {
  editingProject: Project | null;
  reviewConfigs: ReviewConfig[];
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  t: (key: string) => string;
}

const PLATFORMS = [
  { value: 'github', label: 'GitHub', icon: <GithubOutlined />, color: '#333' },
  { value: 'gitlab', label: 'GitLab', icon: <GitlabOutlined />, color: '#e24329' },
  { value: 'gitea', label: 'Gitea', icon: <FolderOutlined />, color: '#5d87c7' },
];

const REVIEW_STYLE_LABELS: Record<string, string> = {
  professional: 'professional',
  strict: 'strict',
  relaxed: 'relaxed',
  educational: 'educational',
};

const getReviewStyleLabel = (style: string) => {
  const key = REVIEW_STYLE_LABELS[style] || style;
  return `reviewStyles.${key}`;
};

export const ProjectForm: React.FC<ProjectFormProps> = ({
  editingProject,
  reviewConfigs,
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
        name="name"
        label={t('projects.projectName')}
        rules={[{ required: true, message: t('projects.projectName') }]}
        initialValue={editingProject?.name}
      >
        <Input placeholder={t('projects.projectName')} />
      </Form.Item>

      <Form.Item name="description" label={t('projects.projectDescription')} initialValue={editingProject?.description}>
        <Input.TextArea rows={2} placeholder={t('projects.projectDescription')} />
      </Form.Item>

      <Form.Item
        name="platform"
        label={t('projects.platform')}
        rules={[{ required: true, message: t('projects.platform') }]}
        initialValue={editingProject?.platform}
      >
        <Select
          placeholder={t('projects.platform')}
          disabled={!!editingProject}
          options={PLATFORMS.map((p) => ({
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
        name="repositoryUrl"
        label={t('projects.repositoryUrl')}
        rules={[{ required: true, message: t('projects.repositoryUrl') }]}
        initialValue={editingProject?.repositoryUrl}
      >
        <Input placeholder={t('projects.exampleRepoUrl')} prefix={<LinkOutlined />} />
      </Form.Item>

      <Form.Item label={t('projects.webhookConfig')} >
        <Space.Compact block>
          <Form.Item name="webhookType" style={{ width: '30%', marginBottom: 0 }} initialValue={editingProject?.webhookType} rules={[{ required: true, message: t('projects.webhookType') }]}>
            <Select placeholder={t('projects.webhookType')} allowClear>
              <Option value="feishu">{t('projects.feishu')}</Option>
              <Option value="dingtalk">{t('projects.dingtalk')}</Option>
            </Select>
          </Form.Item>
          <Form.Item name="webhookUrl" style={{ width: '70%', marginBottom: 0 }} initialValue={editingProject?.webhookUrl} rules={[{ required: true, message: t('projects.webhookUrl') }]}>
            <Input placeholder="Webhook URL" />
          </Form.Item>
        </Space.Compact>
      </Form.Item>

      <Form.Item name="webhookSecret" label={t('projects.webhookSecret')} initialValue={editingProject?.webhookSecret}>
        <Input.Password placeholder="Webhook Secret (Optional)" />
      </Form.Item>

      <Form.Item
        name="reviewConfigId"
        label={t('projects.selectReviewStyle')}
        tooltip="Select the prompt style for code review"
        initialValue={editingProject?.reviewConfigId}
        rules={[{ required: true, message: t('projects.selectReviewStyle') }]}
      >
        <Select placeholder={t('projects.selectReviewStyle')} allowClear>
          {reviewConfigs.map((config) => (
            <Select.Option key={config.id} value={config.id}>
              <Space>
                <span>{t(getReviewStyleLabel(config.reviewStyle))}</span>
                <Tag style={{ margin: 0 }}>{config.maxTokens} tokens</Tag>
              </Space>
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      {editingProject && (
        <Space size={24}>
          <Form.Item name="isEnabled" valuePropName="checked" style={{ marginBottom: 0 }} initialValue={editingProject.isEnabled}>
            <Switch checkedChildren={t('common.enabled')} unCheckedChildren={t('common.disabled')} /> {t('projects.enableProject')}
          </Form.Item>
          <Form.Item name="autoReviewEnabled" valuePropName="checked" style={{ marginBottom: 0 }} initialValue={editingProject.autoReviewEnabled}>
            <Switch checkedChildren={t('projects.autoReviewOn')} unCheckedChildren={t('projects.autoReviewOff')} /> {t('projects.enableAutoReview')}
          </Form.Item>
        </Space>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="primary" onClick={handleSubmit}>
          {t('common.submit')}
        </Button>
      </div>
    </Form>
  );
};

// 需要导入 Select
const Option = Select.Option;
