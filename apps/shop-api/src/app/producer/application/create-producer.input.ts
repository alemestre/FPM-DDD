export interface CreateProducerInput {
  readonly name: string;
  readonly contactEmail: string;
  readonly phoneNumber: string;
  readonly vatNumber: string;
  readonly addressLine1: string;
  readonly addressLine2?: string;
  readonly postalCode: string;
  readonly city: string;
}
