import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { BehaviorSubject, combineLatest, of } from 'rxjs';
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
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

@Component({
  standalone: true,
  selector: 'app-interop',
  imports: [CommonModule],
  styleUrls: ['./interop.component.scss'],
  templateUrl: './interop.component.html',
})
export class InteropComponent {
  // ---------------------------
  // Signals (UI-facing state)
  // ---------------------------
  query = signal('');
  minLen = signal(2);
  requestCount = signal(0);

  // Used to force a re-run even if query didn't change
  private retryToken$ = new BehaviorSubject(0);

  // ---------------------------
  // Signal → Observable
  // ---------------------------
  private query$ = toObservable(this.query).pipe(
    map(v => v.trim()),
    debounceTime(300),
    distinctUntilChanged(),
  );

  // Combine query and retry token (so Retry works without changing query text)
  private searchTrigger$ = combineLatest([
    this.query$,
    this.retryToken$,
    toObservable(this.minLen),
  ]).pipe(
    map(([q, _retry, min]) => ({ q, min })),
  );

  // ---------------------------
  // RxJS pipeline (async workflow)
  // ---------------------------
  readonly state$ = this.searchTrigger$.pipe(
    switchMap(({ q, min }) => {
      if (q.length < min) return of({ status: 'idle' } as const);

      return this.api.searchUsers$(q).pipe(
        tap(() => this.requestCount.update(v => v + 1)),
        map(data => ({ status: 'success', data } as const)),
        startWith({ status: 'loading' } as const),
        catchError(err =>
          of({ status: 'error', message: err?.message ?? 'Unknown error' } as const)
        ),
      );
    }),
    startWith({ status: 'idle' } as const),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Observable → Signal (UI-friendly sync read)
  state = toSignal(this.state$, {requireSync: true} );

  // Data-only stream (derived from state$) → Signal (useful pattern)
  private users$ = this.state$.pipe(
    map(s => (s.status === 'success' ? s.data : ([] as User[]))),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  users = toSignal(this.users$, { initialValue: [] as User[] });

  // Computed derivations on top of async results
  filteredUsers = computed(() => this.users().filter(u => u.name.includes('3')));
  hasThree = computed(() => this.filteredUsers().length > 0);

  constructor(private api: MockApiService) {
    // Tiny “interop sanity” demo: whenever query changes, clear retry-related error noise (optional)
    effect(() => {
      const q = this.query();
      if (q.length === 0) {
        // no-op, but shows effect pattern for “respond to query changes”
      }
    });
  }

  setQuery(v: string) {
    this.query.set(v);
  }

  clear() {
    this.query.set('');
  }

  retry() {
    this.retryToken$.next(this.retryToken$.value + 1);
  }
}