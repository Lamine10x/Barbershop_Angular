import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogueComponent } from './catalogue.component';

describe('CatalogueComponent', () => {
  beforeEach(() => {
    window.localStorage.clear();
    TestBed.configureTestingModule({
      imports: [CatalogueComponent],
      providers: [provideRouter([])],
    });
  });

  afterEach(() => {
    window.localStorage.clear();
  });

  it('affiche la photo d\'une prestation lorsque son URL d\'image est définie', () => {
    const fixture = TestBed.createComponent(CatalogueComponent);
    fixture.detectChanges();

    const img = fixture.nativeElement.querySelector('.prestation-image img') as HTMLImageElement | null;
    expect(img).not.toBeNull();
    expect(img?.getAttribute('src')).toContain('https://');
    expect(img?.getAttribute('alt')).toBeTruthy();
  });

  it('bascule sur le visuel de repli lorsque l\'image échoue à charger', () => {
    const fixture = TestBed.createComponent(CatalogueComponent);
    fixture.detectChanges();

    const card = fixture.nativeElement.querySelector('.prestation-card') as HTMLElement;
    const img = card.querySelector('.prestation-image img') as HTMLImageElement;
    expect(img).not.toBeNull();

    img.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(card.querySelector('.prestation-image img')).toBeNull();
    expect(card.querySelector('.prestation-image-fallback')).not.toBeNull();
  });
});
