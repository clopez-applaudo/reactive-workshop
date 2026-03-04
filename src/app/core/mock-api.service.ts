import { Injectable } from '@angular/core';
import { Observable, of, throwError, timer } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

export type User = { id: number; name: string };

export type Product = { id: number; name: string; price: number; category: 'Books' | 'Games' | 'Tools' };

@Injectable({ providedIn: 'root' })
export class MockApiService {
  private users: User[] = Array.from({ length: 50 }).map((_, i) => ({
    id: i + 1,
    name: `User ${i + 1}`,
  }));

  private products: Product[] = [
    { id: 1, name: 'Angular Signals Handbook', price: 29, category: 'Books' },
    { id: 2, name: 'RxJS Operators Cheat Sheet', price: 19, category: 'Books' },
    { id: 3, name: 'Debugging Toolkit', price: 39, category: 'Tools' },
    { id: 4, name: 'State Management Starter', price: 25, category: 'Books' },
    { id: 5, name: 'Async Game: Cancel the Request', price: 12, category: 'Games' },
    { id: 6, name: 'Marble Diagram Puzzle', price: 9, category: 'Games' },
    { id: 7, name: 'CLI Productivity Pack', price: 15, category: 'Tools' },
    { id: 8, name: 'Typeahead Practice Set', price: 11, category: 'Games' },
    { id: 9, name: 'Signals vs RxJS Notes', price: 8, category: 'Books' },
    { id: 10, name: 'Frontend Observability Kit', price: 45, category: 'Tools' },
  ];


  searchUsers$(query: string): Observable<User[]> {
    const q = query.trim().toLowerCase();

    // simulate latency + occasional error
    return timer(350).pipe(
      switchMap(() => (q === 'error' ? throwError(() => new Error('Simulated API error')) : of(q))),
      map(() => this.users.filter(u => u.name.toLowerCase().includes(q)).slice(0, 10)),
    );
  }

  loadProducts$(query: string): Observable<Product[]> {
    const q = query.trim().toLowerCase();

    // Simulate latency + error path similar to user search
    return timer(450).pipe(
      switchMap(() => (q === 'error' ? throwError(() => new Error('Simulated products API error')) : of(q))),
      map(() => {
        if (!q) return this.products;
        return this.products.filter(p => p.name.toLowerCase().includes(q));
      }),
      map(list => list.slice(0, 20)),
    );
  }
}