# AI Code Review

<div align="center">

![AI Code Review](https://img.shields.io/badge/AI%20Code%20Review-Intelligent-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![NestJS](https://img.shields.io/badge/NestJS-11.0-red)
![React](https://img.shields.io/badge/React-19.0-cyan)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)

**Intelligent Code Review System - AI-Powered Automated Code Review Platform**

[中文](./README.md) | [Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Deployment](#-deployment) • [Contributing](#-contributing)

</div>

---

## 📖 Project Overview

<div align="center">

![AI Code Review Preview](./imgs/image.png)

</div>

AI Code Review is an artificial intelligence-based automated code review system that integrates multiple LLMs (Large Language Models) and Git platforms to achieve intelligent code quality analysis and review suggestions. The system can automatically monitor code commit events from Git repositories, invoke AI models for code review, and provide detailed review reports and improvement suggestions.

### 🎯 Core Values

- **Intelligent Review**: Code analysis based on multiple AI models (OpenAI, Anthropic, DeepSeek, Ollama)
- **Automated Workflow**: Automatically trigger code reviews through Webhooks without manual intervention
- **Multi-Platform Support**: Support for mainstream Git platforms like GitHub, GitLab
- **Flexible Configuration**: Customizable review rules, AI model selection, and notification methods
- **Visualized Reports**: Intuitive Web interface for reviewing results and statistics

---

## ✨ Features

### 🔧 Core Features

#### 1. **Intelligent Code Review**
- Multi-programming language code analysis support
- AI-based code quality assessment and improvement suggestions
- Configurable review rules and check items
- Differential review (only review changed parts)

#### 2. **Multi-Platform Integration**
- **GitHub**: Support for Push, Pull Request events
- **GitLab**: Support for Push, Merge Request events
- Unified Webhook interface handling
- Secure Token authentication mechanism

#### 3. **AI Model Integration**
- **OpenAI**: GPT-4, GPT-3.5 series models
- **Anthropic**: Claude series models
- **DeepSeek**: Chinese high-performance model
- **Ollama**: Locally deployed open-source models
- Flexible model switching and configuration

#### 4. **Project & Configuration Management**
- Multi-project support with independent configuration
- Git platform configuration (Token, repository URL)
- LLM configuration (API Key, model parameters)
- Customizable review rules

#### 5. **Notification System**
- Email notifications (SMTP)
- Webhook notifications
- Configurable notification trigger conditions
- Customizable notification templates

#### 6. **Reports & Statistics**
- Real-time review result viewing
- Historical record queries
- Statistical data visualization
- Automatic daily report generation

### 🛠️ Technical Features

#### Backend Technology Stack
- **Framework**: NestJS 11.x (Node.js enterprise framework)
- **Database**: PostgreSQL + TypeORM
- **Cache**: Redis (distributed cache)
- **Authentication**: JWT + Passport
- **Logging**: Winston (log rotation, hierarchical recording)
- **Task Scheduling**: NestJS Schedule (scheduled tasks)
- **Rate Limiting**: NestJS Throttler (API rate limiting protection)
- **Health Check**: NestJS Terminus
- **API Documentation**: Swagger/OpenAPI

#### Frontend Technology Stack
- **Framework**: React 19.x + TypeScript
- **Build Tool**: Vite 7.x
- **UI Components**: Ant Design 6.x
- **State Management**: Zustand
- **Routing**: React Router 7.x
- **Internationalization**: i18next
- **Styling**: TailwindCSS + Less
- **HTTP Client**: Axios

#### DevOps & Deployment
- **Containerization**: Docker + Docker Compose
- **Reverse Proxy**: Nginx
- **Database Management**: pgAdmin
- **Cache Management**: Redis Commander
- **Log Management**: Winston Daily Rotate File

---

## 🏗️ Architecture Design

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         AI Code Review System                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                   │
│  ┌─────────────────┐      ┌─────────────────┐                   │
│  │   Git Platform  │      │   Web Browser   │                   │
│  │  (GitHub/Lab)   │      │    (Admin UI)   │                   │
│  └────────┬─────────┘      └────────┬────────┘                   │
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

### Backend Module Architecture

```
src/
├── modules/              # Business modules
│   ├── auth/            # Authentication & authorization module
│   │   ├── controllers/ # JWT authentication, login & registration
│   │   ├── services/    # User authentication service
│   │   ├── strategies/  # Passport strategies
│   │   └── guards/      # Route guards
│   │
│   ├── project/         # Project management module
│   │   ├── controllers/ # Project CRUD interfaces
│   │   ├── services/    # Project business logic
│   │   └── entities/    # Project data models
│   │
│   ├── review/          # Code review module
│   │   ├── controllers/ # Review interfaces
│   │   ├── services/    # Review core logic
│   │   ├── entities/    # Review record models
│   │   └── dto/         # Data transfer objects
│   │
│   ├── webhook/         # Webhook handling module
│   │   ├── controllers/ # Webhook receiving endpoints
│   │   ├── services/    # Event handling services
│   │   └── strategies/  # Platform strategies (GitHub/GitLab)
│   │
│   ├── llm/            # LLM integration module
│   │   ├── controllers/ # LLM configuration interfaces
│   │   ├── services/    # AI model invocation services
│   │   ├── providers/   # LLM Providers (OpenAI/Anthropic, etc.)
│   │   └── entities/    # LLM configuration models
│   │
│   ├── git-config/     # Git configuration module
│   │   ├── controllers/ # Git configuration interfaces
│   │   ├── services/    # Git operation services
│   │   └── entities/    # Git configuration models
│   │
│   ├── notification/   # Notification module
│   │   ├── controllers/ # Notification configuration interfaces
│   │   ├── services/    # Email/Webhook notifications
│   │   └── templates/   # Notification templates
│   │
│   ├── report/         # Report & statistics module
│   │   ├── controllers/ # Report query interfaces
│   │   ├── services/    # Statistical analysis services
│   │   └── entities/    # Report data models
│   │
│   └── health/         # Health check module
│       └── controllers/ # System health status
│
├── common/             # Common modules
│   ├── decorators/     # Custom decorators
│   ├── filters/        # Exception filters
│   ├── guards/         # Guards
│   ├── interceptors/   # Interceptors
│   ├── middlewares/    # Middlewares (logging, authentication)
│   ├── pipes/          # Pipes
│   └── services/       # Common services (logging, cache)
│
├── config/             # Configuration files
│   └── database.config.ts
│
└── main.ts            # Application entry point
```

### Frontend Page Architecture

```
src/
├── pages/             # Page components
│   ├── login/        # Login page
│   ├── dashboard/    # Dashboard
│   ├── projects/     # Project management
│   ├── reviews/      # Review records
│   ├── llm-configs/  # LLM configuration
│   └── git-configs/  # Git configuration
│
├── components/        # Common components
│   ├── layout/       # Layout components
│   │   ├── MainLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── modal/        # Modal components
│   └── drawer/       # Drawer components
│
├── store/            # State management
│   ├── authStore.ts  # Authentication state
│   ├── projectStore.ts
│   └── reviewStore.ts
│
├── services/         # API services
│   ├── api.ts       # Axios configuration
│   ├── auth.ts      # Authentication interfaces
│   ├── project.ts   # Project interfaces
│   └── review.ts    # Review interfaces
│
├── router/          # Router configuration
│   └── index.tsx
│
├── locales/         # Internationalization
│   ├── zh/         # Chinese
│   └── en/         # English
│
├── utils/           # Utility functions
│   └── storage.ts  # Local storage
│
└── types/           # TypeScript type definitions
```

### Core Business Flows

#### 1. Webhook Trigger Flow

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
    ├─> Verify Webhook signature
    ├─> Parse event data
    │
    ▼
Project Service (Get project configuration)
    │
    ├─> Query project information
    ├─> Get Git configuration
    └─> Get review rules
    │
    ▼
Review Service (Create review task)
    │
    ├─> Get code diff
    ├─> Call LLM API
    │   │
    │   ├─> OpenAI Service
    │   ├─> Anthropic Service
    │   ├─> DeepSeek Service
    │   └─> Ollama Service
    │
    ├─> Parse AI response
    └─> Save review results
    │
    ▼
Notification Service
    │
    ├─> Email notification
    └─> Webhook notification
```

#### 2. User Operation Flow

```
User Login
    │
    ▼
Dashboard (View overview)
    │
    ├─> Project list
    ├─> Review statistics
    └─> Recent activities
    │
    ▼
Project Management
    │
    ├─> Create project
    ├─> Configure Git
    ├─> Configure LLM
    └─> Set review rules
    │
    ▼
Review Records
    │
    ├─> View history
    ├─> View review details
    └─> View statistics
```

### Data Model Design

```
users (User table)
    ├── id (PK)
    ├── username
    ├── password
    ├── email
    └── created_at

projects (Project table)
    ├── id (PK)
    ├── name
    ├── description
    ├── git_config_id (FK)
    ├── llm_config_id (FK)
    ├── user_id (FK)
    └── created_at

git_configs (Git configuration table)
    ├── id (PK)
    ├── platform (GitHub/GitLab)
    ├── token
    ├── repository_url
    └── webhook_secret

llm_configs (LLM configuration table)
    ├── id (PK)
    ├── provider (OpenAI/Anthropic/etc.)
    ├── api_key
    ├── model
    ├── temperature
    └── max_tokens

reviews (Review records table)
    ├── id (PK)
    ├── project_id (FK)
    ├── commit_hash
    ├── branch
    ├── status (pending/completed/failed)
    ├── result (JSON)
    └── created_at

review_logs (Review logs table)
    ├── id (PK)
    ├── review_id (FK)
    ├── file_path
    ├── suggestion (JSON)
    └── severity

notifications (Notification configuration table)
    ├── id (PK)
    ├── project_id (FK)
    ├── type (email/webhook)
    ├── config (JSON)
    └── enabled

daily_reports (Daily report table)
    ├── id (PK)
    ├── project_id (FK)
    ├── date
    ├── stats (JSON)
    └── created_at
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 20.x+
- **pnpm**: 8.x+
- **Docker**: 20.x+
- **Docker Compose**: 2.x+
- **PostgreSQL**: 15.x+
- **Redis**: 7.x+

### One-Click Start (Development Environment)

```bash
# 1. Clone the project
git clone https://github.com/arcsin1/ai-codereview.git
cd ai-codereview

# 2. Start development environment (backend)
cd ai-codereview-back
./dev.sh

# 3. Install dependencies
pnpm install

# 4. Start backend service
pnpm start:dev

# 5. Start development environment (frontend)
cd ai-codereview-front

pnpm install

pnpm start
```

### Local Development Webhook Configuration (Using ngrok)

In local development environment, GitHub/GitLab cannot directly access your local Webhook endpoint. You can use **ngrok** to create a public tunnel for receiving Webhook events.

#### 1. Install ngrok

```bash
# macOS
brew install ngrok

# Linux
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok

# Or visit https://ngrok.com/download to download
```

#### 2. Start ngrok Tunnel

```bash
# Start backend service (ensure it's on port 3001)
cd ai-codereview-back
pnpm start:dev

# Start ngrok in another terminal window
ngrok http 3001
```

You will see output similar to:

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

#### 3. Configure GitHub/GitLab Webhook

Copy the public URL generated by ngrok (e.g., `https://abc123.ngrok-free.app`), then:

**GitHub Webhook Configuration:**
- Payload URL: `https://abc123.ngrok-free.app/api/webhook/github`
- Secret: Custom secret key (e.g., `my-webhook-secret`)

**GitLab Webhook Configuration:**
- URL: `https://abc123.ngrok-free.app/api/webhook/gitlab`
- Secret token: Custom secret key (e.g., `my-webhook-secret`)

#### 4. Add Local Git Configuration in System

| Field | Description | Example |
|------|-------------|---------|
| Platform | Select Git platform | GitHub / GitLab |
| Name | Configuration name | Local Development |
| URL | API address | `https://api.github.com` or `https://gitlab.com/api/v4` |
| Access Token | Your Personal Access Token | `ghp_xxx...` or `glpat_xxx...` |
| Description | Configuration notes | Local development test configuration |

#### 5. Verify Webhook Reception

**View ngrok Web Interface:**
- Visit http://localhost:4040 to view all HTTP requests
- You can see details of Webhook requests sent by GitHub/GitLab
- Check the response status code (should be 200 or 201)

**View Backend Logs:**
```bash
# View logs in the backend service terminal
# You should see output similar to:
# [WebhookService] Received GitHub webhook event: pull_request
# [WebhookService] Webhook payload verified successfully
```

#### 6. Test Webhook

**GitHub Testing:**
1. On the Webhook configuration page, find your recently set up Webhook
2. Click "Redeliver" to resend a test event
3. Check ngrok Web Interface to see if the request was received

**GitLab Testing:**
1. On the Webhook configuration page, click the "Test" dropdown menu
2. Select test event type (Push or Merge Request)
3. Check system logs to confirm successful reception

#### 7. Common ngrok Commands

```bash
# Start HTTP tunnel (default port 3001)
ngrok http 3001

# Specify subdomain (requires paid account)
ngrok http 3001 --domain=my-app.ngrok-free.app

# View all tunnel statuses
ngrok status

# Restart ngrok
ngrok restart
```

#### 8. Important Notes

⚠️ **Important:**
- ngrok free version's public URL changes every restart, requiring Webhook configuration updates
- ngrok free version has connection and traffic limits, suitable for development testing
- Production environment should use real domain and HTTPS certificates
- Ensure Webhook Secret is consistent between GitHub/GitLab and system configuration

🔧 **Port Configuration:**
- Backend service default port: `3001`
- Frontend service default port: `8080`
- ngrok Web Interface: `http://localhost:4040`

---

### Docker Deployment (Production Environment)

```bash
# 1. Configure environment variables
cp ai-codereview-back/.env.example ai-codereview-back/.env
# Edit .env file, modify database password, JWT secret, etc.

# 2. Start all services
docker-compose up -d --build

# 3. Check service status
docker-compose ps

# 4. View logs
docker-compose logs -f
```

### Access Addresses

| Service | Address | Description |
|---------|---------|-------------|
| Frontend | http://localhost:8080 | Web Interface |
| Backend API | http://localhost:3000 | API Service |
| API Documentation | http://localhost:3000/api/docs | Swagger Documentation |
| pgAdmin | http://localhost:5050 | Database Management |

### Default Account

- **Username**: `admin`
- **Password**: `admin`

⚠️ **Please change the default password immediately in production environment!**

---

## 🔗 Git Platform Configuration Guide

### GitHub Configuration

#### 1. Create GitHub Personal Access Token

1. Log in to GitHub, go to **Settings** → **Developer settings** → **Personal access tokens** → **Tokens (classic)**
2. Click **Generate new token (classic)**
3. Set Token name, e.g., `ai-codereview`
4. Select required permissions:
   - `repo` (Full repository access)
   - `admin:repo_hook` (Webhook management)
   - `read:org` (If accessing organization repositories)
5. Click **Generate token** and copy the generated Token (⚠️ Keep it safe, shown only once)

#### 2. Configure GitHub Webhook

1. On GitHub repository page, go to **Settings** → **Webhooks** → **Add webhook**
2. Configure the following parameters:
   - **Payload URL**: `http://your-domain/api/webhook/github`
   - **Content type**: `application/json`
   - **Secret**: Custom secret key (for verifying Webhook requests)
   - **Events**: Select the following events
     - ✅ Pushes
     - ✅ Pull requests
3. Click **Add webhook**

#### 3. Add GitHub Configuration in System

Add in the system's **Git Configuration** page:

| Field | Description | Example |
|------|-------------|---------|
| Platform | Select Git platform | GitHub |
| Name | Configuration name (for easy identification) | My GitHub |
| URL | GitHub API address | `https://api.github.com`<br>(Enterprise: `https://your-github.company.com`) |
| Access Token | GitHub Personal Access Token | `ghp_xxxxxxxxxxxxxxxxxxxx` |
| Description | Configuration description (optional) | Production GitHub configuration |

#### 4. Supported GitHub Events

- **Push Event**: Triggered when code is pushed to repository
- **Pull Request Event**: Triggered when PR is created, updated, or closed
  - `opened` - PR opened
  - `synchronize` - PR code updated
  - `closed` - PR closed
  - `reopened` - PR reopened

#### 5. GitHub Enterprise Configuration

If using GitHub Enterprise:

- **URL**: `https://your-github-enterprise.com`
- Other configuration same as GitHub public cloud

---

### GitLab Configuration

#### 1. Create GitLab Personal Access Token

1. Log in to GitLab, go to **Preferences** → **Access Tokens**
2. Click **Add new token**
3. Set Token name, e.g., `ai-codereview`
4. Select required permissions:
   - `api` (Full API access)
   - `read_repository` (Repository read access)
   - `read_api` (API read access)
5. Set expiration time (recommend no expiration or long duration)
6. Click **Create personal access token** and copy the generated Token

#### 2. Configure GitLab Webhook

1. On GitLab project page, go to **Settings** → **Webhooks**
2. Configure the following parameters:
   - **URL**: `http://your-domain/api/webhook/gitlab`
   - **Secret token**: Custom secret key (for verifying Webhook requests)
   - **Trigger**: Check the following events
     - ✅ Push events
     - ✅ Merge request events
   - **Enable SSL verification**: Choose based on environment (recommended for production)
3. Click **Add webhook**

#### 3. Add GitLab Configuration in System

Add in the system's **Git Configuration** page:

| Field | Description | Example |
|------|-------------|---------|
| Platform | Select Git platform | GitLab |
| Name | Configuration name (for easy identification) | My GitLab |
| URL | GitLab API address | `https://gitlab.com`<br>(Enterprise: `https://your-gitlab.company.com`) |
| Access Token | GitLab Personal Access Token | `glpat-xxxxxxxxxxxxxxxxxxxx` |
| Description | Configuration description (optional) | Production GitLab configuration |

#### 4. Supported GitLab Events

- **Push Event**: Triggered when code is pushed to branch
- **Merge Request Event**: Triggered when MR is created, updated, or merged
  - `open` - MR opened
  - `update` - MR updated
  - `merge` - MR merged
  - `close` - MR closed
  - `reopen` - MR reopened

#### 5. GitLab Self-Managed Configuration

If using self-hosted GitLab:

- **URL**: `https://your-gitlab.company.com`
- Ensure server can access GitLab instance
- Check firewall and network policies

---

### 🔒 Security Recommendations

1. **Token Security**
   - ⚠️ Don't commit tokens to code repository
   - ⚠️ Rotate Access Tokens regularly
   - ⚠️ Use different tokens for different environments

2. **Webhook Verification**
   - ✅ Always configure Webhook Secret
   - ✅ Use HTTPS transmission (production environment)
   - ✅ Verify Webhook signatures

3. **Minimal Permissions**
   - ✅ Grant only necessary API permissions
   - ✅ Regularly review Token usage
   - ✅ Use independent tokens for different projects

4. **Network Configuration**
   - ✅ Restrict Webhook endpoint access sources
   - ✅ Configure firewall rules
   - ✅ Use reverse proxy (Nginx) for SSL

---

### 🧪 Webhook Testing

#### GitHub Webhook Testing

1. On the Webhook configuration page, find your recently set up Webhook
2. Click **Redeliver** to resend a test event
3. Check system logs for successful reception

#### GitLab Webhook Testing

1. On the Webhook configuration page, click the **Test** dropdown menu
2. Select test event type (Push or Merge Request)
3. Check system logs to confirm successful reception

---

### ❗ FAQ

**Q: Webhook sending failed, signature error?**

A: Please check if the Webhook Secret in your Git configuration matches exactly with the Secret configured in GitHub/GitLab.

**Q: Unable to get code diff?**

A: Check the following:
- Does Access Token have sufficient permissions?
- Is repository private and Token has access permissions?
- Is API URL correct (especially for Enterprise/Self-Hosted versions)?

**Q: How to configure GitLab/GitHub Enterprise?**

A: Just modify the API URL:
- GitHub Enterprise: `https://your-domain.com`
- GitLab Self-Managed: `https://your-domain.com`

**Q: Which code hosting platforms are supported?**

A: Currently supported:
- GitHub (github.com)
- GitLab (gitlab.com)
- Gitea (Self-hosted instances)

---

## 📚 Deployment Guide

### Detailed Deployment Documentation

- [Docker Deployment Guide](./docker-deploy.md)
- [Backend Deployment Guide](./ai-codereview-back/deploy.md)

### Configuration Description

Main environment variables:

```bash
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

## 🤝 Contributing

Contributions are welcome! Feel free to report bugs or suggest new features!

### Development Workflow

1. Fork this repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Create a Pull Request

### Code Standards

- **Backend**: Follow NestJS style guide, use ESLint + Prettier
- **Frontend**: Follow React style guide, use ESLint + Prettier
- **Commit Messages**: Follow Conventional Commits specification

---

## 📄 License

This project is open source under [MIT License](./LICENSE).

---

## 🙏 Acknowledgments

Thanks to the following open source projects:

- [NestJS](https://nestjs.com/) - Node.js enterprise framework
- [React](https://react.dev/) - User interface library
- [Ant Design](https://ant.design/) - React UI component library
- [TypeORM](https://typeorm.io/) - ORM framework
- [LangChain](https://js.langchain.com/) - LLM application framework

---

## 📮 Contact

- **Author**: arcsin1
- **Project URL**: [https://github.com/arcsin1/ai-codereview](https://github.com/arcsin1/ai-codereview)
- **Issue Tracker**: [GitHub Issues](https://github.com/arcsin1/ai-codereview/issues)

---

<div align="center">

**If this project helps you, please give it a ⭐️ Star!**

Made with ❤️ by [arcsin1](https://github.com/arcsin1)

</div>
