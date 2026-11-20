import { ProfileService, UpdateProfilePayload } from '../../../../../services/profile.service';
import { form, FormField, FormRoot, pattern, required } from '@angular/forms/signals';
import { Component, inject, input, linkedSignal, model, signal } from '@angular/core';
import { NotificationService } from '../../../../../services/notification.service';
import { CustomerProfileResponseDto as Profile } from '@fpm/contracts';
import { PHONE_PATTERN } from '../../../../../validators/phone';
import { POSTAL_CODE_PATTERN } from '../../../../../validators/postal-code';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { firstValueFrom } from 'rxjs';

interface InfoModel {
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  postalCode: string;
  city: string;
}

@Component({
  selector: 'app-edit',
  imports: [NgbDropdownModule, FormField, FormRoot],
  templateUrl: './edit.html'
})
export class Edit {
  private readonly notificationService = inject(NotificationService);
  private readonly profileService = inject(ProfileService);

  profile = input.required<Profile>();
  editingInfo = model<boolean>();

  protected readonly infoError = signal<string | null>(null);
  // Calculé à la lecture, une fois l'input reçu, et recalculé si `user` change. Reste modifiable par le formulaire.
  private readonly infoModel = linkedSignal<InfoModel>(() => this.toInfoModel(this.profile()));

  protected readonly infoForm = form(
    this.infoModel,
    (path) => {
      required(path.firstName, { message: 'Le prénom est obligatoire.' });
      required(path.lastName, { message: 'Le nom est obligatoire.' });
      required(path.phone, { message: 'Le numéro de téléphone est obligatoire.' });
      pattern(path.phone, PHONE_PATTERN, {
        message: 'Le numéro de téléphone n\'est pas valide.'
      });

      required(path.line1, { message: 'L\'adresse est obligatoire.' });
      required(path.postalCode, { message: 'Le code postal est obligatoire.' });
      required(path.city, { message: 'La ville est obligatoire.' });
      pattern(path.postalCode, POSTAL_CODE_PATTERN, {
        message: 'Le code postal doit contenir 5 chiffres.'
      });
    },
    {
      submission: {
        action: async (field) => {
          this.infoError.set(null);
          const { firstName, lastName, phone, line1, line2, postalCode, city } =
            field().value();

          const userUpdated: UpdateProfilePayload = {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone,
            address: {
              line1: line1.trim(),
              line2: line2.trim(),
              postalCode,
              city: city.trim()
            }
          }

          try {
            await firstValueFrom(this.profileService.updateProfile(userUpdated))
            this.editingInfo.set(false);
            this.notificationService.showSuccess("Informations mises à jour");
            return undefined;
          } catch (error) {
            this.infoError.set("Une erreur est survenue");
          }
        }
      }
    }
  );

    private toInfoModel(user: Profile): InfoModel {
    return {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? '',
      line1: user.address?.line1 ?? '',
      line2: user.address?.line2 ?? '',
      postalCode: user.address?.postalCode ?? '',
      city: user.address?.city ?? ''
    };
  }

  protected cancelEditInfo() {
    this.editingInfo.set(false)
  }
}
