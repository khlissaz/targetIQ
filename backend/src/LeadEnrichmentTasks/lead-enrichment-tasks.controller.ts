import { Controller, Get, Post, Body, UseGuards, Req, HttpException, HttpStatus } from '@nestjs/common';
import { LeadEnrichmentTasksService } from './lead-enrichment-tasks.service';

import { StartLeadEnrichmentTaskResponseDto } from './dto/start-lead-enrichment-task-response.dto';
import { StartLeadEnrichmentTaskRequestDto } from './dto/start-lead-enrichment-task-request.dto';
import { GetStatusOfProcessingTaskResponseDto } from './dto/get-status-of-processing-task-response.dto';
import { JwtAuthGuard } from 'src/auth/jwt.guard';

// TODO : change the camelcase and pascalcase in the route controller

@Controller('lead-enrichment-tasks')
export class LeadEnrichmentTasksController {
  constructor(private readonly leadEnrichmentTasksService: LeadEnrichmentTasksService) {}

  // TODO : Remove the test controller and the getAll Controller

  // @Get('test')
  // async test() {
  //   return { data: [{ coucou: "beuh" }] };
  // }

  // @UseGuards(JwtAuthGuard)
  // @Get('all')
  // async findAll(): Promise<LeadEnrichmentTask[]> {
  //   return await this.leadEnrichmentTasksService.findAll();
  // }

  // @UseGuards(JwtAuthGuard)
  // @Post()
  // async create(@Body() taskData: Partial<LeadEnrichmentTask>): Promise<LeadEnrichmentTask> {
  //   return await this.leadEnrichmentTasksService.create(taskData);
  // }

  @UseGuards(JwtAuthGuard)
  @Post('startLeadEnrichmentProcess')
  async startLeadEnrichmentProcess(
    @Req() req,
    @Body() { leadId }: StartLeadEnrichmentTaskRequestDto,
  ): Promise<StartLeadEnrichmentTaskResponseDto> {
    const user = req.user;
    return await this.leadEnrichmentTasksService.startLeadEnrichmentProcess(user.userId, leadId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('getStatusOfProcessingTasks')
  async getStatusOfProcessingTasks(
    @Req() req,
  ): Promise<GetStatusOfProcessingTaskResponseDto[]> {
    const user = req.user;
    return await this.leadEnrichmentTasksService.getStatusOfProcessingTasks(user.id);
  }
}
