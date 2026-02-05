import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Project } from './entities/project.entity';
import { CreateProjectDto, UpdateProjectDto } from './dto';
import { PlatformType } from '../../common/interfaces/platform-adapter.interface';

@Injectable()
export class ProjectService {
  private readonly logger = new Logger(ProjectService.name);

  constructor(
    @InjectRepository(Project)
    private readonly projectRepository: Repository<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    // Check if project name already exists
    const existingProject = await this.projectRepository.findOne({
      where: { name: createProjectDto.name },
    });

    if (existingProject) {
      throw new ConflictException('Project with this name already exists');
    }

    const project = this.projectRepository.create(createProjectDto);
    return this.projectRepository.save(project);
  }

  async findAll(
    page: number = 1,
    pageSize: number = 20,
    platform?: string,
  ): Promise<{ items: Project[]; total: number; page: number; pageSize: number }> {
    const queryBuilder = this.projectRepository.createQueryBuilder('project');

    if (platform) {
      queryBuilder.andWhere('project.platform = :platform', { platform });
    }

    queryBuilder
      .orderBy('project.createdAt', 'DESC')
      .skip((page - 1) * pageSize)
      .take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return { items, total, page, pageSize };
  }

  async findOne(id: string): Promise<Project> {
    const project = await this.projectRepository.findOne({ where: { id } });
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  /**
   * Find project by repository URL
   */
  async findByRepositoryUrl(repositoryUrl: string): Promise<Project | null> {
    return this.projectRepository.findOne({
      where: { repositoryUrl },
    });
  }

  /**
   * Find project by repository full_name (supports owner/repo format)
   * Prioritizes matching with the name field
   */
  async findByRepoFullName(repoFullName: string, platform: string): Promise<Project | null> {
    this.logger.log(`Looking for project: ${repoFullName} on platform: ${platform}`);

    // 1. Extract project path (owner/repo)
    let projectPath = repoFullName;

    // If it's a full URL, extract the path part
    if (repoFullName.startsWith('http')) {
      const urlMatch = repoFullName.match(/https?:\/\/[^\/]+\/(.+)$/);
      if (urlMatch) {
        projectPath = urlMatch[1];
      }
    }

    this.logger.log(`Extracted project path: ${projectPath}`);

    // 2. Prioritize exact match using name + platform (fastest and most accurate)
    const projectByName = await this.projectRepository.findOne({
      where: {
        name: projectPath,
        platform: platform as any,
      },
      relations: ['reviewConfig'],
    });

    if (projectByName) {
      this.logger.log(`Found project by name and platform: ${projectPath} (${platform})`);
      return projectByName;
    }

    // 3. Fallback: try matching repository_url (backward compatible)
    const exactUrlMatch = await this.projectRepository.findOne({
      where: { repositoryUrl: repoFullName },
      relations: ['reviewConfig'],
    });
    if (exactUrlMatch) {
      this.logger.log(`Found project by exact URL match: ${repoFullName}`);
      return exactUrlMatch;
    }

    // 4. Fallback: fuzzy match the end of repository_url
    const allProjects = await this.projectRepository.find({
      where: { platform: platform as any }
    });

    const fuzzyMatch = allProjects.find(p => {
      const urlPath = p.repositoryUrl.replace(/^https?:\/\/[^\/]+\//, '');
      return urlPath === projectPath || p.repositoryUrl.endsWith(projectPath);
    });

    if (fuzzyMatch) {
      this.logger.log(`Found project by fuzzy URL match: ${fuzzyMatch.repositoryUrl}`);
      return fuzzyMatch;
    }

    this.logger.warn(`Project not found: ${repoFullName} on platform ${platform}`);
    return null;
  }

  async update(id: string, updateProjectDto: UpdateProjectDto): Promise<Project> {
    const project = await this.findOne(id);
    this.projectRepository.merge(project, updateProjectDto);
    return this.projectRepository.save(project);
  }

  async remove(id: string): Promise<void> {
    const project = await this.findOne(id);
    await this.projectRepository.remove(project);
  }

  async toggleEnabled(id: string): Promise<Project> {
    const project = await this.findOne(id);
    project.isEnabled = !project.isEnabled;
    return this.projectRepository.save(project);
  }

  async toggleAutoReview(id: string): Promise<Project> {
    const project = await this.findOne(id);
    project.autoReviewEnabled = !project.autoReviewEnabled;
    return this.projectRepository.save(project);
  }
}
