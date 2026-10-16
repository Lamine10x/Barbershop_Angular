import { TestBed } from '@angular/core/testing';
import { ReceiptService, ReceiptError } from './receipt.service';

describe('ReceiptService', () => {
  let service: ReceiptService;
  const day = '2026-10-16';

  const baseInput = {
    clientEmail: 'lea@example.com',
    clientName: 'Léa',
    prestationName: 'Coupe Homme Classique',
    prestataireName: 'Alexandre',
    day,
    amount: 25,
    paymentMethod: 'Espèces',
  };

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(ReceiptService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('génère un reçu rattaché au client avec un numéro de référence', () => {
    const receipt = service.createReceipt({
      ...baseInput,
      clientEmail: 'Lea@Example.com',
      clientName: 'Léa Martin',
      amount: 40,
      paymentMethod: 'Carte Bancaire',
    });

    expect(receipt.id).toBeDefined();
    expect(receipt.clientEmail).toBe('lea@example.com');
    expect(receipt.amount).toBe(40);
    expect(receipt.reference).toMatch(/^REC-\d{8}-[A-Z0-9]{4}$/);
    expect(service.getReceiptsForClient('lea@example.com')).toContainEqual(receipt);
  });

  it('enregistre la prestation et le prestataire sur le reçu', () => {
    const receipt = service.createReceipt({
      ...baseInput,
      prestationName: 'Formule Complète Barber',
      prestataireName: 'Julien',
    });

    expect(receipt.prestationName).toBe('Formule Complète Barber');
    expect(receipt.prestataireName).toBe('Julien');
  });

  it('ne renvoie que les reçus du client demandé', () => {
    service.createReceipt({ ...baseInput, clientEmail: 'lea@example.com', clientName: 'Léa', amount: 25 });
    service.createReceipt({ ...baseInput, clientEmail: 'paul@example.com', clientName: 'Paul', amount: 30 });

    const leaReceipts = service.getReceiptsForClient('LEA@example.com');
    expect(leaReceipts.length).toBe(1);
    expect(leaReceipts[0].clientEmail).toBe('lea@example.com');
  });

  it('refuse un montant nul ou négatif', () => {
    expect(() => service.createReceipt({ ...baseInput, amount: 0 })).toThrow(ReceiptError);
    expect(service.receipts().length).toBe(0);
  });

  it('refuse la génération sans client sélectionné', () => {
    expect(() => service.createReceipt({ ...baseInput, clientEmail: '   ', clientName: '' })).toThrow(ReceiptError);
  });

  it('refuse la génération sans prestation sélectionnée', () => {
    expect(() => service.createReceipt({ ...baseInput, prestationName: '  ' })).toThrow(ReceiptError);
  });

  it('refuse la génération sans prestataire sélectionné', () => {
    expect(() => service.createReceipt({ ...baseInput, prestataireName: '' })).toThrow(ReceiptError);
  });

  it('retrouve un reçu par son identifiant', () => {
    const receipt = service.createReceipt(baseInput);

    expect(service.getReceiptById(receipt.id)).toEqual(receipt);
    expect(service.getReceiptById('inconnu')).toBeUndefined();
  });
});
