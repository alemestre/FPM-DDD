import { ProducerRepository } from "../../domain/producer.repository";
import type { CreateProducerInput } from "../create-producer.input";
import { Producer } from "../../domain/producer.entity";
import { Inject } from "@nestjs/common";

export class CreateProducerUseCase {
  constructor(@Inject(ProducerRepository) private readonly repository: ProducerRepository) {}

  async execute(input: CreateProducerInput): Promise<Producer> {
    const { name, email, phone, vatNumber, addressLine1, addressLine2, postalCode, city, isActive } = input;
    const producer = Producer.create(
      name,
      email,
      phone,
      vatNumber,
      addressLine1,
      postalCode,
      city,
      addressLine2
    );

    if (isActive === false) producer.deactivate();

    return this.repository.save(producer);
  }
}
