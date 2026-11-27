import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ProducerService } from '../../../../services/producer.service';
import { EntityDetail } from '../../../../shared/CRUD/entity-detail';
import { ProducerResponseDto as Producer } from '@fpm/contracts';
import { RouterLink } from '@angular/router';
import { PRODUCER_SPECS } from '../constants';

/** /admin/producers/:id : fiche d'un producter. */
@Component({
  selector: 'app-admin-producer-detail',
  imports: [RouterLink],
  templateUrl: './admin-producer-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProducerDetail extends EntityDetail<Producer>{
  protected readonly entityService = inject(ProducerService);
  protected readonly entityResource = this.entityService.adminEntityResource(this.id);
  protected override entitySpecs = PRODUCER_SPECS
}
