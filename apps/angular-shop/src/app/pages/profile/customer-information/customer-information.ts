import { CustomerProfileResponseDto as Profile } from '@fpm/contracts';
import { ContactDetails } from './contact-details/contact-details';
import { Component, input } from '@angular/core';
import { Password } from './password/password';

@Component({
  selector: 'app-customer-information',
  imports: [ContactDetails, Password],
  templateUrl: './customer-information.html'
})
export class CustomerInformation {
  profile = input.required<Profile>();
}
