import { CustomerProfileResponseDto as Profile } from '@fpm/contracts';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-top-bar',
  imports: [NgbDropdownModule],
  templateUrl: './top-bar.html'
})
export class TopBar {
  profile = input.required<Profile>();

  protected readonly profileInitials = computed(() => {
    const profile = this.profile();
    return `${profile.firstName.charAt(0)} ${profile.lastName.charAt(0)}`;
  });
}
