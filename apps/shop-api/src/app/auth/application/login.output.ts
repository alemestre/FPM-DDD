import type { User } from "../domain/user.entity";

export interface LoginOutput {
  readonly user: User;
  readonly accessToken: string;
}
