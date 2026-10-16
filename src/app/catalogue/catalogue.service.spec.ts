import { TestBed } from '@angular/core/testing';
import { CatalogueService, INITIAL_PRESTATIONS } from './catalogue.service';

describe('CatalogueService', () => {
  let service: CatalogueService;

  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(CatalogueService);
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('liste toutes les prestations disponibles avec leurs attributs complets', () => {
    const prestations = service.getAll();
    expect(prestations.length).toBeGreaterThanOrEqual(INITIAL_PRESTATIONS.length);

    for (const prestation of prestations) {
      expect(prestation.id).toBeDefined();
      expect(prestation.name.length).toBeGreaterThan(0);
      expect(prestation.description.length).toBeGreaterThan(0);
      expect(prestation.durationMinutes).toBeGreaterThan(0);
      expect(prestation.price).toBeGreaterThan(0);
    }
  });

  it('filtre les prestations par mot-clé de recherche (insensible à la casse)', () => {
    const resultsBarbe = service.search('barbe');
    expect(resultsBarbe.length).toBeGreaterThan(0);
    expect(
      resultsBarbe.every(
        (p) =>
          p.name.toLowerCase().includes('barbe') ||
          p.description.toLowerCase().includes('barbe') ||
          p.category.toLowerCase().includes('barbe'),
      ),
    ).toBe(true);

    const resultsEmpty = service.search('introuvable_xyz_99');
    expect(resultsEmpty.length).toBe(0);
  });

  it('ajoute une nouvelle prestation au catalogue', () => {
    const initialCount = service.getAll().length;
    const added = service.add({
      name: 'Coloration Barbe',
      description: 'Camouflage des poils blancs ou teinte naturelle.',
      durationMinutes: 20,
      price: 22,
      category: 'Coloration',
    });

    expect(added.id).toBeDefined();
    expect(service.getAll().length).toBe(initialCount + 1);
    expect(service.search('Coloration').length).toBeGreaterThan(0);
  });

  it('conserve l\'URL de l\'image lors de l\'ajout d\'une prestation', () => {
    const imageUrl = 'https://example.com/coloration.jpg';
    const added = service.add({
      name: 'Coloration Barbe',
      description: 'Camouflage des poils blancs ou teinte naturelle.',
      durationMinutes: 20,
      price: 22,
      category: 'Coloration',
      imageUrl,
    });

    expect(added.imageUrl).toBe(imageUrl);
    expect(service.getAll().find((p) => p.id === added.id)?.imageUrl).toBe(imageUrl);
  });

  it('illustre les prestations initiales avec une image issue du web', () => {
    for (const prestation of INITIAL_PRESTATIONS) {
      expect(prestation.imageUrl).toMatch(/^https:\/\//);
    }
  });
});
