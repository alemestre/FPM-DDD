import { AuthenticatedUserId } from '../../../auth/interface/http/authenticated-user-id.decorator';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order.use-case';
import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PlaceGuestOrderDto } from './dto/place-guest-order.dto';
import { toOrderResponse } from './order.response.mapper';
import type { OrderResponseDto } from '@fpm/contracts';
import { PlaceOrderDto } from './dto/place-order.dto';

/**
 * Places orders, paid at the shop when picked up. Signed-in customers and guests
 * have their own route, so no guard has to make authentication optional.
 */
@Controller('orders')
export class OrderController {
    constructor(private readonly placeOrder: PlaceOrderUseCase) {}

    /** Order of the signed-in customer: 401 without a session, 404 without a customer profile. */
    @Post()
    @UseGuards(JwtCookieAuthGuard)
    async place(
        @AuthenticatedUserId() customerId: string,
        @Body() dto: PlaceOrderDto,
    ): Promise<OrderResponseDto> {
        return toOrderResponse(await this.placeOrder.execute({ customerId, ...dto }));
    }

    @Post('guest')
    async placeAsGuest(@Body() dto: PlaceGuestOrderDto): Promise<OrderResponseDto> {
        return toOrderResponse(await this.placeOrder.execute(dto));
    }
}
