import { Footer } from '@/components';
import { login } from '@/services/ant-design-pro/api';
import { LockOutlined, UserOutlined, AlipayCircleOutlined, TaobaoCircleOutlined, WeiboCircleOutlined } from '@ant-design/icons';
import { LoginForm, ProFormCheckbox, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, Link, useModel } from '@umijs/max';
import { Alert, message, Tabs, Col, Row, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import { flushSync } from 'react-dom';
import Settings from '../../../../config/defaultSettings';
import { GIT_HUB, SYSTEM_LOGO } from "@/constant";

const { Title, Text } = Typography;

const useStyles = createStyles(({ token }) => {
  return {
    container: {
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: token.colorBgContainer,
    },
    splitLayout: {
      flex: 1,
      display: 'flex',
      width: '100%',
      height: '100%',
    },
    leftPanel: {
      flex: '1',
      background: 'linear-gradient(135deg, #2563EB 0%, #1E40AF 100%)', // Royal Blue Gradient
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      color: 'white',
      padding: '48px',
      position: 'relative',
      overflow: 'hidden',
      '@media (max-width: 768px)': {
        display: 'none',
      },
    },
    rightPanel: {
      flex: '0 0 500px',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '32px',
      backgroundColor: token.colorBgContainer,
      '@media (max-width: 768px)': {
        flex: 1,
      },
    },
    brandTitle: {
      color: 'white !important',
      fontSize: '48px !important',
      fontWeight: 'bold !important',
      marginBottom: '16px !important',
    },
    brandSubtitle: {
      color: 'rgba(255, 255, 255, 0.85) !important',
      fontSize: '20px !important',
      textAlign: 'center',
      maxWidth: '80%',
    },
    formContainer: {
      width: '100%',
      maxWidth: '360px',
    },
    logo: {
      width: '64px',
      height: '64px',
      marginBottom: '24px',
    }
  };
});

const LoginMessage: React.FC<{
  content: string;
}> = ({ content }) => {
  return (
    <Alert
      style={{
        marginBottom: 24,
      }}
      message={content}
      type="error"
      showIcon
    />
  );
};

const Login: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const { initialState, setInitialState } = useModel('@@initialState');
  const { styles } = useStyles();

  const fetchUserInfo = async () => {
    const userInfo = await initialState?.fetchUserInfo?.();
    if (userInfo) {
      flushSync(() => {
        setInitialState((s) => ({
          ...s,
          currentUser: userInfo,
        }));
      });
    }
  };

  const handleSubmit = async (values: API.LoginParams) => {
    try {
      const user = await login({
        ...values,
      });
      if (user) {
        message.success('登录成功');
        await fetchUserInfo();
        const urlParams = new URL(window.location.href).searchParams;
        history.push(urlParams.get('redirect') || '/');
        return;
      }
    } catch (error) {
      // GlobalRequest interceptor handles errors (displays message)
      // But if we want custom handling here we can add it
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>Login - {Settings.title}</title>
      </Helmet>

      <div className={styles.splitLayout}>
        {/* Left Panel - Branding */}
        <div className={styles.leftPanel}>
          {/* Decorative Circle */}
          <div style={{
            position: 'absolute',
            top: '-10%',
            left: '-10%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(40px)',
          }} />
          <div style={{
            position: 'absolute',
            bottom: '-10%',
            right: '-10%',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.1)',
            filter: 'blur(40px)',
          }} />

          <img src={SYSTEM_LOGO} alt="logo" className={styles.logo} style={{ filter: 'brightness(0) invert(1)' }} />
          <Title className={styles.brandTitle}>AI User Center</Title>
          <Text className={styles.brandSubtitle}>
            下一代智能知识库管理系统。<br />
            Efficient, Intelligent, Secure.
          </Text>
        </div>

        {/* Right Panel - Login Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formContainer}>
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <Title level={2}>欢迎回来</Title>
              <Text type="secondary">请输入您的账号密码以继续</Text>
            </div>

            <LoginForm
              contentStyle={{
                minWidth: 280,
                maxWidth: '100%',
              }}
              logo={null} // Logo shown in left panel or above text
              title={null} // Title shown above
              subTitle={null}
              initialValues={{
                autoLogin: true,
              }}
              actions={[
                // <div key="loginWith" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                //     <Text type="secondary" style={{ marginBottom: 8 }}>其他登录方式</Text>
                //     <div style={{ display: 'flex', gap: 16 }}>
                //         <AlipayCircleOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                //         <TaobaoCircleOutlined style={{ fontSize: 24, color: '#ff4d4f' }} />
                //         <WeiboCircleOutlined style={{ fontSize: 24, color: '#fa8c16' }} />
                //     </div>
                // </div>
              ]}
              onFinish={async (values) => {
                await handleSubmit(values as API.LoginParams);
              }}
            >
              <Tabs
                activeKey={type}
                onChange={setType}
                centered
                items={[
                  {
                    key: 'account',
                    label: '账号密码登录',
                  },
                ]}
              />

              {type === 'account' && (
                <>
                  <ProFormText
                    name="userAccount"
                    fieldProps={{
                      size: 'large',
                      prefix: <UserOutlined className={'prefixIcon'} />,
                    }}
                    placeholder={'请输入账号'}
                    rules={[
                      {
                        required: true,
                        message: '请输入账号!',
                      },
                      {
                        min: 4,
                        message: '账号长度不下于4位',
                      },
                    ]}
                  />
                  <ProFormText.Password
                    name="userPassword"
                    fieldProps={{
                      size: 'large',
                      prefix: <LockOutlined className={'prefixIcon'} />,
                    }}
                    placeholder={'请输入密码'}
                    rules={[
                      {
                        required: true,
                        message: '请输入密码！',
                      },
                      {
                        min: 8,
                        message: '密码长度不下于8位',
                      },
                    ]}
                  />
                </>
              )}

              <div
                style={{
                  marginBottom: 24,
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <ProFormCheckbox noStyle name="autoLogin">
                  自动登录
                </ProFormCheckbox>
                <Link to="/user/register">
                  注册新账号
                </Link>
              </div>
            </LoginForm>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
