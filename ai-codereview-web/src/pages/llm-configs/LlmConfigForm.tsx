import React from 'react';
import { Form, Input, Select, Switch, Button, Space, InputNumber } from 'antd';
import type { LlmConfig } from '@/services/llm.service';

interface LlmConfigFormProps {
  editingConfig: LlmConfig | null;
  onSubmit: (values: any) => Promise<void>;
  onCancel: () => void;
  t: (key: string) => string;
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', color: '#10a37f' },
  { value: 'anthropic', label: 'Anthropic', color: '#d4a574' },
  { value: 'deepseek', label: 'DeepSeek', color: '#1e90ff' },
  { value: 'zhipuai', label: '智谱AI', color: '#4361ee' },
  { value: 'qwen', label: '通义千问', color: '#f95738' },
  { value: 'ollama', label: 'Ollama', color: '#764ba2' },
];

const { Option } = Select;

export const LlmConfigForm: React.FC<LlmConfigFormProps> = ({
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
        label={t('llmConfigs.provider')}
        rules={[{ required: true, message: t('llmConfigs.provider') }]}
        initialValue={editingConfig?.provider}
      >
        <Select placeholder={t('llmConfigs.provider')}>
          {PROVIDERS.map((provider) => (
            <Option key={provider.value} value={provider.value}>
              <Space>
                <span style={{ color: provider.color }}>{provider.label}</span>
              </Space>
            </Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item
        name="name"
        label={t('llmConfigs.configName')}
        rules={[{ required: true, message: t('llmConfigs.configName') }]}
        initialValue={editingConfig?.name}
      >
        <Input placeholder="e.g., Production OpenAI" />
      </Form.Item>

      <Form.Item name="apiKey" label={t('llmConfigs.apiKey')} initialValue={editingConfig?.apiKey}>
        <Input.Password placeholder={t('llmConfigs.apiKey')} />
      </Form.Item>

      <Form.Item name="baseURL" label={t('llmConfigs.baseURL')} initialValue={editingConfig?.baseURL}>
        <Input placeholder="e.g., https://api.openai.com/v1" />
      </Form.Item>

      <Form.Item
        name="model"
        label={t('llmConfigs.model')}
        rules={[{ required: true, message: t('llmConfigs.model') }]}
        initialValue={editingConfig?.model}
      >
        <Input placeholder="e.g., gpt-3.5-turbo" />
      </Form.Item>

      <Space size={16} style={{ display: 'flex' }}>
        <Form.Item
          name="maxTokens"
          label={t('llmConfigs.maxToken')}
          tooltip="Leave empty to use default"
          style={{ flex: 1 }}
          initialValue={editingConfig?.maxTokens}
        >
          <InputNumber
            min={1}
            max={16000}
            placeholder="4096"
            style={{ width: '100%' }}
          />
        </Form.Item>

        <Form.Item
          name="temperature"
          label={t('llmConfigs.temperature')}
          rules={[{ required: true, message: t('llmConfigs.temperature') }]}
          style={{ flex: 1 }}
          initialValue={editingConfig?.temperature}
        >
          <InputNumber min={0} max={2} step={0.1} style={{ width: '100%' }} />
        </Form.Item>
      </Space>

      <Space size={24}>
        <Form.Item name="isDefault" valuePropName="checked" style={{ marginBottom: 0 }} initialValue={editingConfig?.isDefault}>
          <Switch checkedChildren={t('llmConfigs.default')} unCheckedChildren={t('llmConfigs.default')} /> {t('llmConfigs.setAsDefault')}
        </Form.Item>
        <Form.Item name="isEnabled" valuePropName="checked" style={{ marginBottom: 0 }} initialValue={editingConfig?.isEnabled}>
          <Switch checkedChildren={t('llmConfigs.enabled')} unCheckedChildren={t('llmConfigs.disabled')} /> {t('llmConfigs.enableConfig')}
        </Form.Item>
      </Space>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 24, paddingTop: 16, borderTop: '1px solid #f0f0f0' }}>
        <Button onClick={onCancel}>{t('common.cancel')}</Button>
        <Button type="primary" onClick={handleSubmit}>
          {t('common.submit')}
        </Button>
      </div>
    </Form>
  );
};
