import { Controller, Get, Post, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private svc: ProjectsService) {}

  @Get()
  all() { return this.svc.all(); }

  @Post()
  create(@Body() dto: { key: string; name: string }) { return this.svc.create(dto); }
}
