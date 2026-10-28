import { ZodValidationPipe } from "nestjs-zod";
import { ConfigModule } from "@nestjs/config";
import { Module } from "@nestjs/common";
import { APP_PIPE } from "@nestjs/core";

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true })],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe
    }
  ]
})
export class AppModule {}
