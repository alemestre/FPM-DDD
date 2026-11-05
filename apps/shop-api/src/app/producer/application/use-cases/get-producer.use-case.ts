import { ProducerRepository } from "../../domain/producer.repository";
import type { Producer } from "../../domain/producer.entity";
import { Inject } from "@nestjs/common";

export class GetProducerUseCase {
  constructor(@Inject(ProducerRepository) private readonly repository: ProducerRepository) {}

  execute(id: string): Promise<Producer> {
    return this.repository.findByIdOrFail(id);
  }
}
