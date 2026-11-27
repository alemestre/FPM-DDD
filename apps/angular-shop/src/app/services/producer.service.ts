import { ProducerResponseDto as Producer, ProducerRequestDto } from '@fpm/contracts';
import { AdminEntityService } from '../shared/abstract-entity.service';
import { Injectable } from '@angular/core';
import { CONSTANTS } from '../shared/constant';

/**
 * Les méthodes `*Resource` renvoient une ressource (chargement, erreur, valeur en signaux) :
 * elles s'appellent dans un contexte d'injection, par exemple à l'initialisation d'un champ de composant.
 */
@Injectable({
    providedIn: 'root',
})
export class ProducerService extends AdminEntityService<Producer, ProducerRequestDto> {
  protected readonly path = CONSTANTS.API_END_POINTS.PRODUCERS;
}
