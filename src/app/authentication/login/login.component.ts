import { FormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import { AuthService, AuthenticationError } from '../auth.service';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);

  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected async onSubmit(): Promise<void> {
    this.error.set(null);
    this.isSubmitting.set(true);
    try {
      const user = await this.authService.login(this.email(), this.password());
      await this.router.navigate([this.authService.landingRoute(user)]);
    } catch (error) {
      this.error.set(
        error instanceof AuthenticationError ? error.message : 'Connexion impossible.',
      );
      this.isSubmitting.set(false);
    }
  }

  protected fillAdminDemo(): void {
    this.email.set('admin@barbersop.fr');
    this.password.set('admin123');
  }
}
