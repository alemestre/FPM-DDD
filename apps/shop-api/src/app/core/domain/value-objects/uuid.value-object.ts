import { v4 as uuidv4, validate as uuidValidate } from 'uuid';

export class Uuid {
  private readonly value: string;

  constructor(value?: string) {
    if (value) {
      Uuid.validate(value);
      this.value = value;
    } else {
      this.value = uuidv4();
    }
  }

  static validate(value: string): void {
    if (!uuidValidate(value)) {
      throw new Error(`"${value}" n'est pas un UUID valide.`);
    }
  }

  public getValue(): string {
    return this.value
  }
}