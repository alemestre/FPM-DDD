import { ProducerRepository } from "../../domain/producer.repository";
import type { Producer } from "../../domain/producer.entity";
import { Inject } from "@nestjs/common";

export class ActivateProducerUseCase {
  constructor(@Inject(ProducerRepository) private readonly repository: ProducerRepository) {}

  async execute(id: string): Promise<Producer> {
    const producer = await this.repository.findByIdOrFail(id);
    producer.activate();
    return this.repository.save(producer);
  }
}
