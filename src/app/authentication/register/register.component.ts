import { FormsModule } from '@angular/forms';
import { Component, signal } from '@angular/core';
import { AuthService, AuthenticationError } from '../auth.service';
import { Router, RouterLink } from '@angular/router';

import { UserRole } from '../../core/models';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  protected readonly email = signal('');
  protected readonly password = signal('');
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly role = signal<UserRole>('client');
  protected readonly error = signal<string | null>(null);
  protected readonly isSubmitting = signal(false);

  constructor(
    protected readonly authService: AuthService,
    private readonly router: Router,
  ) {}

  protected setRole(role: UserRole): void {
    this.role.set(role);
  }

  protected async onSubmit(): Promise<void> {
    this.error.set(null);
    this.isSubmitting.set(true);
    try {
      const user = await this.authService.register({
        email: this.email(),
        password: this.password(),
        firstName: this.firstName(),
        lastName: this.lastName(),
        role: this.role(),
      });
      await this.router.navigate([this.authService.landingRoute(user)]);
    } catch (error) {
      this.error.set(
        error instanceof AuthenticationError ? error.message : 'Inscription impossible.',
      );
      this.isSubmitting.set(false);
    }
  }
}
