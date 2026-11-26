import type { CategoryResponseDto } from '@fpm/contracts';
import { Component, computed, inject, model } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { CategoryService } from '../../../services/category.service';

@Component({
    selector: 'app-category-nav',
    imports: [RouterLink, RouterLinkActive, NgbCollapseModule, TitleCasePipe],
    templateUrl: './category-nav.html',
    styleUrl: './category-nav.css',
})
export class CategoryNav {
    private readonly categoriesService = inject(CategoryService);

    /** Ouverture du menu sur mobile, partagée avec le layout. */
    readonly menuOpen = model(false);

    private readonly categoriesResource = this.categoriesService.allCategoriesResource();

    /** Vide pendant le chargement ou en cas d'erreur : le lien « À propos » reste affiché. */
    protected readonly categories = computed<CategoryResponseDto[]>(() =>
        this.categoriesResource.hasValue() ? this.categoriesResource.value().data : [],
    );

    protected closeMenu(): void {
        this.menuOpen.set(false);
    }
}
