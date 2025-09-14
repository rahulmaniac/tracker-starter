import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity({ name: 'issues' })
export class IssueEntity {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id!: string;

  @Column()
  project_id!: number;

  @Column({ type: 'enum', enum: ['EPIC','STORY','TASK','BUG','CHORE','GROCERY'] })
  type!: string;

  @Column()
  title!: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ nullable: true, type: 'int' })
  status?: number;
}
