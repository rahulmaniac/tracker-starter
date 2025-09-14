import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ProjectsService {
  constructor(@InjectDataSource() private ds: DataSource) { }

  async all() {
    return this.ds.query('select id, key, name from projects order by id');
  }

  async create(dto: { key: string; name: string }) {
    return this.ds.query('insert into projects(key,name) values($1,$2) returning *', [dto.key, dto.name]);
  }

  async workflow(key: string) {
    return this.ds.query(`
    select ws.name
    from workflow_states ws
    join projects p on p.id = ws.project_id
    where p.key = $1
    order by ws.position
  `, [key]);
  }
}
