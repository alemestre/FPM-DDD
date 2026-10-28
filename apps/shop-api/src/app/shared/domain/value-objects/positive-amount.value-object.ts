export class PositiveAmount {
    private constructor(public readonly value: number) {}
  
    static create(value: number): PositiveAmount {
      if (!Number.isFinite(value) || value <= 0) {
        throw new Error("Le montant doit être strictement supérieur à 0");
      }
  
      return new PositiveAmount(value);
    }
  
    equals(other: PositiveAmount): boolean {
      return this.value === other.value;
    }
  }
  