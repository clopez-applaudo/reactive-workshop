import { CommonModule } from '@angular/common';
import { Component, computed, effect, signal } from '@angular/core';
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
import { MockApiService, Product } from '../../core/mock-api.service';

type ViewState<T> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

type CartItem = { product: Product; qty: number };

@Component({
  standalone: true,
  selector: 'app-mini-store',
  imports: [CommonModule],
  styleUrls: ['./mini-store.component.scss'],
  templateUrl: './mini-store.component.html', 
})
export class MiniStoreComponent {
  // -------------------------
  // Store state (Signals)
  // -------------------------
  query = signal('');
  category = signal<'All' | Product['category']>('All');
  onlyAffordable = signal(false);

  selected = signal<Product | null>(null);

  cart = signal<CartItem[]>([]);
  requestCount = signal(0);

  // Retry trigger for async pipeline
  private retry$ = new Subject<void>();

  // -------------------------
  // Async loading (RxJS)
  // -------------------------
  private query$ = toObservable(this.query).pipe(
    map(v => v.trim()),
    debounceTime(300),
    distinctUntilChanged(),
  );

  private trigger$ = combineLatest([
    this.query$,
    this.retry$.pipe(startWith(undefined)),
  ]).pipe(map(([q]) => q));

  private productsState$: Observable<ViewState<Product[]>> = this.trigger$.pipe(
    switchMap(q =>
      this.api.loadProducts$(q).pipe(
        tap(() => this.requestCount.update(v => v + 1)),
        map(data => ({ status: 'success', data } as const)),
        startWith({ status: 'loading' } as const),
        catchError(err =>
          of({ status: 'error', message: err?.message ?? 'Unknown error' } as const)
        ),
      )
    ),
    startWith({ status: 'idle' } as const),
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  // Expose async state as a Signal (template friendly)
  productsState = toSignal<ViewState<Product[]>>(this.productsState$, { requireSync: true });

  // Data-only convenience signal
  products = computed(() => {
    const s = this.productsState();
    return s.status === 'success' ? s.data : ([] as Product[]);
  });

  // -------------------------
  // Derived selectors (computed)
  // -------------------------
  filteredProducts = computed(() => {
    const cat = this.category();
    const affordable = this.onlyAffordable();

    return this.products().filter(p => {
      if (cat !== 'All' && p.category !== cat) return false;
      if (affordable && p.price > 20) return false;
      return true;
    });
  });

  cartCount = computed(() => this.cart().length);

  totalQty = computed(() => this.cart().reduce((sum, it) => sum + it.qty, 0));

  totalPrice = computed(() =>
    this.cart().reduce((sum, it) => sum + it.qty * it.product.price, 0)
  );

  constructor(private api: MockApiService) {
    // Optional: show the idea of syncing selected with changes (purely demonstrative)
    effect(() => {
      const sel = this.selected();
      if (sel) {
        // No side effects needed; just demonstrates that effects re-run
        // console.log('[MiniStore] selected:', sel.name);
      }
    });
  }

  // -------------------------
  // UI actions
  // -------------------------
  clearQuery() {
    this.query.set('');
  }

  setCategory(v: string) {
    // Accept only expected values
    if (v === 'All' || v === 'Books' || v === 'Games' || v === 'Tools') {
      this.category.set(v);
    }
  }

  retry() {
    this.retry$.next();
  }

  select(p: Product) {
    this.selected.set(p);
  }

  // -------------------------
  // Cart actions (Signals store)
  // -------------------------
  addToCart(p: Product) {
    this.cart.update(items => {
      const idx = items.findIndex(x => x.product.id === p.id);
      if (idx >= 0) {
        const next = items.slice();
        next[idx] = { ...next[idx], qty: next[idx].qty + 1 };
        return next;
      }
      return [{ product: p, qty: 1 }, ...items];
    });
  }

  removeFromCart(productId: number) {
    this.cart.update(items => items.filter(x => x.product.id !== productId));
    if (this.selected()?.id === productId) this.selected.set(null);
  }

  incQty(productId: number) {
    this.cart.update(items =>
      items.map(it => it.product.id === productId ? { ...it, qty: it.qty + 1 } : it)
    );
  }

  decQty(productId: number) {
    this.cart.update(items =>
      items
        .map(it => it.product.id === productId ? { ...it, qty: it.qty - 1 } : it)
        .filter(it => it.qty > 0)
    );
  }

  clearCart() {
    this.cart.set([]);
    this.selected.set(null);
  }
}