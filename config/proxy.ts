/**
 * @name 代理的配置
 * @see 在生产环境 代理是无法生效的，所以这里没有生产环境的配置
 * -------------------------------
 * The agent cannot take effect in the production environment
 * so there is no configuration of the production environment
 * For details, please see
 * https://pro.ant.design/docs/deploy
 *
 * @doc https://umijs.org/docs/guides/proxy
 */
export default {
  // 如果需要自定义本地开发服务器  请取消注释按需调整
  dev: {
    // Spring Boot 用户服务 - 端口 5782
    '/api/user': {
      target: 'http://localhost:5782',
      changeOrigin: true,
    },
    // Spring Boot 认证服务 - 端口 5782 (新增)
    '/api/auth': {
      target: 'http://localhost:5782',
      changeOrigin: true,
    },
    // Python RAG 服务 线上我们用nginx转发
    '/api/v1': {
      target: 'http://localhost:8000',
      changeOrigin: true,
      // SSE 流式响应配置 - 禁用缓冲
      onProxyReq: (proxyReq: any) => {
        proxyReq.setHeader('Connection', 'keep-alive');
      },
      onProxyRes: (proxyRes: any) => {
        proxyRes.headers['Cache-Control'] = 'no-cache, no-transform';
        proxyRes.headers['X-Accel-Buffering'] = 'no';
      },
    },
    // '/health':{ 仅测试，生产用nginx
    //   target: 'http://localhost:8000',
    //   changeOrigin: true,
    // }
  },

  /**
   * @name 详细的代理配置
   * @doc https://github.com/chimurai/http-proxy-middleware
   */
  test: {
    // localhost:8000/api/** -> https://preview.pro.ant.design/api/**
    '/api/': {
      target: 'https://proapi.azurewebsites.net',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
  pre: {
    '/api/': {
      target: 'your pre url',
      changeOrigin: true,
      pathRewrite: { '^': '' },
    },
  },
};
