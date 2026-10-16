import { Routes } from '@angular/router';
import { LoginComponent } from './authentication/login/login.component';
import { RegisterComponent } from './authentication/register/register.component';
import { AuthGuard } from './authentication/auth.guard';
import { RolesComponent } from './user-roles/roles.component';
import { RolesGuard } from './user-roles/roles.guard';

import { CatalogueComponent } from './catalogue/catalogue.component';
import { RendezVousComponent } from './rendez-vous/rendez-vous.component';
import { FideliteComponent } from './fidelite/fidelite.component';
import { CaisseComponent } from './caisse/caisse.component';
import { MesRecusComponent } from './recus/mes-recus.component';
import { RecuDetailComponent } from './recus/recu-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'roles', canActivate: [RolesGuard], component: RolesComponent },
  { path: 'catalogue', component: CatalogueComponent },
  { path: 'rendez-vous', component: RendezVousComponent },
  { path: 'fidelite', component: FideliteComponent },
  { path: 'caisse', component: CaisseComponent },
  { path: 'mes-recus', canActivate: [AuthGuard], component: MesRecusComponent },
  { path: 'mes-recus/:id', canActivate: [AuthGuard], component: RecuDetailComponent },
];
