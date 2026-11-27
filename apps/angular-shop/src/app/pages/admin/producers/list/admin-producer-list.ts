import type { ProducerRequestDto, ProducerResponseDto as Producer } from '@fpm/contracts';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProducerService } from '../../../../services/producer.service';
import { EntityList } from '../../../../shared/CRUD/entity-list';
import { PRODUCER_SPECS } from '../constants';
import { RouterLink } from '@angular/router';

/** /admin/categories : liste des producteurs, avec accès à la fiche, à la modification et à la suppression. */
@Component({
  selector: 'app-admin-producer-list',
  imports: [RouterLink],
  templateUrl: './admin-producer-list.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProducerList extends EntityList<Producer, ProducerRequestDto> {
  protected readonly entityService = inject(ProducerService);
  protected entitiesResource = this.entityService.adminEntitiesResource()
  protected override entitySpecs = PRODUCER_SPECS
}
