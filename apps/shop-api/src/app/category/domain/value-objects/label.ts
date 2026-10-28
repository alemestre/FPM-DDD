export class Label {
  private constructor(private readonly _value: string) {}

  static create(raw: string): Label {
    const t = raw?.trim();
    if (!t || t.length < 3) {
      throw new Error("Title too short");
    }
    return new Label(t);
  }
  toString() {
    return this._value;
  }
}
