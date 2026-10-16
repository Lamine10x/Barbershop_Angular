/**
 * Modèles de données partagés par toutes les capacités du salon.
 * Présentation pure : la persistance et la logique métier vivent dans les services.
 */

export type UserRole = 'client' | 'administrator';

export interface User {
  id: string;
  email: string;
  /** Hash du mot de passe, jamais le mot de passe en clair. */
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  loyaltyPoints: number;
  createdAt: string;
}

export interface Prestation {
  id: string;
  name: string;
  description: string;
  durationMinutes: number;
  price: number;
  category: string;
  /** URL d'une image hébergée sur le web. Optionnelle : un visuel de repli est affiché en son absence. */
  imageUrl?: string;
}

export interface Receipt {
  id: string;
  /** Numéro de référence lisible du reçu (ex: REC-20261016-A1B2). */
  reference: string;
  /** Email du client auquel le reçu est rattaché. */
  clientEmail: string;
  /** Nom du client figé au moment de la génération, pour le rendu imprimable. */
  clientName: string;
  /** Prestation réalisée, figée au moment de la génération. */
  prestationName?: string;
  /** Prestataire (coiffeur) ayant réalisé la prestation, figé au moment de la génération. */
  prestataireName?: string;
  /** Date ISO du jour concerné par le reçu. */
  day: string;
  amount: number;
  paymentMethod: string;
}

export interface RendezVous {
  id: string;
  clientEmail: string;
  hairdresserId: string;
  date: string;
  startTime: string;
  status: 'booked' | 'cancelled';
}

export interface ClientProfile {
  email: string;
  points: number;
  tier: string;
  rewards: string[];
}

export interface Sale {
  id: string;
  /** Date ISO du jour concerné par la vente. */
  day: string;
  total: number;
  paymentMethod: string;
}

export interface CashPayment {
  id: string;
  /** Date ISO du jour concerné par le paiement. */
  day: string;
  amount: number;
  method: string;
}

export interface DailyCash {
  /** Date ISO du jour concerné. */
  day: string;
  sales: Sale[];
  payments: CashPayment[];
  /** Somme des paiements enregistrés pour le jour. */
  totalCollected: number;
}
