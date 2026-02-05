export default [
  {
    path: '/user',
    layout: false,
    routes: [
      { name: '登录', path: '/user/login', component: './User/Login' },
      { name: '注册', path: '/user/register', component: './User/Register' },
    ],
  },
  { path: '/welcome', name: '欢迎', icon: 'smile', component: './Welcome' },
  {
    path: '/admin',
    name: '管理页',
    icon: 'crown',
    access: 'canAdmin',
    routes: [
      { path: '/admin/manage', name: '用户管理', component: './Admin/UserManage' },
      { path: '/admin/upload', name: 'PDF上传', icon: 'upload', component: './Admin/Upload' },
      { path: '/admin', redirect: '/admin/manage' },
    ],
  },
  { path: '/ai-chat', name: 'AI助手', icon: 'robot', component: './AIChat' },
  { path: '/', redirect: '/ai-chat' },
  { path: '*', layout: false, component: './404' },
];
