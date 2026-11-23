import type { PostalAddressProps } from "../../shared/domain/value-objects/postal-address.value-object";

export interface RegisterInput {
  readonly email: string;
  readonly password: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly phone: string;
  readonly address: PostalAddressProps;
}
