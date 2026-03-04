import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  standalone: true,
  selector: 'app-home',
  imports: [RouterLink],
  template: `
    <section style="display:grid; gap: 14px;">
      <p style="margin:0; color:#374151;">
        This workshop is designed for an AngularJS developer ramping up to Angular v19.
        Use the labs in order. Each lab has a focused scenario + TODOs.
      </p>

      <div style="display:flex; gap: 10px; flex-wrap: wrap;">
        <a class="btn" routerLink="/labs/signals-basics">Start Lab 1</a>
        <a class="btn" routerLink="/labs/rxjs-basics">Go to Lab 2</a>
      </div>

      <div class="card">
        <h3 style="margin:0 0 6px;">Goal for the 1-hour call</h3>
        <ol style="margin:0; padding-left: 18px; color:#374151;">
          <li>Signals mental model (state + derivations)</li>
          <li>RxJS mental model (streams + operators)</li>
          <li>Interop (toSignal / toObservable)</li>
        </ol>
      </div>
    </section>
  `,
  styles: [`
    .btn {
      display:inline-block;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #e5e7eb;
      text-decoration: none;
      color: inherit;
      background: #fff;
    }
    .btn:hover { background: #f9fafb; }
    .card {
      border: 1px solid #e5e7eb;
      border-radius: 16px;
      padding: 14px;
      background: #fff;
    }
  `]
})
export class HomeComponent {}