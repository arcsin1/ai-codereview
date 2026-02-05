# Common 模块使用指南

## 概述

`common/` 模块提供了项目中通用的工具类、装饰器、守卫、拦截器等基础设施。所有文件已实现完成，共 31 个 TypeScript 文件。

---

## 📁 目录结构

```
common/
├── constants/       # 枚举和常量定义
│   ├── enums.ts      # 20+ 枚举定义
│   └── index.ts
├── decorators/      # 自定义装饰器
│   ├── current-user.decorator.ts
│   ├── public.decorator.ts
│   ├── roles.decorator.ts
│   ├── permissions.decorator.ts
│   └── index.ts
├── guards/          # 路由守卫
│   ├── jwt-auth.guard.ts
│   ├── local-auth.guard.ts
│   ├── rbac.guard.ts
│   └── index.ts
├── interceptors/    # 拦截器
│   ├── logging.interceptor.ts
│   ├── transform.interceptor.ts
│   ├── timeout.interceptor.ts
│   └── index.ts
├── filters/         # 异常过滤器
│   ├── http-exception.filter.ts
│   └── index.ts
├── middlewares/     # 中间件
│   ├── logger.middleware.ts
│   └── index.ts
├── pipes/           # 管道
│   ├── validation.pipe.ts
│   └── index.ts
├── utils/           # 工具类
│   ├── token-counter.util.ts
│   ├── logger.util.ts
│   ├── crypto.util.ts
│   ├── token.util.ts
│   └── index.ts
├── interfaces/      # TypeScript 接口
│   ├── platform-adapter.interface.ts
│   ├── webhook-event.interface.ts
│   ├── review.interface.ts
│   └── index.ts
└── index.ts         # 主索引（仅导出常用枚举）
```

---

## 💡 使用建议

### ✅ 推荐的导入方式

```typescript
// 1. 从具体文件导入（最清晰）
import { TokenCounterUtil } from '@/common/utils/token-counter.util';
import { UserRole, PlatformType } from '@/common/constants/enums';

// 2. 从子模块导入（次选）
import { TokenCounterUtil, LoggerUtil } from '@/common/utils';
import { JwtAuthGuard, RbacGuard } from '@/common/guards';

// 3. 从主模块导入枚举类型（仅限常用枚举）
import { UserRole, PlatformType, EventType } from '@/common';
```

### ❌ 避免的导入方式

```typescript
// ❌ 不要使用通配符导入（污染命名空间）
import * from '@/common';
import * as Utils from '@/common/utils';

// ❌ 不要从主模块导入所有内容（只导出了枚举）
import { TokenCounterUtil } from '@/common'; // ❌ 会报错
```

---

## 🔧 核心功能使用示例

### 1. Token 计数器 (TokenCounterUtil)

```typescript
import { TokenCounterUtil } from '@/common/utils/token-counter.util';

// 估算 Token 数量
const text = '你的文本内容';
const tokens = TokenCounterUtil.countTokens(text);

// 检查是否超过限制
const maxTokens = 10000;
if (TokenCounterUtil.exceedsTokenLimit(text, maxTokens)) {
  // 截断文本
  const truncated = TokenCounterUtil.truncateByTokens(text, maxTokens);
}

// 获取使用建议
const advice = TokenCounterUtil.getTokenUsageAdvice(text, 'gpt-4');
console.log(advice); // { estimatedTokens, maxTokens, percentage, advice }
```

### 2. 日志工具 (LoggerUtil)

```typescript
import { LoggerUtil, LogPerformance } from '@/common/utils/logger.util';

// 创建日志记录器
const logger = new LoggerUtil('MyService');

// 基础日志
logger.log('Info message');
logger.error('Error occurred', error.stack);
logger.warn('Warning message');

// 结构化日志
logger.logEvent('USER_LOGIN', { userId: '123' }, '123');
logger.logApiCall('GET', '/api/users', 150, 200);
logger.logDatabaseQuery('SELECT * FROM users', [], 50);
logger.logPerformance('dataProcessing', 1200);

// 性能监控装饰器
@LogPerformance('processData')
async processData(data: any) {
  // 方法执行时间会自动记录
  return transform(data);
}
```

### 3. 加密工具 (CryptoUtil & PasswordUtil)

```typescript
import { CryptoUtil, PasswordUtil } from '@/common/utils/crypto.util';

// 加密/解密
const key = CryptoUtil.generateKey(); // 生成密钥
const encrypted = CryptoUtil.encrypt('sensitive data', key);
const decrypted = CryptoUtil.decrypt(encrypted, key);

// 密码哈希
const { hash, salt } = await PasswordUtil.hashPassword('mypassword');
const isValid = await PasswordUtil.verifyPassword('mypassword', hash, salt);

// 生成强密码
const strongPassword = PasswordUtil.generateStrongPassword(16, {
  includeUppercase: true,
  includeNumbers: true,
  includeSymbols: true,
});

// 评估密码强度
const strength = PasswordUtil.evaluatePasswordStrength(password);
console.log(strength); // { score, strength, suggestions }
```

### 4. 权限装饰器 (Permissions)

```typescript
import { Permissions, RequirePermissions } from '@/common/decorators';
import { UserRole } from '@/common/constants';

// 使用预定义的权限装饰器
@Permissions.ReviewRead
@Get('reviews')
findAllReviews() {}

// 自定义权限
@RequirePermissions('review:read', 'review:write')
@Post('reviews')
createReview() {}

// 组合权限（任意一个满足即可）
@RequireAnyPermission('review:read', 'project:read')
@Get('mixed-reviews')
findMixedReviews() {}
```

### 5. 拦截器使用

```typescript
import { LoggingInterceptor, TransformInterceptor, TimeoutInterceptors } from '@/common/interceptors';
import { HttpExceptionFilter, AllExceptionsFilter } from '@/common/filters';

@Controller('reviews')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
@UseFilters(HttpExceptionFilter)
export class ReviewController {

  @Get()
  @UseInterceptors(TimeoutInterceptors.Normal) // 30秒超时
  async findAll() {
    // 自动记录请求日志
    // 自动转换响应格式
    // 自动处理超时
    return [];
  }

  @Post()
  @UseInterceptors(TimeoutInterceptors.LLM) // 3分钟超时（适合LLM调用）
  async createReview() {
    // ...
  }
}
```

### 6. 管道使用

```typescript
import { ValidationPipes, DetailedValidationPipe } from '@/common/pipes';

@Controller('users')
export class UsersController {

  @Post()
  async create(
    @Body(ValidationPipes.Detailed) createUserDto: CreateUserDto,
  ) {
    // 自动验证，返回详细错误信息
    return this.usersService.create(createUserDto);
  }
}
```

### 7. 守卫使用

```typescript
import { JwtAuthGuard, RbacGuard } from '@/common/guards';
import { Roles } from '@/common/decorators';
import { UserRole } from '@/common/constants';

@Controller('admin')
@UseGuards(JwtAuthGuard, RbacGuard)
@Roles(UserRole.ADMIN)
export class AdminController {

  @Get('settings')
  getSettings() {
    // 只有管理员可以访问
  }
}
```

---

## 🎯 常见模式

### 模式 1: Controller 标准配置

```typescript
import { Controller, UseGuards, UseInterceptors, UseFilters, UsePipes } from '@nestjs/common';
import { JwtAuthGuard } from '@/common/guards';
import { LoggingInterceptor, TransformInterceptor } from '@/common/interceptors';
import { HttpExceptionFilter } from '@/common/filters';
import { ValidationPipes } from '@/common/pipes';
import { Permissions } from '@/common/decorators';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
@UseFilters(HttpExceptionFilter)
export class ReviewController {

  @Get()
  @Permissions.ReviewRead
  findAll() {
    return [];
  }

  @Post()
  @Permissions.ReviewWrite
  @UsePipes(ValidationPipes.Standard)
  create(@Body() dto: CreateReviewDto) {
    return [];
  }
}
```

### 模式 2: Service 层使用工具类

```typescript
import { Injectable } from '@nestjs/common';
import { LoggerUtil, TokenCounterUtil } from '@/common/utils';
import { LogPerformance } from '@/common/utils/logger.util';

@Injectable()
export class ReviewService {
  private readonly logger = new LoggerUtil('ReviewService');

  @LogPerformance('generateReview')
  async generateReview(changes: CodeChange[]): Promise<ReviewResult> {
    this.logger.log('Starting review generation');

    // Token 管理
    const text = this.formatChanges(changes);
    const advice = TokenCounterUtil.getTokenUsageAdvice(text, 'gpt-4');

    if (advice.percentage > 90) {
      this.logger.warn('Token usage is high', { advice });
      // 截断处理...
    }

    return this.performReview(changes);
  }
}
```

---

## 📌 注意事项

1. **避免循环依赖**
   - 不要在 `common/` 模块内部相互导入 `from '@/common'`
   - 使用相对路径：`from '../utils'`

2. **性能考虑**
   - `LoggingInterceptor` 会记录所有请求，生产环境建议谨慎使用
   - `TransformInterceptor` 会包装所有响应，确保数据格式正确

3. **错误处理**
   - `HttpExceptionFilter` 会捕获所有 HTTP 异常
   - `AllExceptionsFilter` 会捕获未处理的异常

4. **安全性**
   - 使用 `ValidationPipe` 验证所有用户输入
   - 使用 `RbacGuard` 保护敏感路由
   - 使用 `CryptoUtil` 处理敏感数据

---

## 🔄 迁移指南

如果你之前使用的是旧版本的导入方式，需要调整：

### 旧代码（需要修改）

```typescript
// ❌ 旧方式
import * as Common from '@/common';
Common.TokenCounterUtil.countTokens(text);
```

### 新代码（正确）

```typescript
// ✅ 新方式
import { TokenCounterUtil } from '@/common/utils/token-counter.util';
TokenCounterUtil.countTokens(text);
```

---

## 📚 相关文档

- [NestJS 拦截器](https://docs.nestjs.com/interceptors)
- [NestJS 管道](https://docs.nestjs.com/pipes)
- [NestJS 守卫](https://docs.nestjs.com/guards)
- [NestJS 过滤器](https://docs.nestjs.com/exception-filters)
