import { DomainValidationError } from '../../shared/domain/errors/domain-validation.error';
import { OrderNumber } from './order-number.value-object';

describe('OrderNumber', () => {
    it("s'écrit AAAA-MM-N sans zéros devant N", () => {
        expect(OrderNumber.of('2026-11', 1).toString()).toBe('2026-11-1');
        expect(OrderNumber.of('2026-11', 42).toString()).toBe('2026-11-42');
    });

    it.each([
        ['un rang nul', '2026-11', 0],
        ['un rang négatif', '2026-11', -1],
        ['un rang décimal', '2026-11', 1.5],
        ['un mois invalide', '2026-13', 1],
        ['une période mal formée', '26-11', 1],
    ])('refuse %s', (_case, period, sequence) => {
        expect(() => OrderNumber.of(period, sequence)).toThrow(DomainValidationError);
    });

    it('relit un numéro enregistré', () => {
        expect(OrderNumber.parse('2026-11-7').equals(OrderNumber.of('2026-11', 7))).toBe(true);
        expect(() => OrderNumber.parse('2026-11-07')).toThrow(DomainValidationError);
        expect(() => OrderNumber.parse('CMD-7')).toThrow(DomainValidationError);
    });

    describe('periodOf', () => {
        it('donne le mois de la commande', () => {
            expect(OrderNumber.periodOf(new Date('2026-11-19T10:00:00Z'))).toBe('2026-11');
        });

        it('suit le calendrier de Paris : le 31/10 à 23h30 UTC est déjà en novembre', () => {
            expect(OrderNumber.periodOf(new Date('2026-10-31T23:30:00Z'))).toBe('2026-11');
        });

        it("passe à l'année suivante en décembre", () => {
            expect(OrderNumber.periodOf(new Date('2026-12-31T23:30:00Z'))).toBe('2027-01');
        });
    });
});
