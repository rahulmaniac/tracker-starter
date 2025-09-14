import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private svc: ProjectsService) {}

  @Get()
  all() {
    return this.svc.all();
  }

  @Post()
  create(@Body() dto: { key: string; name: string }) {
    return this.svc.create(dto);
  }

  // Param style: /api/projects/HOME/workflow
  @Get(':key/workflow')
  workflow(@Param('key') key: string) {
    return this.svc.workflow(key);
  }

  // Fallback: /api/projects/workflow?key=HOME
  @Get('workflow')
  workflowQ(@Query('key') key: string) {
    return this.svc.workflow(key);
  }
}
