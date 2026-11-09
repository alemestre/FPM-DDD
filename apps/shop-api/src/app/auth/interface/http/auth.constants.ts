import type { CookieOptions } from "express";

/** Name of the HTTP-only cookie that carries the access token (JWT). */
export const ACCESS_TOKEN_COOKIE = "access_token";

/** Lifetime of the access token and of its cookie. */
export const ACCESS_TOKEN_TTL_SECONDS = 60 * 60; // 1 h

/**
 * Options shared by login (set) and logout (clear): the browser only removes a
 * cookie when the clearing options match the ones it was set with.
 * SameSite=Lax keeps the cookie off cross-site POST requests (CSRF).
 */
export const ACCESS_TOKEN_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env["NODE_ENV"] === "production",
  path: "/"
};
