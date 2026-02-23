import { getAIToken } from '@/services/rag';
import {
  ArrowRightOutlined,
  ClockCircleOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  RobotOutlined,
  SafetyOutlined,
  SettingOutlined,
  ThunderboltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { history, useModel } from '@umijs/max';
import { Avatar, Card, Col, Row, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

// =========================================================
// 工具函数
// =========================================================

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return '夜深了';
  if (hour < 12) return '上午好';
  if (hour < 14) return '中午好';
  if (hour < 18) return '下午好';
  return '晚上好';
}

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  return `${y}年${m}月${d}日 ${weekdays[date.getDay()]}`;
}

// =========================================================
// 快捷入口配置
// =========================================================

interface QuickAction {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
  gradient: string;
  path: string;
  adminOnly?: boolean;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: 'AI 对话',
    desc: '向智能助手提问，获取知识库中的精准答案',
    icon: <RobotOutlined />,
    color: '#2563eb',
    gradient: 'linear-gradient(135deg, #dbeafe 0%, #eff6ff 100%)',
    path: '/ai-chat',
  },
  {
    title: '文档上传',
    desc: '上传 PDF/Word 文档，自动切分并建立向量索引',
    icon: <FileTextOutlined />,
    color: '#7c3aed',
    gradient: 'linear-gradient(135deg, #ede9fe 0%, #f5f3ff 100%)',
    path: '/admin/upload',
    adminOnly: true,
  },
  {
    title: '向量管理',
    desc: '查看、编辑、删除向量库中的文档条目',
    icon: <DatabaseOutlined />,
    color: '#059669',
    gradient: 'linear-gradient(135deg, #d1fae5 0%, #ecfdf5 100%)',
    path: '/admin/vectors',
    adminOnly: true,
  },
  {
    title: 'RAG 调参',
    desc: '调节检索参数与权重，运行 RAGAS 质量评估',
    icon: <SettingOutlined />,
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
    path: '/admin/rag-config',
    adminOnly: true,
  },
];

// =========================================================
// 快捷入口卡片
// =========================================================

const ActionCard: React.FC<{ action: QuickAction }> = ({ action }) => {
  const [hovered, setHovered] = useState(false);

  return (
    <Card
      hoverable
      style={{
        borderRadius: 12,
        border: '1px solid #f0f0f0',
        background: hovered ? action.gradient : '#fff',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: 'pointer',
        transform: hovered ? 'translateY(-2px)' : 'none',
        boxShadow: hovered ? '0 12px 24px -4px rgba(0,0,0,0.08)' : '0 1px 3px rgba(0,0,0,0.04)',
        height: '100%',
      }}
      bodyStyle={{ padding: '24px' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => history.push(action.path)}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Icon */}
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 12,
            background: `${action.color}12`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            color: action.color,
            transition: 'all 0.3s',
            transform: hovered ? 'scale(1.1)' : 'none',
          }}
        >
          {action.icon}
        </div>

        {/* Text */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Text strong style={{ fontSize: 16, color: '#1e293b' }}>
              {action.title}
            </Text>
            <ArrowRightOutlined
              style={{
                fontSize: 12,
                color: action.color,
                opacity: hovered ? 1 : 0,
                transform: hovered ? 'translateX(0)' : 'translateX(-8px)',
                transition: 'all 0.3s',
              }}
            />
          </div>
          <Text type="secondary" style={{ fontSize: 13, lineHeight: '20px' }}>
            {action.desc}
          </Text>
        </div>
      </div>
    </Card>
  );
};

// =========================================================
// 系统状态卡片
// =========================================================

interface SystemStat {
  title: string;
  icon: React.ReactNode;
  color: string;
  loading: boolean;
  value: string | number;
  suffix?: string;
}

const StatCard: React.FC<{ stat: SystemStat }> = ({ stat }) => (
  <div
    style={{
      display: 'flex',
      alignItems: 'center',
      gap: 16,
      padding: '16px 20px',
      borderRadius: 10,
      background: `${stat.color}08`,
      border: `1px solid ${stat.color}18`,
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: 10,
        background: `${stat.color}15`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
        color: stat.color,
      }}
    >
      {stat.icon}
    </div>
    <div>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {stat.title}
      </Text>
      <div style={{ fontSize: 20, fontWeight: 600, color: '#1e293b', lineHeight: '28px' }}>
        {stat.loading ? '...' : stat.value}
        {stat.suffix && (
          <span style={{ fontSize: 13, fontWeight: 400, color: '#94a3b8', marginLeft: 4 }}>
            {stat.suffix}
          </span>
        )}
      </div>
    </div>
  </div>
);

// =========================================================
// 主组件
// =========================================================

const Welcome: React.FC = () => {
  const { initialState } = useModel('@@initialState');
  const currentUser = initialState?.currentUser;

  // 向量库统计
  const [vectorCount, setVectorCount] = useState<number | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  const loadStats = async () => {
    try {
      const token = await getAIToken();
      const res = await fetch('/api/v1/vectors?page=1&page_size=1', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        setVectorCount(json.total ?? 0);
      }
    } catch {
      // 非致命，忽略
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const roleLabel = currentUser?.authority === 1 ? '管理员' : '普通用户';

  const systemStats: SystemStat[] = [
    {
      title: '知识库向量数',
      icon: <DatabaseOutlined />,
      color: '#2563eb',
      loading: statsLoading,
      value: vectorCount ?? '-',
      suffix: '条',
    },
    {
      title: '系统状态',
      icon: <ThunderboltOutlined />,
      color: '#059669',
      loading: false,
      value: '运行中',
    },
    {
      title: '安全等级',
      icon: <SafetyOutlined />,
      color: '#7c3aed',
      loading: false,
      value: 'JWT 认证',
    },
  ];

  return (
    <PageContainer header={{ title: '', breadcrumb: {} }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        {/* ============= 顶部欢迎横幅 ============= */}
        <Card
          style={{
            borderRadius: 16,
            border: 'none',
            background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #60a5fa 100%)',
            marginBottom: 24,
            overflow: 'hidden',
            position: 'relative',
          }}
          bodyStyle={{ padding: '36px 40px', position: 'relative', zIndex: 1 }}
        >
          {/* 装饰性背景图案 */}
          <div
            style={{
              position: 'absolute',
              top: -40,
              right: -20,
              width: 280,
              height: 280,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: -60,
              right: 120,
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)',
            }}
          />

          <Row align="middle" gutter={24}>
            <Col>
              <Avatar
                size={64}
                src={currentUser?.avatar}
                icon={<UserOutlined />}
                style={{
                  border: '3px solid rgba(255,255,255,0.3)',
                  background: 'rgba(255,255,255,0.15)',
                }}
              />
            </Col>
            <Col flex="auto">
              <Title level={3} style={{ color: '#fff', margin: 0, fontWeight: 600 }}>
                {getGreeting()}，{currentUser?.username || '用户'}
              </Title>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
                <Tag
                  style={{
                    background: 'rgba(255,255,255,0.18)',
                    border: 'none',
                    color: '#fff',
                    borderRadius: 6,
                    fontSize: 12,
                  }}
                >
                  {roleLabel}
                </Tag>
                <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
                  <ClockCircleOutlined style={{ marginRight: 6 }} />
                  {formatDate(new Date())}
                </Text>
              </div>
            </Col>
          </Row>
        </Card>

        {/* ============= 快捷入口 ============= */}
        <div style={{ marginBottom: 24 }}>
          <Text
            strong
            style={{ fontSize: 15, color: '#475569', marginBottom: 16, display: 'block' }}
          >
            快捷入口
          </Text>
          <Row gutter={[16, 16]}>
            {QUICK_ACTIONS.filter((a) => !a.adminOnly || currentUser?.authority === 1).map(
              (action) => (
                <Col xs={24} sm={12} lg={6} key={action.title}>
                  <ActionCard action={action} />
                </Col>
              ),
            )}
          </Row>
        </div>

        {/* ============= 系统概览 ============= */}
        <Card
          style={{ borderRadius: 12, border: '1px solid #f0f0f0' }}
          bodyStyle={{ padding: '24px' }}
        >
          <Text
            strong
            style={{ fontSize: 15, color: '#475569', marginBottom: 16, display: 'block' }}
          >
            系统概览
          </Text>
          <Row gutter={[16, 16]}>
            {systemStats.map((stat) => (
              <Col xs={24} sm={8} key={stat.title}>
                <StatCard stat={stat} />
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    </PageContainer>
  );
};

export default Welcome;
