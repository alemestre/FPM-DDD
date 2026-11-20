import { AuthenticatedUserId } from '../../../auth/interface/http/authenticated-user-id.decorator';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { ListOrdersUseCase } from '../../application/use-cases/list-orders.use-case';
import { GetOrderUseCase } from '../../application/use-cases/get-order.use-case';
import { PlaceOrderUseCase } from '../../application/use-cases/place-order.use-case';
import {
    Body,
    Controller,
    Get,
    Param,
    ParseUUIDPipe,
    Post,
    Query,
    UseGuards,
} from '@nestjs/common';
import { PlaceGuestOrderDto } from './dto/place-guest-order.dto';
import { ListOrdersQueryDto } from './dto/list-orders-query.dto';
import { toOrderResponse } from './order.response.mapper';
import type { OrderResponseDto } from '@fpm/contracts';
import { PlaceOrderDto } from './dto/place-order.dto';

/**
 * Places orders, paid at the shop when picked up, and lists those of the signed-in
 * customer. Signed-in customers and guests have their own route, so no guard has to
 * make authentication optional.
 */
@Controller('orders')
export class OrderController {
    constructor(
        private readonly placeOrder: PlaceOrderUseCase,
        private readonly listOrders: ListOrdersUseCase,
        private readonly getOrder: GetOrderUseCase,
    ) {}

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

    /**
     * Orders of the signed-in customer, newest first, optionally filtered by status
     * (`?status=READY&status=IN_PROGRESS`): 401 without a session, 400 for an unknown status.
     */
    @Get()
    @UseGuards(JwtCookieAuthGuard)
    async listMine(
        @AuthenticatedUserId() customerId: string,
        @Query() { status }: ListOrdersQueryDto,
    ): Promise<OrderResponseDto[]> {
        const orders = await this.listOrders.execute(customerId, status);
        return orders.map(toOrderResponse);
    }

    /**
     * One order of the signed-in customer: 401 without a session, 400 for an id that is
     * not a UUID, 404 if the order does not exist or belongs to someone else.
     */
    @Get(':id')
    @UseGuards(JwtCookieAuthGuard)
    async findMine(
        @AuthenticatedUserId() customerId: string,
        @Param('id', ParseUUIDPipe) id: string,
    ): Promise<OrderResponseDto> {
        return toOrderResponse(await this.getOrder.execute(id, customerId));
    }
}
