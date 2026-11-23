import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import { PostalAddress } from '../../../shared/domain/value-objects/postal-address.value-object';
import { OrderConfirmationSender } from '../ports/order-confirmation-sender';
import { OrderContact } from '../../domain/order-contact.value-object';
import { OrderLine } from '../../domain/order-line.value-object';
import type { PlaceOrderInput, PlaceOrderItemInput } from '../place-order.input';
import { OrderRepository } from '../../domain/order.repository';
import { Order } from '../../domain/order.entity';
import { Inject, NotFoundException } from '@nestjs/common';

export class PlaceOrderUseCase {
    constructor(
        @Inject(OrderRepository) private readonly repository: OrderRepository,
        @Inject(OrderConfirmationSender)
        private readonly confirmationSender: OrderConfirmationSender,
    ) {}

    /**
     * Registers the order of a signed-in customer or of a guest, then emails its confirmation.
     * Prices, names and VAT rates are read from the catalog, never from the request.
     *
     * @throws {DomainValidationError} If a product is unknown or unavailable, or an input breaks a rule.
     * @throws {NotFoundException} If the signed-in user has no customer profile.
     */
    async execute(input: PlaceOrderInput, orderedAt = new Date()): Promise<Order> {
        const billingAddress = PostalAddress.create(input.billingAddress);
        const [lines, contact] = await Promise.all([
            this.toLines(input.items),
            this.contactOf(input),
        ]);

        const order = Order.place({
            customerId: 'customerId' in input ? input.customerId : null,
            contact,
            billingAddress,
            lines,
            orderedAt,
        });

        const saved = await this.repository.save(order);
        await this.confirmationSender.send(saved);
        return saved;
    }

    private async contactOf(input: PlaceOrderInput): Promise<OrderContact> {
        if (!('customerId' in input)) {
            return OrderContact.create(input.contact);
        }

        const contact = await this.repository.findCustomerContact(input.customerId);
        if (!contact) {
            throw new NotFoundException();
        }
        return OrderContact.create(contact);
    }

    private async toLines(items: readonly PlaceOrderItemInput[]): Promise<OrderLine[]> {
        const products = await this.repository.findOrderableProducts(
            items.map((item) => item.productId),
        );
        const productById = new Map(products.map((product) => [product.id, product]));

        return items.map(({ productId, quantity }) => {
            const product = productById.get(productId);
            if (!product) {
                throw new DomainValidationError(`Le produit ${productId} n'existe pas`);
            }
            if (!product.isAvailable) {
                throw new DomainValidationError(
                    `Le produit "${product.name}" n'est plus disponible`,
                );
            }

            return OrderLine.create({
                productId,
                productName: product.name,
                unitPrice: product.price,
                vatRate: product.vatRate,
                quantity,
            });
        });
    }
}
