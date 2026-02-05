import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
  UseInterceptors,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { GitConfigService } from './git-config.service';
import {
  CreateGitConfigDto,
  UpdateGitConfigDto,
  QueryGitConfigDto,
} from './dto/git-config.dto';
import { GitProvider } from './entities/git-config.entity';
import { LoggingInterceptor, TransformInterceptor } from '../../common/interceptors';
import { JwtAuthGuard } from '../../common/guards';

@Controller('git-configs')
@UseGuards(JwtAuthGuard)
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class GitConfigController {
  private readonly logger = new Logger(GitConfigController.name);

  constructor(private readonly gitConfigService: GitConfigService) {}

  @Get()
  @ApiOperation({ summary: 'Get Git configuration list' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findAll(@Query() query: QueryGitConfigDto) {
    return this.gitConfigService.findAll(query);
  }

  @Get('provider/:provider')
  @ApiOperation({ summary: 'Get Git configuration by provider' })
  @ApiParam({ name: 'provider', enum: GitProvider })
  @ApiResponse({ status: 200, description: 'Success' })
  async findByProvider(@Param('provider') provider: GitProvider) {
    return this.gitConfigService.findByProvider(provider);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get Git configuration details' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Success' })
  async findOne(@Param('id') id: string) {
    return this.gitConfigService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create Git configuration' })
  @ApiResponse({ status: 201, description: 'Created successfully' })
  async create(@Body() dto: CreateGitConfigDto) {
    return this.gitConfigService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update Git configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Updated successfully' })
  async update(@Param('id') id: string, @Body() dto: UpdateGitConfigDto) {
    return this.gitConfigService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete Git configuration' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  async remove(@Param('id') id: string) {
    return this.gitConfigService.remove(id);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Test Git configuration connection' })
  @ApiParam({ name: 'id', description: 'Configuration ID' })
  @ApiResponse({ status: 200, description: 'Test successful' })
  async testConnection(@Param('id') id: string) {
    return this.gitConfigService.testConnection(id);
  }
}
