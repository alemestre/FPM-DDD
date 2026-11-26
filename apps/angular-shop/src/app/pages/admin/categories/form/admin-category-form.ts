import {
    FormField,
    FormRoot,
    minLength,
    required,
    type SchemaPathTree,
} from '@angular/forms/signals';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CategoryService } from '../../../../services/category.service';
import type { CategoryResponseDto as Category, CategoryRequestDto } from '@fpm/contracts';
import { EntityForm } from '../../../../shared/CRUD/entity-form';
import { CATEGORY_SPECS } from '../constants';
import { RouterLink } from '@angular/router';

/** Même règle que le value object Name de l'API. */
const NAME_MIN_LENGTH = 3;

/**
 * Formulaire d'une catégorie : /admin/categories/nouveau (ajout) et /admin/categories/:id/modifier.
 * Après l'enregistrement, ouvre la fiche de la catégorie.
 */
@Component({
    selector: 'app-admin-category-form',
    imports: [FormField, FormRoot, RouterLink],
    templateUrl: './admin-category-form.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminCategoryForm extends EntityForm<Category, CategoryRequestDto> {
    protected readonly entityService = inject(CategoryService);
    protected readonly entitySpecs = CATEGORY_SPECS;
    protected readonly entityResource = this.entityService.adminEntityResource(this.id);

    protected toModel(category: Category | undefined): CategoryRequestDto {
        return { name: category?.name ?? '' };
    }

    protected applySchema(path: SchemaPathTree<CategoryRequestDto>): void {
        required(path.name, { message: 'Le nom est obligatoire.' });
        minLength(path.name, NAME_MIN_LENGTH, {
            message: `Le nom doit contenir au moins ${NAME_MIN_LENGTH} caractères.`,
        });
    }
}
