import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';

type Issue = { id: string; title: string; type: string; status_name?: string };

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  styles: [`
    header { padding:12px; border-bottom:1px solid #ddd; display:flex; gap:12px; align-items:center; }
    .board { display:flex; gap:12px; align-items:flex-start; }
    .col { flex:1; border:1px solid #ddd; border-radius:8px; padding:8px; min-height:120px; background:#fafafa; }
    .card { padding:8px; border:1px solid #eee; border-radius:6px; margin:6px 0; background:#fff; cursor:grab; }
    .col h4 { margin:4px 0 8px; }
    .btn { padding:8px 12px; border:1px solid #ccc; border-radius:8px; background:#fff; cursor:pointer; }
    dialog { border:none; border-radius:12px; padding:0; width:520px; max-width:95vw; }
    .dlg { padding:16px; }
    .row { display:flex; gap:12px; }
    .row > * { flex:1; }
    .actions { display:flex; gap:8px; justify-content:flex-end; margin-top:12px; }
    input, select, textarea { width:100%; padding:8px; border:1px solid #ccc; border-radius:8px; }
    textarea { min-height: 100px; resize: vertical; }
  `],
  template: `
    <header>
      <h2 style="margin:0; flex:1;">Tracker — Phase-1</h2>
      <button class="btn" (click)="openNew()">+ New Issue</button>
    </header>

    <main style="padding:16px;">
      <p>Project: <strong>{{projectKey}}</strong></p>

      <section class="board">
        <div class="col"
             *ngFor="let c of columns()"
             cdkDropList
             [cdkDropListData]="c.items"
             (cdkDropListDropped)="drop($event, c.name)">
          <h4>{{c.name}} ({{c.items.length}})</h4>

          <div class="card"
               *ngFor="let i of c.items; trackBy: trackIssue"
               cdkDrag
               [cdkDragData]="i">
            <div><strong>#{{i.id}}</strong> — {{i.title}}</div>
            <div style="font-size:12px; color:#666;">type: {{i.type}}</div>
          </div>
        </div>
      </section>
    </main>

    <!-- Create Issue dialog -->
    <dialog id="newIssue">
      <form class="dlg" (submit)="submitNew($event)">
        <h3 style="margin:0 0 12px;">Create Issue</h3>
        <div class="row">
          <label>Title
            <input name="title" required placeholder="e.g. Wire Angular board" />
          </label>
          <label>Type
            <select name="type">
              <option value="TASK">Task</option>
              <option value="STORY">Story</option>
              <option value="BUG">Bug</option>
              <option value="EPIC">Epic</option>
              <option value="CHORE">Chore</option>
              <option value="GROCERY">Grocery</option>
            </select>
          </label>
        </div>
        <label>Description
          <textarea name="description" placeholder="Optional details..."></textarea>
        </label>
        <div class="actions">
          <button type="button" class="btn" (click)="closeNew()">Cancel</button>
          <button type="submit" class="btn">Create</button>
        </div>
      </form>
    </dialog>
  `
})
class AppComponent implements OnInit {
  projectKey = 'HOME';
  columns = signal<{ name: string; items: Issue[] }[]>([
    { name: 'To Do', items: [] },
    { name: 'In Progress', items: [] },
    { name: 'Done', items: [] }
  ]);

  trackIssue = (_: number, i: Issue) => i.id;

  async ngOnInit() {
    // 1) Load workflow → set columns
    const wf = await fetch(`/api/projects/${this.projectKey}/workflow`).then(r => r.json());
    if (Array.isArray(wf) && wf.length) {
      this.columns.set(wf.map((row: any) => ({ name: row.name, items: [] })));
    }

    // 2) Load issues → distribute into columns by status_name
    const issues: Issue[] = await fetch(`/api/issues?project=${this.projectKey}`).then(r => r.json());
    const cols = this.columns();
    for (const i of issues) {
      const name = i.status_name || cols[0].name;
      (cols.find(c => c.name === name) || cols[0]).items.push(i);
    }
    this.columns.set([...cols]);
  }

  async drop(event: CdkDragDrop<Issue[]>, destName: string) {
    const cols = this.columns();
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    this.columns.set([...cols]);

    const moved: Issue = event.item.data;
    try {
      await fetch(`/api/issues/${moved.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_key: this.projectKey, status_name: destName })
      });
    } catch (e) {
      console.error('Failed to persist status', e);
    }
  }

  openNew() {
    (document.getElementById('newIssue') as HTMLDialogElement).showModal();
  }
  closeNew() {
    (document.getElementById('newIssue') as HTMLDialogElement).close();
  }
  async submitNew(ev: Event) {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const fd = new FormData(form);
    const title = (fd.get('title') || '').toString().trim();
    const type = (fd.get('type') || 'TASK').toString();
    const description = (fd.get('description') || '').toString();

    if (!title) return;

    try {
      const res = await fetch(`/api/issues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_key: this.projectKey, type, title, description })
      });
      const createdArr = await res.json();
      const created: Issue = Array.isArray(createdArr) ? createdArr[0] : createdArr;

      // Put into first column by default (backend places it in the first workflow state)
      const cols = this.columns();
      created.status_name = cols[0].name;
      cols[0].items.unshift(created);
      this.columns.set([...cols]);

      form.reset();
      this.closeNew();
    } catch (e) {
      console.error('Create failed', e);
    }
  }
}

bootstrapApplication(AppComponent).catch(err => console.error(err));
