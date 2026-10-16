import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe, DecimalPipe, NgClass } from '@angular/common';
import { AuthService } from '../authentication/auth.service';
import { RolesService, ROLES } from './roles.service';
import { CaisseService } from '../caisse/caisse.service';
import { RendezVousService } from '../rendez-vous/rendez-vous.service';
import { CatalogueService } from '../catalogue/catalogue.service';
import { FideliteService } from '../fidelite/fidelite.service';
import { ReceiptService } from '../recus/receipt.service';
import { User, UserRole } from '../core/models';
import { DAILY_SLOTS } from '../rendez-vous/rendez-vous.service';

type AdminTab = 'dashboard' | 'users' | 'catalogue' | 'team' | 'receipts';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [FormsModule, RouterLink, DatePipe, DecimalPipe],
  templateUrl: './roles.component.html',
})
export class RolesComponent {
  protected readonly authService = inject(AuthService);
  protected readonly rolesService = inject(RolesService);
  protected readonly caisseService = inject(CaisseService);
  protected readonly rdvService = inject(RendezVousService);
  protected readonly catalogueService = inject(CatalogueService);
  protected readonly fideliteService = inject(FideliteService);
  protected readonly receiptService = inject(ReceiptService);
  private readonly router = inject(Router);

  readonly roles = ROLES;
  readonly todayIso = new Date().toISOString().substring(0, 10);
  readonly timeSlots = DAILY_SLOTS;

  // ── Navigation ──
  readonly activeTab = signal<AdminTab>('dashboard');

  setTab(tab: AdminTab): void {
    this.activeTab.set(tab);
  }

  // ── Users state ──
  readonly usersList = signal<User[]>([]);
  readonly successMessage = signal<string | null>(null);
  readonly userSearch = signal('');
  readonly roleFilter = signal<'all' | UserRole>('all');

  // ── New Prestation Form ──
  readonly newPrestationName = signal('');
  readonly newPrestationDesc = signal('');
  readonly newPrestationDuration = signal(30);
  readonly newPrestationPrice = signal(25);
  readonly newPrestationCategory = signal('Cheveux');
  readonly newPrestationImage = signal('');

  // ── Génération de reçus ──
  readonly receiptClientEmail = signal('');
  readonly receiptPrestationName = signal('');
  readonly receiptPrestataireName = signal('');
  readonly receiptAmount = signal(25);
  readonly receiptMethod = signal('Carte Bancaire');
  readonly receiptError = signal<string | null>(null);

  // ── KPIs ──
  readonly todayCash = computed(() => this.caisseService.getReconciliation(this.todayIso));
  readonly appointmentsCount = computed(() => this.rdvService.appointments().length);
  readonly prestationsCount = computed(() => this.catalogueService.prestations().length);
  readonly hairdressers = this.rdvService.getHairdressers();

  readonly adminCount = computed(() => this.usersList().filter((u) => u.role === 'administrator').length);
  readonly clientCount = computed(() => this.usersList().filter((u) => u.role === 'client').length);

  readonly clientUsers = computed(() => this.usersList().filter((u) => u.role === 'client'));

  readonly receiptsList = computed(() =>
    [...this.receiptService.receipts()].sort((a, b) => b.day.localeCompare(a.day)),
  );

  readonly avgPrice = computed(() => {
    const list = this.catalogueService.prestations();
    if (!list.length) return 0;
    return list.reduce((sum, p) => sum + p.price, 0) / list.length;
  });

  readonly avgDuration = computed(() => {
    const list = this.catalogueService.prestations();
    if (!list.length) return 0;
    return Math.round(list.reduce((sum, p) => sum + p.durationMinutes, 0) / list.length);
  });

  readonly filteredUsers = computed(() => {
    let list = this.usersList();
    const search = this.userSearch().toLowerCase().trim();
    const filter = this.roleFilter();
    if (filter !== 'all') {
      list = list.filter((u) => u.role === filter);
    }
    if (search) {
      list = list.filter(
        (u) =>
          u.firstName.toLowerCase().includes(search) ||
          u.lastName.toLowerCase().includes(search) ||
          u.email.toLowerCase().includes(search),
      );
    }
    return list;
  });

  readonly fillRate = computed(() => {
    const count = this.todayCash().salesCount;
    return Math.min((count / (count + 5)) * 100, 100);
  });

  // Rights matrix
  readonly rightsMatrix = [
    { name: '📅 Réserver un rendez-vous', client: true, admin: true },
    { name: '💈 Voir le catalogue', client: true, admin: true },
    { name: '⭐ Programme fidélité', client: true, admin: true },
    { name: '👥 Gérer les utilisateurs', client: false, admin: true },
    { name: '💶 Accès à la caisse', client: false, admin: true },
    { name: '✂️ Modifier le catalogue', client: false, admin: true },
    { name: '📊 Voir les statistiques', client: false, admin: true },
    { name: '🔐 Modifier les rôles', client: false, admin: true },
  ];

  constructor() {
    this.refreshUsers();
  }

  protected currentUser() {
    return this.authService.currentUser();
  }

  refreshUsers(): void {
    this.usersList.set(this.authService.getUsers());
  }

  toggleRole(user: User): void {
    const nextRole: UserRole = user.role === 'administrator' ? 'client' : 'administrator';
    this.authService.updateUserRole(user.id, nextRole);
    this.refreshUsers();
    this.successMessage.set(`Rôle de ${user.firstName} ${user.lastName} mis à jour : ${nextRole}.`);
    setTimeout(() => this.successMessage.set(null), 4000);
  }

  createPrestation(): void {
    if (!this.newPrestationName().trim()) return;

    const imageUrl = this.newPrestationImage().trim();

    this.catalogueService.add({
      name: this.newPrestationName().trim(),
      description: this.newPrestationDesc().trim() || 'Prestation sur mesure réalisée au salon.',
      durationMinutes: Number(this.newPrestationDuration()),
      price: Number(this.newPrestationPrice()),
      category: this.newPrestationCategory(),
      imageUrl: imageUrl || undefined,
    });

    this.successMessage.set(`Nouvelle prestation « ${this.newPrestationName()} » ajoutée au catalogue !`);
    this.newPrestationName.set('');
    this.newPrestationDesc.set('');
    this.newPrestationImage.set('');
    setTimeout(() => this.successMessage.set(null), 4000);
  }

  /** Génère un reçu de caisse rattaché au client sélectionné. */
  createReceipt(): void {
    const client = this.clientUsers().find((u) => u.email === this.receiptClientEmail());
    if (!client) {
      this.receiptError.set('Sélectionnez un client.');
      return;
    }

    try {
      this.receiptService.createReceipt({
        clientEmail: client.email,
        clientName: `${client.firstName} ${client.lastName}`.trim(),
        prestationName: this.receiptPrestationName(),
        prestataireName: this.receiptPrestataireName(),
        day: this.todayIso,
        amount: Number(this.receiptAmount()),
        paymentMethod: this.receiptMethod(),
      });
      this.receiptError.set(null);
      this.receiptPrestationName.set('');
      this.receiptPrestataireName.set('');
      this.successMessage.set(`Reçu généré pour ${client.firstName} ${client.lastName}.`);
      setTimeout(() => this.successMessage.set(null), 4000);
    } catch (error) {
      this.receiptError.set(
        error instanceof Error ? error.message : 'Erreur lors de la génération du reçu.',
      );
    }
  }

  /** Nombre total de RDV pour un coiffeur */
  getHdRdvCount(hairdresserId: string): number {
    return this.rdvService.appointments().filter((a) => a.hairdresserId === hairdresserId).length;
  }

  /** Nombre de RDV aujourd'hui pour un coiffeur */
  getHdTodayCount(hairdresserId: string): number {
    return this.rdvService
      .appointments()
      .filter((a) => a.hairdresserId === hairdresserId && a.date === this.todayIso && a.status === 'booked').length;
  }

  /** Taux d'occupation journalier (sur 10 créneaux) */
  getOccupationPct(hairdresserId: string): number {
    return Math.round((this.getHdTodayCount(hairdresserId) / 10) * 100);
  }

  /** Vérifie si un créneau est réservé pour un coiffeur aujourd'hui */
  isSlotBooked(hairdresserId: string, slot: string): boolean {
    return this.rdvService
      .appointments()
      .some(
        (a) =>
          a.hairdresserId === hairdresserId &&
          a.date === this.todayIso &&
          a.startTime === slot &&
          a.status === 'booked',
      );
  }

  protected signOut(): void {
    this.authService.logout();
    void this.router.navigate(['/login']);
  }
}
