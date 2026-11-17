import { ChangePasswordSchema } from "./change-password.dto";

describe("ChangePasswordSchema", () => {
  const valid = { currentPassword: "ancien", newPassword: "Nouveau1!motdepasse" };

  it("accepte un changement complet", () => {
    expect(ChangePasswordSchema.safeParse(valid).success).toBe(true);
  });

  it.each([
    ["sans mot de passe actuel", { ...valid, currentPassword: "" }],
    ["avec un nouveau mot de passe trop court", { ...valid, newPassword: "Ab1!" }],
    ["avec un nouveau mot de passe trop long", { ...valid, newPassword: `Ab1!${"x".repeat(130)}` }],
    ["sans nouveau mot de passe", { currentPassword: "ancien" }],
    ["avec un champ inconnu", { ...valid, email: "x@y.fr" }]
  ])("refuse un corps %s", (_case, body) => {
    expect(ChangePasswordSchema.safeParse(body).success).toBe(false);
  });
});
