#!/bin/bash
# AI Code Review - 开发环境启动脚本

set -e

echo "=========================================="
echo "   AI Code Review - Dev Environment      "
echo "=========================================="
echo ""

# 检查 Docker 是否运行
if ! docker info > /dev/null 2>&1; then
    echo "❌ Error: Docker is not running. Please start Docker first."
    exit 1
fi

# 启动开发数据库和 Redis
echo "🚀 Starting dev database and Redis..."
docker-compose -f docker-compose.dev.yml up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# 检查服务状态
echo ""
echo "📊 Service Status:"
echo ""

if docker-compose -f docker-compose.dev.yml ps | grep -q "postgres.*Up"; then
    echo "   ✅ PostgreSQL: Running (port 5432)"
else
    echo "   ❌ PostgreSQL: Failed"
fi

if docker-compose -f docker-compose.dev.yml ps | grep -q "redis.*Up"; then
    echo "   ✅ Redis: Running (port 6379)"
else
    echo "   ❌ Redis: Failed"
fi

echo ""
echo "=========================================="
echo "✅ Dev environment ready!"
echo "=========================================="
echo ""
echo "📋 Next steps:"
echo "   1. Install dependencies: pnpm install"
echo "   2. Initialize database (first time only): pnpm seed"
echo "   3. Start dev server: pnpm start:dev"
echo ""
echo "🔗 Access URLs:"
echo "   PostgreSQL: localhost:5432"
echo "   Redis: localhost:6379"
echo "   Backend API: http://localhost:3000"
echo ""
echo "📝 Default credentials:"
echo "   Username: admin"
echo "   Password: 123456"
echo ""
echo "📋 Useful commands:"
echo "   View logs: docker-compose -f docker-compose.dev.yml logs -f [service]"
echo "   Stop: docker-compose -f docker-compose.dev.yml down"
echo "   Reset DB: docker-compose -f docker-compose.dev.yml down -v && docker-compose -f docker-compose.dev.yml up -d"
echo "   Redis Commander (optional): docker-compose -f docker-compose.dev.yml --profile tools up -d redis-commander"
echo ""
echo "=========================================="
