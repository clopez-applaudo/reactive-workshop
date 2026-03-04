import { Routes } from '@angular/router';
import { LabShellComponent } from './shared/lab-shell/lab-shell.component';
import { HomeComponent } from './home.component';

import { SignalsBasicsComponent } from './labs/signals-basics/signals-basics.component';
import { RxjsBasicsComponent } from './labs/rxjs-basics/rxjs-basics.component';
import { InteropComponent } from './labs/interop/interop.component';
import { TypeaheadComponent } from './labs/typeahead/typeahead.component';
import { MiniStoreComponent } from './labs/mini-store/mini-store.component';

export const routes: Routes = [
  {
    path: '',
    component: LabShellComponent,
    children: [
      { path: '', pathMatch: 'full', component: HomeComponent },

      { path: 'labs/signals-basics', component: SignalsBasicsComponent },
      { path: 'labs/rxjs-basics', component: RxjsBasicsComponent },
      { path: 'labs/interop', component: InteropComponent },
      { path: 'labs/typeahead', component: TypeaheadComponent },
      { path: 'labs/mini-store', component: MiniStoreComponent },

      { path: '**', redirectTo: '' },
    ],
  },
];