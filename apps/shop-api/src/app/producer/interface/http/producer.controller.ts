import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseUUIDPipe, Patch, Post } from "@nestjs/common";
import { DeactivateProducerUseCase } from "../../application/use-cases/deactivate-producer.use-case";
import { ActivateProducerUseCase } from "../../application/use-cases/activate-producer.use-case";
import { CreateProducerUseCase } from "../../application/use-cases/create-producer.use-case";
import { UpdateProducerUseCase } from "../../application/use-cases/update-producer.use-case";
import { ListProducersUseCase } from "../../application/use-cases/list-producers.use-case";
import { GetProducerUseCase } from "../../application/use-cases/get-producer.use-case";
import type { ProducerResponseDto } from "@fpm/contracts";
import { toProducerResponse } from "./producer.response.mapper";
import { CreateProducerDto } from "./dto/create-producer.dto";
import { UpdateProducerDto } from "./dto/update-producer.dto";

/**
 * Producers are never deleted, so their products keep a valid producer:
 * they are deactivated instead.
 */
@Controller("producers")
export class ProducerController {
  constructor(
    private readonly createProducer: CreateProducerUseCase,
    private readonly listProducers: ListProducersUseCase,
    private readonly getProducer: GetProducerUseCase,
    private readonly updateProducer: UpdateProducerUseCase,
    private readonly activateProducer: ActivateProducerUseCase,
    private readonly deactivateProducer: DeactivateProducerUseCase
  ) {}

  @Post()
  async create(@Body() dto: CreateProducerDto): Promise<ProducerResponseDto> {
    return toProducerResponse(await this.createProducer.execute(dto));
  }

  @Get()
  async findAll(): Promise<ProducerResponseDto[]> {
    const producers = await this.listProducers.execute();
    return producers.map(toProducerResponse);
  }

  @Get(":id")
  async findOne(@Param("id", ParseUUIDPipe) id: string): Promise<ProducerResponseDto> {
    return toProducerResponse(await this.getProducer.execute(id));
  }

  @Patch(":id")
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateProducerDto
  ): Promise<ProducerResponseDto> {
    return toProducerResponse(await this.updateProducer.execute(id, dto));
  }

  @Post(":id/activate")
  @HttpCode(HttpStatus.OK)
  async activate(@Param("id", ParseUUIDPipe) id: string): Promise<ProducerResponseDto> {
    return toProducerResponse(await this.activateProducer.execute(id));
  }

  @Post(":id/deactivate")
  @HttpCode(HttpStatus.OK)
  async deactivate(@Param("id", ParseUUIDPipe) id: string): Promise<ProducerResponseDto> {
    return toProducerResponse(await this.deactivateProducer.execute(id));
  }
}
