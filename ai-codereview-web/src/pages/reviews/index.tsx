import { useState, useEffect } from 'react';
import { getReviews, getReview, type Review } from '@/services/review.service';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, Table, Input, Button, Tag, Space } from 'antd';
import { SearchOutlined, ReloadOutlined, EyeOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { drawer } from '@/components/drawer';
import { ReviewDetailDrawer } from './ReviewDetailDrawer';

interface ReviewListData {
  items: Review[];
  total: number;
  page: number;
  pageSize: number;
}

function Reviews() {
  const { t } = useTranslation();
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [reviewData, setReviewData] = useState<ReviewListData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await getReviews({ page, limit });
        setReviewData(res);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, [page, limit]);

  const refresh = () => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const res = await getReviews({ page: 1, limit });
        setReviewData(res);
        setPage(1);
      } catch (error) {
        console.error('Failed to fetch reviews:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  };

  const showDetailDrawer = async (record: Review) => {
    // Fetch latest data using unified API
    const latestData = await getReview(record.id);
    drawer.show(
      () => <ReviewDetailDrawer record={latestData} t={t} />,
      {
        title: t('reviews.detail'),
        size: 600,
        maskClosable: true,
        footer: null,
      }
    );
  };

  const columns = [
    {
      title: t('reviews.type'),
      dataIndex: 'reviewType',
      key: 'reviewType',
      width: 90,
      render: (reviewType: string) => {
        const config = {
          mr: { text: t('reviews.mr'), color: 'blue' },
          push: { text: t('reviews.push'), color: 'green' }
        };
        const item = config[reviewType as keyof typeof config] || { text: reviewType, color: 'default' };
        return <Tag color={item.color}>{item.text}</Tag>;
      },
    },
    {
      title: t('reviews.project'),
      dataIndex: 'projectName',
      key: 'projectName',
      ellipsis: true,
      width: 200,
    },
    {
      title: t('reviews.author'),
      dataIndex: 'author',
      key: 'author',
      width: 120,
      ellipsis: true,
    },
    {
      title: t('reviews.branch'),
      key: 'branch',
      width: 100,
      ellipsis: true,
      render: (_: any, record: Review) => {
        if (record.reviewType === 'mr') {
          return `${record.sourceBranch || '-'} → ${record.targetBranch || '-'}`;
        }
        return record.branch || '-';
      },
    },
    {
      title: t('reviews.score'),
      dataIndex: 'score',
      key: 'score',
      width: 80,
      sorter: (a: Review, b: Review) => a.score - b.score,
      render: (score: number) => {
        let color = 'default';
        if (score >= 80) color = 'success';
        else if (score >= 60) color = 'warning';
        else if (score < 60) color = 'error';
        return <Tag color={color} style={{ minWidth: 44, textAlign: 'center' }}>{score}</Tag>;
      },
    },
    {
      title: t('reviews.changes'),
      key: 'changes',
      width: 100,
      render: (_: any, record: Review) => {
        const additions = record.additions || 0;
        const deletions = record.deletions || 0;
        return (
          <Space size={4}>
            <span style={{ color: '#52c41a' }}>+{additions}</span>
            <span style={{ color: '#ff4d4f' }}>-{deletions}</span>
          </Space>
        );
      },
    },
    {
      title: t('reviews.createdAt'),
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 160,
      sorter: (a: Review, b: Review) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      render: (date: string) => new Date(date).toLocaleString(),
    },
    {
      title: t('reviews.action'),
      key: 'action',
      width: 90,
      fixed: 'right' as const,
      render: (_: any, record: Review) => (
        <Button
          type="link"
          size="small"
          icon={<EyeOutlined />}
          onClick={() => showDetailDrawer(record)}
        >
          {t('reviews.detail')}
        </Button>
      ),
    },
  ];

  const filteredData = reviewData?.items?.filter(item =>
    item.projectName?.toLowerCase().includes(searchText.toLowerCase()) ||
    item.author?.toLowerCase().includes(searchText.toLowerCase())
  ) || [];

  return (
    <MainLayout>
      <div className="page-container">
        <div className="page-header">
          <h2 className="page-title">{t('reviews.title')}</h2>
          <Space>
            <Input.Search
              placeholder={t('reviews.searchPlaceholder')}
              style={{ width: 240 }}
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => setSearchText(e.target.value)}
            />
            <Button icon={<ReloadOutlined />} onClick={refresh}>{t('common.refresh')}</Button>
          </Space>
        </div>

        <div className="page-content">
          <Card className="page-card">
            <Table
              columns={columns}
              dataSource={filteredData}
              loading={loading}
              rowKey="id"
              className="page-table"
               size='small'
              scroll={{ x: 1000 }}
              pagination={{
                current: page,
                pageSize: limit,
                total: reviewData?.total || 0,
                showSizeChanger: false,
                onChange: (newPage) => setPage(newPage),
                showTotal: (total) => t('common.totalRecords', { total }),
                pageSizeOptions: ['10', '20', '50'],
              }}
            />
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}

export default Reviews;
