import { request } from '@umijs/max';

/**
 * RAG 服务配置
 * 对应 Python 服务的地址
 */
const RAG_API_HOST = process.env.REACT_APP_RAG_API_HOST || 'http://localhost:8000';

// Token 缓存
let cachedToken: string | null = null;
let tokenExpireTime: number = 0;

/**
 * 获取 AI 服务的 Access Token (Hybrid Auth)
 * 流程: 前端 -> Spring Boot (Session验证) -> 返回 JWT -> 前端缓存
 */
async function getAIToken(): Promise<string> {
    const now = Date.now();
    // 如果缓存有效，直接返回
    if (cachedToken && tokenExpireTime > now) {
        return cachedToken;
    }

    try {
        // 向 Spring Boot 请求通行证
        // request 会自动带上当前域名的 Cookie (JSESSIONID)
        const res = await request<{ code: number, data: string }>('/api/auth/ai-token', {
            method: 'GET',
        });

        if (res.code === 0 && res.data) {
            cachedToken = res.data;
            // 缓存 9 分钟 (JWT 有效期 10 分钟)
            tokenExpireTime = now + 9 * 60 * 1000;
            return cachedToken;
        }
        throw new Error("获取 AI Token 失败");
    } catch (e) {
        console.error("无法获取 AI 服务权限", e);
        throw e;
    }
}

// 通用响应结构
export interface RAGResponse<T = any> {
    code: number;
    message: string;
    data: T;
}

// 健康检查
export async function healthCheck(): Promise<RAGResponse> {
    return fetch(`${RAG_API_HOST}/health`, { method: 'GET' })
        .then(res => res.json());
}

// 上传 PDF 文件
export async function uploadPDF(file: File): Promise<RAGResponse> {
    const token = await getAIToken();

    const formData = new FormData();
    formData.append('file', file);

    // 使用 fetch 直连 Python，避免 umi request 的额外处理干扰
    const response = await fetch(`${RAG_API_HOST}/api/v1/upload`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`
        },
        body: formData
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`上传失败: ${response.status} ${errorText}`);
    }

    return response.json();
}

/**
 * RAG 对话 (流式)
 * 前端直连 Python SSE 接口
 */
export async function chatStream(query: string): Promise<Response> {
    // 1. 获取通行证
    const token = await getAIToken();

    // 2. 发起直连请求
    const url = `${RAG_API_HOST}/api/v1/chat/stream`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}` // ✅ 核心鉴权逻辑
        },
        body: JSON.stringify({ query }),
    });

    // 处理 401: Token 可能非法或过期
    if (response.status === 401) {
        console.warn("AI Token 失效，尝试清除缓存...");
        cachedToken = null;
        tokenExpireTime = 0;
        throw new Error('鉴权失败，请重试');
    }

    if (!response.ok) {
        throw new Error(`AI 服务请求失败: ${response.status}`);
    }

    return response;
}
