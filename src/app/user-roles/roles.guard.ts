import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../authentication/auth.service';
import { RolesService, Permission } from './roles.service';
import { User } from '../core/models';

/**
 * Garde de route : exige une session active et le droit correspondant.
 * Un visiteur non connecté est renvoyé vers la page de connexion ;
 * un utilisateur connecté sans le droit est renvoyé vers sa page d'accueil.
 */
@Injectable({ providedIn: 'root' })
export class RolesGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly rolesService = inject(RolesService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    const user: User | null = this.authService.currentUser();
    if (user === null) {
      this.router.navigate(['/login']);
      return false;
    }
    if (!this.rolesService.hasRight(user, 'manage:roles' as Permission)) {
      this.router.navigate([this.authService.landingRoute(user)]);
      return false;
    }
    return true;
  }
}
