import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
  <header style="padding:12px;border-bottom:1px solid #ddd;">
    <h2 style="margin:0;">Tracker — Phase‑1</h2>
  </header>
  <main style="padding:16px;">
    <p>Project: <strong>HOME</strong></p>
    <section style="display:flex; gap:12px;">
      <div *ngFor="let c of columns" style="flex:1; border:1px solid #ddd; border-radius:8px; padding:8px;">
        <h4 style="margin-top:0;">{{c.name}}</h4>
        <article *ngFor="let i of c.items" style="padding:8px; border:1px solid #eee; border-radius:6px; margin:6px 0;">
          <div><strong>#{{i.id}}</strong> — {{i.title}}</div>
          <div style="font-size:12px; color:#666;">type: {{i.type}}</div>
        </article>
      </div>
    </section>
  </main>
  `
})
export class AppComponent implements OnInit {
  columns = [
    { name: 'To Do', items: [] as any[] },
    { name: 'In Progress', items: [] as any[] },
    { name: 'Done', items: [] as any[] }
  ];

  async ngOnInit() {
    const res = await fetch('/api/issues?project=HOME');
    const issues = await res.json();
    for (const i of issues) {
      // naive status_name mapping for seed data (falls back to To Do)
      let statusName = 'To Do';
      if (i.status_name) statusName = i.status_name;
      const col = this.columns.find(c => c.name === statusName) || this.columns[0];
      col.items.push(i);
    }
  }
}
