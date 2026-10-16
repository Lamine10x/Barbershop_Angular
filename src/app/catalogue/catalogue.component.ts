import { Component, computed, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CatalogueService } from './catalogue.service';
import { AuthService } from '../authentication/auth.service';

@Component({
  selector: 'app-catalogue',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './catalogue.component.html',
})
export class CatalogueComponent {
  private readonly catalogueService = inject(CatalogueService);
  protected readonly authService = inject(AuthService);

  readonly searchQuery = signal('');
  readonly selectedCategory = signal<string>('Toutes');

  /** Identifiants des prestations dont l'image n'a pas pu être chargée (repli affiché). */
  private readonly failedImages = signal<ReadonlySet<string>>(new Set());

  readonly categories = computed(() => {
    const all = this.catalogueService.prestations().map((p) => p.category);
    return ['Toutes', ...Array.from(new Set(all))];
  });

  readonly filteredPrestations = computed(() => {
    const query = this.searchQuery().trim().toLowerCase();
    const category = this.selectedCategory();
    let items = this.catalogueService.prestations();

    if (category !== 'Toutes') {
      items = items.filter((p) => p.category === category);
    }

    if (query) {
      items = items.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query),
      );
    }

    return items;
  });

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  /** Vrai quand la prestation doit afficher le visuel de repli plutôt qu'une image. */
  showImageFallback(id: string): boolean {
    return this.failedImages().has(id);
  }

  /** Bascule sur le visuel de repli quand une image ne peut pas être chargée. */
  onImageError(id: string): void {
    this.failedImages.update((failed) => new Set(failed).add(id));
  }
}
