import { ProducerRepository } from "../../domain/producer.repository";
import type { UpdateProducerInput } from "../update-producer.input";
import type { Producer } from "../../domain/producer.entity";
import { Inject } from "@nestjs/common";

export class UpdateProducerUseCase {
  constructor(@Inject(ProducerRepository) private readonly repository: ProducerRepository) {}

  /**
   * Applies a partial update through the Producer aggregate so every change
   * goes through the domain invariants before being persisted.
   */
  async execute(id: string, input: UpdateProducerInput): Promise<Producer> {
    const { name, contactEmail, phoneNumber, vatNumber, addressLine1, addressLine2, postalCode, city } = input;
    const producer = await this.repository.findByIdOrFail(id);

    if (name !== undefined) producer.changeName(name);
    if (contactEmail !== undefined) producer.changeContactEmail(contactEmail);
    if (phoneNumber !== undefined) producer.changePhoneNumber(phoneNumber);
    if (vatNumber !== undefined) producer.changeVatNumber(vatNumber);
    producer.changeAddress({ addressLine1, addressLine2, postalCode, city });

    return this.repository.save(producer);
  }
}
