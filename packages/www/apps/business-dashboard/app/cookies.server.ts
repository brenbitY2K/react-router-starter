import { createCookie } from "react-router";
import { serverConfig } from "./config.server.js";

export const googleOauthState = createCookie("google_oauth_state", {
  path: "/",
  secure: serverConfig.nodeEnv === "production",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax",
});

export const googleOauthCodeVerifier = createCookie(
  "google_oauth_code_verifier",
  {
    path: "/",
    secure: serverConfig.nodeEnv === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  },
);

export const oauthRequestOrigin = createCookie("oauth_request_origin", {
  path: "/",
  secure: serverConfig.nodeEnv === "production",
  httpOnly: true,
  maxAge: 60 * 10,
  sameSite: "lax",
});

export const oauthRequestReturToPath = createCookie(
  "oauth_request_return_to_path",
  {
    path: "/",
    secure: serverConfig.nodeEnv === "production",
    httpOnly: true,
    maxAge: 60 * 10,
    sameSite: "lax",
  },
);

export type SetCookieHeader = ["Set-Cookie", string];
