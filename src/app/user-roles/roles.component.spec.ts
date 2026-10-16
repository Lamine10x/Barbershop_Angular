import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { RolesComponent } from './roles.component';
import { CatalogueService } from '../catalogue/catalogue.service';
import { AuthService } from '../authentication/auth.service';
import { ReceiptService } from '../recus/receipt.service';

describe('RolesComponent — ajout de prestation illustrée', () => {
  let catalogueService: CatalogueService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      imports: [RolesComponent],
      providers: [provideRouter([])],
    });
    catalogueService = TestBed.inject(CatalogueService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('crée une prestation avec l\'URL d\'image saisie puis vide le champ', () => {
    const fixture = TestBed.createComponent(RolesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.newPrestationName.set('Soin Barbe Premium');
    component.newPrestationImage.set('https://example.com/soin.jpg');
    component.createPrestation();

    const created = catalogueService.getAll().find((p) => p.name === 'Soin Barbe Premium');
    expect(created).toBeDefined();
    expect(created?.imageUrl).toBe('https://example.com/soin.jpg');
    expect(component.newPrestationImage()).toBe('');
  });

  it('crée une prestation sans image quand le champ est vide', () => {
    const fixture = TestBed.createComponent(RolesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.newPrestationName.set('Coupe Simple');
    component.newPrestationImage.set('   ');
    component.createPrestation();

    const created = catalogueService.getAll().find((p) => p.name === 'Coupe Simple');
    expect(created).toBeDefined();
    expect(created?.imageUrl).toBeUndefined();
  });
});

describe('RolesComponent — génération de reçu de caisse', () => {
  let authService: AuthService;
  let receiptService: ReceiptService;

  beforeEach(async () => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      imports: [RolesComponent],
      providers: [provideRouter([])],
    });
    authService = TestBed.inject(AuthService);
    receiptService = TestBed.inject(ReceiptService);
    await authService.register({
      email: 'client@barbersop.fr',
      password: 'secret123',
      firstName: 'Léa',
      lastName: 'Martin',
      role: 'client',
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('génère un reçu rattaché au client sélectionné', () => {
    const fixture = TestBed.createComponent(RolesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.refreshUsers();
    fixture.detectChanges();

    component.receiptClientEmail.set('client@barbersop.fr');
    component.receiptPrestationName.set('Coupe Homme Classique');
    component.receiptPrestataireName.set('Alexandre');
    component.receiptAmount.set(40);
    component.receiptMethod.set('Carte Bancaire');
    component.createReceipt();

    const receipts = receiptService.getReceiptsForClient('client@barbersop.fr');
    expect(receipts.length).toBe(1);
    expect(receipts[0].amount).toBe(40);
    expect(receipts[0].clientName).toBe('Léa Martin');
    expect(receipts[0].prestationName).toBe('Coupe Homme Classique');
    expect(receipts[0].prestataireName).toBe('Alexandre');
    expect(component.receiptError()).toBeNull();
  });

  it('affiche une erreur et ne crée rien si aucun client n\'est sélectionné', () => {
    const fixture = TestBed.createComponent(RolesComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();

    component.receiptClientEmail.set('');
    component.createReceipt();

    expect(component.receiptError()).toBeTruthy();
    expect(receiptService.receipts().length).toBe(0);
  });
});
