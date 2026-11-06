import { DomainValidationErrorFilter } from './shared/interface/http/domain-validation-error.filter';
import { ApiResponseInterceptor } from './shared/interface/http/api-response.interceptor';
import { ProducerModule } from './producer/producer.module';
import { CategoryModule } from './category/category.module';
import { ProductModule } from './product/product.module';
import { PrismaModule } from '../prisma/prisma.module';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    ProductModule,
    ProducerModule,
    CategoryModule
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe
    },
    {
      provide: APP_FILTER,
      useClass: DomainValidationErrorFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiResponseInterceptor
    }
  ]
})
export class AppModule {}
