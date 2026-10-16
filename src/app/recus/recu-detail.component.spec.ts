import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { RecuDetailComponent } from './recu-detail.component';
import { AuthService } from '../authentication/auth.service';
import { ReceiptService } from './receipt.service';

describe('RecuDetailComponent', () => {
  let authService: AuthService;
  let receiptService: ReceiptService;
  let routeId = '';
  const day = '2026-10-16';

  beforeEach(async () => {
    window.localStorage.clear();
    routeId = '';
    TestBed.configureTestingModule({
      imports: [RecuDetailComponent],
      providers: [
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get paramMap() {
                return convertToParamMap({ id: routeId });
              },
            },
          },
        },
      ],
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

  it('affiche le reçu du client connecté', () => {
    const receipt = receiptService.createReceipt({
      clientEmail: 'lea@example.com',
      clientName: 'Léa Martin',
      prestationName: 'Formule Complète Barber',
      prestataireName: 'Julien',
      day,
      amount: 40,
      paymentMethod: 'Carte Bancaire',
    });
    routeId = receipt.id;

    const fixture = TestBed.createComponent(RecuDetailComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.receipt-document')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain(receipt.reference);
  });

  it('affiche la prestation, le prestataire, le prix et le remerciement, sans emoji', () => {
    const receipt = receiptService.createReceipt({
      clientEmail: 'lea@example.com',
      clientName: 'Léa Martin',
      prestationName: 'Coupe Homme Classique',
      prestataireName: 'Alexandre',
      day,
      amount: 25,
      paymentMethod: 'Carte Bancaire',
    });
    routeId = receipt.id;

    const fixture = TestBed.createComponent(RecuDetailComponent);
    fixture.detectChanges();

    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Coupe Homme Classique');
    expect(text).toContain('Alexandre');
    expect(text).toContain('25 €');
    expect(text).toContain('Merci de nous avoir fait confiance et à bientôt !');
    expect(/\p{Extended_Pictographic}/u.test(text)).toBe(false);
  });

  it('ne montre pas le reçu rattaché à un autre client', () => {
    const other = receiptService.createReceipt({
      clientEmail: 'paul@example.com',
      clientName: 'Paul Durand',
      prestationName: 'Taille & Entretien de Barbe',
      prestataireName: 'Lucas',
      day,
      amount: 30,
      paymentMethod: 'Espèces',
    });
    routeId = other.id;

    const fixture = TestBed.createComponent(RecuDetailComponent);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.receipt-document')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('introuvable');
  });
});
