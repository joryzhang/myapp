import { useResizableColumns } from '@/components/ResizableTitle';
import { searchUsers } from '@/services/ant-design-pro/api';
import { PlusOutlined } from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable, TableDropdown } from '@ant-design/pro-components';
import { Button, Image } from 'antd';
import { useRef } from 'react';

export const waitTimePromise = async (time: number = 100) => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(true);
    }, time);
  });
};

export const waitTime = async (time: number = 100) => {
  await waitTimePromise(time);
};

const baseColumns: ProColumns<API.CurrentUser>[] = [
  {
    dataIndex: 'id',
    valueType: 'indexBorder',
    width: 48,
    fixed: 'left',
  },
  {
    title: '用户名',
    dataIndex: 'username',
    ellipsis: true,
    width: 100,
  },
  {
    title: '账号',
    dataIndex: 'account',
    ellipsis: true,
    width: 100,
  },
  {
    title: '头像',
    render: (_, record) => (
      <div>
        <Image src={record.avatar} width={40} style={{ borderRadius: '50%' }}></Image>
      </div>
    ),
    dataIndex: 'avatar',
    search: false,
    width: 60,
  },
  {
    title: '性别',
    dataIndex: 'gender',
    ellipsis: true,
    width: 60,
  },
  {
    title: '手机号',
    dataIndex: 'phone',
    copyable: true,
    ellipsis: true,
    width: 130,
  },
  {
    title: '邮箱',
    dataIndex: 'email',
    ellipsis: true,
    tooltip: '标题过长会自动收缩',
    width: 160,
  },
  {
    title: '状态',
    dataIndex: 'status',
    ellipsis: true,
    width: 60,
  },
  {
    title: '角色',
    dataIndex: 'authority',
    ellipsis: true,
    valueType: 'select',
    width: 90,
    valueEnum: {
      0: { text: '普通用户', status: 'Default' },
      1: {
        text: '管理员',
        status: 'Success',
      },
    },
  },
  {
    title: '创建时间',
    dataIndex: 'createTime',
    valueType: 'date',
    ellipsis: true,
    width: 110,
  },
  {
    title: '操作',
    valueType: 'option',
    key: 'option',
    width: 120,
    fixed: 'right',
    render: (text, record, _, action) => [
      <a
        key="editable"
        onClick={() => {
          action?.startEditable?.(record.id);
        }}
      >
        编辑
      </a>,
      <a href={record.account} target="_blank" rel="noopener noreferrer" key="view">
        查看
      </a>,
      <TableDropdown
        key="actionGroup"
        onSelect={() => action?.reload()}
        menus={[
          { key: 'copy', name: '复制' },
          { key: 'delete', name: '删除' },
        ]}
      />,
    ],
  },
];

export default () => {
  const actionRef = useRef<ActionType>();
  const { columns, components } = useResizableColumns(baseColumns);

  return (
    <ProTable<API.CurrentUser>
      columns={columns}
      components={components}
      actionRef={actionRef}
      cardBordered
      scroll={{ x: 1000 }}
      //@ts-ignore
      request={async (params, sort, filter) => {
        console.log(sort, filter);
        await waitTime(2000);
        const userList = await searchUsers();
        return {
          data: userList,
        };
      }}
      editable={{
        type: 'multiple',
      }}
      columnsState={{
        persistenceKey: 'pro-table-singe-demos',
        persistenceType: 'localStorage',
        onChange(value) {
          console.log('value: ', value);
        },
      }}
      rowKey="id"
      search={{
        filterType: 'light',
      }}
      options={{
        setting: {
          listsHeight: 400,
        },
      }}
      form={{
        syncToUrl: (values, type) => {
          if (type === 'get') {
            return {
              ...values,
              created_at: [values.startTime, values.endTime],
            };
          }
          return values;
        },
      }}
      pagination={{
        pageSize: 5,
        onChange: (page) => console.log(page),
      }}
      dateFormatter="string"
      headerTitle="用户管理"
      toolBarRender={() => [
        <Button
          key="button"
          icon={<PlusOutlined />}
          onClick={() => {
            actionRef.current?.reload();
          }}
          type="primary"
        >
          新建
        </Button>,
      ]}
    />
  );
};
