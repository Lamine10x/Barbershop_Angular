import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ReceiptService } from './receipt.service';
import { AuthService } from '../authentication/auth.service';

@Component({
  selector: 'app-recu-detail',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './recu-detail.component.html',
})
export class RecuDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly receiptService = inject(ReceiptService);
  private readonly authService = inject(AuthService);

  /**
   * Reçu demandé, uniquement s'il appartient au client connecté.
   * Un reçu rattaché à un autre email n'est jamais exposé.
   */
  readonly receipt = computed(() => {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    const receipt = this.receiptService.getReceiptById(id);
    if (receipt === undefined) {
      return undefined;
    }
    const email = (this.authService.currentUser()?.email ?? '').trim().toLowerCase();
    return receipt.clientEmail === email ? receipt : undefined;
  });

  /** Lance l'impression du navigateur (permettant l'enregistrement en PDF). */
  print(): void {
    window.print();
  }
}
