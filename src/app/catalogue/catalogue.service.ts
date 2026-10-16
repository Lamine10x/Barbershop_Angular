import { Injectable, signal } from '@angular/core';
import { Prestation } from '../core/models';
import { loadJson, saveJson } from '../core/persistence';

const PRESTATIONS_KEY = 'prestations';

/**
 * Prestations initiales du catalogue, illustrées par des photos libres de droits
 * hébergées sur le web (vérifiées le 2026-10-16, réponse HTTP 200) :
 * - Coupe Homme Classique — Wikimedia Commons, « Barbershop haircutting session » (CC BY)
 * - Taille & Entretien de Barbe — Wikimedia Commons, « Barbershop Ritual 07 Beard Trimming » (CC BY-SA)
 * - Formule Complète Barber — Flickr, « Barber Shop [Explored] » (CC BY)
 * - Rasage Traditionnel à l'Ancienne — Wikimedia Commons, « Man being shaved with straight razor » (CC BY)
 * - Coupe Junior (-12 ans) — Flickr, « Boy Needs A Haircut » (CC BY)
 */
export const INITIAL_PRESTATIONS: Prestation[] = [
  {
    id: 'prest-1',
    name: 'Coupe Homme Classique',
    description: 'Shampoing, coupe aux ciseaux et tondeuse, coiffage avec finitions précises.',
    durationMinutes: 30,
    price: 25,
    category: 'Cheveux',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/d/df/Barbershop_haircutting_session_%2851210140096%29.jpg',
  },
  {
    id: 'prest-2',
    name: 'Taille & Entretien de Barbe',
    description: 'Sculpture au coupe-chou, serviette chaude et huile de soin nourrissante.',
    durationMinutes: 25,
    price: 20,
    category: 'Barbe',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/50/Barbershop_Ritual_07_Beard_Trimming.jpg/960px-Barbershop_Ritual_07_Beard_Trimming.jpg',
  },
  {
    id: 'prest-3',
    name: 'Formule Complète Barber',
    description: 'Coupe personnalisée + taille de barbe avec rituel serviette chaude et massage crânien.',
    durationMinutes: 50,
    price: 40,
    category: 'Formules',
    imageUrl: 'https://live.staticflickr.com/7428/8948021446_42147211c3_b.jpg',
  },
  {
    id: 'prest-4',
    name: 'Rasage Traditionnel à l\'Ancienne',
    description: 'Savonnage au blaireau, rasage au coupe-choux traditionnel et soin après-rasage apaisant.',
    durationMinutes: 35,
    price: 28,
    category: 'Barbe',
    imageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c4/Man_being_shaved_with_straight_razor._Roadside%2C_Kashgar.jpg/960px-Man_being_shaved_with_straight_razor._Roadside%2C_Kashgar.jpg',
  },
  {
    id: 'prest-5',
    name: 'Coupe Junior (-12 ans)',
    description: 'Coupe tendance adaptée aux plus jeunes avec finition gel ou cire.',
    durationMinutes: 20,
    price: 18,
    category: 'Cheveux',
    imageUrl: 'https://live.staticflickr.com/3556/3829751089_39d0c430f2_b.jpg',
  },
];

@Injectable({ providedIn: 'root' })
export class CatalogueService {
  private readonly _prestations = signal<Prestation[]>([]);
  readonly prestations = this._prestations.asReadonly();

  constructor() {
    this.init();
  }

  private init(): void {
    const saved = loadJson<Prestation[]>(PRESTATIONS_KEY, []);
    if (saved.length === 0) {
      this._prestations.set(INITIAL_PRESTATIONS);
      saveJson(PRESTATIONS_KEY, INITIAL_PRESTATIONS);
    } else {
      this._prestations.set(saved);
    }
  }

  getAll(): Prestation[] {
    return this._prestations();
  }

  search(term: string): Prestation[] {
    const query = term.trim().toLowerCase();
    if (!query) {
      return this.getAll();
    }
    return this._prestations().filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query),
    );
  }

  add(prestation: Omit<Prestation, 'id'>): Prestation {
    const newPrestation: Prestation = {
      ...prestation,
      id: `prest-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    };
    const updated = [...this._prestations(), newPrestation];
    this._prestations.set(updated);
    saveJson(PRESTATIONS_KEY, updated);
    return newPrestation;
  }
}
