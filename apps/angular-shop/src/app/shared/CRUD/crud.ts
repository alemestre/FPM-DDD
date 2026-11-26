import { NotificationService } from '../../services/notification.service';
import type { AdminEntityService } from '../abstract-entity.service';
import type { GenericEntity } from '@fpm/contracts';
import { Directive, inject } from '@angular/core';
import { upperFirst } from 'lodash';

/** Description d'une rubrique, pour les messages et la navigation communs aux pages CRUD. */
export interface EntitySpecs<Entity> {
    /** Nom commun en minuscules : « catégorie », « producteur »… */
    name: string;
    /** Propriété qui nomme une entité dans les messages (« Fruits »). */
    key: keyof Entity;
    gender: 'F' | 'M';
    /** URL absolue de la liste, par exemple `/admin/categories`. */
    basePath: string;
}

@Directive()
export abstract class Crud<Entity extends GenericEntity, Body = Partial<Entity>> {
    protected abstract readonly entityService: AdminEntityService<Entity, Body>;
    protected abstract readonly entitySpecs: EntitySpecs<Entity>;
    protected readonly notificationService = inject(NotificationService);

    protected get entityName() {
        return this.entitySpecs.name;
    }

    /** « e » au féminin : « créée », « supprimée ». */
    protected get genderSuffix() {
        return this.entitySpecs.gender === 'F' ? 'e' : '';
    }

    /** « la catégorie », « le producteur », « l’utilisateur ». */
    protected get theEntity() {
        if (/^[aàâeéèêiîoôuh]/i.test(this.entityName)) {
            return `l’${this.entityName}`;
        }
        return `${this.entitySpecs.gender === 'F' ? 'la' : 'le'} ${this.entityName}`;
    }

    /** Nom d'une entité dans les messages : « Fruits ». */
    protected labelOf(entity: Entity) {
        return String(entity[this.entitySpecs.key]);
    }

    protected confirmDeleteOptions(entity: Entity) {
        return {
            title: `Supprimer ${this.theEntity}`,
            message: `Supprimer définitivement ${this.theEntity} « ${this.labelOf(entity)} » ?`,
        };
    }

    /** « Catégorie « Fruits » supprimée ». */
    protected deletedMessage(entity: Entity) {
        return `${upperFirst(this.entityName)} « ${this.labelOf(entity)} » supprimé${this.genderSuffix}`;
    }

    protected deleteFailedMessage() {
        return `${upperFirst(this.theEntity)} n’a pas pu être supprimé${this.genderSuffix}.`;
    }
}
