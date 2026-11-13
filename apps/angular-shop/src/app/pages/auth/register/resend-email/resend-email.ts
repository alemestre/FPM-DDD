import { ChangeDetectionStrategy, Component, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../../services/auth.service';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';


@Component({
  selector: 'app-resend-email',
  imports: [RouterLink],
  templateUrl: './resend-email.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ResendEmail {
  private readonly authService = inject(AuthService);
  protected readonly resendStatus = signal<'idle' | 'sending' | 'sent' | 'failed'>('idle');

  email = input<string>();
  displayLoginButton = input<boolean>();

  protected async resendVerificationEmail(): Promise<void> {
    const email = this.email();
    if (!email) {
      return;
    }
    this.resendStatus.set('sending');
    try {
      await firstValueFrom(this.authService.resendVerificationEmail(email));
      this.resendStatus.set('sent');
    } catch {
      this.resendStatus.set('failed');
    }
  }
}
