import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  BehaviorSubject,
  Subject,
  Subscription,
  Observable,
  of,
  combineLatest,
  timer,
} from 'rxjs';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  filter,
  map,
  shareReplay,
  startWith,
  switchMap,
  takeUntil,
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
  selector: 'app-rxjs-basics',
  imports: [CommonModule],
  styleUrls: ['./rxjs-basics.component.scss'],
  templateUrl: './rxjs-basics.component.html',
})
export class RxjsBasicsComponent implements OnDestroy {
  // ----------------------------
  // Demo A (BAD)
  // ----------------------------
  badQuery = '';
  badResults: User[] = [];
  badError: string | null = null;
  badActiveSubs = 0;

  private badSub?: Subscription;

  // ----------------------------
  // Demo B (GOOD)
  // ----------------------------
  private goodQuery$ = new BehaviorSubject<string>('');
  private goodRetry$ = new Subject<void>();

  // snapshot just for input binding
  get goodQuerySnapshot() {
    return this.goodQuery$.value;
  }

  /**
   * Good pipeline:
   * - debounce user input
   * - ignore small queries
   * - switchMap for cancellation
   * - shareReplay(1) for caching (latest success)
   * - expose a view state observable for templates
   */
  readonly goodState$: Observable<ViewState<User[]>> = combineLatest([
    this.goodQuery$.pipe(
      map(v => v.trim()),
      debounceTime(300),
      distinctUntilChanged(),
    ),
    this.goodRetry$.pipe(startWith(undefined)),
  ]).pipe(
    map(([q]) => q),
    switchMap(q => {
      if (q.length < 2) return of({ status: 'idle' } as const);

      // Emit loading immediately, then request
      return this.api.searchUsers$(q).pipe(
        map(data => ({ status: 'success', data } as const)),
        startWith({ status: 'loading' } as const),
        catchError(err =>
          of({ status: 'error', message: err?.message ?? 'Unknown error' } as const)
        ),
      );
    }),
    // Cache the latest emitted ViewState for any new subscribers
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  constructor(private api: MockApiService) {}

  // BAD demo: creates manual subscription per keystroke
  badOnInput(v: string) {
    this.badQuery = v;
    this.badError = null;

    // WORST PRACTICE: subscribe inside event handler, lots of lifecycle footguns
    this.badSub = this.api.searchUsers$(v).subscribe({
      next: users => {
        this.badResults = users;
        this.badActiveSubs = this.badActiveSubs + 1;
      },
      error: err => {
        this.badError = err?.message ?? 'Unknown error';
      },
    });
  }

  badClear() {
    this.badQuery = '';
    this.badResults = [];
    this.badError = null;
    // often forgotten in "bad" pattern:
    this.badSub?.unsubscribe();
    this.badActiveSubs = 0;
  }

  // GOOD demo
  goodSetQuery(v: string) {
    this.goodQuery$.next(v);
  }

  goodClear() {
    this.goodQuery$.next('');
  }

  goodRetry() {
    this.goodRetry$.next();
  }

  ngOnDestroy(): void {
    // (Good pipeline uses async pipe; nothing required.)
    // But the BAD subscription should be cleaned up:
    this.badSub?.unsubscribe();
  }
}