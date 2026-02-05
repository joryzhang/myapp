import { ProLayoutProps } from '@ant-design/pro-components';

/**
 * @name
 */
const Settings: ProLayoutProps & {
  pwa?: boolean;
  logo?: string;
} = {
  navTheme: 'light',
  // AI SaaS Royal Blue
  colorPrimary: '#2563EB',
  layout: 'side',
  contentWidth: 'Fluid',
  fixedHeader: true,
  fixSiderbar: true,
  colorWeak: false,
  title: 'AI User Center',
  pwa: true,
  logo: 'https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg',
  iconfontUrl: '',
  token: {
    // See ts declaration, demo documentation, modify style through token
    // https://procomponents.ant.design/components/layout#%E9%80%9A%E8%BF%87-token-%E4%BF%AE%E6%94%B9%E6%A0%B7%E5%BC%8F
    header: {
      colorBgHeader: '#ffffff',
      colorHeaderTitle: '#1e293b',
      colorTextMenu: '#64748b',
      colorTextMenuSelected: '#2563eb',
    },
    sider: {
      colorMenuBackground: '#ffffff',
      colorTextMenu: '#64748b',
      colorTextMenuSelected: '#2563eb',
      colorBgMenuItemSelected: '#eff6ff', // Slate-50/Blue-50 mix
    },
    pageContainer: {
      paddingBlockPageContainerContent: 24,
      paddingInlinePageContainerContent: 24,
      colorBgPageContainer: '#f8fafc', // Slate-50 background
    }
  },
};

export default Settings;
