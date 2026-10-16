import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { MesRecusComponent } from './mes-recus.component';
import { AuthService } from '../authentication/auth.service';
import { ReceiptService } from './receipt.service';

describe('MesRecusComponent', () => {
  let authService: AuthService;
  let receiptService: ReceiptService;
  const day = '2026-10-16';

  beforeEach(async () => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      imports: [MesRecusComponent],
      providers: [provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
    receiptService = TestBed.inject(ReceiptService);
    await authService.register({
      email: 'lea@example.com',
      password: 'secret123',
      firstName: 'Léa',
      lastName: 'Martin',
      role: 'client',
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('n\'affiche que les reçus du client connecté', () => {
    const lea = receiptService.createReceipt({
      clientEmail: 'lea@example.com',
      clientName: 'Léa Martin',
      prestationName: 'Coupe Homme Classique',
      prestataireName: 'Alexandre',
      day,
      amount: 40,
      paymentMethod: 'Carte Bancaire',
    });
    const paul = receiptService.createReceipt({
      clientEmail: 'paul@example.com',
      clientName: 'Paul Durand',
      prestationName: 'Taille & Entretien de Barbe',
      prestataireName: 'Lucas',
      day,
      amount: 30,
      paymentMethod: 'Espèces',
    });

    const fixture = TestBed.createComponent(MesRecusComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain(lea.reference);
    expect(text).not.toContain(paul.reference);
    expect(fixture.nativeElement.querySelectorAll('.table-row').length).toBe(1);
  });

  it('affiche un message lorsque le client n\'a aucun reçu', () => {
    const fixture = TestBed.createComponent(MesRecusComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.receipts-empty')).not.toBeNull();
    expect(fixture.nativeElement.querySelectorAll('.table-row').length).toBe(0);
  });
});
