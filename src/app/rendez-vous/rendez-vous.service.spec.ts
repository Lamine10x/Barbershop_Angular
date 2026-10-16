import { TestBed } from '@angular/core/testing';
import {
  RendezVousService,
  AppointmentConflictError,
  AdministratorClientError,
  DAILY_SLOTS,
} from './rendez-vous.service';

describe('RendezVousService', () => {
  let service: RendezVousService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(RendezVousService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('affiche les créneaux disponibles pour un coiffeur donné', () => {
    const slots = service.getAvailableSlots('hd-1', '2026-10-20');
    expect(slots).toEqual(DAILY_SLOTS);
  });

  it('permet de réserver un créneau et met à jour les disponibilités', () => {
    const apt = service.book({
      clientEmail: 'client@example.com',
      hairdresserId: 'hd-1',
      date: '2026-10-20',
      startTime: '10:30',
    });

    expect(apt.id).toBeDefined();
    expect(apt.status).toBe('booked');

    const updatedSlots = service.getAvailableSlots('hd-1', '2026-10-20');
    expect(updatedSlots).not.toContain('10:30');
    expect(updatedSlots.length).toBe(DAILY_SLOTS.length - 1);
  });

  it('interdit les chevauchements et refuse une réservation en doublon sur le même créneau', () => {
    service.book({
      clientEmail: 'client1@example.com',
      hairdresserId: 'hd-1',
      date: '2026-10-20',
      startTime: '14:00',
    });

    expect(() => {
      service.book({
        clientEmail: 'client2@example.com',
        hairdresserId: 'hd-1',
        date: '2026-10-20',
        startTime: '14:00',
      });
    }).toThrow(AppointmentConflictError);
  });

  it('permet à un autre coiffeur d\'être réservé sur la même plage horaire sans conflit', () => {
    service.book({
      clientEmail: 'client1@example.com',
      hairdresserId: 'hd-1',
      date: '2026-10-20',
      startTime: '14:00',
    });

    const aptOther = service.book({
      clientEmail: 'client2@example.com',
      hairdresserId: 'hd-2',
      date: '2026-10-20',
      startTime: '14:00',
    });

    expect(aptOther.id).toBeDefined();
  });

  it('refuse d\'enregistrer un compte administrateur comme client', () => {
    expect(() => {
      service.book({
        clientEmail: 'admin@barbersop.fr',
        hairdresserId: 'hd-1',
        date: '2026-10-20',
        startTime: '09:00',
      });
    }).toThrow(AdministratorClientError);

    // La casse ne doit pas permettre de contourner la règle
    expect(() => {
      service.book({
        clientEmail: 'Admin@Barbersop.FR',
        hairdresserId: 'hd-1',
        date: '2026-10-20',
        startTime: '09:45',
      });
    }).toThrow(AdministratorClientError);
  });

  it('consulte l\'historique des rendez-vous passés d\'un coiffeur avec ses clients', () => {
    service.book({
      clientEmail: 'thomas@example.com',
      hairdresserId: 'hd-1',
      date: '2026-10-18',
      startTime: '09:00',
    });
    service.book({
      clientEmail: 'julie@example.com',
      hairdresserId: 'hd-1',
      date: '2026-10-19',
      startTime: '11:15',
    });

    const history = service.getHistoryByHairdresser('hd-1');
    expect(history.length).toBe(2);
    expect(history.some((a) => a.clientEmail === 'thomas@example.com')).toBe(true);
    expect(history.some((a) => a.clientEmail === 'julie@example.com')).toBe(true);
  });
});
