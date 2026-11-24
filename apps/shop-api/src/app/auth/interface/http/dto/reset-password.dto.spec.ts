import { ResetPasswordSchema } from "./reset-password.dto";

describe("ResetPasswordSchema", () => {
  const valid = { token: "header.payload.signature", password: "Nouveau1!motdepasse" };

  it("accepte un jeton JWT et un mot de passe", () => {
    expect(ResetPasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["sans jeton", { password: valid.password }],
    ["avec un jeton vide", { ...valid, token: "" }],
    ["sans mot de passe", { token: valid.token }],
    ["avec un mot de passe trop court", { ...valid, password: "Ab1!" }],
    ["avec un mot de passe trop long", { ...valid, password: `Ab1!${"x".repeat(130)}` }],
    ["avec un champ inconnu", { ...valid, email: "x@y.fr" }]
  ])("refuse un corps %s", (_case, body) => {
    expect(ResetPasswordSchema.safeParse(body).success).toBe(false);
  });
});
