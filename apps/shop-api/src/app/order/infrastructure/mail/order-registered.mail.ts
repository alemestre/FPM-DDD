import type { Mailable, MailTemplateContent } from '@nestjs/mail';
import { Injectable } from '@nestjs/common';

export interface OrderRegisteredMailLine {
    readonly productName: string;
    readonly quantity: number;
    /** Line total including VAT, already formatted ("12,50 €"). */
    readonly total: string;
}

export interface OrderRegisteredMailData {
    readonly firstName: string;
    readonly orderNumber: string;
    readonly lines: readonly OrderRegisteredMailLine[];
    /** Totals, already formatted. */
    readonly subtotal: string;
    readonly tax: string;
    readonly total: string;
    /** Billing address, one entry per printed line. */
    readonly billingAddress: readonly string[];
    /** Indicative pickup date, already formatted ("jeudi 26 novembre 2026"). */
    readonly estimatedPickupDate: string;
}

/**
 * Email sent once an order is registered. Rendered from
 * `assets/mail/templates/order-registered.html` (and `.txt`), which escape every value.
 */
@Injectable()
export class OrderRegisteredMail implements Mailable<OrderRegisteredMailData> {
    render(data: OrderRegisteredMailData): MailTemplateContent {
        return {
            subject: `Votre commande n° ${data.orderNumber} est enregistrée`,
            template: 'order-registered',
            context: { ...data },
        };
    }
}
