import { NestMailOrderConfirmationSender } from './infrastructure/nest-mail-order-confirmation.sender';
import { OrderConfirmationSender } from './application/ports/order-confirmation-sender';
import { ListOrdersUseCase } from './application/use-cases/list-orders.use-case';
import { PlaceOrderUseCase } from './application/use-cases/place-order.use-case';
import { OrderRegisteredMail } from './infrastructure/mail/order-registered.mail';
import { PrismaOrderRepository } from './infrastructure/prisma-order.repository';
import { OrderController } from './interface/http/order.controller';
import { OrderRepository } from './domain/order.repository';
import { AuthModule } from '../auth/auth.module';
import { Module } from '@nestjs/common';

@Module({
    // Provides JwtCookieAuthGuard, which protects the signed-in customer's route.
    // Mailer comes from MailModule, registered globally by AuthModule.
    imports: [AuthModule],
    controllers: [OrderController],
    providers: [
        PlaceOrderUseCase,
        ListOrdersUseCase,
        OrderRegisteredMail,
        { provide: OrderRepository, useClass: PrismaOrderRepository },
        { provide: OrderConfirmationSender, useClass: NestMailOrderConfirmationSender },
    ],
})
export class OrderModule {}
