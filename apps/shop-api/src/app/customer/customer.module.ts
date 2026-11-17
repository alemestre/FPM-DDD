import { UpdateCustomerProfileUseCase } from "./application/use-cases/update-customer-profile.use-case";
import { GetCustomerProfileUseCase } from "./application/use-cases/get-customer-profile.use-case";
import { PrismaCustomerRepository } from "./infrastructure/prisma-customer.repository";
import { CustomerController } from "./interface/http/customer.controller";
import { CustomerRepository } from "./domain/customer.repository";
import { AuthModule } from "../auth/auth.module";
import { Module } from "@nestjs/common";

@Module({
  // Provides JwtCookieAuthGuard, which protects every customer route.
  imports: [AuthModule],
  controllers: [CustomerController],
  providers: [
    { provide: CustomerRepository, useClass: PrismaCustomerRepository },
    GetCustomerProfileUseCase,
    UpdateCustomerProfileUseCase
  ]
})
export class CustomerModule {}
