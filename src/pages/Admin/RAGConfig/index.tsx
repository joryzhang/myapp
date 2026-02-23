import { getAIToken } from '@/services/rag';
import {
  ExperimentOutlined,
  InfoCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import {
  Alert,
  Button,
  Card,
  Col,
  Divider,
  InputNumber,
  message,
  Progress,
  Row,
  Slider,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Text, Paragraph } = Typography;

// =========================================================
// Types
// =========================================================

interface RAGConfigData {
  chunk_size: number;
  chunk_overlap: number;
  top_k: number;
  rrf_k: number;
  table_weight: number;
  image_weight: number;
}

interface EvalDetail {
  question: string;
  answer: string;
  faithfulness: number | null;
  answer_relevancy: number | null;
  context_precision: number | null;
  context_recall: number | null;
}

interface EvalResult {
  timestamp: string;
  faithfulness: number | null;
  answer_relevancy: number | null;
  context_precision: number | null;
  context_recall: number | null;
  num_questions: number;
  details: EvalDetail[];
}

// =========================================================
// API 封装
// =========================================================

async function fetchRAGConfig(): Promise<RAGConfigData> {
  const token = await getAIToken();
  const res = await fetch('/api/v1/rag/config', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`获取配置失败: ${res.status}`);
  return res.json();
}

async function updateRAGConfig(config: Partial<RAGConfigData>): Promise<RAGConfigData> {
  const token = await getAIToken();
  const res = await fetch('/api/v1/rag/config', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(config),
  });
  if (res.status === 403) throw new Error('需要管理员权限');
  if (!res.ok) throw new Error(`更新失败: ${res.status}`);
  return res.json();
}

async function runEvaluation(): Promise<EvalResult> {
  const token = await getAIToken();
  const res = await fetch('/api/v1/rag/evaluate', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 403) throw new Error('需要管理员权限');
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail || `评估失败: ${res.status}`);
  }
  return res.json();
}

async function fetchEvalResult(): Promise<EvalResult | null> {
  const token = await getAIToken();
  const res = await fetch('/api/v1/rag/evaluate', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`获取评估结果失败: ${res.status}`);
  return res.json();
}

// =========================================================
// 指标渲染
// =========================================================

function MetricCard({
  label,
  value,
  description,
}: {
  label: string;
  value: number | null;
  description: string;
}) {
  const percent = value !== null ? Math.round(value * 100) : 0;
  const color =
    value === null ? '#d9d9d9' : value >= 0.7 ? '#52c41a' : value >= 0.4 ? '#faad14' : '#ff4d4f';

  return (
    <Card size="small" style={{ textAlign: 'center' }}>
      <Tooltip title={description}>
        <div style={{ marginBottom: '8px' }}>
          <Text type="secondary" style={{ fontSize: '13px' }}>
            {label}
          </Text>
          <InfoCircleOutlined style={{ marginLeft: '4px', fontSize: '12px', color: '#bbb' }} />
        </div>
      </Tooltip>
      {value !== null ? (
        <Progress
          type="circle"
          percent={percent}
          size={80}
          strokeColor={color}
          format={() => `${(value * 100).toFixed(1)}%`}
        />
      ) : (
        <div
          style={{
            height: '80px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text type="secondary">暂无数据</Text>
        </div>
      )}
    </Card>
  );
}

// =========================================================
// 主组件
// =========================================================

const RAGConfig: React.FC = () => {
  const [config, setConfig] = useState<RAGConfigData | null>(null);
  const [localConfig, setLocalConfig] = useState<RAGConfigData | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [evalResult, setEvalResult] = useState<EvalResult | null>(null);
  const [evalLoading, setEvalLoading] = useState(false);

  // 加载配置 — 函数声明在 useEffect 之前, 避免 no-use-before-define

  const loadConfig = async () => {
    try {
      setConfigLoading(true);
      const data = await fetchRAGConfig();
      setConfig(data);
      setLocalConfig({ ...data });
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setConfigLoading(false);
    }
  };

  const loadEvalResult = async () => {
    try {
      const data = await fetchEvalResult();
      setEvalResult(data);
    } catch (e: any) {
      console.warn('加载评估结果:', e.message);
    }
  };

  useEffect(() => {
    loadConfig();
    loadEvalResult();
  }, []);

  const handleSave = async () => {
    if (!localConfig || !config) return;

    // 只发送变更的字段
    const diff: Partial<RAGConfigData> = {};
    if (localConfig.chunk_size !== config.chunk_size) diff.chunk_size = localConfig.chunk_size;
    if (localConfig.chunk_overlap !== config.chunk_overlap)
      diff.chunk_overlap = localConfig.chunk_overlap;
    if (localConfig.top_k !== config.top_k) diff.top_k = localConfig.top_k;
    if (localConfig.rrf_k !== config.rrf_k) diff.rrf_k = localConfig.rrf_k;
    if (localConfig.table_weight !== config.table_weight)
      diff.table_weight = localConfig.table_weight;
    if (localConfig.image_weight !== config.image_weight)
      diff.image_weight = localConfig.image_weight;

    if (Object.keys(diff).length === 0) {
      message.info('参数未变更');
      return;
    }

    try {
      setSaving(true);
      const updated = await updateRAGConfig(diff);
      setConfig(updated);
      setLocalConfig({ ...updated });
      message.success('参数已更新');
    } catch (e: any) {
      message.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleEvaluate = async () => {
    try {
      setEvalLoading(true);
      message.loading({ content: '评估中... 这可能需要几分钟', key: 'eval', duration: 0 });
      const result = await runEvaluation();
      setEvalResult(result);
      message.destroy('eval');
      message.success(`评估完成, ${result.num_questions} 条数据`);
    } catch (e: any) {
      message.destroy('eval');
      message.error(e.message);
    } finally {
      setEvalLoading(false);
    }
  };

  const hasChanges =
    config &&
    localConfig &&
    (config.chunk_size !== localConfig.chunk_size ||
      config.chunk_overlap !== localConfig.chunk_overlap ||
      config.top_k !== localConfig.top_k ||
      config.rrf_k !== localConfig.rrf_k ||
      config.table_weight !== localConfig.table_weight ||
      config.image_weight !== localConfig.image_weight);

  if (configLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '100px' }}>
        <Spin size="large" tip="加载配置中..." />
      </div>
    );
  }

  return (
    <div style={{ padding: '24px', maxWidth: '1000px', margin: '0 auto' }}>
      {/* ============= 参数调节 Card ============= */}
      <Card
        title={
          <Space>
            <SettingOutlined style={{ color: '#2563eb' }} />
            <span>RAG 核心参数</span>
          </Space>
        }
        extra={
          <Space>
            <Button icon={<ReloadOutlined />} onClick={loadConfig} size="small">
              重置
            </Button>
            <Button type="primary" onClick={handleSave} loading={saving} disabled={!hasChanges}>
              保存
            </Button>
          </Space>
        }
        style={{ marginBottom: '24px' }}
      >
        <Alert
          message="CHUNK_SIZE 和 CHUNK_OVERLAP 仅影响新上传的文档, 已有文档不会重新切分"
          type="info"
          showIcon
          style={{ marginBottom: '24px' }}
        />

        {localConfig && (
          <div>
            {/* CHUNK_SIZE */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <Text strong>
                  文本切分块大小 (CHUNK_SIZE)
                  <Tag color="orange" style={{ marginLeft: '8px', fontSize: '11px' }}>
                    仅新上传
                  </Tag>
                </Text>
                <InputNumber
                  min={100}
                  max={2000}
                  step={50}
                  value={localConfig.chunk_size}
                  onChange={(v) => setLocalConfig({ ...localConfig, chunk_size: v || 500 })}
                  size="small"
                  style={{ width: '80px' }}
                />
              </div>
              <Slider
                min={100}
                max={2000}
                step={50}
                value={localConfig.chunk_size}
                onChange={(v) => setLocalConfig({ ...localConfig, chunk_size: v })}
                marks={{ 100: '100', 500: '500', 1000: '1000', 2000: '2000' }}
              />
            </div>

            {/* CHUNK_OVERLAP */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <Text strong>
                  切分重叠大小 (CHUNK_OVERLAP)
                  <Tag color="orange" style={{ marginLeft: '8px', fontSize: '11px' }}>
                    仅新上传
                  </Tag>
                </Text>
                <InputNumber
                  min={0}
                  max={200}
                  step={10}
                  value={localConfig.chunk_overlap}
                  onChange={(v) => setLocalConfig({ ...localConfig, chunk_overlap: v || 50 })}
                  size="small"
                  style={{ width: '80px' }}
                />
              </div>
              <Slider
                min={0}
                max={200}
                step={10}
                value={localConfig.chunk_overlap}
                onChange={(v) => setLocalConfig({ ...localConfig, chunk_overlap: v })}
                marks={{ 0: '0', 50: '50', 100: '100', 200: '200' }}
              />
            </div>

            {/* TOP_K */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <Text strong>
                  检索返回数量 (TOP_K)
                  <Tooltip title="检索到的父文档数量, 越大上下文越丰富但 token 消耗越多">
                    <InfoCircleOutlined style={{ marginLeft: '4px', color: '#bbb' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  min={1}
                  max={10}
                  value={localConfig.top_k}
                  onChange={(v) => setLocalConfig({ ...localConfig, top_k: v || 2 })}
                  size="small"
                  style={{ width: '80px' }}
                />
              </div>
              <Slider
                min={1}
                max={10}
                value={localConfig.top_k}
                onChange={(v) => setLocalConfig({ ...localConfig, top_k: v })}
                marks={{ 1: '1', 2: '2', 5: '5', 10: '10' }}
              />
            </div>

            {/* RRF_K */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <Text strong>
                  RRF 平滑指数 (RRF_K)
                  <Tooltip title="控制多路检索融合时的排名平滑程度。越大 → 排名差异越平滑 (推荐 60)；越小 → 头部排名权重越大 (赢者通吃)">
                    <InfoCircleOutlined style={{ marginLeft: '4px', color: '#bbb' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  min={1}
                  max={200}
                  value={localConfig.rrf_k}
                  onChange={(v) => setLocalConfig({ ...localConfig, rrf_k: v || 60 })}
                  size="small"
                  style={{ width: '80px' }}
                />
              </div>
              <Slider
                min={1}
                max={200}
                value={localConfig.rrf_k}
                onChange={(v) => setLocalConfig({ ...localConfig, rrf_k: v })}
                marks={{ 1: '1', 30: '30', 60: '60', 100: '100', 200: '200' }}
              />
            </div>

            <Divider>RRF 类型权重</Divider>

            {/* TABLE_WEIGHT */}
            <div style={{ marginBottom: '24px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <Text strong>
                  表格权重 (TABLE_WEIGHT)
                  <Tooltip title="RRF 融合时表格类型的权重系数。1.0 = 不加权; >1.0 = 提升表格排名; <1.0 = 降低表格排名">
                    <InfoCircleOutlined style={{ marginLeft: '4px', color: '#bbb' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  min={0}
                  max={3}
                  step={0.1}
                  value={localConfig.table_weight}
                  onChange={(v) => setLocalConfig({ ...localConfig, table_weight: v ?? 1.0 })}
                  size="small"
                  style={{ width: '80px' }}
                />
              </div>
              <Slider
                min={0}
                max={3}
                step={0.1}
                value={localConfig.table_weight}
                onChange={(v) => setLocalConfig({ ...localConfig, table_weight: v })}
                marks={{ 0: '0', 0.5: '0.5', 1: '1.0', 1.5: '1.5', 2: '2.0', 3: '3.0' }}
              />
            </div>

            {/* IMAGE_WEIGHT */}
            <div style={{ marginBottom: '8px' }}>
              <div
                style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}
              >
                <Text strong>
                  图片权重 (IMAGE_WEIGHT)
                  <Tooltip title="RRF 融合时图片类型的权重系数。1.0 = 不加权; >1.0 = 提升图片排名">
                    <InfoCircleOutlined style={{ marginLeft: '4px', color: '#bbb' }} />
                  </Tooltip>
                </Text>
                <InputNumber
                  min={0}
                  max={3}
                  step={0.1}
                  value={localConfig.image_weight}
                  onChange={(v) => setLocalConfig({ ...localConfig, image_weight: v ?? 1.0 })}
                  size="small"
                  style={{ width: '80px' }}
                />
              </div>
              <Slider
                min={0}
                max={3}
                step={0.1}
                value={localConfig.image_weight}
                onChange={(v) => setLocalConfig({ ...localConfig, image_weight: v })}
                marks={{ 0: '0', 0.5: '0.5', 1: '1.0', 1.5: '1.5', 2: '2.0', 3: '3.0' }}
              />
            </div>
          </div>
        )}
      </Card>

      {/* ============= RAGAS 评估 Card ============= */}
      <Card
        title={
          <Space>
            <ExperimentOutlined style={{ color: '#7c3aed' }} />
            <span>RAGAS 评估</span>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleEvaluate}
            loading={evalLoading}
            style={{ background: '#7c3aed', borderColor: '#7c3aed' }}
          >
            {evalLoading ? '评估中...' : '运行评估'}
          </Button>
        }
      >
        {!evalResult ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Text type="secondary">暂无评估数据, 点击「运行评估」开始</Text>
            <Paragraph type="secondary" style={{ fontSize: '12px', marginTop: '8px' }}>
              基于预设的 QA 数据集, 测试当前参数下 RAG 系统的检索与生成质量
            </Paragraph>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px' }}>
              <Text type="secondary">
                评估时间: {evalResult.timestamp} · 数据量: {evalResult.num_questions} 条
              </Text>
            </div>

            {/* 四个指标卡片 */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
              <Col xs={12} sm={6}>
                <MetricCard
                  label="忠诚度"
                  value={evalResult.faithfulness}
                  description="Faithfulness — 回答是否基于检索到的上下文, 而不是模型自编"
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricCard
                  label="答案相关性"
                  value={evalResult.answer_relevancy}
                  description="Answer Relevancy — 回答是否切中问题要点"
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricCard
                  label="上下文精确度"
                  value={evalResult.context_precision}
                  description="Context Precision — 检索到的文档是否都和问题相关 (少噪音)"
                />
              </Col>
              <Col xs={12} sm={6}>
                <MetricCard
                  label="上下文召回率"
                  value={evalResult.context_recall}
                  description="Context Recall — 是否检索到了回答问题所需的全部信息"
                />
              </Col>
            </Row>

            {/* 明细表格 */}
            {evalResult.details.length > 0 && (
              <>
                <Divider>评估明细</Divider>
                {evalResult.details.map((d, i) => (
                  <Card
                    key={i}
                    size="small"
                    style={{ marginBottom: '12px' }}
                    title={
                      <Text ellipsis style={{ maxWidth: '600px' }}>
                        Q{i + 1}: {d.question}
                      </Text>
                    }
                  >
                    <Paragraph ellipsis={{ rows: 2, expandable: true }}>
                      <Text strong>回答: </Text>
                      {d.answer}
                    </Paragraph>
                    <Space wrap>
                      {d.faithfulness !== null && (
                        <Tag color="blue">忠诚度: {(d.faithfulness * 100).toFixed(0)}%</Tag>
                      )}
                      {d.answer_relevancy !== null && (
                        <Tag color="green">相关性: {(d.answer_relevancy * 100).toFixed(0)}%</Tag>
                      )}
                      {d.context_precision !== null && (
                        <Tag color="purple">精确度: {(d.context_precision * 100).toFixed(0)}%</Tag>
                      )}
                      {d.context_recall !== null && (
                        <Tag color="orange">召回率: {(d.context_recall * 100).toFixed(0)}%</Tag>
                      )}
                    </Space>
                  </Card>
                ))}
              </>
            )}
          </>
        )}
      </Card>
    </div>
  );
};

export default RAGConfig;
