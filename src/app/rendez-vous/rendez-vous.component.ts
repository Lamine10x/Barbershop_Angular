import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import {
  RendezVousService,
  Hairdresser,
  AppointmentConflictError,
  AdministratorClientError,
} from './rendez-vous.service';
import { AuthService } from '../authentication/auth.service';
import { CatalogueService } from '../catalogue/catalogue.service';

@Component({
  selector: 'app-rendez-vous',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './rendez-vous.component.html',
})
export class RendezVousComponent {
  private readonly rendezVousService = inject(RendezVousService);
  private readonly catalogueService = inject(CatalogueService);
  protected readonly authService = inject(AuthService);
  private readonly route = inject(ActivatedRoute);

  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'administrator');

  readonly hairdressers = this.rendezVousService.getHairdressers();
  readonly selectedHairdresserId = signal<string>(this.hairdressers[0]?.id || 'hd-1');

  // Date par défaut aujourd'hui YYYY-MM-DD
  readonly selectedDate = signal<string>(new Date().toISOString().substring(0, 10));
  readonly selectedSlot = signal<string>('');
  
  // Un administrateur ne s'auto-attribue pas le RDV : le champ commence vide pour saisir l'email du client
  readonly clientEmail = signal<string>(
    this.authService.currentUser()?.role === 'administrator'
      ? ''
      : (this.authService.currentUser()?.email || '')
  );

  readonly successMessage = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);

  // Créneaux disponibles pour le coiffeur et la date sélectionnés
  readonly availableSlots = computed(() => {
    return this.rendezVousService.getAvailableSlots(
      this.selectedHairdresserId(),
      this.selectedDate(),
    );
  });

  // Historique complet pour le coiffeur sélectionné
  readonly history = computed(() => {
    return this.rendezVousService.getHistoryByHairdresser(this.selectedHairdresserId());
  });

  constructor() {
    this.route.queryParams.subscribe((params) => {
      if (params['prestationId']) {
        const prest = this.catalogueService
          .getAll()
          .find((p) => p.id === params['prestationId']);
        if (prest) {
          this.successMessage.set(`Prestation sélectionnée : ${prest.name} (${prest.price} €)`);
        }
      }
    });
  }

  selectHairdresser(id: string): void {
    this.selectedHairdresserId.set(id);
    this.selectedSlot.set('');
    this.errorMessage.set(null);
  }

  selectSlot(slot: string): void {
    this.selectedSlot.set(slot);
    this.errorMessage.set(null);
  }

  cancelAppointment(id: string): void {
    this.rendezVousService.cancel(id);
    this.successMessage.set('Rendez-vous annulé avec succès.');
  }

  book(): void {
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const email = this.clientEmail().trim().toLowerCase();

    // Règle métier : un compte administrateur ne peut pas être enregistré comme client
    if (this.authService.isAdministratorEmail(email)) {
      this.errorMessage.set(
        'Règle salon : un compte administrateur ne peut pas être enregistré comme client. Veuillez renseigner l\'email du client (visite au salon ou appel téléphonique).'
      );
      return;
    }

    if (!email) {
      this.errorMessage.set(
        this.isAdmin()
          ? 'Veuillez saisir l\'email du client pour enregistrer sa réservation.'
          : 'Veuillez renseigner votre email.'
      );
      return;
    }

    if (!this.selectedSlot()) {
      this.errorMessage.set('Veuillez sélectionner un créneau horaire.');
      return;
    }

    try {
      this.rendezVousService.book({
        clientEmail: email,
        hairdresserId: this.selectedHairdresserId(),
        date: this.selectedDate(),
        startTime: this.selectedSlot(),
      });
      this.successMessage.set(
        `Rendez-vous confirmé avec succès pour le client (${email}) le ${this.selectedDate()} à ${this.selectedSlot()} !`,
      );
      this.selectedSlot.set('');
      if (this.isAdmin()) {
        this.clientEmail.set('');
      }
    } catch (err) {
      if (err instanceof AppointmentConflictError || err instanceof AdministratorClientError) {
        this.errorMessage.set(err.message);
      } else {
        this.errorMessage.set('Une erreur est survenue lors de la réservation.');
      }
    }
  }
}
