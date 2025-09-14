create extension if not exists pgcrypto;

create type issue_type as enum ('EPIC','STORY','TASK','BUG','CHORE','GROCERY');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  display_name text not null
);

create table projects (
  id serial primary key,
  key text unique not null,
  name text not null,
  lead uuid references users(id)
);

create table workflow_states (
  id serial primary key,
  project_id int references projects(id) on delete cascade,
  name text not null,
  position int not null
);

create table issues (
  id bigserial primary key,
  project_id int references projects(id) on delete cascade,
  type issue_type not null,
  title text not null,
  description text,
  status int references workflow_states(id),
  priority int default 2,
  points int,
  reporter_id uuid references users(id),
  assignee_id uuid references users(id),
  due_date date,
  parent_id bigint references issues(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table labels (
  id serial primary key,
  project_id int references projects(id) on delete cascade,
  name text not null,
  color text not null default '#888888'
);

create table issue_labels (
  issue_id bigint references issues(id) on delete cascade,
  label_id int references labels(id) on delete cascade,
  primary key (issue_id, label_id)
);

create table comments (
  id bigserial primary key,
  issue_id bigint references issues(id) on delete cascade,
  author_id uuid references users(id),
  body text not null,
  created_at timestamptz default now()
);

-- demo seed
insert into users(email, display_name) values
('rahul@example.com','Rahul'),
('deeksha@example.com','Deeksha')
on conflict do nothing;

insert into projects(key, name, lead)
values('HOME','Home Projects',(select id from users where email='rahul@example.com'))
on conflict do nothing;

insert into workflow_states(project_id, name, position) values
((select id from projects where key='HOME'), 'To Do', 1),
((select id from projects where key='HOME'), 'In Progress', 2),
((select id from projects where key='HOME'), 'Done', 3);

insert into issues(project_id,type,title,description,status,reporter_id,assignee_id)
values
((select id from projects where key='HOME'),'EPIC','Set up home server','Base infra and services',(select id from workflow_states where name='To Do' and project_id=(select id from projects where key='HOME')),(select id from users where email='rahul@example.com'),(select id from users where email='rahul@example.com')),
((select id from projects where key='HOME'),'GROCERY','Buy fruits','Apples, bananas, oranges',(select id from workflow_states where name='To Do' and project_id=(select id from projects where key='HOME')),(select id from users where email='rahul@example.com'),(select id from users where email='deeksha@example.com'));
