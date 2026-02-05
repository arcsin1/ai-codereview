# AI Code Review

<div align="center">

![AI Code Review](https://img.shields.io/badge/AI%20Code%20Review-Intelligent-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![NestJS](https://img.shields.io/badge/NestJS-11.0-red)
![React](https://img.shields.io/badge/React-19.0-cyan)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

**智能代码审查系统 - 基于 AI 的自动化代码审查平台**

[English](./README_EN.md) | [功能特性](#功能特性) • [快速开始](#快速开始) • [架构设计](#架构设计) • [部署指南](#部署指南) • [贡献指南](#贡献指南)

</div>

---

## 📖 项目简介

<div align="center">

![AI Code Review Preview](./image.png)

</div>

AI Code Review 是一个基于人工智能的自动化代码审查系统，通过集成多种 LLM（大语言模型）和 Git 平台，实现智能化的代码质量分析和审查建议。系统能够自动监听 Git 仓库的代码提交事件，调用 AI 模型进行代码审查，并提供详细的审查报告和改进建议。

### 🎯 核心价值

- **智能化审查**：基于多种 AI 模型（OpenAI、Anthropic、DeepSeek、Ollama）进行代码分析
- **自动化流程**：通过 Webhook 自动触发代码审查，无需人工干预
- **多平台支持**：支持 GitHub、GitLab 等主流 Git 平台
- **灵活配置**：可自定义审查规则、AI 模型选择和通知方式
- **可视化报告**：提供直观的 Web 界面查看审查结果和统计数据

---

## ✨ 功能特性

### 🔧 核心功能

#### 1. **智能代码审查**
- 支持多种编程语言的代码分析
- 基于 AI 的代码质量评估和改进建议
- 可配置的审查规则和检查项
- 差异化审查（仅审查变更部分）

#### 2. **多平台集成**
- **GitHub**：支持 Push、Pull Request 事件
- **GitLab**：支持 Push、Merge Request 事件
- 统一的 Webhook 接口处理
- 安全的 Token 认证机制

#### 3. **AI 模型集成**
- **OpenAI**：GPT-4、GPT-3.5 系列模型
- **Anthropic**：Claude 系列模型
- **DeepSeek**：国产高性能模型
- **Ollama**：本地部署的开源模型
- 灵活的模型切换和配置

#### 4. **项目与配置管理**
- 多项目支持，独立配置
- Git 平台配置（Token、仓库地址）
- LLM 配置（API Key、模型参数）
- 审查规则自定义

#### 5. **通知系统**
- 邮件通知（SMTP）
- Webhook 通知
- 可配置的通知触发条件
- 通知模板自定义

#### 6. **报告统计**
- 实时审查结果查看
- 历史记录查询
- 统计数据可视化
- 日报自动生成

### 🛠️ 技术特性

#### 后端技术栈
- **框架**：NestJS 11.x（Node.js 企业级框架）
- **数据库**：PostgreSQL + TypeORM
- **缓存**：Redis（分布式缓存）
- **认证**：JWT + Passport
- **日志**：Winston（日志轮转、分级记录）
- **任务调度**：NestJS Schedule（定时任务）
- **限流**：NestJS Throttler（API 限流保护）
- **健康检查**：NestJS Terminus
- **API 文档**：Swagger/OpenAPI

#### 前端技术栈
- **框架**：React 19.x + TypeScript
- **构建工具**：Vite 7.x
- **UI 组件**：Ant Design 6.x
- **状态管理**：Zustand
- **路由**：React Router 7.x
- **国际化**：i18next
- **样式**：TailwindCSS + Less
- **HTTP 客户端**：Axios

#### DevOps & 部署
- **容器化**：Docker + Docker Compose
- **反向代理**：Nginx
- **数据库管理**：pgAdmin
- **缓存管理**：Redis Commander
- **日志管理**：Winston Daily Rotate File

---

## 🏗️ 架构设计

### 系统架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Code Review System                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐      ┌─────────────────┐                   │
│  │   Git Platform  │      │   Web Browser   │                   │
│  │  (GitHub/Lab)   │      │    (Admin UI)   │                   │
│  �────────┬─────────┘      └────────┬────────┘                   │
│           │                          │                            │
│           │ Webhook                  │ HTTP                      │
│           ▼                          ▼                            │
│  ┌─────────────────────────────────────────────────┐            │
│  │              Nginx Reverse Proxy                 │            │
│  │              (Port 80/443)                      │            │
│  └──────────────────────┬──────────────────────────┘            │
│                          │                                       │
│           ┌──────────────┴──────────────┐                       │
│           │                             │                       │
│           ▼                             ▼                       │
│  ┌─────────────────┐          ┌─────────────────┐              │
│  │  Frontend App   │          │   Backend API   │              │
│  │  (React + Vite) │          │   (NestJS)      │              │
│  │  Port: 8080     │          │   Port: 3000    │              │
│  └─────────────────┘          └────────┬────────┘              │
│                                         │                        │
│            ┌────────────────────────────┼────────────────┐      │
│            │                            │                │      │
│            ▼                            ▼                ▼      │
│  ┌──────────────┐          ┌──────────────┐  ┌──────────────┐ │
│  │ PostgreSQL   │          │    Redis     │  │  LLM APIs    │ │
│  │ Database     │          │    Cache     │  │  (External)  │ │
│  │ Port: 5432   │          │ Port: 6379   │  │              │ │
│  └──────────────┘          └──────────────┘  └──────────────┘ │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### 后端模块架构

```
src/
├── modules/              # 业务模块
│   ├── auth/            # 认证授权模块
│   │   ├── controllers/ # JWT 认证、登录注册
│   │   ├── services/    # 用户认证服务
│   │   ├── strategies/  # Passport 策略
│   │   └── guards/      # 路由守卫
│   │
│   ├── project/         # 项目管理模块
│   │   ├── controllers/ # 项目 CRUD 接口
│   │   ├── services/    # 项目业务逻辑
│   │   └── entities/    # 项目数据模型
│   │
│   ├── review/          # 代码审查模块
│   │   ├── controllers/ # 审查接口
│   │   ├── services/    # 审查核心逻辑
│   │   ├── entities/    # 审查记录模型
│   │   └── dto/         # 数据传输对象
│   │
│   ├── webhook/         # Webhook 处理模块
│   │   ├── controllers/ # Webhook 接收端点
│   │   ├── services/    # 事件处理服务
│   │   └── strategies/  # 平台策略（GitHub/GitLab）
│   │
│   ├── llm/            # LLM 集成模块
│   │   ├── controllers/ # LLM 配置接口
│   │   ├── services/    # AI 模型调用服务
│   │   ├── providers/   # LLM Provider（OpenAI/Anthropic等）
│   │   └── entities/    # LLM 配置模型
│   │
│   ├── git-config/     # Git 配置模块
│   │   ├── controllers/ # Git 配置接口
│   │   ├── services/    # Git 操作服务
│   │   └── entities/    # Git 配置模型
│   │
│   ├── notification/   # 通知模块
│   │   ├── controllers/ # 通知配置接口
│   │   ├── services/    # 邮件/Webhook 通知
│   │   └── templates/   # 通知模板
│   │
│   ├── report/         # 报告统计模块
│   │   ├── controllers/ # 报告查询接口
│   │   ├── services/    # 统计分析服务
│   │   └── entities/    # 报告数据模型
│   │
│   └── health/         # 健康检查模块
│       └── controllers/ # 系统健康状态
│
├── common/             # 公共模块
│   ├── decorators/     # 自定义装饰器
│   ├── filters/        # 异常过滤器
│   ├── guards/         # 守卫
│   ├── interceptors/   # 拦截器
│   ├── middlewares/    # 中间件（日志、认证）
│   ├── pipes/          # 管道
│   └── services/       # 公共服务（日志、缓存）
│
├── config/             # 配置文件
│   └── database.config.ts
│
└── main.ts            # 应用入口
```

### 前端页面架构

```
src/
├── pages/             # 页面组件
│   ├── login/        # 登录页
│   ├── dashboard/    # 仪表盘
│   ├── projects/     # 项目管理
│   ├── reviews/      # 审查记录
│   ├── llm-configs/  # LLM 配置
│   └── git-configs/  # Git 配置
│
├── components/        # 公共组件
│   ├── layout/       # 布局组件
│   │   ├── MainLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── modal/        # 模态框组件
│   └── drawer/       # 抽屉组件
│
├── store/            # 状态管理
│   ├── authStore.ts  # 认证状态
│   ├── projectStore.ts
│   └── reviewStore.ts
│
├── services/         # API 服务
│   ├── api.ts       # Axios 配置
│   ├── auth.ts      # 认证接口
│   ├── project.ts   # 项目接口
│   └── review.ts    # 审查接口
│
├── router/          # 路由配置
│   └── index.tsx
│
├── locales/         # 国际化
│   ├── zh/         # 中文
│   └── en/         # 英文
│
├── utils/           # 工具函数
│   └── storage.ts  # 本地存储
│
└── types/           # TypeScript 类型定义
```

### 核心业务流程

#### 1. Webhook 触发流程

```
Git Push Event
    │
    ▼
Git Platform (GitHub/GitLab)
    │
    │ Webhook POST
    ▼
Backend Webhook Controller
    │
    ├─> 验证 Webhook 签名
    ├─> 解析事件数据
    │
    ▼
Project Service (获取项目配置)
    │
    ├─> 查询项目信息
    ├─> 获取 Git 配置
    └─> 获取审查规则
    │
    ▼
Review Service (创建审查任务)
    │
    ├─> 获取代码差异
    ├─> 调用 LLM API
    │   │
    │   ├─> OpenAI Service
    │   ├─> Anthropic Service
    │   ├─> DeepSeek Service
    │   └─> Ollama Service
    │
    ├─> 解析 AI 响应
    └─> 保存审查结果
    │
    ▼
Notification Service
    │
    ├─> 邮件通知
    └─> Webhook 通知
```

#### 2. 用户操作流程

```
用户登录
    │
    ▼
Dashboard (查看概览)
    │
    ├─> 项目列表
    ├─> 审查统计
    └─> 最近活动
    │
    ▼
项目管理
    │
    ├─> 创建项目
    ├─> 配置 Git
    ├─> 配置 LLM
    └─> 设置审查规则
    │
    ▼
审查记录
    │
    ├─> 查看历史记录
    ├─> 查看审查详情
    └─> 查看统计数据
```

### 数据模型设计

```
users (用户表)
    ├── id (PK)
    ├── username
    ├── password
    ├── email
    └── created_at

projects (项目表)
    ├── id (PK)
    ├── name
    ├── description
    ├── git_config_id (FK)
    ├── llm_config_id (FK)
    ├── user_id (FK)
    └── created_at

git_configs (Git 配置表)
    ├── id (PK)
    ├── platform (GitHub/GitLab)
    ├── token
    ├── repository_url
    └── webhook_secret

llm_configs (LLM 配置表)
    ├── id (PK)
    ├── provider (OpenAI/Anthropic等)
    ├── api_key
    ├── model
    ├── temperature
    └── max_tokens

reviews (审查记录表)
    ├── id (PK)
    ├── project_id (FK)
    ├── commit_hash
    ├── branch
    ├── status (pending/completed/failed)
    ├── result (JSON)
    └── created_at

review_logs (审查日志表)
    ├── id (PK)
    ├── review_id (FK)
    ├── file_path
    ├── suggestion (JSON)
    └── severity

notifications (通知配置表)
    ├── id (PK)
    ├── project_id (FK)
    ├── type (email/webhook)
    ├── config (JSON)
    └── enabled

daily_reports (日报表)
    ├── id (PK)
    ├── project_id (FK)
    ├── date
    ├── stats (JSON)
    └── created_at
```

---

## 🚀 快速开始

### 环境要求

- **Node.js**: 20.x+
- **pnpm**: 8.x+
- **Docker**: 20.x+
- **Docker Compose**: 2.x+
- **PostgreSQL**: 15.x+
- **Redis**: 7.x+

### 一键启动（开发环境）

```bash
# 1. 克隆项目
git clone https://github.com/arcsin1/ai-codereview.git
cd ai-codereview

# 2. 启动开发环境(后端)
cd ai-codereview-back
./dev.sh

# 3. 安装依赖
pnpm install

# 5. 启动后端服务
pnpm start:dev

# 6. 启动开发环境(前端)
cd ai-codereview-front

pnpm install

pnpm start
```

### 本地开发 Webhook 配置（使用 ngrok）

在本地开发环境中，GitHub/GitLab 无法直接访问你本地的 Webhook 端点。可以使用 **ngrok** 创建一个公网隧道来接收 Webhook 事件。

#### 1. 安装 ngrok

```bash
# macOS
brew install ngrok

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# 或访问 https://ngrok.com/download 下载
```

#### 2. 启动 ngrok 隧道

```bash
# 启动后端服务（确保在 3001 端口）
cd ai-codereview-back
pnpm start:dev

# 在另一个终端窗口启动 ngrok
ngrok http 3001
```

启动后会看到类似输出：

```
ngrok by @inconshreveable                                                                                                                                                                                          (Ctrl+C to quit)

Session Status                online
Account                       your-name (Plan: Free)
Version                       3.x.x
Region                        United States (us)
Forwarding                    https://abc123.ngrok-free.app -> http://localhost:3001
Web Interface                 http://localhost:4040

Connections                   ttl     opn     rt1     rt5     p50     rt90
                              0       0       0.00    0.00    0.00    0.00
```

#### 3. 配置 GitHub/GitLab Webhook

复制 ngrok 生成的公网地址（如 `https://abc123.ngrok-free.app`），然后：

**GitHub Webhook 配置：**
- Payload URL: `https://abc123.ngrok-free.app/api/webhook/github`
- Secret: 自定义密钥（如 `my-webhook-secret`）

**GitLab Webhook 配置：**
- URL: `https://abc123.ngrok-free.app/api/webhook/gitlab`
- Secret token: 自定义密钥（如 `my-webhook-secret`）

#### 4. 在系统中添加本地 Git 配置

| 字段 | 说明 | 示例 |
|------|------|------|
| 平台 | 选择 Git 平台 | GitHub / GitLab |
| 名称 | 配置名称 | Local Development |
| URL | API 地址 | `https://api.github.com` 或 `https://gitlab.com/api/v4` |
| Access Token | 你的 Personal Access Token | `ghp_xxx...` 或 `glpat_xxx...` |
| 描述 | 配置说明 | 本地开发测试配置 |

#### 5. 验证 Webhook 接收

**查看 ngrok Web Interface：**
- 访问 http://localhost:4040 查看所有 HTTP 请求
- 可以看到 GitHub/GitLab 发送的 Webhook 请求详情
- 检查请求状态码（应该是 200 或 201）

**查看后端日志：**
```bash
# 在后端服务终端查看日志
# 应该能看到类似输出：
# [WebhookService] Received GitHub webhook event: pull_request
# [WebhookService] Webhook payload verified successfully
```

#### 6. 测试 Webhook

**GitHub 测试：**
1. 在 Webhook 配置页面，点击最近设置的 Webhook
2. 选择 "Redeliver" 重新发送 Ping 事件
3. 在 ngrok Web Interface 查看是否收到请求

**GitLab 测试：**
1. 在 Webhook 配置页面，点击 "Test" 下拉菜单
2. 选择测试事件类型（Push 或 Merge Request）
3. 查看系统日志确认接收成功

#### 7. ngrok 常用命令

```bash
# 启动 HTTP 隧道（默认端口 3001）
ngrok http 3001

# 指定子域名（需要付费账户）
ngrok http 3001 --domain=my-app.ngrok-free.app

# 查看所有隧道状态
ngrok status

# 重启 ngrok
ngrok restart
```

#### 8. 注意事项

⚠️ **重要提示：**
- ngrok 免费版的公网地址每次重启都会变化，需要更新 Webhook 配置
- ngrok 免费版有连接数和流量限制，适合开发测试
- 生产环境请使用真实的域名和 HTTPS 证书
- 确保 Webhook Secret 在 GitHub/GitLab 和系统配置中一致

🔧 **端口配置：**
- 后端服务默认端口：`3001`
- 前端服务默认端口：`8080`
- ngrok Web Interface：`http://localhost:4040`

---

### Docker 部署（生产环境）

```bash
# 1. 配置环境变量
cp ai-codereview-back/.env.example ai-codereview-back/.env
# 编辑 .env 文件，修改数据库密码、JWT 密钥等

# 2. 启动所有服务
docker-compose up -d --build

# 3. 查看服务状态
docker-compose ps

# 4. 查看日志
docker-compose logs -f
```

### 访问地址

| 服务 | 地址 | 说明 |
|------|------|------|
| 前端 | http://localhost:8080 | Web 界面 |
| 后端 API | http://localhost:3000 | API 服务 |
| API 文档 | http://localhost:3000/api/docs | Swagger 文档 |
| pgAdmin | http://localhost:5050 | 数据库管理 |

### 默认账户

- **用户名**: `admin`
- **密码**: `admin`

⚠️ **生产环境请立即修改默认密码！**

---

## 🔗 Git 平台配置指南

### GitHub 配置

#### 1. 创建 GitHub Personal Access Token

1. 登录 GitHub，进入 **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. 点击 **Generate new token (classic)**
3. 设置 Token 名称，如 `ai-codereview`
4. 选择所需权限：
   - `repo` (完整仓库访问权限)
   - `admin:repo_hook` (Webhook 管理权限)
   - `read:org` (如果需要访问组织仓库)
5. 点击 **Generate token**，复制生成的 Token（⚠️ 请妥善保管，仅显示一次）

#### 2. 配置 GitHub Webhook

1. 在 GitHub 仓库页面，进入 **Settings** → **Webhooks** → **Add webhook**
2. 配置以下参数：
   - **Payload URL**: `http://your-domain/api/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: 自定义密钥（用于验证 Webhook 请求）
   - **Events**: 选择以下事件
     - ✅ Pushes
     - ✅ Pull requests
3. 点击 **Add webhook**

#### 3. 在系统中添加 GitHub 配置

在系统的 **Git 配置** 页面添加：

| 字段 | 说明 | 示例 |
|------|------|------|
| 平台 | 选择 Git 平台 | GitHub |
| 名称 | 配置名称（便于识别） | My GitHub |
| URL | GitHub API 地址 | `https://api.github.com`<br>（企业版：`https://your-gitlab.company.com`） |
| Access Token | GitHub Personal Access Token | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| 描述 | 配置说明（可选） | 生产环境 GitHub 配置 |

#### 4. 支持的 GitHub 事件

- **Push 事件**: 代码推送到仓库时触发
- **Pull Request 事件**: 创建、更新、关闭 PR 时触发
  - `opened` - PR 打开
  - `synchronize` - PR 代码更新
  - `closed` - PR 关闭
  - `reopened` - PR 重新打开

#### 5. GitHub Enterprise 配置

如果使用 GitHub Enterprise：

- **URL**: `https://your-github-enterprise.com`
- 其他配置与 GitHub 公有云相同

---

### GitLab 配置

#### 1. 创建 GitLab Personal Access Token

1. 登录 GitLab，进入 **Preferences** → **Access Tokens**
2. 点击 **Add new token**
3. 设置 Token 名称，如 `ai-codereview`
4. 选择所需权限：
   - `api` (完整 API 访问权限)
   - `read_repository` (读取仓库权限)
   - `read_api` (读取 API 权限)
5. 设置过期时间（建议选择永不过期或设置较长时长）
6. 点击 **Create personal access token**，复制生成的 Token

#### 2. 配置 GitLab Webhook

1. 在 GitLab 项目页面，进入 **Settings** → **Webhooks**
2. 配置以下参数：
   - **URL**: `http://your-domain/api/webhook/gitlab`
   - **Secret token**: 自定义密钥（用于验证 Webhook 请求）
   - **Trigger**: 勾选以下事件
     - ✅ Push events
     - ✅ Merge request events
   - **Enable SSL verification**: 根据环境选择（生产环境建议开启）
3. 点击 **Add webhook**

#### 3. 在系统中添加 GitLab 配置

在系统的 **Git 配置** 页面添加：

| 字段 | 说明 | 示例 |
|------|------|------|
| 平台 | 选择 Git 平台 | GitLab |
| 名称 | 配置名称（便于识别） | My GitLab |
| URL | GitLab API 地址 | `https://gitlab.com`<br>（企业版：`https://your-gitlab.company.com`） |
| Access Token | GitLab Personal Access Token | `glpat-xxxxxxxxxxxxxxxxxxxx` |
| 描述 | 配置说明（可选） | 生产环境 GitLab 配置 |

#### 4. 支持的 GitLab 事件

- **Push 事件**: 代码推送到分支时触发
- **Merge Request 事件**: 创建、更新、合并 MR 时触发
  - `open` - MR 打开
  - `update` - MR 更新
  - `merge` - MR 合并
  - `close` - MR 关闭
  - `reopen` - MR 重新打开

#### 5. GitLab Self-Managed 配置

如果使用自托管的 GitLab：

- **URL**: `https://your-gitlab.company.com`
- 确保服务器能访问 GitLab 实例
- 检查防火墙和网络策略

---

### 🔒 安全建议

1. **Token 安全**
   - ⚠️ 不要将 Token 提交到代码仓库
   - ⚠️ 定期轮换 Access Token
   - ⚠️ 为不同环境使用不同的 Token

2. **Webhook 验证**
   - ✅ 始终配置 Webhook Secret
   - ✅ 使用 HTTPS 传输（生产环境）
   - ✅ 验证 Webhook 签名

3. **权限最小化**
   - ✅ 仅授予必要的 API 权限
   - ✅ 定期审查 Token 使用情况
   - ✅ 为不同项目使用独立的 Token

4. **网络配置**
   - ✅ 限制 Webhook 端点的访问来源
   - ✅ 配置防火墙规则
   - ✅ 使用反向代理（Nginx）处理 SSL

---

### 🧪 Webhook 测试

#### GitHub Webhook 测试

1. 在 Webhook 配置页面，找到最近设置的 Webhook
2. 点击 **Redeliver** 重新发送测试事件
3. 在系统日志中查看是否成功接收

#### GitLab Webhook 测试

1. 在 Webhook 配置页面，点击 **Test** 下拉菜单
2. 选择测试事件类型（Push 或 Merge Request）
3. 查看系统日志确认接收成功

---

### ❗ 常见问题

**Q: Webhook 发送失败，提示签名错误？**

A: 请检查系统中的 Git 配置中 Webhook Secret 是否与 GitHub/GitLab 中配置的 Secret 完全一致。

**Q: 无法获取代码差异？**

A: 检查以下几点：
- Access Token 是否有足够的权限
- 仓库是否为私有仓库且 Token 有访问权限
- API URL 是否正确（特别是企业版/自托管版本）

**Q: 企业版 GitLab/GitHub 如何配置？**

A: 只需修改 API URL：
- GitHub Enterprise: `https://your-domain.com`
- GitLab Self-Managed: `https://your-domain.com`

**Q: 支持哪些代码托管平台？**

A: 目前支持：
- GitHub (github.com)
- GitLab (gitlab.com)
- Gitea (自托管实例)

---

## 📚 部署指南

### 详细部署文档

- [Docker 部署指南](./docker-deploy.md)
- [后端部署指南](./ai-codereview-back/deploy.md)

### 配置说明

主要环境变量：

```bash
# Database
# Application
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_DATABASE=ai_codereview

# JWT
JWT_SECRET=123456789
JWT_EXPIRES_IN=7d
JWT_REFRESH_SECRET=987654321

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Daily Report
DAILY_REPORT_ENABLED=false
DAILY_REPORT_CRON=0 18 * * *




```

---

## 📄 许可证

本项目基于 [MIT License](./LICENSE) 开源。

---

## 🙏 致谢

感谢以下开源项目：

- [NestJS](https://nestjs.com/) - Node.js 企业级框架
- [React](https://react.dev/) - 用户界面库
- [Ant Design](https://ant.design/) - React UI 组件库
- [TypeORM](https://typeorm.io/) - ORM 框架
- [LangChain](https://js.langchain.com/) - LLM 应用框架

---

## 📮 联系方式

- **作者**: arcsin1
- **项目地址**: [https://github.com/arcsin1/ai-codereview](https://github.com/arcsin1/ai-codereview)
- **问题反馈**: [GitHub Issues](https://github.com/arcsin1/ai-codereview/issues)

---

<div align="center">

**如果这个项目对你有帮助，请给一个 ⭐️ Star！**

Made with ❤️ by [arcsin1](https://github.com/arcsin1)

</div>
