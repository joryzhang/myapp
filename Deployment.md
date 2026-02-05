# 前端部署指南 (Docker)

## 1. 前置准备
确保你的后端服务已启动：
- Java Backend (User Center): `localhost:5782`
- Python RAG Backend: `localhost:8000`

## 2. 构建镜像
在 `myapp` 目录下打开终端，执行以下命令构建 Docker 镜像：

```bash
docker build -t user-center-frontend .
```

## 3. 运行容器
使用以下命令启动前端容器：

```bash
docker run -d -p 80:80 --name frontend user-center-frontend
```

**访问地址**: `http://localhost`

## 4. 关于反向代理 (Important)
为了让 Docker 容器内的 Nginx 能访问到你宿主机上的后端服务，我们在 `nginx.conf` 中使用了 `host.docker.internal`。
- **Windows/Mac**: Docker Desktop 默认支持此域名，无需额外配置。
- **Linux**: 如果你在 Linux 上运行，需要在 `docker run` 命令中添加 `--add-host host.docker.internal:host-gateway`。

## 5. 自定义配置
如果你的后端地址发生变化，请修改 `nginx.conf` 中的 `proxy_pass` 地址，然后重新构建镜像。

### API 映射说明
| 前端路径 | 后端服务 | 目标端口 |
|---------|---------|---------|
| `/api/user` | User Center | 5782 |
| `/api/auth` | User Center | 5782 |
| `/api/rag` | RAG Engine | 8000 |
