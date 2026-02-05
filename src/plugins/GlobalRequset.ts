/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import { extend } from 'umi-request';
import { history } from "@@/core/history";
import { message } from 'antd'; // 引入消息组件

const request = extend({
  // credentials: 'include', // 默认请求是否带上cookie
  // requestType: 'form',
});

// /**
//  * 所以请求拦截器
//  */
// request.interceptors.request.use((url, options): any => {
//
//
//   return {
//     url,
//     options: {
//       ...options,
//       headers: {
//       },
//     },
//   };
// });

/**
 * 所有响应拦截器
 */
request.interceptors.response.use(async (response): Promise<any> => {

  const res = await response.clone().json();
  if (res.code === 0) {
    return res.data;
  }
  if (res.code === 40002) {
    const urlParams = new URL(window.location.href).searchParams;
    history.push(urlParams.get('redirect') || '/user/login');
  }
  else if (res.code === 40001){
    const urlParams = new URL(window.location.href).searchParams;
    history.push(urlParams.get('redirect') || '/user/login');
    message.error('用户不存在,请重试');
  }
  else {
    // 统一提示错误信息
    // 优先显示后端返回的 description (通常更详细)，其次 message
    message.error(res.description || res.message || '请求失败');
    return res.data;
  }
  return res.data;
});

export default request;
