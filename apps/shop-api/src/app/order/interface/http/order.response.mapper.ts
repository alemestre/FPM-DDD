import type { OrderResponseDto } from '@fpm/contracts';
import type { Order } from '../../domain/order.entity';

/** Maps a saved order to its public HTTP representation. */
export function toOrderResponse(order: Order): OrderResponseDto {
    const { contact, billingAddress } = order;

    return {
        id: order.id,
        number: order.number?.toString() ?? '',
        status: order.status,
        isModified: order.isModified,
        createdAt: order.orderedAt.toISOString(),
        estimatedPickupDate: order.estimatedPickupDate.toISOString().slice(0, 10),
        contact: {
            firstName: contact.firstName,
            lastName: contact.lastName,
            email: contact.email,
            phone: contact.phone,
        },
        billingAddress: {
            line1: billingAddress.line1,
            line2: billingAddress.line2,
            postalCode: billingAddress.postalCode,
            city: billingAddress.city,
        },
        items: order.lines.map((line) => ({
            productId: line.productId,
            productName: line.productName,
            unitPrice: line.unitPrice,
            vatRate: line.vatRate,
            quantity: line.quantity,
            confirmedQuantity: line.confirmedQuantity,
            total: line.total,
        })),
        subtotal: order.subtotal,
        tax: order.tax,
        total: order.total,
    };
}
