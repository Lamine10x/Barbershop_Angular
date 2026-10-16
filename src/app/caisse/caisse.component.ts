import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CaisseService } from './caisse.service';
import { AuthService } from '../authentication/auth.service';

@Component({
  selector: 'app-caisse',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './caisse.component.html',
})
export class CaisseComponent {
  private readonly caisseService = inject(CaisseService);
  protected readonly authService = inject(AuthService);

  readonly selectedDay = signal<string>(new Date().toISOString().substring(0, 10));

  // Formulaire nouvelle vente
  readonly saleTotal = signal<number>(25);
  readonly saleMethod = signal<string>('Carte Bancaire');

  // Formulaire nouveau paiement
  readonly payAmount = signal<number>(25);
  readonly payMethod = signal<string>('Carte Bancaire');

  readonly message = signal<string | null>(null);

  readonly daySales = computed(() => {
    return this.caisseService.getSalesForDay(this.selectedDay());
  });

  readonly dayPayments = computed(() => {
    return this.caisseService.getPaymentsForDay(this.selectedDay());
  });

  readonly reconciliation = computed(() => {
    return this.caisseService.getReconciliation(this.selectedDay());
  });

  addSale(): void {
    if (this.saleTotal() <= 0) return;
    this.caisseService.recordSale({
      day: this.selectedDay(),
      total: this.saleTotal(),
      paymentMethod: this.saleMethod(),
    });
    this.message.set(`Vente de ${this.saleTotal()} € enregistrée.`);
  }

  addPayment(): void {
    if (this.payAmount() <= 0) return;
    this.caisseService.recordPayment({
      day: this.selectedDay(),
      amount: this.payAmount(),
      method: this.payMethod(),
    });
    this.message.set(`Paiement de ${this.payAmount()} € enregistré.`);
  }
}
