import { TestBed } from '@angular/core/testing';
import { FideliteService, LOYALTY_TIERS } from './fidelite.service';

describe('FideliteService', () => {
  let service: FideliteService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(FideliteService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('définit les 4 paliers de fidélité et leurs seuils de points', () => {
    const tiers = service.getTiers();
    expect(tiers.length).toBe(4);
    expect(tiers.map((t) => t.name)).toEqual(['Bronze', 'Argent', 'Or', 'Platine']);
    expect(tiers.map((t) => t.minPoints)).toEqual([0, 50, 100, 200]);
  });

  it('attribue des points lors de la réalisation d\'un service', () => {
    const clientEmail = 'nouveau@example.com';
    const profile = service.addPoints(clientEmail, 30, 'Coupe Homme');

    expect(profile.email).toBe(clientEmail);
    expect(profile.points).toBe(30);
    expect(profile.tier).toBe('Bronze');
  });

  it('fait passer automatiquement le client au palier supérieur lors du dépassement du seuil', () => {
    const clientEmail = 'client-fidele@example.com';

    // Ajout de 60 points -> franchit le seuil 50 (Argent)
    const profile1 = service.addPoints(clientEmail, 60, 'Formule Complète');
    expect(profile1.points).toBe(60);
    expect(profile1.tier).toBe('Argent');
    expect(profile1.rewards).toContain('Soin cuir chevelu ou huile barbe offerte');

    // Ajout de 50 points -> total 110 points -> franchit le seuil 100 (Or)
    const profile2 = service.addPoints(clientEmail, 50, 'Coupe & Barbe');
    expect(profile2.points).toBe(110);
    expect(profile2.tier).toBe('Or');
    expect(profile2.rewards).toContain('20% de remise immédiate sur votre prestation');
  });

  it('attribue une récompense et permet de consulter l\'historique des activités', () => {
    const clientEmail = 'vip@example.com';
    service.addPoints(clientEmail, 25, 'Taille Barbe');
    service.claimReward(clientEmail, 'Boisson offerte');

    const history = service.getActivityHistory(clientEmail);
    expect(history.length).toBe(2);
    expect(history.some((h) => h.type === 'points_earned')).toBe(true);
    expect(history.some((h) => h.type === 'reward_claimed' && h.description.includes('Boisson offerte'))).toBe(true);
  });
});
