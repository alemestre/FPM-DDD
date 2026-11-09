import { Producer } from './producer.entity';

const validArgs = () =>
  [
    'Ferme du Moulin',
    ' Contact@Ferme-Moulin.FR ',
    '06 12 34 56 78',
    ' fr 40 303 265 045 ',
    '1 chemin du Moulin',
    ' 75 001 ',
    'Paris',
  ] as const;

jest.mock("uuid", () => ({
    v4: jest.fn(() => "12345678-1234-4123-8123-123456789abc")
}));

describe('Producer', () => {
  describe('create', () => {
    it('crée un producteur avec des valeurs normalisées', () => {
      const producer = Producer.create(...validArgs());

      expect(producer.id).toBeDefined();
      expect(producer.name).toBe('Ferme du Moulin');
      expect(producer.email).toBe('contact@ferme-moulin.fr');
      expect(producer.phone).toBe('+33612345678');
      expect(producer.vatNumber).toBe('FR40303265045');
      expect(producer.postalCode).toBe('75001');
      expect(producer.addressLine2).toBe('');
      expect(producer.isActive).toBe(true);
    });

    it.each([
      ['email', 1, 'pas-un-email'],
      ['téléphone', 2, '12345'],
      ['numéro de TVA', 3, 'FR41303265045'],
      ['code postal', 5, '7500'],
    ])('rejette un %s invalide', (_label, index, value) => {
      const args: string[] = [...validArgs()];
      args[index] = value;

      expect(() =>
        Producer.create(...(args as unknown as Parameters<typeof Producer.create>)),
      ).toThrow();
    });
  });

  describe('modifications', () => {
    it('change et normalise email, téléphone et numéro de TVA', () => {
      const producer = Producer.create(...validArgs());

      producer.changeEmail(' Nouveau@Ferme-Moulin.FR ');
      producer.changePhone('01 45 67 89 10');
      producer.changeVatNumber(' fr 02 000 000 029 ');

      expect(producer.email).toBe('nouveau@ferme-moulin.fr');
      expect(producer.phone).toBe('+33145678910');
      expect(producer.vatNumber).toBe('FR02000000029');
    });

    it.each([
      ['email', (p: Producer) => p.changeEmail('pas-un-email'), (p: Producer) => p.email, 'contact@ferme-moulin.fr'],
      ['téléphone', (p: Producer) => p.changePhone('12345'), (p: Producer) => p.phone, '+33612345678'],
      ['numéro de TVA', (p: Producer) => p.changeVatNumber('FR41303265045'), (p: Producer) => p.vatNumber, 'FR40303265045'],
    ])('rejette un %s invalide et conserve la valeur précédente', (_label, change, read, previous) => {
      const producer = Producer.create(...validArgs());

      expect(() => change(producer)).toThrow();
      expect(read(producer)).toBe(previous);
    });

    it("change uniquement les champs d'adresse fournis", () => {
      const producer = Producer.create(...validArgs());

      producer.changeAddress({ postalCode: ' 69 002 ', city: 'Lyon' });

      expect(producer.postalCode).toBe('69002');
      expect(producer.city).toBe('Lyon');
      expect(producer.addressLine1).toBe('1 chemin du Moulin');
      expect(producer.addressLine2).toBe('');
    });

    it("n'expose pas les champs d'adresse en écriture", () => {
      const producer = Producer.create(...validArgs());

      expect(() => {
        (producer as unknown as { city: string }).city = 'Lyon';
      }).toThrow(TypeError);
      expect(producer.city).toBe('Paris');
    });

    it("n'applique aucune modification d'adresse si le code postal est invalide", () => {
      const producer = Producer.create(...validArgs());

      expect(() => producer.changeAddress({ postalCode: '7500', city: 'Lyon' })).toThrow();
      expect(producer.postalCode).toBe('75001');
      expect(producer.city).toBe('Paris');
    });
  });

  describe('activation', () => {
    it('désactive puis réactive un producteur', () => {
      const producer = Producer.create(...validArgs());

      producer.deactivate();
      expect(producer.isActive).toBe(false);

      producer.activate();
      expect(producer.isActive).toBe(true);
    });

    it("n'expose pas isActive en écriture", () => {
      const producer = Producer.create(...validArgs());

      expect(() => {
        (producer as unknown as { isActive: boolean }).isActive = false;
      }).toThrow(TypeError);
      expect(producer.isActive).toBe(true);
    });
  });

  describe('reconstitute', () => {
    it("reconstitue un producteur à partir de l'état persisté", () => {
      const producer = Producer.reconstitute(
        'a3bb189e-8bf9-3888-9912-ace4e6543002',
        'Ferme du Moulin',
        'contact@ferme-moulin.fr',
        '+33612345678',
        'FR40303265045',
        '1 chemin du Moulin',
        '75001',
        'Paris',
        'Bâtiment B',
        false,
      );

      expect(producer.id).toBe('a3bb189e-8bf9-3888-9912-ace4e6543002');
      expect(producer.phone).toBe('+33612345678');
      expect(producer.postalCode).toBe('75001');
      expect(producer.addressLine2).toBe('Bâtiment B');
      expect(producer.isActive).toBe(false);
    });
  });
});
