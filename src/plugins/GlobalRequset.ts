/**
 * request 网络请求工具
 * 更详细的 api 文档: https://github.com/umijs/umi-request
 */
import {extend} from 'umi-request';
import {history} from "@@/core/history";


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
  if (res.code === 40002 || res.code === 40001) {
    const urlParams = new URL(window.location.href).searchParams;
    history.push(urlParams.get('redirect') || '/user/login');
    // history.push({
    //   pathname: '/user/login',
    //   search: stringify({
    //     redirect: location.pathname,
    //   }),
    // });
  }else {
    return res.data;
  }
  return res.data;
});

export default request;
