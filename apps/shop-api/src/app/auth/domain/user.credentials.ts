import type { User } from "./user.entity";

export interface UserCredentials {
  readonly user: User;
  readonly passwordHash: string;
}
