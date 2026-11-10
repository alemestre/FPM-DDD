import { CategoryInUseError } from "../../domain/errors/category-in-use.error";
import { CategoryInUseErrorFilter } from "./category-in-use-error.filter";
import type { ArgumentsHost } from "@nestjs/common";

describe("CategoryInUseErrorFilter", () => {
  it("renvoie une réponse 409 avec le message de l’erreur", () => {
    const json = jest.fn();
    const status = jest.fn().mockReturnValue({ json });
    const host = {
      switchToHttp: () => ({ getResponse: () => ({ status }) })
    } as unknown as ArgumentsHost;
    const error = new CategoryInUseError();

    new CategoryInUseErrorFilter().catch(error, host);

    expect(status).toHaveBeenCalledWith(409);
    expect(json).toHaveBeenCalledWith({
      statusCode: 409,
      error: "Conflict",
      message: error.message
    });
  });
});
