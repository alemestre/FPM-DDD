import type { User } from "../../domain/user.entity";

export abstract class AccessTokenIssuer {
  abstract issue(user: User): Promise<string>;
}
