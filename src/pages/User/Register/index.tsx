import { SYSTEM_LOGO } from '@/constant';
import { register } from '@/services/ant-design-pro/api';
import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Helmet, history, Link } from '@umijs/max';
import { message, Tabs, Typography } from 'antd';
import { createStyles } from 'antd-style';
import React, { useState } from 'react';
import Settings from '../../../../config/defaultSettings';

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
      maxWidth: '100%',
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
    },
  };
});

const Register: React.FC = () => {
  const [type, setType] = useState<string>('account');
  const { styles } = useStyles();

  const handleSubmit = async (values: API.RegisterParams) => {
    const { userPassword, checkPassword } = values;
    if (userPassword !== checkPassword) {
      message.error('两次输入的密码不一致');
      return;
    }

    try {
      const id = await register(values);
      if (id) {
        message.success('注册成功！');
        history.push('/user/login');
        return;
      }
    } catch (error) {
      // Global interceptor handles this
    }
  };

  return (
    <div className={styles.container}>
      <Helmet>
        <title>注册 - {Settings.title}</title>
      </Helmet>

      <div className={styles.splitLayout}>
        {/* Left Panel - Branding (Consistent with Login) */}
        <div className={styles.leftPanel}>
          <div
            style={{
              position: 'absolute',
              top: '-10%',
              left: '-10%',
              width: '400px',
              height: '400px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              filter: 'blur(40px)',
            }}
          />
          <div
            style={{
              position: 'absolute',
              bottom: '-10%',
              right: '-10%',
              width: '300px',
              height: '300px',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.1)',
              filter: 'blur(40px)',
            }}
          />

          <img
            src={SYSTEM_LOGO}
            alt="logo"
            className={styles.logo}
            style={{ filter: 'brightness(0) invert(1)' }}
          />
          <Title className={styles.brandTitle}>Join Us</Title>
          <Text className={styles.brandSubtitle}>
            创建您的账号，开启智能之旅。
            <br />
            Create your account today.
          </Text>
        </div>

        {/* Right Panel - Register Form */}
        <div className={styles.rightPanel}>
          <div className={styles.formContainer}>
            <div style={{ marginBottom: 32, textAlign: 'center' }}>
              <Title level={2}>创建账号</Title>
              <Text type="secondary">请填写以下信息以完成注册</Text>
            </div>

            <LoginForm
              submitter={{
                searchConfig: {
                  submitText: '注册',
                },
              }}
              contentStyle={{
                minWidth: 280,
                maxWidth: '100%',
              }}
              logo={null}
              title={null}
              subTitle={null}
              initialValues={{
                autoLogin: true,
              }}
              onFinish={async (values) => {
                await handleSubmit(values as API.RegisterParams);
              }}
            >
              <Tabs
                activeKey={type}
                onChange={setType}
                centered
                items={[
                  {
                    key: 'account',
                    label: '账号密码注册',
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
                  <ProFormText.Password
                    name="checkPassword"
                    fieldProps={{
                      size: 'large',
                      prefix: <LockOutlined className={'prefixIcon'} />,
                    }}
                    placeholder={'请确认密码'}
                    rules={[
                      {
                        required: true,
                        message: '请再次输入密码！',
                      },
                      {
                        min: 8,
                        message: '密码长度不下于8位',
                      },
                    ]}
                  />
                </>
              )}

              <div style={{ marginBottom: 24, textAlign: 'center' }}>
                <Link to="/user/login">已有账号？立即登录</Link>
              </div>
            </LoginForm>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
