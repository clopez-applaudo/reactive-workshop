import { Component, computed, effect, signal } from '@angular/core';
import { DatePipe } from '@angular/common';

type Toast = { id: number; message: string; ts: number };

@Component({
  standalone: true,
  selector: 'app-signals-basics',
  imports: [DatePipe],
  styleUrls: ['./signals-basics.component.scss'],
  templateUrl: './signals-basics.component.html',
})
export class SignalsBasicsComponent {
  // Demo A: writable state
  count = signal(0);
  step = signal(1);

  // Demo B: derived state
  double = computed(() => this.count() * 2);
  parity = computed(() => (this.count() % 2 === 0 ? 'even' : 'odd'));
  isNegative = computed(() => this.count() < 0);

  // Demo C: effects
  logToConsole = signal(true);

  // Toasts (shows effect usage without RxJS)
  private toastSeq = 1;
  toasts = signal<Toast[]>([]);

  // Mini exercise
  name = signal('');
  nameLen = computed(() => this.name().trim().length);
  isLongName = computed(() => this.nameLen() >= 10);

  constructor() {
    // Effect: logging
    effect(() => {
      if (!this.logToConsole()) return;
      console.log('[Signals Lab] count =', this.count(), 'step =', this.step());
    });

    // Effect: create a toast when count changes (simple “react to state” demo)
    effect(() => {
      const c = this.count(); // dependency
      if (c === 0) return;    // avoid noise at init/reset
      this.addToast(`Count changed to ${c}`);
    });
  }

  setStep(v: number) {
    this.step.set(v);
  }

  inc() {
    this.count.update(v => v + this.step());
  }

  dec() {
    this.count.update(v => v - this.step());
  }

  reset() {
    this.count.set(0);
    this.step.set(1);
    this.name.set('');
    this.clearToasts();
  }

  toggleLogging(v: boolean) {
    this.logToConsole.set(v);
  }

  addToast(message: string) {
    const t: Toast = { id: this.toastSeq++, message, ts: Date.now() };
    this.toasts.update(arr => [t, ...arr].slice(0, 6));
  }

  removeToast(id: number) {
    this.toasts.update(arr => arr.filter(t => t.id !== id));
  }

  clearToasts() {
    this.toasts.set([]);
  }
}