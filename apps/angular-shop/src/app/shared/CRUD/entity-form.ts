import { computed, Directive, inject, linkedSignal, signal } from '@angular/core';
import { HttpErrorResponse, type HttpResourceRef } from '@angular/common/http';
import { form, type SchemaPathTree } from '@angular/forms/signals';
import type { ApiResponseDto, GenericEntity } from '@fpm/contracts';
import { apiErrorMessage } from '../tools/api-error-message';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { firstValueFrom, map } from 'rxjs';
import { upperFirst } from 'lodash';
import { Crud } from './crud';

/**
 * Formulaire d'une rubrique admin, pour l'ajout (`nouveau`) et la modification (`:id/modifier`).
 * Le formulaire édite directement `Body`, le corps envoyé à l'API.
 * Après l'enregistrement, ouvre la fiche de l'entité.
 */
@Directive()
export abstract class EntityForm<Entity extends GenericEntity, Body extends object> extends Crud<Entity, Body> {
    protected readonly router = inject(Router);
    protected readonly route = inject(ActivatedRoute);

    /** `null` en ajout. */
    protected readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
        initialValue: null,
    });
    protected readonly isEdit = computed(() => this.id() !== null);
    /** Fournie par la sous-classe, en général `entityService.adminEntityResource(this.id)`. */
    protected abstract readonly entityResource: HttpResourceRef<ApiResponseDto<Entity> | undefined>;
    /** 404, ou 400 pour un id qui n'est pas un UUID : l'entité n'existe pas. */
    protected readonly notFound = computed(() => {
        const error = this.entityResource.error();
        return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
    });

    protected readonly submitError = signal<string | null>(null);

    /** Valeurs initiales du formulaire : vides en ajout, celles de l'entité en modification. */
    protected abstract toModel(entity: Entity | undefined): Body;
    /** Règles de validation du formulaire. */
    protected abstract applySchema(path: SchemaPathTree<Body>): void;

    // Pré-rempli une fois l'entité chargée, puis modifié par le formulaire.
    // Paresseux : n'est lu qu'au rendu, une fois les champs de la sous-classe initialisés.
    private readonly model = linkedSignal(() => this.toModel(this.entityResource.value()?.data));

    protected readonly form = form(this.model, (path) => this.applySchema(path), {
        submission: {
            action: async (field) => {
                this.submitError.set(null);
                const id = this.id();
                const body = field().value();

                try {
                    const entity = await firstValueFrom(
                        id
                            ? this.entityService.updateEntity(id, body)
                            : this.entityService.createEntity(body),
                    );
                    this.notificationService.showSuccess(
                        `${upperFirst(this.entityName)} ${id ? 'modifié' : 'créé'}${this.genderSuffix}`,
                    );
                    await this.router.navigateByUrl(`${this.entitySpecs.basePath}/${entity.id}`);
                } catch (error) {
                    this.submitError.set(
                        apiErrorMessage(
                            error,
                            `${upperFirst(this.theEntity)} n’a pas pu être enregistré${this.genderSuffix}.`,
                        ),
                    );
                }
                return undefined;
            },
        },
    });
}
