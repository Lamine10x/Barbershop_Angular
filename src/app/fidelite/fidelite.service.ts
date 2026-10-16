import { Injectable, signal } from '@angular/core';
import { ClientProfile } from '../core/models';
import { loadJson, saveJson } from '../core/persistence';

const LOYALTY_PROFILES_KEY = 'loyalty_profiles';
const LOYALTY_ACTIVITIES_KEY = 'loyalty_activities';

export interface LoyaltyTier {
  name: string;
  minPoints: number;
  rewardAvailable: string;
  badge: string;
}

export const LOYALTY_TIERS: readonly LoyaltyTier[] = [
  { name: 'Bronze', minPoints: 0, rewardAvailable: 'Café & rafraîchissement offert', badge: '🥉' },
  { name: 'Argent', minPoints: 50, rewardAvailable: 'Soin cuir chevelu ou huile barbe offerte', badge: '🥈' },
  { name: 'Or', minPoints: 100, rewardAvailable: '20% de remise immédiate sur votre prestation', badge: '🥇' },
  { name: 'Platine', minPoints: 200, rewardAvailable: 'Formule Complète Barber offerte', badge: '💎' },
];

export interface LoyaltyActivity {
  id: string;
  clientEmail: string;
  date: string;
  type: 'points_earned' | 'reward_claimed' | 'tier_unlocked';
  description: string;
  pointsDelta?: number;
}

@Injectable({ providedIn: 'root' })
export class FideliteService {
  private readonly _profiles = signal<ClientProfile[]>([]);
  private readonly _activities = signal<LoyaltyActivity[]>([]);

  readonly profiles = this._profiles.asReadonly();
  readonly activities = this._activities.asReadonly();

  constructor() {
    this.init();
  }

  private init(): void {
    const savedProfiles = loadJson<ClientProfile[]>(LOYALTY_PROFILES_KEY, [
      {
        email: 'lea@example.com',
        points: 60,
        tier: 'Argent',
        rewards: ['Soin cuir chevelu ou huile barbe offerte'],
      },
      {
        email: 'paul@example.com',
        points: 110,
        tier: 'Or',
        rewards: ['20% de remise immédiate sur votre prestation'],
      },
    ]);
    this._profiles.set(savedProfiles);

    const savedActivities = loadJson<LoyaltyActivity[]>(LOYALTY_ACTIVITIES_KEY, []);
    this._activities.set(savedActivities);
  }

  getTiers(): readonly LoyaltyTier[] {
    return LOYALTY_TIERS;
  }

  calculateTier(points: number): LoyaltyTier {
    for (let i = LOYALTY_TIERS.length - 1; i >= 0; i--) {
      if (points >= LOYALTY_TIERS[i].minPoints) {
        return LOYALTY_TIERS[i];
      }
    }
    return LOYALTY_TIERS[0];
  }

  getProfile(email: string): ClientProfile {
    const normalized = email.trim().toLowerCase();
    const existing = this._profiles().find((p) => p.email === normalized);
    if (existing) {
      return existing;
    }

    const defaultProfile: ClientProfile = {
      email: normalized,
      points: 0,
      tier: 'Bronze',
      rewards: [],
    };
    const updated = [...this._profiles(), defaultProfile];
    this._profiles.set(updated);
    saveJson(LOYALTY_PROFILES_KEY, updated);
    return defaultProfile;
  }

  /**
   * Attribue des points à un client pour un service effectué.
   * Gère la transition automatique de palier.
   */
  addPoints(email: string, points: number, serviceName = 'Prestation'): ClientProfile {
    const profile = this.getProfile(email);
    const newPoints = profile.points + points;
    const oldTier = profile.tier;
    const newTier = this.calculateTier(newPoints);

    const newRewards = [...profile.rewards];
    if (newTier.name !== oldTier && !newRewards.includes(newTier.rewardAvailable)) {
      newRewards.push(newTier.rewardAvailable);
    }

    const updatedProfile: ClientProfile = {
      ...profile,
      points: newPoints,
      tier: newTier.name,
      rewards: newRewards,
    };

    const updatedProfiles = this._profiles().map((p) =>
      p.email === updatedProfile.email ? updatedProfile : p,
    );
    this._profiles.set(updatedProfiles);
    saveJson(LOYALTY_PROFILES_KEY, updatedProfiles);

    // Enregistrer l'activité
    const activity: LoyaltyActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientEmail: profile.email,
      date: new Date().toISOString().substring(0, 10),
      type: 'points_earned',
      description: `+${points} points gagnés (${serviceName})`,
      pointsDelta: points,
    };

    const updatedActivities = [activity, ...this._activities()];
    this._activities.set(updatedActivities);
    saveJson(LOYALTY_ACTIVITIES_KEY, updatedActivities);

    return updatedProfile;
  }

  /**
   * Attribue / valide une récompense débloquée pour le client.
   */
  claimReward(email: string, rewardName: string): ClientProfile {
    const profile = this.getProfile(email);
    if (!profile.rewards.includes(rewardName)) {
      // Débloque et enregistre la récompense
      profile.rewards.push(rewardName);
    }

    const updatedProfiles = this._profiles().map((p) =>
      p.email === profile.email ? profile : p,
    );
    this._profiles.set(updatedProfiles);
    saveJson(LOYALTY_PROFILES_KEY, updatedProfiles);

    const activity: LoyaltyActivity = {
      id: `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      clientEmail: profile.email,
      date: new Date().toISOString().substring(0, 10),
      type: 'reward_claimed',
      description: `Récompense attribuée : ${rewardName}`,
    };

    const updatedActivities = [activity, ...this._activities()];
    this._activities.set(updatedActivities);
    saveJson(LOYALTY_ACTIVITIES_KEY, updatedActivities);

    return profile;
  }

  /**
   * Consulter l'historique des activités et récompenses d'un client.
   */
  getActivityHistory(email: string): LoyaltyActivity[] {
    const normalized = email.trim().toLowerCase();
    return this._activities().filter((act) => act.clientEmail === normalized);
  }
}
