import { ConfirmDialogService } from '../confirm-dialog/confirm-dialog';
import type { ApiResponseDto, GenericEntity } from '@fpm/contracts';
import { apiErrorMessage } from '../tools/api-error-message';
import type { HttpResourceRef } from '@angular/common/http';
import { computed, Directive, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Crud } from './crud';

/** Page liste d'une rubrique admin : entités chargées, suppression confirmée puis rechargement. */
@Directive()
export abstract class EntityList<Entity extends GenericEntity, Body = Partial<Entity>> extends Crud<
    Entity,
    Body
> {
    protected readonly confirmDialog = inject(ConfirmDialogService);

    /** Fournie par la sous-classe, en général `entityService.adminEntitiesResource()`. */
    protected abstract readonly entitiesResource: HttpResourceRef<
        ApiResponseDto<Entity[]> | undefined
    >;
    protected readonly entities = computed(() => this.entitiesResource.value()?.data ?? []);

    protected async delete(entity: Entity): Promise<void> {
        if (!(await this.confirmDialog.confirm(this.confirmDeleteOptions(entity)))) {
            return;
        }

        try {
            await firstValueFrom(this.entityService.deleteEntity(entity.id));
            this.notificationService.showSuccess(this.deletedMessage(entity));
            this.entitiesResource.reload();
        } catch (error) {
            this.notificationService.showError(apiErrorMessage(error, this.deleteFailedMessage()));
        }
    }
}
