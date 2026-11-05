import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { LogLevel } from "../generated/prisma/internal/prismaNamespace.js";
import { PrismaClient } from "../generated/prisma/client.js";
import { ConfigService } from "@nestjs/config";
import { PrismaPg } from "@prisma/adapter-pg";

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(configService: ConfigService) {
    const adapter = new PrismaPg({
      connectionString: configService.getOrThrow<string>("DATABASE_URL"),
    });
    const log: LogLevel[] = ["query", "info", "warn", "error"];
    super({ adapter, log });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
