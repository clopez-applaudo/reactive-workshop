import { Component, input } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

export type LabNavItem = {
  label: string;
  route: string;
};

@Component({
  standalone: true,
  selector: 'app-lab-shell',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  styles: [`
    :host { display: block; height: 100%; }
    .layout { display: grid; grid-template-columns: 280px 1fr; min-height: 100vh; }
    nav { border-right: 1px solid #e5e7eb; padding: 16px; }
    main { padding: 20px; max-width: 1100px; }
    .title { font-size: 18px; font-weight: 700; margin-bottom: 10px; }
    .section { margin-top: 18px; }
    a { display: block; padding: 10px 12px; border-radius: 10px; color: inherit; text-decoration: none; }
    a.active { background: #f3f4f6; font-weight: 600; }
    .hint { font-size: 12px; color: #6b7280; line-height: 1.35; }
    .topbar { display: flex; align-items: baseline; gap: 10px; margin-bottom: 12px; }
    .badge { font-size: 12px; background: #eef2ff; padding: 2px 8px; border-radius: 999px; }
    .panel { border: 1px solid #e5e7eb; border-radius: 14px; padding: 14px; }
  `],
  template: `
    <div class="layout">
      <nav>
        <div class="title">Reactive Workshop</div>
        <div class="hint">
          Focus: RxJS + Signals + interop. <br />
        </div>

        <div class="section">
          @for (item of nav(); track item.route) {
            <a [routerLink]="item.route" routerLinkActive="active">{{ item.label }}</a>
          }
        </div>

        <div class="section panel">
          <div style="font-weight: 700; margin-bottom: 6px;">How to use this</div>
          <div class="hint">
            Each lab includes concepts + demo + TODOs.<br />
            After the call, complete TODOs and compare with solutions.
          </div>
        </div>
      </nav>

      <main>
        <div class="topbar">
          <h1 style="margin:0; font-size: 22px;">{{ pageTitle() }}</h1>
          @if (tag()) { <span class="badge">{{ tag() }}</span> }
        </div>

        <router-outlet />
      </main>
    </div>
  `,
})
export class LabShellComponent {
  pageTitle = input<string>('Labs');
  tag = input<string>('');

  nav = input<LabNavItem[]>([
    { label: 'Home', route: '/' },
    { label: 'Lab 1 — Signals basics', route: '/labs/signals-basics' },
    { label: 'Lab 2 — RxJS basics', route: '/labs/rxjs-basics' },
    { label: 'Lab 3 — Interop', route: '/labs/interop' },
    { label: 'Lab 4 — Typeahead', route: '/labs/typeahead' },
    { label: 'Lab 5 — Mini store', route: '/labs/mini-store' },
  ]);
}