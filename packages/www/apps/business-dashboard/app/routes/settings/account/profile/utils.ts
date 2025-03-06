import { serverConfig } from "~/config.server.js";
import jwt from "jsonwebtoken";
import { throwNotFoundErrorResponseJsonAndLog } from "~/utils/response.server.js";
import { type Logger } from "~/logging/index.js";

export function getDataFromEmailChangeJWTOrThrow({
  token,
  logger,
}: {
  logger: Logger;
  token: string;
}) {
  try {
    const decoded = jwt.verify(token, serverConfig.emailOtpJwtSecret ?? "") as
      | { email: string; code: string }
      | undefined;

    if (!decoded || !decoded.code) throw new Error();

    return { code: decoded.code };
  } catch (_error) {
    throw throwNotFoundErrorResponseJsonAndLog({
      data: { message: "This email change link is invalid" },
      logInfo: { logger, event: "email_otp_link_token_invalid" },
    });
  }
}
