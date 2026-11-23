import { ChangeCartItemQuantityUseCase } from './application/use-cases/change-cart-item-quantity.use-case';
import { RemoveCartItemUseCase } from './application/use-cases/remove-cart-item.use-case';
import { AddCartItemUseCase } from './application/use-cases/add-cart-item.use-case';
import { GetCartUseCase } from './application/use-cases/get-cart.use-case';
import { PrismaCartRepository } from './infrastructure/prisma-cart.repository';
import { CartController } from './interface/http/cart.controller';
import { CartRepository } from './domain/cart.repository';
import { ProductModule } from '../product/product.module';
import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';
import { ClearCartUseCase } from './application/use-cases/clear-cart.use-case';

@Module({
  // AuthModule provides JwtCookieAuthGuard; ProductModule exports ProductRepository,
  // read for the stock and the products shown in the cart.
  imports: [AuthModule, ProductModule],
  controllers: [CartController],
  providers: [
    GetCartUseCase,
    ClearCartUseCase,
    AddCartItemUseCase,
    ChangeCartItemQuantityUseCase,
    RemoveCartItemUseCase,
    { provide: CartRepository, useClass: PrismaCartRepository }
  ]
})
export class CartModule {
}
