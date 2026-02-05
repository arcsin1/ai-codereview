import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { systemService, GitProvider } from '@/services/system.service';
import type { GitConfig, CreateGitConfigDto } from '@/services/system.service';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Tooltip,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  GitlabOutlined,
  GithubOutlined,
  FolderOutlined,
  ReloadOutlined,
  LinkOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { drawer } from '@/components/drawer';
import { GitConfigForm } from './GitConfigForm';

const { Text } = Typography;

const PROVIDERS = [
  { value: GitProvider.GITHUB, label: 'GitHub', icon: <GithubOutlined />, color: '#333' },
  { value: GitProvider.GITLAB, label: 'GitLab', icon: <GitlabOutlined />, color: '#e24329' },
  { value: GitProvider.GITEA, label: 'Gitea', icon: <FolderOutlined />, color: '#5d87c7' },
];

function GitConfigs() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [configs, setConfigs] = useState<GitConfig[]>([]);
  const [testingId, setTestingId] = useState<string | null>(null);

  const fetchConfigs = async () => {
    setLoading(true);
    try {
      const data = await systemService.getGitConfigs({});
      setConfigs(data);
    } catch (error: any) {
      message.error(error.response?.data?.message || t('gitConfigs.failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfigs();
  }, []);

  const handleCreate = async (values: CreateGitConfigDto) => {
    await systemService.createGitConfig(values);
    message.success(t('gitConfigs.success'));
    drawer.close();
    fetchConfigs();
  };

  const handleUpdate = async (id: string, values: CreateGitConfigDto) => {
    await systemService.updateGitConfig(id, values);
    message.success(t('gitConfigs.success'));
    drawer.close();
    fetchConfigs();
  };

  const handleDelete = async (id: string) => {
    try {
      await systemService.deleteGitConfig(id);
      message.success(t('gitConfigs.success'));
      fetchConfigs();
    } catch (error: any) {
      message.error(error.response?.data?.message || t('gitConfigs.failed'));
    }
  };

  const handleTest = async (id: string) => {
    setTestingId(id);
    try {
      const result = await systemService.testGitConfig(id);
      if (result?.connected) {
        message.success(t('gitConfigs.testSuccess'));
      } else {
        message.error(t('gitConfigs.testFailed'));
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || t('gitConfigs.testFailed'));
    } finally {
      setTestingId(null);
    }
  };

  const handleSubmit = async (values: any, editingConfig: GitConfig | null) => {
    if (editingConfig) {
      await handleUpdate(editingConfig.id, values);
    } else {
      await handleCreate(values);
    }
  };

  const showDrawer = (editingConfig: GitConfig | null) => {
    drawer.show(
      () => (
        <GitConfigForm
          editingConfig={editingConfig}
          onSubmit={(values) => handleSubmit(values, editingConfig)}
          onCancel={() => drawer.close()}
          t={t}
        />
      ),
      {
        title: editingConfig ? t('gitConfigs.edit') : t('gitConfigs.create'),
        size: 520,
        footer: null,
      }
    );
  };

  const getProviderInfo = (provider: GitProvider) => {
    return PROVIDERS.find((p) => p.value === provider) || PROVIDERS[0];
  };

  const maskToken = (token: string) => {
    if (!token || token.length <= 8) return '****';
    return token.substring(0, 4) + '****' + token.substring(token.length - 4);
  };

  const columns = [
    {
      title: t('gitConfigs.configName'),
      dataIndex: 'name',
      key: 'name',
      width: 150,
      render: (name: string, record: GitConfig) => {
        const provider = getProviderInfo(record.provider);
        return (
          <Space>
            <span style={{ fontSize: 16, color: provider.color }}>{provider.icon}</span>
            <Text strong>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: t('gitConfigs.platform'),
      dataIndex: 'provider',
      key: 'provider',
      width: 100,
      render: (provider: GitProvider) => {
        const info = getProviderInfo(provider);
        return (
          <Tag icon={info.icon} style={{ color: info.color, borderColor: info.color, margin: 0 }}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: t('gitConfigs.serverUrl'),
      dataIndex: 'url',
      key: 'url',
      width: 200,
      ellipsis: true,
      render: (url: string) => (
        <Tooltip title={url}>
          <a href={url} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <LinkOutlined /> <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
          </a>
        </Tooltip>
      ),
    },
    {
      title: t('gitConfigs.accessToken'),
      dataIndex: 'accessToken',
      key: 'accessToken',
      width: 140,
      render: (token: string) => <code style={{ fontSize: 12 }}>{maskToken(token)}</code>,
    },
    {
      title: t('gitConfigs.description'),
      dataIndex: 'description',
      key: 'description',
      width: 150,
      ellipsis: true,
      render: (desc?: string) => <Text type="secondary">{desc || '-'}</Text>,
    },
    {
      title: t('gitConfigs.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a: GitConfig, b: GitConfig) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('gitConfigs.action'),
      key: 'action',
      width: 220,
      fixed: 'right' as const,
      render: (_: any, record: GitConfig) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<CheckCircleOutlined />}
            onClick={() => handleTest(record.id)}
            loading={testingId === record.id}
          >
            {t('gitConfigs.test')}
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
            title={t('gitConfigs.deleteConfirm')}
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
          <h2 className="page-title">{t('gitConfigs.title')}</h2>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchConfigs}>{t('common.refresh')}</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showDrawer(null)}
            >
              {t('gitConfigs.createConfig')}
            </Button>
          </Space>
        </div>

        <div className="page-content">
          <Card className="page-card">
            <Table
              columns={columns}
              dataSource={configs}
              rowKey="id"
              loading={loading}
              className="page-table"
              size="small"
              scroll={{ x: 1000 }}
              pagination={false}
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default GitConfigs;
