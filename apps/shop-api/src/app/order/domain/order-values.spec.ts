import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { BillingAddress } from './billing-address.value-object';
import { OrderContact } from './order-contact.value-object';
import { OrderLine } from './order-line.value-object';

describe('BillingAddress', () => {
    const valid = {
        line1: ' 1 rue des Lilas ',
        line2: ' Bât. B ',
        postalCode: '29 000',
        city: ' Quimper ',
    };

    it('normalise les valeurs', () => {
        const address = BillingAddress.create(valid);

        expect(address.line1).toBe('1 rue des Lilas');
        expect(address.line2).toBe('Bât. B');
        expect(address.postalCode).toBe('29000');
        expect(address.city).toBe('Quimper');
    });

    it('utilise un complément vide par défaut', () => {
        expect(BillingAddress.create({ ...valid, line2: undefined }).line2).toBe('');
    });

    it.each([
        ['line1', { ...valid, line1: '  ' }],
        ['city', { ...valid, city: '' }],
        ['postalCode', { ...valid, postalCode: '2900' }],
    ])('refuse une adresse dont %s est invalide', (_field, props) => {
        expect(() => BillingAddress.create(props)).toThrow(DomainValidationError);
    });
});

describe('OrderContact', () => {
    const valid = {
        firstName: ' Marie ',
        lastName: ' Durand ',
        email: ' Marie@Example.fr ',
        phone: '06 12 34 56 78',
    };

    it('normalise le contact', () => {
        const contact = OrderContact.create(valid);

        expect(contact.firstName).toBe('Marie');
        expect(contact.fullName).toBe('Marie Durand');
        expect(contact.email).toBe('marie@example.fr');
        expect(contact.phone).toBe('+33612345678');
    });

    it.each([
        ['sans prénom', { ...valid, firstName: ' ' }],
        ['sans nom', { ...valid, lastName: '' }],
        ['avec un e-mail invalide', { ...valid, email: 'marie' }],
        ['avec un téléphone invalide', { ...valid, phone: '123' }],
    ])('refuse un contact %s', (_case, props) => {
        expect(() => OrderContact.create(props)).toThrow(DomainValidationError);
    });
});

describe('OrderLine', () => {
    const valid = {
        productId: 'a3bb189e-8bf9-4888-9912-ace4e6543002',
        productName: 'Farine de blé',
        unitPrice: 2.5,
        vatRate: 5.5,
        quantity: 3,
    };

    it('calcule le HT, la TVA arrondie au centime et le TTC de la ligne', () => {
        const line = OrderLine.create(valid);

        expect(line.subtotal).toBe(7.5);
        expect(line.tax).toBe(0.41);
        expect(line.total).toBe(7.91);
    });

    it.each([
        ['une quantité nulle', { ...valid, quantity: 0 }],
        ['une quantité décimale', { ...valid, quantity: 1.5 }],
        ['un prix nul', { ...valid, unitPrice: 0 }],
        ['un taux de TVA hors bornes', { ...valid, vatRate: 120 }],
        ['un nom vide', { ...valid, productName: ' ' }],
    ])('refuse %s', (_case, props) => {
        expect(() => OrderLine.create(props)).toThrow(DomainValidationError);
    });
});
