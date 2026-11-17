import { UpdateCustomerProfileUseCase } from "../../application/use-cases/update-customer-profile.use-case";
import { GetCustomerProfileUseCase } from "../../application/use-cases/get-customer-profile.use-case";
import { AuthenticatedUserId } from "../../../auth/interface/http/authenticated-user-id.decorator";
import { JwtCookieAuthGuard } from "../../../auth/interface/http/guards/jwt-cookie-auth.guard";
import { toCustomerProfileResponse } from "./customer-profile.response.mapper";
import { UpdateCustomerProfileDto } from "./dto/update-customer-profile.dto";
import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import type { CustomerProfileResponseDto } from "@fpm/contracts";

/** Profile of the signed-in customer: 401 without a session, 404 for accounts without a customer profile. */
@Controller("customers")
@UseGuards(JwtCookieAuthGuard)
export class CustomerController {
  constructor(
    private readonly getCustomerProfile: GetCustomerProfileUseCase,
    private readonly updateCustomerProfile: UpdateCustomerProfileUseCase
  ) {}

  @Get("me")
  async me(@AuthenticatedUserId() customerId: string): Promise<CustomerProfileResponseDto> {
    return toCustomerProfileResponse(await this.getCustomerProfile.execute(customerId));
  }

  @Patch("me")
  async updateMe(
    @AuthenticatedUserId() customerId: string,
    @Body() dto: UpdateCustomerProfileDto
  ): Promise<CustomerProfileResponseDto> {
    return toCustomerProfileResponse(await this.updateCustomerProfile.execute(customerId, dto));
  }
}
