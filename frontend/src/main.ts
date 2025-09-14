import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule, CdkDragDrop, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import Keycloak, { KeycloakInstance } from 'keycloak-js';

type Issue = { id: string; title: string; type: string; status_name?: string };

// tiny toast
type Toast = { id: number; text: string };
const toasts = signal<Toast[]>([]);
let _toastId = 1;
function toast(text: string, ms = 2500) {
  const id = _toastId++;
  toasts.update(ts => [...ts, { id, text }]);
  setTimeout(() => toasts.update(ts => ts.filter(t => t.id !== id)), ms);
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  styles: [`
    header { padding:12px; border-bottom:1px solid #ddd; display:flex; gap:12px; align-items:center; }
    .spacer { flex: 1; }
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
    .toasts { position: fixed; right: 16px; bottom: 16px; display:flex; flex-direction:column; gap:8px; z-index: 9999; }
    .toast { background:#333; color:#fff; padding:10px 12px; border-radius:8px; box-shadow:0 2px 10px rgba(0,0,0,.2); }
  `],
  template: `
    <header>
      <h2 style="margin:0;">Tracker — Phase-1</h2>
      <div class="spacer"></div>
      <ng-container *ngIf="authUser(); else loggedOut">
        <span>👋 {{authUser()}}</span>
        <button class="btn" (click)="logout()">Logout</button>
      </ng-container>
      <ng-template #loggedOut>
        <button class="btn" (click)="login()">Login</button>
      </ng-template>
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

    <div class="toasts">
      <div class="toast" *ngFor="let t of tlist()">{{t.text}}</div>
    </div>
  `
})
class AppComponent implements OnInit {
  projectKey = 'HOME';
  columns = signal<{ name: string; items: Issue[] }[]>([
    { name: 'To Do', items: [] },
    { name: 'In Progress', items: [] },
    { name: 'Done', items: [] }
  ]);

  private kc: KeycloakInstance | null = null;
  authUser = signal<string | null>(null);
  tlist = computed(() => toasts());
  trackIssue = (_: number, i: Issue) => i.id;

  async ngOnInit() {
    // Keycloak init (guarded)
    try {
      const kc = new (Keycloak as any)({
        url: 'http://192.168.0.225:8080',
        realm: 'tracker',
        clientId: 'tracker-web'
      }) as KeycloakInstance;
      this.kc = kc;

      await kc.init({
        onLoad: 'check-sso',
        pkceMethod: 'S256',
        silentCheckSsoRedirectUri: window.location.origin + '/silent-check-sso.html'
      }).catch(() => null);

      if (kc.authenticated) {
        this.authUser.set(kc.tokenParsed?.preferred_username || kc.tokenParsed?.email || 'user');
        toast('Logged in');
      }
    } catch (e) {
      console.warn('Keycloak init skipped/failed', e);
    }

    // Load workflow
    const wf = await fetch(`/api/projects/${this.projectKey}/workflow`).then(r => r.json());
    if (Array.isArray(wf) && wf.length) {
      this.columns.set(wf.map((row: any) => ({ name: row.name, items: [] })));
    }

    // Load issues
    const issues: Issue[] = await fetch(`/api/issues?project=${this.projectKey}`).then(r => r.json());
    const cols = this.columns();
    for (const i of issues) {
      const name = i.status_name || cols[0].name;
      (cols.find(c => c.name === name) || cols[0]).items.push(i);
    }
    this.columns.set([...cols]);
  }

  async login() {
    if (!this.kc) return;
    try { await this.kc.login({ redirectUri: window.location.href }); } catch (e) { console.error(e); }
  }
  async logout() {
    if (!this.kc) return;
    try {
      await this.kc.logout({ redirectUri: window.location.origin });
      this.authUser.set(null);
      toast('Logged out');
    } catch (e) { console.error(e); }
  }

  openNew() { (document.getElementById('newIssue') as HTMLDialogElement).showModal(); }
  closeNew() { (document.getElementById('newIssue') as HTMLDialogElement).close(); }

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

      const cols = this.columns();
      created.status_name = cols[0].name;
      cols[0].items.unshift(created);
      this.columns.set([...cols]);
      toast('Issue created');
      form.reset();
      this.closeNew();
    } catch (e) {
      console.error('Create failed', e);
      toast('Failed to create issue');
    }
  }

  async drop(event: CdkDragDrop<Issue[]>, destName: string) {
    const cols = this.columns();
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
    } else {
      transferArrayItem(event.previousContainer.data, event.container.data, event.previousIndex, event.currentIndex);
    }
    this.columns.set([...cols]);

    const moved: Issue = event.item.data;
    try {
      await fetch(`/api/issues/${moved.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_key: this.projectKey, status_name: destName })
      });
      toast(`Moved #${moved.id} → ${destName}`);
    } catch (e) {
      console.error('Failed to persist status', e);
      toast('Failed to move issue');
    }
  }
}

bootstrapApplication(AppComponent).catch(err => console.error(err));
