import { Controller, Get, Post, Patch, Param, Body, Query } from '@nestjs/common';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private svc: IssuesService) {}

  @Get()
  search(@Query('project') projectKey?: string) {
    return this.svc.search(projectKey);
  }

  @Post()
  create(@Body() dto: { project_key: string; type: string; title: string; description?: string }) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }
}
