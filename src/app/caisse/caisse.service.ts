import { Injectable, signal } from '@angular/core';
import { Sale, CashPayment, DailyCash } from '../core/models';
import { loadJson, saveJson } from '../core/persistence';

const CAISSE_SALES_KEY = 'caisse_sales';
const CAISSE_PAYMENTS_KEY = 'caisse_payments';

export interface ReconciliationReport {
  day: string;
  totalSales: number;
  totalPayments: number;
  difference: number;
  isBalanced: boolean;
  salesCount: number;
  paymentsCount: number;
}

@Injectable({ providedIn: 'root' })
export class CaisseService {
  private readonly _sales = signal<Sale[]>([]);
  private readonly _payments = signal<CashPayment[]>([]);

  readonly sales = this._sales.asReadonly();
  readonly payments = this._payments.asReadonly();

  constructor() {
    this.init();
  }

  private init(): void {
    const today = new Date().toISOString().substring(0, 10);
    const savedSales = loadJson<Sale[]>(CAISSE_SALES_KEY, [
      { id: 'sale-1', day: today, total: 25, paymentMethod: 'Carte Bancaire' },
      { id: 'sale-2', day: today, total: 40, paymentMethod: 'Espèces' },
    ]);
    this._sales.set(savedSales);

    const savedPayments = loadJson<CashPayment[]>(CAISSE_PAYMENTS_KEY, [
      { id: 'pay-1', day: today, amount: 25, method: 'Carte Bancaire' },
      { id: 'pay-2', day: today, amount: 40, method: 'Espèces' },
    ]);
    this._payments.set(savedPayments);
  }

  /**
   * Enregistre une vente pour la journée spécifiée.
   */
  recordSale(input: { day: string; total: number; paymentMethod: string }): Sale {
    const newSale: Sale = {
      id: `sale-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      day: input.day,
      total: Number(input.total),
      paymentMethod: input.paymentMethod,
    };

    const updated = [...this._sales(), newSale];
    this._sales.set(updated);
    saveJson(CAISSE_SALES_KEY, updated);
    return newSale;
  }

  /**
   * Enregistre un encaissement / paiement pour la journée spécifiée.
   */
  recordPayment(input: { day: string; amount: number; method: string }): CashPayment {
    const newPayment: CashPayment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      day: input.day,
      amount: Number(input.amount),
      method: input.method,
    };

    const updated = [...this._payments(), newPayment];
    this._payments.set(updated);
    saveJson(CAISSE_PAYMENTS_KEY, updated);
    return newPayment;
  }

  /**
   * Récupère la liste des ventes enregistrées d'une journée.
   */
  getSalesForDay(day: string): Sale[] {
    return this._sales().filter((s) => s.day === day);
  }

  /**
   * Récupère la liste des paiements enregistrés d'une journée.
   */
  getPaymentsForDay(day: string): CashPayment[] {
    return this._payments().filter((p) => p.day === day);
  }

  /**
   * Calcule le total des paiements et effectue le rapprochement avec les ventes de la journée.
   */
  getReconciliation(day: string): ReconciliationReport {
    const daySales = this.getSalesForDay(day);
    const dayPayments = this.getPaymentsForDay(day);

    const totalSales = Number(
      daySales.reduce((sum, s) => sum + s.total, 0).toFixed(2),
    );
    const totalPayments = Number(
      dayPayments.reduce((sum, p) => sum + p.amount, 0).toFixed(2),
    );
    const difference = Number((totalPayments - totalSales).toFixed(2));

    return {
      day,
      totalSales,
      totalPayments,
      difference,
      isBalanced: difference === 0,
      salesCount: daySales.length,
      paymentsCount: dayPayments.length,
    };
  }
}
