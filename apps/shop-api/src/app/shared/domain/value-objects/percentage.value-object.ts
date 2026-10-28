
export class Percentage {
    private constructor(public readonly value: number) {}
  
    static create(value: number): Percentage {
      if (!Number.isFinite(value) || value < 0 || value > 100) {
        throw new Error("Le pourcentage doit être compris entre 0 et 100");
      }
  
      return new Percentage(value);
    }
  
    equals(other: Percentage): boolean {
      return this.value === other.value;
    }
  }
  