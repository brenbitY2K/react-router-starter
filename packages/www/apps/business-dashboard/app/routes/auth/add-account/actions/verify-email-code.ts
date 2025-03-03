import { redirect, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger } from "~/logging/index.js";
import { EmailOTPRepository } from "~/repositories/email-otps.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { EmailOTPAuthService } from "~/services/email-otp-auth.server.js";
import {
  currentUserSessionStorage,
  getAuthSessionStorageWithUserId,
} from "~/sessions/auth.server.js";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server.js";
import {
  throwActionErrorAndLog,
  throwNotFoundErrorResponseJsonAndLog,
} from "~/utils/response.server.js";
import {
  createNewAuthSessionAndSetActiveUser,
  getClientInformationForSession,
} from "~/utils/sessions.server.js";

export const verifyEmailCodeSchema = z.object({
  code: z.string().min(1, "Please enter a valid code."),
  email: z.string().email("Please enter a valid email."),
});

export async function verifyEmailCode(
  args: ActionFunctionArgs,
  logger: Logger,
) {
  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: verifyEmailCodeSchema,
    formData,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const authService = new EmailOTPAuthService({
    logger,
    emailOTPRepository: new EmailOTPRepository(),
  });

  const userId = await authService.verifyEmailOTPForLogin({
    email: parsed.data.email.trim().toLowerCase(),
    code: parsed.data.code.trim(),
    userRepo: new UserRepository(),
    customerRepo: new CustomerRepository(),
    invalidCodeThrower: () => {
      throw throwActionErrorAndLog({
        message: "This code is invalid.",
        logInfo: { logger: logger, event: "email_otp_does_not_exist" },
      });
    },
    expiredCodeThrower: () => {
      throw throwActionErrorAndLog({
        message: "This code has expired.",
        logInfo: { logger: logger, event: "email_otp_expired" },
      });
    },
    userDoesNotExistThrower: () => {
      throw throwNotFoundErrorResponseJsonAndLog({
        data: {
          message:
            "A user with this email does not exist. Please create an account first.",
        },
        logInfo: { logger, event: "account_with_email_does_not_exist" },
      });
    },
  });

  const authSessionStorage = getAuthSessionStorageWithUserId({
    userId,
    sessionRepo: new SessionRepository(),
  });

  const cookieHeader = args.request.headers.get("Cookie");

  const clientInfo = await getClientInformationForSession({
    request: args.request,
    logger,
  });
  const { authSession, currentUserSession } =
    await createNewAuthSessionAndSetActiveUser({
      authSessionStorage,
      data: { userId, ...clientInfo },
      cookieHeader,
    });

  throw redirect("/signup", {
    headers: [
      ["Set-Cookie", await authSessionStorage.commitSession(authSession)],
      [
        "Set-Cookie",
        await currentUserSessionStorage.commitSession(currentUserSession),
      ],
    ],
  });
}
