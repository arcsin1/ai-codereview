import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { projectService, type Project, type CreateProjectDto, type UpdateProjectDto } from '@/services/project.service';
import { getReviewConfigs, type ReviewConfig } from '@/services/review.service';
import {
  Card,
  Table,
  Button,
  Space,
  Tag,
  Popconfirm,
  message,
  Switch,
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
  PlayCircleOutlined,
  PauseCircleOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { drawer } from '@/components/drawer';
import { ProjectForm } from './ProjectForm';

const { Text } = Typography;

const PLATFORMS = [
  { value: 'gitlab', label: 'GitLab', icon: <GitlabOutlined />, color: '#e24329' },
  { value: 'github', label: 'GitHub', icon: <GithubOutlined />, color: '#333' },
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

function Projects() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [projectData, setProjectData] = useState<{ items: Project[]; total: number } | null>(null);
  const [reviewConfigs, setReviewConfigs] = useState<ReviewConfig[]>([]);

  const fetchReviewConfigs = async () => {
    try {
      const configs = await getReviewConfigs();
      setReviewConfigs(configs);
    } catch (error) {
      console.error('Failed to fetch review configs:', error);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await projectService.getProjects({ page, pageSize });
      setProjectData(data);
    } catch (error: any) {
      message.error(error.response?.data?.message || t('projects.failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    fetchReviewConfigs();
  }, [page, pageSize]);

  const handleCreate = async (values: CreateProjectDto) => {
    await projectService.createProject(values);
    message.success(t('projects.success'));
    drawer.close();
    fetchProjects();
  };

  const handleUpdate = async (id: string, values: UpdateProjectDto) => {
    await projectService.updateProject(id, values);
    message.success(t('projects.success'));
    drawer.close();
    fetchProjects();
  };

  const handleDelete = async (id: string) => {
    try {
      await projectService.deleteProject(id);
      message.success(t('projects.success'));
      fetchProjects();
    } catch (error: any) {
      message.error(error.response?.data?.message || t('projects.failed'));
    }
  };

  const handleToggleEnabled = async (project: Project) => {
    try {
      await projectService.toggleEnabled(project.id);
      message.success(project.isEnabled ? t('projects.disabled') : t('projects.enabled'));
      fetchProjects();
    } catch (error: any) {
      message.error(error.response?.data?.message || t('projects.failed'));
    }
  };

  const handleToggleAutoReview = async (project: Project) => {
    try {
      await projectService.toggleAutoReview(project.id);
      message.success(project.autoReviewEnabled ? t('projects.autoReviewOff') : t('projects.autoReviewOn'));
      fetchProjects();
    } catch (error: any) {
      message.error(error.response?.data?.message || t('projects.failed'));
    }
  };

  const handleSubmit = async (values: any, editingProject: Project | null) => {
    if (editingProject) {
      const { platform, ...updateData } = values;
      await handleUpdate(editingProject.id, updateData);
    } else {
      await handleCreate(values);
    }
  };

  const showDrawer = (editingProject: Project | null) => {
    drawer.show(
      () => (
        <ProjectForm
          editingProject={editingProject}
          reviewConfigs={reviewConfigs}
          onSubmit={(values) => handleSubmit(values, editingProject)}
          onCancel={() => drawer.close()}
          t={t}
        />
      ),
      {
        title: editingProject ? t('projects.edit') : t('projects.create'),
        size: 560,
        footer: null,
      }
    );
  };

  const getPlatformInfo = (platform: string) => {
    return PLATFORMS.find((p) => p.value === platform) || PLATFORMS[2];
  };

  const getReviewConfigLabel = (id: string) => {
    const config = reviewConfigs.find(c => c.id === id);
    return config ? t(getReviewStyleLabel(config.reviewStyle)) : '-';
  };

  const columns = [
    {
      title: t('projects.project'),
      dataIndex: 'name',
      key: 'name',
      width: 200,
      render: (name: string, record: Project) => {
        const platform = getPlatformInfo(record.platform);
        return (
          <Space>
            <span style={{ fontSize: 18, color: platform.color }}>{platform.icon}</span>
            <Text strong>{name}</Text>
          </Space>
        );
      },
    },
    {
      title: t('projects.platform'),
      dataIndex: 'platform',
      key: 'platform',
      width: 100,
      render: (platform: string) => {
        const info = getPlatformInfo(platform);
        return (
          <Tag icon={info.icon} style={{ color: info.color, borderColor: info.color, margin: 0 }}>
            {info.label}
          </Tag>
        );
      },
    },
    {
      title: t('projects.repository'),
      dataIndex: 'repositoryUrl',
      key: 'repositoryUrl',
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
      title: t('projects.reviewStyle'),
      dataIndex: 'reviewConfigId',
      key: 'reviewConfigId',
      width: 120,
      render: (id: string) => (
        <Tag color="blue">{getReviewConfigLabel(id)}</Tag>
      ),
    },
    {
      title: t('projects.autoReview'),
      dataIndex: 'autoReviewEnabled',
      key: 'autoReviewEnabled',
      width: 110,
      render: (autoReviewEnabled: boolean, record: Project) => (
        <Tooltip title={autoReviewEnabled ? t('projects.toggleAutoReviewOff') : t('projects.toggleAutoReviewOn')}>
          <Switch
            size="small"
            checked={autoReviewEnabled}
            onChange={() => handleToggleAutoReview(record)}
            checkedChildren={<PlayCircleOutlined style={{ fontSize: 12 }} />}
            unCheckedChildren={<PauseCircleOutlined style={{ fontSize: 12 }} />}
          />
        </Tooltip>
      ),
    },
    {
      title: t('projects.status'),
      dataIndex: 'isEnabled',
      key: 'isEnabled',
      width: 80,
      render: (isEnabled: boolean, record: Project) => (
        <Tooltip title={isEnabled ? t('projects.toggleDisable') : t('projects.toggleEnable')}>
          <Switch
            size="small"
            checked={isEnabled}
            onChange={() => handleToggleEnabled(record)}
          />
        </Tooltip>
      ),
    },
    {
      title: t('projects.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      sorter: (a: Project, b: Project) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('projects.action'),
      key: 'action',
      width: 140,
      fixed: 'right' as const,
      render: (_: any, record: Project) => (
        <Space size={4}>
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => showDrawer(record)}
          >
            {t('common.edit')}
          </Button>
          <Popconfirm
            title={t('projects.deleteConfirm')}
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
          <h2 className="page-title">{t('projects.title')}</h2>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchProjects}>{t('common.refresh')}</Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => showDrawer(null)}
            >
              {t('projects.createProject')}
            </Button>
          </Space>
        </div>

        <div className="page-content">
          <Card className="page-card">
            <Table
              columns={columns}
              dataSource={projectData?.items || []}
              rowKey="id"
              loading={loading}
              className="page-table"
               size='small'
              scroll={{ x: 1200 }}
              pagination={{
                current: page,
                pageSize,
                total: projectData?.total || 0,
                showSizeChanger: true,
                showTotal: (total) => t('common.totalRecords', { total }),
                onChange: (newPage, newPageSize) => {
                  setPage(newPage);
                  setPageSize(newPageSize || 10);
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

export default Projects;
