import { NestMailOrderConfirmationSender } from './nest-mail-order-confirmation.sender';
import { BillingAddress } from '../domain/billing-address.value-object';
import { OrderContact } from '../domain/order-contact.value-object';
import { OrderNumber } from '../domain/order-number.value-object';
import { OrderRegisteredMail } from './mail/order-registered.mail';
import { OrderLine } from '../domain/order-line.value-object';
import { MailError, type Mailer } from '@nestjs/mail';
import { Order } from '../domain/order.entity';
import { Logger } from '@nestjs/common';

jest.mock('uuid', () => ({
    v4: jest.fn(() => '12345678-1234-4123-8123-123456789abc'),
    validate: jest.fn(() => true),
}));

/** Intl inserts narrow no-break spaces in French amounts. */
const normalizeSpaces = (value: unknown) =>
    JSON.parse(JSON.stringify(value).replace(/[\u202f\u00a0]/g, ' '));

describe('NestMailOrderConfirmationSender', () => {
    let mailer: { send: jest.Mock };
    let sender: NestMailOrderConfirmationSender;
    let order: Order;

    beforeEach(() => {
        mailer = { send: jest.fn().mockResolvedValue({}) };
        sender = new NestMailOrderConfirmationSender(mailer as unknown as Mailer);
        order = Order.place({
            customerId: null,
            contact: OrderContact.create({
                firstName: 'Paul',
                lastName: 'Martin',
                email: 'paul@example.fr',
                phone: '0698765432',
            }),
            billingAddress: BillingAddress.create({
                line1: '2 quai Est',
                postalCode: '29200',
                city: 'Brest',
            }),
            lines: [
                OrderLine.create({
                    productId: 'a3bb189e-8bf9-4888-9912-ace4e6543002',
                    productName: 'Farine',
                    unitPrice: 2.5,
                    vatRate: 20,
                    quantity: 2,
                }),
            ],
            orderedAt: new Date('2026-11-16T11:00:00Z'),
        });
        order.assignNumber(OrderNumber.of('2026-11', 4));
    });

    afterEach(() => jest.restoreAllMocks());

    it('envoie le récapitulatif de la commande au contact', async () => {
        await sender.send(order);

        const [mailable, message] = mailer.send.mock.calls[0];
        expect(mailable).toBe(OrderRegisteredMail);
        expect(normalizeSpaces(message)).toEqual({
            to: { name: 'Paul Martin', address: 'paul@example.fr' },
            data: {
                firstName: 'Paul',
                orderNumber: '2026-11-4',
                lines: [{ productName: 'Farine', quantity: 2, total: '6,00 €' }],
                subtotal: '5,00 €',
                tax: '1,00 €',
                total: '6,00 €',
                billingAddress: ['Paul Martin', '2 quai Est', '29200 Brest'],
                estimatedPickupDate: 'jeudi 19 novembre 2026',
            },
        });
    });

    it("journalise un échec d'envoi sans le propager : la commande est déjà enregistrée", async () => {
        const logError = jest.spyOn(Logger.prototype, 'error').mockImplementation();
        mailer.send.mockRejectedValue(new MailError('SMTP indisponible', { permanent: false }));

        await expect(sender.send(order)).resolves.toBeUndefined();
        expect(logError).toHaveBeenCalledWith(
            expect.stringContaining('2026-11-4'),
            expect.any(String),
        );
    });

    it('propage les erreurs qui ne viennent pas du mailer', async () => {
        const bug = new TypeError('bug');
        mailer.send.mockRejectedValue(bug);

        await expect(sender.send(order)).rejects.toBe(bug);
    });
});
