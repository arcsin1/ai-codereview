# AI Code Review - 部署指南

本文档整理了项目的所有部署说明，区分开发环境和正式（生产）环境部署。

---

## 目录

- [前置要求](#前置要求)
- [开发环境部署](#开发环境部署)
- [正式环境部署](#正式环境部署)
- [环境变量配置](#环境变量配置)
- [服务管理](#服务管理)
- [数据库管理](#数据库管理)
- [故障排除](#故障排除)
- [安全建议](#安全建议)
- [监控和维护](#监控和维护)

---

## 前置要求

### 通用要求

- Docker 20.10+
- Docker Compose 2.0+
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

### 开发环境额外要求

- Node.js 20+
- pnpm 包管理器

### 正式环境额外要求

- 域名（可选，用于 HTTPS 配置）
- SSL 证书（生产环境推荐）

---

## 开发环境部署

开发环境使用本地 Node.js 运行后端服务，通过 Docker 运行数据库和缓存服务。

### 快速开始

```bash
# 1. 启动数据库和 Redis 容器
./dev.sh

# 2. 安装依赖
pnpm install

# 4. 启动开发服务器
pnpm start:dev
```

### 手动启动（不使用脚本）

```bash
# 1. 启动数据库和 Redis
docker-compose -f docker-compose.dev.yml up -d

# 2. 等待数据库就绪
sleep 5

# 3. 安装依赖
pnpm install


# 5. 启动开发服务器
pnpm start:dev
```

### 开发环境服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| PostgreSQL | localhost:5432 | 数据库 |
| Redis | localhost:6379 | 缓存服务 |
| Redis Commander | http://localhost:8081 | Redis 管理界面（需手动启动） |
| Backend API | http://localhost:3000 | 后端服务 |

### 使用开发环境工具

启动 Redis Commander（可选）：

```bash
docker-compose -f docker-compose.dev.yml --profile tools up -d redis-commander
```

### 重置开发数据库

```bash
docker-compose -f docker-compose.dev.yml down -v
docker-compose -f docker-compose.dev.yml up -d
```

### 开发环境默认账户

- 用户名：`admin`
- 密码：`123456`
- 邮箱：`admin@example.com`

---


### 正式环境服务地址

| 服务 | 地址 | 说明 |
|------|------|------|
| Backend API | http://localhost:3000 | 后端服务 |
| API 文档 | http://localhost:3000/api/docs | Swagger 文档 |
| 健康检查 | http://localhost:3000/health | 健康检查端点 |
| pgAdmin | http://localhost:5050 | 数据库管理（需启用 profile） |

### 启用 pgAdmin

```bash
docker-compose --profile tools up -d pgadmin
```

### 正式环境默认账户

- 用户名：`admin`
- 密码：`123456`
- 邮箱：`admin@example.com`

⚠️ **生产环境请立即修改默认密码！**

---

## 环境变量配置

### .env 文件模板

```bash
# Database
POSTGRES_DB=ai_codereview
POSTGRES_USER=postgres
POSTGRES_PASSWORD=your_secure_password

# Redis
REDIS_HOST=redis
REDIS_PORT=6379

# JWT
JWT_SECRET=your_jwt_secret_key  # 使用强随机密钥
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# App
NODE_ENV=production  # production 或 development
PORT=3000

```

**部署愉快！** 🎉
