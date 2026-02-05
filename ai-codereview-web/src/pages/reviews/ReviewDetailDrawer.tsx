import React from 'react';
import { Descriptions, Tag, Space, Typography, Tooltip } from 'antd';
import { LinkOutlined, CopyOutlined } from '@ant-design/icons';
import type { Review } from '@/types';

const { Text, Paragraph } = Typography;

interface ReviewDetailDrawerProps {
  record: Review;
  t: (key: string) => string;
}

export const ReviewDetailDrawer: React.FC<ReviewDetailDrawerProps> = ({ record: review, t }) => {
  const renderMarkdownContent = () => {
    if (!review?.reviewResult) return '-';

    if (typeof review.reviewResult === 'string') {
      return (
        <div style={{
          whiteSpace: 'pre-wrap',
          maxHeight: 500,
          overflow: 'auto',
          padding: 16,
          background: '#fafafa',
          borderRadius: 6,
          fontFamily: 'monospace',
          fontSize: 13,
          lineHeight: 1.7,
        }}>
          {review.reviewResult}
        </div>
      );
    }

    // Handle structured review result
    const result = review.reviewResult as any;
    const markdown = result.markdown || result.content || JSON.stringify(result, null, 2);

    return (
      <div style={{
        whiteSpace: 'pre-wrap',
        maxHeight: 500,
        overflow: 'auto',
        padding: 16,
        background: '#fafafa',
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 13,
        lineHeight: 1.7,
      }}>
        {markdown}
      </div>
    );
  };

  return (
    <div style={{ padding: '8px 0' }}>
      <Descriptions column={1} bordered size="small">
        <Descriptions.Item label={t('reviews.project')}>
          <Text strong>{review.projectName || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('reviews.author')}>
          <Text code>{review.author || '-'}</Text>
        </Descriptions.Item>
        <Descriptions.Item label={t('reviews.branch')}>
          {review.reviewType === 'mr'
            ? `${review.sourceBranch || '-'} → ${review.targetBranch || '-'}`
            : review.branch || '-'}
        </Descriptions.Item>
        <Descriptions.Item label={t('reviews.score')}>
          <Tag color={review.score >= 80 ? 'success' : review.score >= 60 ? 'warning' : 'error'} style={{ fontSize: 14, padding: '0 8px' }}>
            {review.score}
          </Tag>
        </Descriptions.Item>
        <Descriptions.Item label={t('reviews.changes')}>
          <Space size={16}>
            <Text style={{ color: '#52c41a', fontWeight: 500 }}>+{review.additions || 0}</Text>
            <Text style={{ color: '#ff4d4f', fontWeight: 500 }}>-{review.deletions || 0}</Text>
          </Space>
        </Descriptions.Item>
        <Descriptions.Item label="Commit ID">
          {review.lastCommitId ? (
            <Tooltip title={t('reviews.copyCommitId')}>
              <Text
                copyable={{ text: review.lastCommitId, icon: <CopyOutlined /> }}
                style={{ fontFamily: 'monospace', fontSize: 13, cursor: 'pointer' }}
              >
                {review.lastCommitId.substring(0, 8)}
              </Text>
            </Tooltip>
          ) : '-'}
        </Descriptions.Item>
        {review.url && (
          <Descriptions.Item label={t('reviews.url')}>
            <a href={review.url} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <LinkOutlined /> {t('reviews.viewOnPlatform')}
            </a>
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t('reviews.createdAt')}>
          {new Date(review.createdAt).toLocaleString()}
        </Descriptions.Item>
        {review.commitMessages && (
          <Descriptions.Item label="Commit Messages">
            <Paragraph
              style={{
                whiteSpace: 'pre-wrap',
                maxHeight: 120,
                overflow: 'auto',
                marginBottom: 0,
                padding: 8,
                background: '#f5f5f5',
                borderRadius: 4,
                fontSize: 12,
              }}
              copyable
            >
              {review.commitMessages}
            </Paragraph>
          </Descriptions.Item>
        )}
        <Descriptions.Item label={t('reviews.reviewResult')} style={{ padding: 0 }}>
          {renderMarkdownContent()}
        </Descriptions.Item>
      </Descriptions>
    </div>
  );
};
