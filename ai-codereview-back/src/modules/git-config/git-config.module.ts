import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GitConfig } from './entities/git-config.entity';
import { GitConfigController } from './git-config.controller';
import { GitConfigService } from './git-config.service';

@Module({
  imports: [TypeOrmModule.forFeature([GitConfig])],
  controllers: [GitConfigController],
  providers: [GitConfigService],
  exports: [GitConfigService],
})
export class GitConfigModule {}
