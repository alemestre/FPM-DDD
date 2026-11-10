import { CategorySlugAlreadyUsedError } from "../../domain/errors/category-slug-already-used.error";
import { CategoryInUseError } from "../../domain/errors/category-in-use.error";
import { CategoryConflictErrorFilter } from "./category-conflict-error.filter";
import type { ArgumentsHost } from "@nestjs/common";

describe("CategoryConflictErrorFilter", () => {
  it.each([
    ["CategoryInUseError", new CategoryInUseError()],
    ["CategorySlugAlreadyUsedError", new CategorySlugAlreadyUsedError()]
  ])("renvoie une réponse 409 avec le message de l’erreur (%s)", (_label, error) => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) })
    } as unknown as ArgumentsHost;

    new CategoryConflictErrorFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      error: "Conflict",
      message: error.message
    });
  });
});
