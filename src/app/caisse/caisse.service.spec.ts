import { TestBed } from '@angular/core/testing';
import { CaisseService } from './caisse.service';

describe('CaisseService', () => {
  let service: CaisseService;
  const testDay = '2026-10-25';

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CaisseService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('enregistre les ventes de la journée', () => {
    const sale1 = service.recordSale({
      day: testDay,
      total: 25,
      paymentMethod: 'Carte Bancaire',
    });
    const sale2 = service.recordSale({
      day: testDay,
      total: 35,
      paymentMethod: 'Espèces',
    });

    const sales = service.getSalesForDay(testDay);
    expect(sales.length).toBe(2);
    expect(sales.map((s) => s.id)).toEqual([sale1.id, sale2.id]);
    expect(sales.reduce((sum, s) => sum + s.total, 0)).toBe(60);
  });

  it('enregistre les paiements et permet de les consulter pour une journée donnée', () => {
    const pay1 = service.recordPayment({
      day: testDay,
      amount: 25,
      method: 'Carte Bancaire',
    });
    const pay2 = service.recordPayment({
      day: testDay,
      amount: 35,
      method: 'Espèces',
    });

    const payments = service.getPaymentsForDay(testDay);
    expect(payments.length).toBe(2);
    expect(payments.some((p) => p.id === pay1.id && p.amount === 25)).toBe(true);
    expect(payments.some((p) => p.id === pay2.id && p.amount === 35)).toBe(true);
  });

  it('calcule le total et effectue le rapprochement équilibré de fin de journée', () => {
    // 2 ventes totalisant 75€
    service.recordSale({ day: testDay, total: 25, paymentMethod: 'Carte Bancaire' });
    service.recordSale({ day: testDay, total: 50, paymentMethod: 'Espèces' });

    // 2 paiements totalisant 75€
    service.recordPayment({ day: testDay, amount: 25, method: 'Carte Bancaire' });
    service.recordPayment({ day: testDay, amount: 50, method: 'Espèces' });

    const report = service.getReconciliation(testDay);
    expect(report.totalSales).toBe(75);
    expect(report.totalPayments).toBe(75);
    expect(report.difference).toBe(0);
    expect(report.isBalanced).toBe(true);
  });

  it('détecte un écart lors du rapprochement si les paiements ne correspondent pas aux ventes', () => {
    service.recordSale({ day: testDay, total: 50, paymentMethod: 'Espèces' });
    service.recordPayment({ day: testDay, amount: 45, method: 'Espèces' });

    const report = service.getReconciliation(testDay);
    expect(report.totalSales).toBe(50);
    expect(report.totalPayments).toBe(45);
    expect(report.difference).toBe(-5);
    expect(report.isBalanced).toBe(false);
  });
});
