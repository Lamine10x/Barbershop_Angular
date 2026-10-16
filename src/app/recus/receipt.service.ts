import { Injectable, signal } from '@angular/core';
import { Receipt } from '../core/models';
import { loadJson, saveJson } from '../core/persistence';

const RECEIPTS_KEY = 'receipts';

/** Erreur levée lorsqu'un reçu ne peut pas être généré (saisie invalide). */
export class ReceiptError extends Error {}

export interface CreateReceiptInput {
  clientEmail: string;
  clientName: string;
  prestationName: string;
  prestataireName: string;
  day: string;
  amount: number;
  paymentMethod: string;
}

@Injectable({ providedIn: 'root' })
export class ReceiptService {
  private readonly _receipts = signal<Receipt[]>([]);
  readonly receipts = this._receipts.asReadonly();

  constructor() {
    this.init();
  }

  private init(): void {
    this._receipts.set(loadJson<Receipt[]>(RECEIPTS_KEY, []));
  }

  /**
   * Génère un reçu de caisse rattaché à un client.
   * Lève une `ReceiptError` si le client, la prestation ou le prestataire est absent,
   * ou si le montant n'est pas positif.
   */
  createReceipt(input: CreateReceiptInput): Receipt {
    const clientEmail = input.clientEmail?.trim().toLowerCase() ?? '';
    if (!clientEmail) {
      throw new ReceiptError('Un client doit être sélectionné.');
    }
    const prestationName = input.prestationName?.trim() ?? '';
    if (!prestationName) {
      throw new ReceiptError('Une prestation doit être sélectionnée.');
    }
    const prestataireName = input.prestataireName?.trim() ?? '';
    if (!prestataireName) {
      throw new ReceiptError('Un prestataire doit être sélectionné.');
    }
    if (!(Number(input.amount) > 0)) {
      throw new ReceiptError('Le montant doit être supérieur à zéro.');
    }

    const receipt: Receipt = {
      id: `receipt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      reference: this.generateReference(),
      clientEmail,
      clientName: input.clientName?.trim() || clientEmail,
      prestationName,
      prestataireName,
      day: input.day,
      amount: Number(input.amount),
      paymentMethod: input.paymentMethod,
    };

    const updated = [...this._receipts(), receipt];
    this._receipts.set(updated);
    saveJson(RECEIPTS_KEY, updated);
    return receipt;
  }

  /** Tous les reçus rattachés à un client (email, insensible à la casse). */
  getReceiptsForClient(email: string): Receipt[] {
    const normalized = email?.trim().toLowerCase() ?? '';
    return this._receipts().filter((r) => r.clientEmail === normalized);
  }

  /** Un reçu par son identifiant, ou `undefined`. */
  getReceiptById(id: string): Receipt | undefined {
    return this._receipts().find((r) => r.id === id);
  }

  private generateReference(): string {
    const datePart = new Date().toISOString().substring(0, 10).replace(/-/g, '');
    const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `REC-${datePart}-${suffix}`;
  }
}
