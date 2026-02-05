import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getStatistics, getReviews, type ReviewListResponse, type ReviewStatistics } from '@/services/review.service';
import { useAuthStore } from '@/store/useAuthStore';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Row, Col, Statistic, Typography, Table, Tag, Button, Space } from 'antd';
import {
  FileTextOutlined,
  CheckCircleOutlined,
  RiseOutlined,
  PlusOutlined,
  SettingOutlined,
  ArrowRightOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';

const { Title, Text } = Typography;

interface ReviewItem {
  id: string;
  projectName: string;
  author: string;
  score: number;
  type: 'mr' | 'push';
  createdAt: string;
}

function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReviewStatistics | null>(null);
  const [recentReviews, setRecentReviews] = useState<ReviewItem[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsData, reviewsData] = await Promise.all([
        getStatistics({}),
        getReviews({ page: 1, limit: 5 }),
      ]);
      setStats(statsData as ReviewStatistics);
      setRecentReviews((reviewsData as ReviewListResponse).items?.map(r => ({
        id: r.id,
        projectName: r.projectName,
        author: r.author,
        score: r.score,
        type: r.reviewType || 'mr',
        createdAt: r.createdAt,
      })) || []);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const columns = [
    {
      title: t('reviews.project'),
      dataIndex: 'projectName',
      key: 'projectName',
      width: 150,
      ellipsis: true,
    },
    {
      title: t('reviews.author'),
      dataIndex: 'author',
      key: 'author',
      width: 100,
      ellipsis: true,
    },
    {
      title: t('reviews.type'),
      dataIndex: 'type',
      key: 'type',
      width: 80,
      render: (type: string) => (
        <Tag color={type === 'mr' ? 'blue' : 'green'}>
          {type === 'mr' ? t('reviews.mr') : t('reviews.push')}
        </Tag>
      ),
    },
    {
      title: t('reviews.score'),
      dataIndex: 'score',
      key: 'score',
      width: 80,
      render: (score: number) => {
        let color = 'default';
        if (score >= 80) color = 'success';
        else if (score >= 60) color = 'warning';
        else if (score < 60) color = 'error';
        return <Tag color={color}>{score}</Tag>;
      },
    },
    {
      title: t('reviews.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 150,
      render: (date: string) => new Date(date).toLocaleString(),
    },
  ];

  const statCards = [
    {
      title: t('dashboard.totalReviews'),
      value: stats?.totalReviews || 0,
      prefix: <FileTextOutlined />,
      color: '#5b4eff',
    },
    {
      title: t('dashboard.mrReviews'),
      value: stats?.mrReviews || 0,
      prefix: <CheckCircleOutlined />,
      color: '#52c41a',
    },
    {
      title: t('dashboard.pushReviews'),
      value: stats?.pushReviews || 0,
      prefix: <RiseOutlined />,
      color: '#722ed1',
    },
  ];

  return (
    <MainLayout>
      <div className="page-container">
        <div className="page-header">
          <div>
            <h2 className="page-title">{t('dashboard.title')}</h2>
            <Text type="secondary">{t('dashboard.welcome', { username: user?.username || t('header.user') })}</Text>
          </div>
          <Button icon={<ReloadOutlined />} onClick={fetchData}>{t('common.refresh')}</Button>
        </div>

        <div className="page-content">
          {/* 统计卡片 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {statCards.map((card, index) => (
              <Col xs={24} sm={8} key={index}>
                <Card className="stat-card" variant="borderless">
                  <Statistic
                    title={card.title}
                    value={card.value}
                    prefix={card.prefix}
                    loading={loading}
                    styles={{ content: { color: card.color } }}
                  />
                </Card>
              </Col>
            ))}
          </Row>

          {/* 最近审查记录 */}
          <Card
            title={t('dashboard.recentReviews')}
            extra={
              <Button type="link" onClick={() => navigate('/reviews')}>
                {t('dashboard.viewAll')} <ArrowRightOutlined />
              </Button>
            }
            className="page-card"
          >
            <Table
              columns={columns}
              dataSource={recentReviews}
              rowKey="id"
              loading={loading}
              className="page-table"
              size="small"
              scroll={{ x: 700 }}
              pagination={false}
            />
          </Card>

          {/* 快速操作 */}
          <Card title={t('dashboard.quickActions')} className="page-card" style={{ marginTop: 16 }}>
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  className="action-card"
                  onClick={() => navigate('/projects')}
                >
                  <Space align="center" style={{ width: '100%', textAlign: 'center' }} orientation="vertical">
                    <PlusOutlined style={{ fontSize: 32, color: '#5b4eff' }} />
                    <Title level={4} style={{ margin: '8px 0 0' }}>{t('dashboard.createProject')}</Title>
                    <Text type="secondary">{t('dashboard.addRepository')}</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  className="action-card"
                  onClick={() => navigate('/reviews')}
                >
                  <Space align="center" style={{ width: '100%', textAlign: 'center' }} orientation="vertical">
                    <FileTextOutlined style={{ fontSize: 32, color: '#52c41a' }} />
                    <Title level={4} style={{ margin: '8px 0 0' }}>{t('dashboard.reviewHistory')}</Title>
                    <Text type="secondary">{t('dashboard.viewPastResults')}</Text>
                  </Space>
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  className="action-card"
                  onClick={() => navigate('/settings')}
                >
                  <Space align="center" style={{ width: '100%', textAlign: 'center' }} orientation="vertical">
                    <SettingOutlined style={{ fontSize: 32, color: '#722ed1' }} />
                    <Title level={4} style={{ margin: '8px 0 0' }}>{t('dashboard.systemSettings')}</Title>
                    <Text type="secondary">{t('dashboard.configureLLM')}</Text>
                  </Space>
                </Card>
              </Col>
            </Row>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default Dashboard;
