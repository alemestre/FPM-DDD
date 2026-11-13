import type { CategoryResponseDto } from '@fpm/contracts';
import { Component, inject, model, OnInit, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TitleCasePipe } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap';
import { CategoriesService } from '../../../services/categories.service';
import { toSignal } from '@angular/core/rxjs-interop';
import { catchError } from 'rxjs';

@Component({
    selector: 'app-category-nav',
    imports: [RouterLink, RouterLinkActive, NgbCollapseModule, TitleCasePipe],
    templateUrl: './category-nav.html',
    styleUrl: './category-nav.css',
})
export class CategoryNav {
    private readonly categoriesService = inject(CategoriesService);

    /** Ouverture du menu sur mobile, partagée avec le layout. */
    readonly menuOpen = model(false);

    protected readonly categories = toSignal(this.categoriesService.getAllCategories())

    protected closeMenu(): void {
        this.menuOpen.set(false);
    }
}
