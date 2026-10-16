import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { FideliteService, LOYALTY_TIERS } from './fidelite.service';
import { AuthService } from '../authentication/auth.service';

@Component({
  selector: 'app-fidelite',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './fidelite.component.html',
})
export class FideliteComponent {
  private readonly fideliteService = inject(FideliteService);
  protected readonly authService = inject(AuthService);

  readonly tiers = this.fideliteService.getTiers();
  readonly clientEmail = signal<string>(
    this.authService.currentUser()?.email || 'lea@example.com',
  );

  readonly profile = computed(() => {
    return this.fideliteService.getProfile(this.clientEmail());
  });

  readonly history = computed(() => {
    return this.fideliteService.getActivityHistory(this.clientEmail());
  });

  readonly nextTier = computed(() => {
    const pts = this.profile().points;
    return this.tiers.find((t) => t.minPoints > pts) || null;
  });

  readonly progressPercentage = computed(() => {
    const pts = this.profile().points;
    const next = this.nextTier();
    if (!next) return 100;
    return Math.min(100, Math.round((pts / next.minPoints) * 100));
  });

  readonly pointsToAdd = signal<number>(20);
  readonly serviceName = signal<string>('Coupe & Soin');
  readonly successMessage = signal<string | null>(null);

  awardPoints(): void {
    if (this.pointsToAdd() <= 0) return;
    this.fideliteService.addPoints(
      this.clientEmail(),
      this.pointsToAdd(),
      this.serviceName(),
    );
    this.successMessage.set(
      `+${this.pointsToAdd()} points ajoutés avec succès pour ${this.clientEmail()} !`,
    );
  }

  claimReward(reward: string): void {
    this.fideliteService.claimReward(this.clientEmail(), reward);
    this.successMessage.set(`Récompense « ${reward} » validée !`);
  }
}
