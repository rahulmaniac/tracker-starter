import 'zone.js'; // required for Angular change detection
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule], // <-- enables *ngFor, etc.
  template: `
    <header style="padding:12px;border-bottom:1px solid #ddd;">
      <h2 style="margin:0;">Tracker — Phase-1</h2>
    </header>
    <main style="padding:16px;">
      <p>Project: <strong>HOME</strong></p>
      <section style="display:flex; gap:12px;">
        <div *ngFor="let c of columns" style="flex:1; border:1px solid #ddd; border-radius:8px; padding:8px;">
          <h4 style="margin-top:0;">{{c.name}} ({{c.items.length}})</h4>
          <article *ngFor="let i of c.items" style="padding:8px; border:1px solid #eee; border-radius:6px; margin:6px 0;">
            <div><strong>#{{i.id}}</strong> — {{i.title}}</div>
            <div style="font-size:12px; color:#666;">type: {{i.type}}</div>
          </article>
        </div>
      </section>
    </main>
  `
})
class AppComponent implements OnInit {
  columns = [
    { name: 'To Do', items: [] as any[] },
    { name: 'In Progress', items: [] as any[] },
    { name: 'Done', items: [] as any[] }
  ];

  async ngOnInit() {
    try {
      const res = await fetch('/api/issues?project=HOME');
      const issues = await res.json();
      for (const i of issues) {
        // Phase-1: drop everything in To Do
        this.columns[0].items.push(i);
      }
    } catch (e) {
      console.error('API fetch failed', e);
    }
  }
}

bootstrapApplication(AppComponent).catch(err => console.error(err));
