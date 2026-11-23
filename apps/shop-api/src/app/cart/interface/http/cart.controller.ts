import { ChangeCartItemQuantityUseCase } from '../../application/use-cases/change-cart-item-quantity.use-case';
import { AuthenticatedUserId } from '../../../auth/interface/http/authenticated-user-id.decorator';
import { JwtCookieAuthGuard } from '../../../auth/interface/http/guards/jwt-cookie-auth.guard';
import { RemoveCartItemUseCase } from '../../application/use-cases/remove-cart-item.use-case';
import { AddCartItemUseCase } from '../../application/use-cases/add-cart-item.use-case';
import { ChangeCartItemQuantityDto } from './dto/change-cart-item-quantity.dto';
import { GetCartUseCase } from '../../application/use-cases/get-cart.use-case';
import { AddCartItemDto } from './dto/add-cart-item.dto';
import { toCartResponse } from './cart.response.mapper';
import type { CartResponseDto } from '@fpm/contracts';
import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    ParseUUIDPipe,
    Patch,
    Post,
    UseGuards,
} from '@nestjs/common';
import { ClearCartUseCase } from '../../application/use-cases/clear-cart.use-case';

/**
 * Cart of the signed-in customer, saved in the database. Guests keep theirs in the browser.
 * Every route needs a session (401 otherwise) and answers with the whole cart, except the
 * one that empties it (204).
 */
@Controller('cart')
@UseGuards(JwtCookieAuthGuard)
export class CartController {
    constructor(
        private readonly getCart: GetCartUseCase,
        private readonly addCartItem: AddCartItemUseCase,
        private readonly changeCartItemQuantity: ChangeCartItemQuantityUseCase,
        private readonly removeCartItem: RemoveCartItemUseCase,
        private readonly clearCart: ClearCartUseCase,
    ) {}

    @Get()
    async findMine(@AuthenticatedUserId() customerId: string): Promise<CartResponseDto> {
        return toCartResponse(await this.getCart.execute(customerId));
    }

    /** Adds to the quantity already in the cart: 400 above 10 units or above the stock. */
    @Post('items')
    async add(
        @AuthenticatedUserId() customerId: string,
        @Body() { productId, quantity }: AddCartItemDto,
    ): Promise<CartResponseDto> {
        return toCartResponse(await this.addCartItem.execute(customerId, productId, quantity));
    }

    /** 404 if the product is not in the cart, 400 above 10 units or above the stock. */
    @Patch('items/:productId')
    async changeQuantity(
        @AuthenticatedUserId() customerId: string,
        @Param('productId', ParseUUIDPipe) productId: string,
        @Body() { quantity }: ChangeCartItemQuantityDto,
    ): Promise<CartResponseDto> {
        return toCartResponse(
            await this.changeCartItemQuantity.execute(customerId, productId, quantity),
        );
    }

    /** 404 if the product is not in the cart. */
    @Delete('items/:productId')
    async remove(
        @AuthenticatedUserId() customerId: string,
        @Param('productId', ParseUUIDPipe) productId: string,
    ): Promise<CartResponseDto> {
        return toCartResponse(await this.removeCartItem.execute(customerId, productId));
    }

    /** Empties the cart: 204, even if it was already empty. */
    @Delete('items')
    @HttpCode(HttpStatus.NO_CONTENT)
    async clear(@AuthenticatedUserId() customerId: string): Promise<void> {
        await this.clearCart.execute(customerId);
    }
}
