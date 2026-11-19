import { OrderConfirmationSender } from '../application/ports/order-confirmation-sender';
import { OrderRegisteredMail } from './mail/order-registered.mail';
import type { Order } from '../domain/order.entity';
import { Injectable, Logger } from '@nestjs/common';
import { MailError, Mailer } from '@nestjs/mail';

const EURO = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' });

/** The pickup date is a calendar day stored at 00:00 UTC: it is printed in UTC to keep that day. */
const PICKUP_DATE = new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
});

/**
 * Sends the "order registered" email through @nestjs/mail, which already retries
 * transient failures. A failed send is logged, not rethrown: the order is already saved.
 */
@Injectable()
export class NestMailOrderConfirmationSender implements OrderConfirmationSender {
    private readonly logger = new Logger(NestMailOrderConfirmationSender.name);

    constructor(private readonly mailer: Mailer) {}

    async send(order: Order): Promise<void> {
        const { contact, billingAddress } = order;
        const orderNumber = order.number?.toString() ?? '';

        try {
            await this.mailer.send(OrderRegisteredMail, {
                to: { name: contact.fullName, address: contact.email },
                data: {
                    firstName: contact.firstName,
                    orderNumber,
                    lines: order.lines.map((line) => ({
                        productName: line.productName,
                        quantity: line.quantity,
                        total: EURO.format(line.total),
                    })),
                    subtotal: EURO.format(order.subtotal),
                    tax: EURO.format(order.tax),
                    total: EURO.format(order.total),
                    billingAddress: [
                        contact.fullName,
                        billingAddress.line1,
                        billingAddress.line2,
                        `${billingAddress.postalCode} ${billingAddress.city}`,
                    ].filter((line) => line !== ''),
                    estimatedPickupDate: PICKUP_DATE.format(order.estimatedPickupDate),
                },
            });
        } catch (error) {
            if (!(error instanceof MailError)) {
                throw error;
            }
            this.logger.error(
                `Échec de l'envoi de la confirmation de la commande ${orderNumber} (${order.id})`,
                error.stack,
            );
        }
    }
}
