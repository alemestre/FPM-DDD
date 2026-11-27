import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { email, FormField, FormRoot, minLength, pattern, required, type SchemaPathTree } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import type { ProducerRequestDto, ProducerResponseDto as Producer } from '@fpm/contracts';
import { EntityForm } from '../../../../shared/CRUD/entity-form';
import { ProducerService } from '../../../../services/producer.service';
import { PRODUCER_SPECS } from '../constants';
import { NAME_MIN_LENGTH } from '../../../../shared/constant';

// Formats acceptés par les value objects PhoneNumber, VatNumber et PostalCode de l'API, espaces compris.
/** 0X XX XX XX XX, ou +33 / 0033 (et DOM) suivi de 9 chiffres ; séparateurs espace, point ou tiret. */
const PHONE_PATTERN = /^\s*(?:0|(?:\+|00)(?:33|262|590|594|596)[\s.-]*(?:\(0\))?)[\s.-]*[1-9](?:[\s.-]*\d){8}\s*$/;
/** FR suivi de 11 chiffres (la clé est vérifiée par l'API). */
const VAT_NUMBER_PATTERN = /^\s*[Ff][Rr](?:\s*\d){11}\s*$/;
const POSTAL_CODE_PATTERN = /^\s*\d{2}\s*\d{3}\s*$/;

/**
 * Formulaire d'une producer : /admin/producers/nouveau (ajout) et /admin/poducers/:id/modifier.
 * Après l'enregistrement, ouvre la fiche de la producers.
 */
@Component({
  selector: 'app-admin-producer-form',
  imports: [FormField, FormRoot, RouterLink],
  templateUrl: './admin-producer-form.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminProducerForm extends EntityForm<Producer, ProducerRequestDto> {
  protected override toModel(producer: Producer | undefined): ProducerRequestDto {
    return {
      name: producer?.name ?? '',
      email: producer?.email ?? '',
      phone: producer?.phone ?? '',
      vatNumber: producer?.vatNumber ?? '',
      addressLine1: producer?.addressLine1 ?? '',
      addressLine2: producer?.addressLine2 ?? '',
      postalCode: producer?.postalCode ?? '',
      city: producer?.city ?? '',
      isActive: producer?.isActive ?? true,
    };
  }

  // Mêmes règles que les value objects de l'API, pour prévenir avant l'envoi. L'API reste juge :
  // ses messages (clé de TVA fausse…) s'affichent via submitError.
  protected applySchema(path: SchemaPathTree<ProducerRequestDto>): void {
    required(path.name, { message: 'Le nom est obligatoire.' });
    minLength(path.name, NAME_MIN_LENGTH, { message: `Le nom doit contenir au moins ${NAME_MIN_LENGTH} caractères.` });

    required(path.email, { message: 'L’e-mail est obligatoire.' });
    email(path.email, { message: 'L’e-mail n’est pas valide.' });

    required(path.phone, { message: 'Le téléphone est obligatoire.' });
    pattern(path.phone, PHONE_PATTERN, { message: 'Le téléphone doit être un numéro français, par exemple 06 12 34 56 78.' });

    required(path.vatNumber, { message: 'Le numéro de TVA est obligatoire.' });
    pattern(path.vatNumber, VAT_NUMBER_PATTERN, { message: 'Le numéro de TVA doit avoir la forme FR + 11 chiffres.' });

    required(path.addressLine1, { message: 'L’adresse est obligatoire.' });

    required(path.postalCode, { message: 'Le code postal est obligatoire.' });
    pattern(path.postalCode, POSTAL_CODE_PATTERN, { message: 'Le code postal doit contenir 5 chiffres.' });

    required(path.city, { message: 'La ville est obligatoire.' });
  }

  protected override entityService = inject(ProducerService)
  protected override entitySpecs = PRODUCER_SPECS
  protected entityResource = this.entityService.adminEntityResource(this.id)
}
