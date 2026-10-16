import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ReceiptService } from './receipt.service';
import { AuthService } from '../authentication/auth.service';

@Component({
  selector: 'app-mes-recus',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './mes-recus.component.html',
})
export class MesRecusComponent {
  private readonly receiptService = inject(ReceiptService);
  protected readonly authService = inject(AuthService);

  /** Reçus rattachés au client connecté, du plus récent au plus ancien. */
  readonly receipts = computed(() => {
    const email = this.authService.currentUser()?.email ?? '';
    if (!email) {
      return [];
    }
    return [...this.receiptService.getReceiptsForClient(email)].sort((a, b) =>
      b.day.localeCompare(a.day),
    );
  });
}
