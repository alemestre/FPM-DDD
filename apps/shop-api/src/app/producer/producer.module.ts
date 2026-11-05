import { DeactivateProducerUseCase } from "./application/use-cases/deactivate-producer.use-case";
import { ActivateProducerUseCase } from "./application/use-cases/activate-producer.use-case";
import { CreateProducerUseCase } from "./application/use-cases/create-producer.use-case";
import { UpdateProducerUseCase } from "./application/use-cases/update-producer.use-case";
import { PrismaProducerRepository } from "./infrastructure/prisma-producer.repository";
import { ListProducersUseCase } from "./application/use-cases/list-producers.use-case";
import { GetProducerUseCase } from "./application/use-cases/get-producer.use-case";
import { ProducerController } from "./interface/http/producer.controller";
import { ProducerRepository } from "./domain/producer.repository";
import { Module } from "@nestjs/common";

@Module({
  controllers: [ProducerController],
  providers: [
    { provide: ProducerRepository, useClass: PrismaProducerRepository },
    CreateProducerUseCase,
    ListProducersUseCase,
    GetProducerUseCase,
    UpdateProducerUseCase,
    ActivateProducerUseCase,
    DeactivateProducerUseCase
  ]
})
export class ProducerModule {}
