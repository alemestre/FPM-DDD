import { HttpErrorResponse, type HttpResourceRef } from '@angular/common/http';
import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog';
import type { ApiResponseDto, GenericEntity } from '@fpm/contracts';
import { apiErrorMessage } from '../tools/api-error-message';
import { computed, Directive, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { firstValueFrom, map } from 'rxjs';
import { Crud } from './crud';

/** Page fiche d'une rubrique admin (`:id`) : entité chargée, suppression puis retour à la liste. */
@Directive()
export abstract class EntityDetail<
    Entity extends GenericEntity,
    Body = Partial<Entity>,
> extends Crud<Entity, Body> {
    protected readonly confirmDialog = inject(ConfirmDialogService);
    protected readonly router = inject(Router);
    protected readonly route = inject(ActivatedRoute);

    protected readonly id = toSignal(this.route.paramMap.pipe(map((params) => params.get('id'))), {
        initialValue: null,
    });
    /** Fournie par la sous-classe, en général `entityService.adminEntityResource(this.id)`. */
    protected abstract readonly entityResource: HttpResourceRef<ApiResponseDto<Entity> | undefined>;
    protected readonly entity = computed(() => this.entityResource.value()?.data);
    /** 404, ou 400 pour un id qui n'est pas un UUID : l'entité n'existe pas. */
    protected readonly notFound = computed(() => {
        const error = this.entityResource.error();
        return error instanceof HttpErrorResponse && (error.status === 404 || error.status === 400);
    });

    protected async delete(): Promise<void> {
        const entity = this.entity();
        if (!entity || !(await this.confirmDialog.confirm(this.confirmDeleteOptions(entity)))) {
            return;
        }

        try {
            await firstValueFrom(this.entityService.deleteEntity(entity.id));
            this.notificationService.showSuccess(this.deletedMessage(entity));
            await this.router.navigateByUrl(this.entitySpecs.basePath);
        } catch (error) {
            this.notificationService.showError(apiErrorMessage(error, this.deleteFailedMessage()));
        }
    }
}
