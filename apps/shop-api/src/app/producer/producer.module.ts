import { DeactivateProducerUseCase } from './application/use-cases/deactivate-producer.use-case';
import { ActivateProducerUseCase } from './application/use-cases/activate-producer.use-case';
import { CreateProducerUseCase } from './application/use-cases/create-producer.use-case';
import { UpdateProducerUseCase } from './application/use-cases/update-producer.use-case';
import { ListProducersUseCase } from './application/use-cases/list-producers.use-case';
import { PrismaProducerRepository } from "./infrastructure/prisma-producer.repository";
import { AdminProducerController } from './interface/http/admin-producer.controller';
import { GetProducerUseCase } from './application/use-cases/get-producer.use-case';
import { ProducerRepository } from "./domain/producer.repository";
import { AuthModule } from '../auth/auth.module';
import { Module } from "@nestjs/common";

@Module({
  // Provides the guards behind @OnlyAdmin, which protects AdminProducerController.
  imports: [AuthModule],
  controllers: [AdminProducerController],
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
