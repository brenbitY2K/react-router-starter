import { serverConfig } from "~/config.server.js";
import { type Logger } from "~/logging/index.js";
import jwt from "jsonwebtoken";
import { throwNotFoundErrorResponseJsonAndLog } from "~/utils/response.server.js";

import { type GoogleTokens } from "arctic";
import { redirectWithToast } from "remix-toast";

export function getDataFromJWTOrThrow({
  token,
  logger,
}: {
  logger: Logger;
  token: string;
}) {
  try {
    const decoded = jwt.verify(token, serverConfig.emailOtpJwtSecret ?? "") as
      | { email: string; code: string; name?: string }
      | undefined;

    if (!decoded || (!decoded.email && !decoded.code)) throw new Error();

    return { email: decoded.email, code: decoded.code, name: decoded.name };
  } catch (_error) {
    throw throwNotFoundErrorResponseJsonAndLog({
      data: { message: "This login link is invalid" },
      logInfo: { logger, event: "email_otp_link_token_invalid" },
    });
  }
}

export async function fetchGoogleUser(tokens: GoogleTokens) {
  const response = await fetch(
    "https://openidconnect.googleapis.com/v1/userinfo",
    {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    },
  );

  return (await response.json()) as GoogleUser;
}

export async function redirectWithBaseGoogleError(path: string) {
  throw await redirectWithToast(path, {
    type: "error",
    message:
      "We had trouble authenticating with Google. Please try again later.",
  });
}

export function isValidRedirectPath(path: string) {
  try {
    if (!path.startsWith("/")) return false;
  } catch (error) {
    return false;
  }
}

export interface GoogleUser {
  name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  sub: string;
}
