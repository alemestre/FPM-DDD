export interface RegisterAddressInput {
  readonly line1: string;
  readonly line2?: string;
  readonly postalCode: string;
  readonly city: string;
}

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly address?: RegisterAddressInput;
}
