import { Injectable, inject, signal } from '@angular/core';
import { RendezVous } from '../core/models';
import { loadJson, saveJson } from '../core/persistence';
import { AuthService } from '../authentication/auth.service';

const RENDEZ_VOUS_KEY = 'rendez-vous';

export interface Hairdresser {
  id: string;
  name: string;
  specialty: string;
  avatar?: string;
}

export const HAIRDRESSERS: Hairdresser[] = [
  { id: 'hd-1', name: 'Alexandre', specialty: 'Maître barbier & Dégradés américan' },
  { id: 'hd-2', name: 'Julien', specialty: 'Coupes classiques & Soins traditionnels' },
  { id: 'hd-3', name: 'Lucas', specialty: 'Taille de barbe sculptée & Coloration' },
];

export const DAILY_SLOTS = [
  '09:00',
  '09:45',
  '10:30',
  '11:15',
  '14:00',
  '14:45',
  '15:30',
  '16:15',
  '17:00',
  '17:45',
];

export class AppointmentConflictError extends Error {}

/** Levée lorsqu'un compte administrateur est utilisé comme client d'un rendez-vous. */
export class AdministratorClientError extends Error {}

@Injectable({ providedIn: 'root' })
export class RendezVousService {
  private readonly authService = inject(AuthService);
  private readonly _appointments = signal<RendezVous[]>([]);
  readonly appointments = this._appointments.asReadonly();

  constructor() {
    this.init();
  }

  private init(): void {
    const saved = loadJson<RendezVous[]>(RENDEZ_VOUS_KEY, []);
    this._appointments.set(saved);
  }

  getHairdressers(): Hairdresser[] {
    return HAIRDRESSERS;
  }

  /**
   * Retourne la liste des créneaux horaires encore disponibles
   * pour un coiffeur donné à une date donnée (YYYY-MM-DD).
   */
  getAvailableSlots(hairdresserId: string, date: string): string[] {
    const bookedSlots = this._appointments()
      .filter(
        (apt) =>
          apt.hairdresserId === hairdresserId &&
          apt.date === date &&
          apt.status === 'booked',
      )
      .map((apt) => apt.startTime);

    return DAILY_SLOTS.filter((slot) => !bookedSlots.includes(slot));
  }

  /**
   * Réserve un rendez-vous. Refuse et lève une erreur en cas de conflit/chevauchement,
   * ou si l'email correspond à un compte administrateur (un admin n'est jamais un client).
   */
  book(input: {
    clientEmail: string;
    hairdresserId: string;
    date: string;
    startTime: string;
  }): RendezVous {
    if (this.authService.isAdministratorEmail(input.clientEmail)) {
      throw new AdministratorClientError(
        'Un compte administrateur ne peut pas être enregistré comme client. Veuillez saisir l\'email d\'un client.',
      );
    }

    const isConflict = this._appointments().some(
      (apt) =>
        apt.hairdresserId === input.hairdresserId &&
        apt.date === input.date &&
        apt.startTime === input.startTime &&
        apt.status === 'booked',
    );

    if (isConflict) {
      throw new AppointmentConflictError(
        'Ce créneau est déjà réservé pour ce coiffeur. Veuillez en choisir un autre.',
      );
    }

    const newApt: RendezVous = {
      id: `apt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientEmail: input.clientEmail.trim().toLowerCase(),
      hairdresserId: input.hairdresserId,
      date: input.date,
      startTime: input.startTime,
      status: 'booked',
    };

    const updated = [...this._appointments(), newApt];
    this._appointments.set(updated);
    saveJson(RENDEZ_VOUS_KEY, updated);
    return newApt;
  }

  /**
   * Retourne l'historique complet des rendez-vous d'un coiffeur (avec ses clients).
   */
  getHistoryByHairdresser(hairdresserId: string): RendezVous[] {
    return this._appointments()
      .filter((apt) => apt.hairdresserId === hairdresserId)
      .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`));
  }

  /**
   * Retourne les rendez-vous d'un client.
   */
  getByClient(clientEmail: string): RendezVous[] {
    const email = clientEmail.trim().toLowerCase();
    return this._appointments().filter((apt) => apt.clientEmail === email);
  }

  /**
   * Annulation d'un rendez-vous.
   */
  cancel(appointmentId: string): void {
    const updated = this._appointments().map((apt) =>
      apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt,
    );
    this._appointments.set(updated);
    saveJson(RENDEZ_VOUS_KEY, updated);
  }
}
