-- =====================================================
-- AI Code Review Database Initialization Script
-- =====================================================
-- Usage:
--   1. Start PostgreSQL container
--   2. Run: psql -U postgres -f init-db.sql
--   Or connect with psql and run: \i init-db.sql
-- =====================================================

-- Create database (run as postgres user)
-- CREATE DATABASE ai_codereview;

-- Connect to the database
\c ai_codereview;

-- =====================================================
-- Extensions
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- For text search (indexes on text columns)

-- =====================================================
-- Enum Types
-- =====================================================
DO $$ BEGIN
    CREATE TYPE git_provider AS ENUM ('github', 'gitlab', 'gitea');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE project_platform AS ENUM ('gitlab', 'github', 'gitea');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE llm_provider AS ENUM ('openai', 'anthropic', 'deepseek', 'zhipuai', 'qwen', 'ollama');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- Table: users
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    avatar VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    refresh_token VARCHAR(255),
    refresh_token_expires TIMESTAMP,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- =====================================================
-- Table: llm_configs - LLM 配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS llm_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider llm_provider NOT NULL DEFAULT 'openai',
    name VARCHAR(100) NOT NULL,
    api_key TEXT,
    base_url VARCHAR(255),
    model VARCHAR(100) DEFAULT 'gpt-3.5-turbo',
    max_tokens INTEGER DEFAULT 2000,
    temperature DECIMAL(3,2) DEFAULT 0.7,
    is_default BOOLEAN DEFAULT FALSE,
    is_enabled BOOLEAN DEFAULT TRUE,
    extra_config JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_llm_configs_provider ON llm_configs(provider);
CREATE INDEX IF NOT EXISTS idx_llm_configs_name ON llm_configs(name);

-- =====================================================
-- Table: git_configs - Git 配置表
-- =====================================================
CREATE TABLE IF NOT EXISTS git_configs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider git_provider NOT NULL,
    url VARCHAR(255) NOT NULL,
    access_token VARCHAR(255) NOT NULL,
    description VARCHAR(500),
    name VARCHAR(50) DEFAULT 'default',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_git_configs_provider ON git_configs(provider);
CREATE INDEX IF NOT EXISTS idx_git_configs_name ON git_configs(name);

-- =====================================================
-- Table: review_configs - 审查配置表（需要在 projects 之前创建）
-- =====================================================
CREATE TABLE IF NOT EXISTS review_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_style VARCHAR(50) NOT NULL UNIQUE,
    prompt TEXT NOT NULL,
    max_tokens INTEGER NOT NULL DEFAULT 4096,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_review_configs_review_style ON review_configs(review_style);

-- =====================================================
-- Table: projects - 项目表
-- =====================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    platform project_platform NOT NULL,
    repository_url VARCHAR(500) NOT NULL,
    webhook_url VARCHAR(255),
    webhook_type VARCHAR(50),  -- 'feishu' | 'dingtalk'
    webhook_secret VARCHAR(255),
    is_enabled BOOLEAN DEFAULT TRUE,
    auto_review_enabled BOOLEAN DEFAULT TRUE,
    review_config_id UUID REFERENCES review_configs(id),
    owner_id UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_projects_name ON projects(name);
CREATE INDEX IF NOT EXISTS idx_projects_platform ON projects(platform);
CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id);
CREATE INDEX IF NOT EXISTS idx_projects_review_config_id ON projects(review_config_id);

-- =====================================================
-- Table: review_logs - 审查日志（合并 MR 和 Push）
-- =====================================================
CREATE TABLE IF NOT EXISTS review_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    review_type VARCHAR(20) NOT NULL,  -- 'mr' | 'push'
    project_id UUID,
    project_name VARCHAR(100) NOT NULL,
    author VARCHAR(100) NOT NULL,
    source_branch VARCHAR(255),   -- MR 专用
    target_branch VARCHAR(255),   -- MR 专用
    branch VARCHAR(255),          -- Push 专用
    commit_messages TEXT,
    score INTEGER NOT NULL,
    url VARCHAR(500),
    review_result JSONB NOT NULL,
    additions INTEGER DEFAULT 0,
    deletions INTEGER DEFAULT 0,
    last_commit_id VARCHAR(64),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_review_logs_type ON review_logs(review_type);
CREATE INDEX IF NOT EXISTS idx_review_logs_project_author ON review_logs(review_type, project_name, author);
CREATE INDEX IF NOT EXISTS idx_review_logs_updated ON review_logs(updated_at);

DROP TABLE IF EXISTS mr_review_logs;
DROP TABLE IF EXISTS push_review_logs;

-- =====================================================
-- Table: webhook_logs - Webhook 处理日志
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    platform VARCHAR(20) NOT NULL,  -- 'gitlab' | 'github' | 'gitea'
    event_type VARCHAR(50) NOT NULL,
    project_name VARCHAR(255) NOT NULL,
    project_id UUID NOT NULL,
    author VARCHAR(255) NOT NULL,
    source_branch VARCHAR(255),
    target_branch VARCHAR(255),
    branch VARCHAR(255),
    success BOOLEAN DEFAULT FALSE,
    message TEXT NOT NULL,
    error TEXT,
    processing_time INTEGER,
    review_score INTEGER,
    raw_payload JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_project_time ON webhook_logs(project_name, created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_event_time ON webhook_logs(event_type, created_at);

-- =====================================================
-- Table: daily_reports - 每日报告
-- =====================================================
CREATE TABLE IF NOT EXISTS daily_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_date DATE NOT NULL,
    total_reviews INTEGER NOT NULL,
    average_score INTEGER DEFAULT 0,
    total_additions INTEGER NOT NULL,
    total_deletions INTEGER NOT NULL,
    project_stats JSONB NOT NULL,
    author_stats JSONB NOT NULL,
    summary TEXT,
    score_distribution JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_reports_date ON daily_reports(report_date);

-- =====================================================
-- Comments
-- =====================================================
COMMENT ON TABLE users IS '用户账户表';
COMMENT ON TABLE llm_configs IS 'LLM API 配置表';
COMMENT ON TABLE git_configs IS 'Git 平台配置表';
COMMENT ON TABLE projects IS '项目配置表';
COMMENT ON TABLE review_logs IS '审查日志（合并 MR/PR 和 Push）';
COMMENT ON TABLE webhook_logs IS 'Webhook 处理日志';
COMMENT ON TABLE daily_reports IS '每日审查报告';
COMMENT ON TABLE review_configs IS '审查风格配置表';

-- =====================================================
-- Output success message
-- =====================================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Database initialized successfully!';
    RAISE NOTICE 'Database: ai_codereview';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - users';
    RAISE NOTICE '  - llm_configs';
    RAISE NOTICE '  - git_configs';
    RAISE NOTICE '  - projects';
    RAISE NOTICE '  - review_logs';
    RAISE NOTICE '  - webhook_logs';
    RAISE NOTICE '  - daily_reports';
    RAISE NOTICE '  - review_configs';
    RAISE NOTICE '========================================';
END $$;
