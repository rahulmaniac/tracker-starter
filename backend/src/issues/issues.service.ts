import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class IssuesService {
  constructor(@InjectDataSource() private ds: DataSource) { }

  async search(projectKey?: string) {
    if (!projectKey) {
      return this.ds.query(`
      select i.*, ws.name as status_name
      from issues i
      left join workflow_states ws on ws.id = i.status
      order by i.id desc
      limit 100
    `);
    }
    return this.ds.query(`
    select i.*, ws.name as status_name
    from issues i
    join projects p on p.id = i.project_id
    left join workflow_states ws on ws.id = i.status
    where p.key = $1
    order by i.id desc
    limit 200
  `, [projectKey]);
  }


  async create(dto: { project_key: string; type: string; title: string; description?: string }) {
    const res = await this.ds.query('select id from projects where key=$1', [dto.project_key]);
    if (!res.length) throw new Error('Project not found');
    const project_id = res[0].id;
    return this.ds.query(
      'insert into issues(project_id,type,title,description,status) values($1,$2,$3,$4,(select id from workflow_states where project_id=$1 order by position asc limit 1)) returning *',
      [project_id, dto.type, dto.title, dto.description || null]
    );
  }

  async update(id: string, dto: any) {
    if (dto.status_name && dto.project_key) {
      const r = await this.ds.query(
        'select id from workflow_states where project_id=(select id from projects where key=$1) and name=$2',
        [dto.project_key, dto.status_name]
      );
      if (r.length) dto.status = r[0].id;
      delete dto.status_name; delete dto.project_key;
    }
    const fields = Object.keys(dto);
    if (!fields.length) return this.ds.query('select * from issues where id=$1', [id]);
    const values = Object.values(dto);
    const set = fields.map((k, i) => `${k}=$${i + 1}`).join(',');
    const q = `update issues set ${set}, updated_at=now() where id=${id} returning *`;
    return this.ds.query(q, values);
  }
}
