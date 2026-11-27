import type { ProducerResponseDto as Producer } from '@fpm/contracts';
import type { EntitySpecs } from '../../../shared/CRUD/crud';


/** Rubrique producers, partagée par la liste, la fiche et le formulaire. */
export const PRODUCER_SPECS: EntitySpecs<Producer> = {
  name: 'producteur',
  key: 'name',
  gender: 'M',
  basePath: 'producteurs'
};
