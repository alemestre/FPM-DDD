import { DomainValidationError } from '../../../shared/domain/errors/domain-validation.error';
import isURL from 'validator/lib/isURL';

/**
 * Absolute http(s) URL of a product image.
 */
export class ImageUrl {
    private constructor(public readonly value: string) {}

    /**
     * @throws {DomainValidationError} If the value is not an absolute http(s) URL.
     */
    static create(raw: string): ImageUrl {
        const value = raw?.trim() ?? '';

        if (
            !value ||
            !isURL(value, {
                protocols: ['http', 'https'],
                require_protocol: true,
                require_tld: false,
            })
        ) {
            throw new DomainValidationError(`L'URL d'image "${raw}" n'est pas valide`);
        }

        return new ImageUrl(value);
    }

    equals(other: ImageUrl): boolean {
        return this.value === other.value;
    }

    toString(): string {
        return this.value;
    }
}
