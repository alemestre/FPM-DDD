import { ProducerRepository } from "../../domain/producer.repository";
import type { Producer } from "../../domain/producer.entity";
import { Inject } from "@nestjs/common";

export class ListProducersUseCase {
  constructor(@Inject(ProducerRepository) private readonly repository: ProducerRepository) {}

  /**
   * Returns every producer, active or not.
   */
  execute(): Promise<Producer[]> {
    return this.repository.findAll();
  }
}
