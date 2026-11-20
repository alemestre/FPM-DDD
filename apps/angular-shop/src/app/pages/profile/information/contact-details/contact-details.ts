import { CustomerProfileResponseDto as Profile } from '@fpm/contracts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Component,  input, signal } from '@angular/core';
import { ReadOnly } from './read-only/read-only';
import { Edit } from './edit/edit';

@Component({
  selector: 'app-contact-details',
  imports: [NgbDropdownModule, ReadOnly, Edit],
  templateUrl: './contact-details.html',
  // Colonne de la grille portée par l'hôte : Bootstrap exige une colonne enfant direct de .row.
  host: { class: 'col-12 col-lg-7' }
})
export class ContactDetails {
  profile = input.required<Profile>();
  editingInfo = signal(false)

  protected onEdit() {
    this.editingInfo.set(true)
  }
}
