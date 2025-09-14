import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class ProjectsService {
  constructor(@InjectDataSource() private ds: DataSource) {}

  async all() {
    return this.ds.query('select id, key, name from projects order by id');
  }

  async create(dto: { key: string; name: string }) {
    return this.ds.query('insert into projects(key,name) values($1,$2) returning *', [dto.key, dto.name]);
  }
}
