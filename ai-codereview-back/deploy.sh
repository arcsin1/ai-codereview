#!/bin/bash
# AI Code Review - 一键部署脚本
# 用途: 快速启动整个应用栈（数据库 + 后端）

set -e

echo "=========================================="
echo "   AI Code Review - One-Click Deploy     "
echo "=========================================="
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# 检查 .env 文件
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        cat > .env << EOF
# Database
POSTGRES_DB=ai_codereview
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres

# JWT
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# App
NODE_ENV=production
PORT=3000
EOF
    fi
    echo "✅ .env file created"
    echo ""
fi

# 检查是否需要重新构建
REBUILD=false
if [ "$1" = "--rebuild" ] || [ "$1" = "-r" ]; then
    REBUILD=true
fi

# 停止现有容器
echo "🛑 Stopping existing containers..."
docker-compose down

# 清理数据卷（如果指定了 --clean）
if [ "$1" = "--clean" ] || [ "$1" = "-c" ]; then
    echo "🗑️  Cleaning data volumes..."
    docker-compose down -v
    echo ""
fi

# 构建和启动
if [ "$REBUILD" = true ]; then
    echo "🔨 Rebuilding images..."
    docker-compose build --no-cache
fi

echo "🚀 Starting services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 10

# 检查服务状态
echo ""
echo "📊 Service Status:"
echo ""

# PostgreSQL
if docker-compose ps | grep -q "postgres.*Up"; then
    echo "   ✅ PostgreSQL: Running"
else
    echo "   ❌ PostgreSQL: Failed"
fi

# Redis
if docker-compose ps | grep -q "redis.*Up"; then
    echo "   ✅ Redis: Running"
else
    echo "   ❌ Redis: Failed"
fi

# Backend
if docker-compose ps | grep -q "backend.*Up"; then
    echo "   ✅ Backend: Running"
else
    echo "   ❌ Backend: Failed"
fi

echo ""
echo "=========================================="
echo "✅ Deployment completed!"
echo "=========================================="
echo ""
echo "📝 Default credentials:"
echo "   Username: admin"
echo "   Password: admin"
echo ""
echo "🔗 Access URLs:"
echo "   Backend API: http://localhost:3000"
echo "   API Docs: http://localhost:3000/api/docs"
echo "   Health Check: http://localhost:3000/health"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose logs -f [service]"
echo "   Stop: docker-compose down"
echo "   Restart: docker-compose restart"
echo "   Reset DB: docker-compose down -v && docker-compose up -d"
echo ""
echo "=========================================="
