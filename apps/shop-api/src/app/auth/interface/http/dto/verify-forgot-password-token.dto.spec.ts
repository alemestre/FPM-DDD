import { VerifyForgotPasswordTokenSchema } from "./verify-forgot-password-token.dto";

describe("VerifyForgotPasswordTokenSchema", () => {
  it("accepte un jeton", () => {
    expect(VerifyForgotPasswordTokenSchema.safeParse({ token: "header.payload.signature" }).success).toBe(true);
  });

  it.each([
    ["sans jeton", {}],
    ["avec un jeton vide", { token: "" }],
    ["avec un champ inconnu", { token: "a.b.c", email: "x@y.fr" }]
  ])("refuse un corps %s", (_case, body) => {
    expect(VerifyForgotPasswordTokenSchema.safeParse(body).success).toBe(false);
  });
});
