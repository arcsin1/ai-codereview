import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { llmService, type LlmConfig } from '@/services/llm.service';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { drawer } from '@/components/drawer';
import { LlmConfigForm } from './LlmConfigForm';

const { Text } = Typography;

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', color: '#10a37f' },
  { value: 'anthropic', label: 'Anthropic', color: '#d4a574' },
  { value: 'deepseek', label: 'DeepSeek', color: '#1e90ff' },
  { value: 'zhipuai', label: '智谱AI', color: '#4361ee' },
  { value: 'qwen', label: '通义千问', color: '#f95738' },
  { value: 'ollama', label: 'Ollama', color: '#764ba2' },
];

interface LlmConfigListData {
  items: LlmConfig[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function LlmConfigs() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [configsData, setConfigsData] = useState<LlmConfigListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await llmService.getConfigs({ page, limit });
      setConfigsData(data);
    } catch (error: any) {
      message.error(error.response?.data?.message || t('llmConfigs.failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, [page, limit]);

  const handleCreate = async (values: any) => {
    await llmService.createConfig(values);
    message.success(t('llmConfigs.success'));
    drawer.close();
    fetchConfigs();
  };

  const handleUpdate = async (id: string, values: any) => {
    await llmService.updateConfig(id, values);
    message.success(t('llmConfigs.success'));
    drawer.close();
    fetchConfigs();
  };

  const handleDelete = async (id: string) => {
    try {
      await llmService.deleteConfig(id);
      message.success(t('llmConfigs.success'));
      fetchConfigs();
    } catch (error: any) {
      message.error(error.response?.data?.message || t('llmConfigs.failed'));
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await llmService.testConfig(id);
      if (result.success) {
        message.success(t('llmConfigs.testSuccess'));
      } else {
        message.error(t('llmConfigs.testFailed'));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t('llmConfigs.testFailed'));
    } finally {
      setTestingId(null);
    }
  };

  const handleSubmit = async (values: any, editingConfig: LlmConfig | null) => {
    if (editingConfig) {
      await handleUpdate(editingConfig.id, values);
    } else {
      await handleCreate(values);
    }
  };

  const showDrawer = (editingConfig: LlmConfig | null) => {
    drawer.show(
      () => (
        <LlmConfigForm
          editingConfig={editingConfig}
          onSubmit={(values) => handleSubmit(values, editingConfig)}
          onCancel={() => drawer.close()}
          t={t}
        />
      ),
      {
        title: editingConfig ? t('llmConfigs.edit') : t('llmConfigs.create'),
        size: 560,
        footer: null,
      }
    );
  };

  const getProviderInfo = (value: string) => {
    return PROVIDERS.find(p => p.value === value) || { label: value, color: '#666' };
  };

  const columns = [
    {
      title: t('llmConfigs.configName'),
      dataIndex: 'name',
      key: 'name',
      width: 160,
      render: (name: string) => <Text strong>{name}</Text>,
    },
    {
      title: t('llmConfigs.provider'),
      dataIndex: 'provider',
      key: 'provider',
      width: 120,
      render: (provider: string) => {
        const info = getProviderInfo(provider);
        return (
          <Tag style={{ color: info.color, borderColor: info.color }}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: t('llmConfigs.model'),
      dataIndex: 'model',
      key: 'model',
      width: 150,
      render: (model: string) => <code>{model}</code>,
    },
    {
      title: t('llmConfigs.params'),
      key: 'params',
      width: 140,
      render: (_: any, record: LlmConfig) => (
        <Space size={12}>
          <Text type="secondary">{t('llmConfigs.maxTokens')}: {record.maxTokens}</Text>
          <Text type="secondary">{t('llmConfigs.temperature')}: {record.temperature}</Text>
        </Space>
      ),
    },
    {
      title: t('llmConfigs.default'),
      dataIndex: 'isDefault',
      key: 'isDefault',
      width: 70,
      render: (isDefault: boolean) =>
        isDefault ? <Tag color="blue" style={{ margin: 0 }}>{t('llmConfigs.default')}</Tag> : null,
    },
    {
      title: t('llmConfigs.status'),
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 80,
      render: (isEnabled: boolean) =>
        isEnabled ? (
          <Tag icon={<CheckCircleOutlined />} color="success" style={{ margin: 0 }}>
            {t('llmConfigs.enabled')}
          </Tag>
        ) : (
          <Tag icon={<CloseCircleOutlined />} color="default" style={{ margin: 0 }}>
            {t('llmConfigs.disabled')}
          </Tag>
        ),
    },
    {
      title: t('llmConfigs.action'),
      key: 'action',
      width: 200,
      fixed: 'right' as const,
      render: (_: any, record: LlmConfig) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleTest(record.id)}
            loading={testingId === record.id}
          >
            {t('llmConfigs.test')}
          </Button>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showDrawer(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('llmConfigs.deleteConfirm')}
            onConfirm={() => handleDelete(record.id)}
            okText={t('common.confirm')}
            cancelText={t('common.cancel')}
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>
              {t('common.delete')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <MainLayout>
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title">{t('llmConfigs.title')}</h2>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>{t('common.refresh')}</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showDrawer(null)}
            >
              {t('llmConfigs.createConfig')}
            </Button>
          </Space>
        </div>

        <div className="page-content">
          <Card className="page-card">
            <Table
              columns={columns}
              dataSource={configsData?.items || []}
              rowKey="id"
              loading={loading}
              size='small'
              className="page-table"
              scroll={{ x: 900 }}
              pagination={{
                current: page,
                pageSize: limit,
                total: configsData?.total || 0,
                showSizeChanger: true,
                showTotal: (total) => t('common.totalRecords', { total }),
                onChange: (newPage, newLimit) => {
                  setPage(newPage);
                  setLimit(newLimit || 10);
                },
                pageSizeOptions: ['10', '20', '50'],
              }}
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default LlmConfigs;
