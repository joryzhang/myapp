import { useResizableColumns } from '@/components/ResizableTitle';
import { getAIToken } from '@/services/rag';
import { DeleteOutlined, EditOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Button, Input, message, Modal, Popconfirm, Space, Tag, Tooltip } from 'antd';
import { useRef, useState } from 'react';

const { TextArea } = Input;

// =========================================================
// Types
// =========================================================

interface VectorItem {
  id: string;
  content: string;
  metadata: Record<string, any>;
}

interface VectorListResponse {
  total: number;
  items: VectorItem[];
}

// =========================================================
// API 调用
// =========================================================

async function fetchVectors(params: {
  current?: number;
  pageSize?: number;
  keyword?: string;
}): Promise<{ data: VectorItem[]; total: number; success: boolean }> {
  const { current = 1, pageSize = 20, keyword } = params;
  try {
    const token = await getAIToken();
    const query = new URLSearchParams({
      page: String(current),
      page_size: String(pageSize),
      ...(keyword ? { keyword } : {}),
    });

    const res = await fetch(`/api/v1/vectors?${query}`, {
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (res.status === 401) {
      message.error('鉴权失败，请重新登录');
      return { data: [], total: 0, success: false };
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const json: VectorListResponse = await res.json();
    return {
      data: json.items || [],
      total: json.total || 0,
      success: true,
    };
  } catch (error) {
    message.error('加载向量数据失败');
    return { data: [], total: 0, success: false };
  }
}

async function updateVector(id: string, content: string): Promise<boolean> {
  try {
    const token = await getAIToken();
    const res = await fetch(`/api/v1/vectors/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    message.success('更新成功');
    return true;
  } catch (error) {
    message.error('更新失败');
    return false;
  }
}

async function deleteVector(id: string): Promise<boolean> {
  try {
    const token = await getAIToken();
    const res = await fetch(`/api/v1/vectors/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    message.success('删除成功');
    return true;
  } catch (error) {
    message.error('删除失败');
    return false;
  }
}

// =========================================================
// Component
// =========================================================

export default () => {
  const actionRef = useRef<ActionType>();
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VectorItem | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleEdit = (record: VectorItem) => {
    setEditingItem(record);
    setEditContent(record.content);
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (!editingItem) return;
    setSaving(true);
    const ok = await updateVector(editingItem.id, editContent);
    setSaving(false);
    if (ok) {
      setEditModalOpen(false);
      actionRef.current?.reload();
    }
  };

  const handleDelete = async (id: string) => {
    const ok = await deleteVector(id);
    if (ok) {
      actionRef.current?.reload();
    }
  };

  const baseColumns: ProColumns<VectorItem>[] = [
    {
      title: '',
      dataIndex: 'index',
      valueType: 'index',
      width: 48,
      fixed: 'left',
      search: false,
      align: 'center',
    },
    {
      title: 'ID',
      dataIndex: 'id',
      ellipsis: true,
      copyable: true,
      search: false,
      width: 80,
      fixed: 'left',
      render: (_, record) => (
        <Tooltip title={record.id}>
          <span style={{ fontFamily: 'monospace', fontSize: 12 }}>{record.id.slice(0, 4)}...</span>
        </Tooltip>
      ),
    },
    {
      title: '内容摘要',
      dataIndex: 'content',
      ellipsis: true,
      search: false,
      width: 300,
      render: (_, record) => (
        <Tooltip title={record.content} placement="topLeft" overlayStyle={{ maxWidth: 400 }}>
          <span style={{ cursor: 'pointer', wordBreak: 'break-all' }}>
            {record.content.length > 60 ? record.content.slice(0, 60) + '...' : record.content}
          </span>
        </Tooltip>
      ),
    },
    {
      title: '关键词搜索',
      dataIndex: 'keyword',
      hideInTable: true,
      fieldProps: { placeholder: '按内容关键词过滤' },
    },
    {
      title: '来源',
      dataIndex: ['metadata', 'file_hash'],
      ellipsis: true,
      search: false,
      width: 100,
      render: (_, record) => {
        const hash = record.metadata?.file_hash;
        return hash ? <Tag color="blue">{String(hash).slice(0, 8)}</Tag> : '-';
      },
    },
    {
      title: '页',
      dataIndex: ['metadata', 'page'],
      search: false,
      width: 50,
      align: 'center',
      render: (_, record) => record.metadata?.page ?? '-',
    },
    {
      title: '类型',
      dataIndex: ['metadata', 'type'],
      search: false,
      width: 70,
      align: 'center',
      render: (_, record) => {
        const t = record.metadata?.type;
        const colorMap: Record<string, string> = {
          text: 'green',
          table: 'orange',
          image: 'purple',
        };
        return t ? <Tag color={colorMap[t] || 'default'}>{t}</Tag> : '-';
      },
    },
    {
      title: '状态',
      dataIndex: ['metadata', 'has_override'],
      search: false,
      width: 70,
      align: 'center',
      render: (_, record) => {
        return record.metadata?.has_override ? (
          <Tag color="orange">已编辑</Tag>
        ) : (
          <Tag color="default">原始</Tag>
        );
      },
    },
    {
      title: '父文档ID',
      dataIndex: ['metadata', 'parent_id'],
      ellipsis: true,
      copyable: true,
      search: false,
      width: 160,
    },
    {
      title: '操作',
      valueType: 'option',
      width: 120,
      fixed: 'right',
      render: (_, record) => (
        <Space size={4}>
          <a key="edit" onClick={() => handleEdit(record)}>
            <EditOutlined /> 编辑
          </a>
          <Popconfirm
            title="确认删除此向量条目？"
            description="删除后不可恢复，且会影响检索结果。"
            onConfirm={() => handleDelete(record.id)}
            okText="确认"
            cancelText="取消"
          >
            <a key="delete" style={{ color: '#ff4d4f' }}>
              <DeleteOutlined /> 删除
            </a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const { columns, components } = useResizableColumns(baseColumns);

  return (
    <>
      <ProTable<VectorItem>
        columns={columns}
        components={components}
        actionRef={actionRef}
        cardBordered
        scroll={{ x: 900 }}
        request={async (params) => {
          return fetchVectors({
            current: params.current,
            pageSize: params.pageSize,
            keyword: params.keyword,
          });
        }}
        rowKey="id"
        search={{ labelWidth: 'auto' }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: { listsHeight: 400 },
        }}
        pagination={{
          defaultPageSize: 20,
          showSizeChanger: true,
          pageSizeOptions: ['10', '20', '50', '100'],
        }}
        dateFormatter="string"
        headerTitle="向量库管理"
        toolBarRender={() => [
          <Button
            key="reload"
            icon={<ReloadOutlined />}
            onClick={() => actionRef.current?.reload()}
          >
            刷新
          </Button>,
        ]}
      />

      <Modal
        title="编辑向量内容"
        open={editModalOpen}
        onOk={handleSave}
        onCancel={() => setEditModalOpen(false)}
        confirmLoading={saving}
        width="90%"
        style={{ maxWidth: 700 }}
        okText="保存"
        cancelText="取消"
      >
        {editingItem && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 8 }}>
              <strong>ID:</strong>{' '}
              <code style={{ fontSize: 12, color: '#666', wordBreak: 'break-all' }}>
                {editingItem.id}
              </code>
            </div>
            <div style={{ marginBottom: 8 }}>
              <strong>来源:</strong>{' '}
              <Tag color="blue">{editingItem.metadata?.file_hash?.slice(0, 16) || '-'}</Tag>
              <strong style={{ marginLeft: 8 }}>页码:</strong> {editingItem.metadata?.page ?? '-'}
            </div>
          </div>
        )}
        <TextArea
          value={editContent}
          onChange={(e) => setEditContent(e.target.value)}
          rows={12}
          style={{ fontFamily: 'monospace', fontSize: 13 }}
          placeholder="向量文本内容"
        />
        <div style={{ marginTop: 8, color: '#999', fontSize: 12 }}>
          ⚠️ 保存后会自动重新计算 Embedding 并热更新 BM25 索引
        </div>
      </Modal>
    </>
  );
};
