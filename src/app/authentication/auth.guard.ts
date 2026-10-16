import { Injectable, inject } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from './auth.service';

/**
 * Garde de route : exige une session active.
 * Un visiteur non connecté est renvoyé vers la page de connexion.
 */
@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  canActivate(): boolean {
    if (this.authService.currentUser() === null) {
      this.router.navigate(['/login']);
      return false;
    }
    return true;
  }
}
