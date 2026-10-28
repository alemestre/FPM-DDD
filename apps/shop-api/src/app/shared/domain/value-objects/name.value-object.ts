export class Name {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Name {
    const t = raw?.trim();
    if (!t || t.length < 3) {
      throw new Error("Title too short");
    }
    return new Name(t);
  }
  toString() {
    return this._value;
  }
}
