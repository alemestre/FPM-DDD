import { CustomerProfileResponseDto as Profile } from '@fpm/contracts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-read-only',
  imports: [NgbDropdownModule],
  templateUrl: './read-only.html'
})
export class ReadOnly {
  profile = input.required<Profile>()
}
