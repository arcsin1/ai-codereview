# Docker 部署指南

本指南介绍如何使用 Docker Compose 快速部署 AI Code Review 系统。

## 前置要求

- Docker Engine >= 20.10
- Docker Compose >= 2.0
- Git

## 快速部署

### 1. 克隆项目

```bash
git clone <your-repo-url>
cd ai-code-review

## 直接启动部署
docker-compose up -d --build

## 访问

默认端口映射：

| 服务 | 端口 |
|------|------|
| 前端 | http://localhost:8081/ |
| 后端 API | http://localhost:3001/ |

### 2. 配置环境变量

项目使用 `ai-codereview-back/.env` 读取配置：

如需自定义密码等敏感配置或者开启日报功能，再编辑：

```bash
vim ai-codereview-back/.env
```

主要配置项：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| POSTGRES_PASSWORD | 数据库密码 | postgres |
| JWT_SECRET | JWT 密钥 | 123456789 |
| JWT_REFRESH_SECRET | 刷新令牌密钥 | 987654321 |

### 3. 启动服务

```bash
# 构建并启动所有服务
docker-compose up -d --build

# 查看启动状态
docker-compose ps
```

### 4. 验证部署

```bash
# 检查服务健康状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

访问地址：

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:8081 | Web 界面 |
| 后端 API | http://localhost:3001 | API 服务 |
| pgAdmin | http://localhost:5051 | 数据库管理（需单独启动）|

默认账号：`admin` / `123456`

## 管理命令

### 启动/停止服务

```bash
# 启动
docker-compose up -d

# 停止
docker-compose down

# 停止并删除数据卷（清空数据库）
docker-compose down -v
```

### 查看日志

```bash
# 查看所有日志
docker-compose logs -f

# 查看指定服务日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### 重启服务

```bash
# 重启单个服务
docker-compose restart backend
docker-compose restart frontend

# 重启所有服务
docker-compose restart
```

### 更新部署

```bash
# 拉取最新代码
git pull

# 重新构建并启动
docker-compose up -d --build
```

## 可选服务

### 启动 pgAdmin（数据库管理工具）

```bash
# 使用 profiles 启动
docker-compose --profile tools up -d pgadmin

# 访问 http://localhost:5051
# 邮箱: admin@ai-codereview.com (或 .env 中配置)
# 密码: admin (或 .env 中配置)
```

连接 pgAdmin：

1. 添加服务器
2. 主机: `postgres`
3. 端口: `5432`
4. 数据库: `ai_codereview`
5. 用户名: `postgres`
6. 密码: `postgres` (或 .env 中配置)

## 数据持久化

数据存储在 Docker volumes 中：

| volume | 说明 | 路径 |
|--------|------|------|
| postgres_data | PostgreSQL 数据 | /var/lib/postgresql/data |
| redis_data | Redis 数据 | /data |
| backend_logs | 后端日志 | /app/logs |

备份数据：

```bash
# 备份 PostgreSQL
docker-compose exec postgres pg_dump -U postgres ai_codereview > backup.sql

# 备份所有 volumes
docker-compose down
docker run --rm -v ai-codereview_postgres_data:/data -v $(pwd)/backup:/backup alpine tar czf /backup/postgres.tar.gz /data
```

## 故障排除

### 数据库连接失败

```bash
# 检查数据库状态
docker-compose exec postgres pg_isready -U postgres

# 查看数据库日志
docker-compose logs postgres
```

### 后端健康检查失败

```bash
# 检查后端日志
docker-compose logs backend

# 进入后端容器排查
docker-compose exec backend sh
```

### 清空数据库重新部署

```bash
# 停止服务并删除数据卷
docker-compose down -v

# 重新启动（会自动执行 init-db.sql 和 seed.sql）
docker-compose up -d
```

## 生产环境建议

1. **修改默认密码**
   ```env
   POSTGRES_PASSWORD=your-strong-password
   JWT_SECRET=your-very-long-secret-key
   ```

2. **启用 HTTPS**
   - 使用 nginx 反向代理
   - 或使用 Traefik/Caddy

3. **资源限制**
   - 已内置 CPU/内存限制
   - 根据服务器配置调整 `docker-compose.yml` 中的 `deploy.resources.limits`

4. **定期备份**
   ```bash
   # 添加定时任务
   crontab -e
   # 0 2 * * * docker-compose exec -T postgres pg_dump -U postgres ai_codereview > /backup/ai_codereview_$(date +\%Y\%m\%d).sql
   ```

5. **监控**
   - 使用 Docker Stats 监控资源使用
   ```bash
   docker stats
   ```
