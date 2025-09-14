import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { IssuesService } from './issues.service';

@Controller('issues')
export class IssuesController {
  constructor(private svc: IssuesService) {}

  @Get()
  search(@Query('project') projectKey?: string) {
    return this.svc.search(projectKey);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member')
  create(@Body() dto: { project_key: string; type: string; title: string; description?: string }) {
    return this.svc.create(dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('member')
  update(@Param('id') id: string, @Body() dto: any) {
    return this.svc.update(id, dto);
  }
}