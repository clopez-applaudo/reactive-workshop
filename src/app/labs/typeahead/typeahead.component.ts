import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  map,
  shareReplay,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';
import { MockApiService, User } from '../../core/mock-api.service';

type ViewState<T> =
  | { status: 'idle'; reason: 'empty' | 'tooShort' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

@Component({
  standalone: true,
  selector: 'app-typeahead',
  imports: [CommonModule],
  styleUrls: ['./typeahead.component.scss'],
  templateUrl: './typeahead.component.html',
})
export class TypeaheadComponent {
  // -------------------------
  // Signals (UI inputs/state)
  // -------------------------
  query = signal('');
  minLen = signal(2);
  cacheEnabled = signal(true);

  requestCount = signal(0);
  recent = signal<string[]>([]);

  // Retry trigger (RxJS event)
  private retry$ = new Subject<void>();

  // -------------------------
  // Signal → Observable
  // -------------------------
  private query$ = toObservable(this.query).pipe(
    map(v => v.trim()),
    debounceTime(300),
    distinctUntilChanged(),
  );

  private minLen$ = toObservable(this.minLen);

  // Combine triggers
  private trigger$ = combineLatest([
    this.query$,
    this.minLen$,
    this.retry$.pipe(startWith(undefined)),
  ]).pipe(
    map(([q, min]) => ({ q, min })),
  );

  // -------------------------
  // Build state$ with optional caching
  // -------------------------
  private buildState$(): Observable<ViewState<User[]>> {
    const raw$ = this.trigger$.pipe(
      switchMap(({ q, min }) => {
        if (q.length === 0) return of({ status: 'idle', reason: 'empty' } as const);
        if (q.length < min) return of({ status: 'idle', reason: 'tooShort' } as const);

        return this.api.searchUsers$(q).pipe(
          tap(() => {
            this.requestCount.update(v => v + 1);
            this.pushRecent(q);
          }),
          map(data => ({ status: 'success', data } as const)),
          startWith({ status: 'loading' } as const),
          catchError(err =>
            of({ status: 'error', message: err?.message ?? 'Unknown error' } as const)
          ),
        );
      }),
      // Ensure toSignal can requireSync safely (immediate value)
      startWith({ status: 'idle', reason: 'empty' } as const),
    );

    // Toggle caching by wrapping (simple but effective)
    return toObservable(this.cacheEnabled).pipe(
      switchMap(enabled =>
        enabled
          ? raw$.pipe(shareReplay({ bufferSize: 1, refCount: true }))
          : raw$
      ),
    );
  }

  readonly state$ = this.buildState$();

  // NOTE: requireSync is safe because buildState$ emits startWith immediately
  state = toSignal<ViewState<User[]>>(this.state$);

  // A small “signals on top of async” derived example
  containsOne = computed(() => {
    const s = this.state();
    if (s?.status !== 'success') {
      return false
    };
    return s?.data.some(u => u.name.includes('1'));
  });

  constructor(private api: MockApiService) {}

  setQuery(v: string) {
    this.query.set(v);
  }

  clear() {
    this.query.set('');
  }

  retry() {
    this.retry$.next();
  }

  setMinLen(v: string) {
    const n = Number(v);
    this.minLen.set(Number.isFinite(n) ? n : 2);
  }

  clearRecent() {
    this.recent.set([]);
  }

  private pushRecent(q: string) {
    this.recent.update(list => {
      const normalized = q.trim();
      if (!normalized) return list;
      const next = [normalized, ...list.filter(x => x !== normalized)];
      return next.slice(0, 8);
    });
  }
}