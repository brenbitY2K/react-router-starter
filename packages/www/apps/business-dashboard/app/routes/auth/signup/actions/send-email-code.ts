import { users } from "@acme/database/schema";
import { data, type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger } from "~/logging/index.js";
import { EmailOTPRepository } from "~/repositories/email-otps.server.js";
import { UserQuerier } from "~/repositories/users.server";
import { EmailOTPAuthService } from "~/services/email-otp-auth.server.js";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server";

export const sendEmailCodeSchema = z.object({
  email: z.string().email("Please enter a valid email."),
  name: z.string().min(1, "Please enter your name."),
});

export async function sendEmailCode(args: ActionFunctionArgs, logger: Logger) {
  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: sendEmailCodeSchema,
    formData,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const userQuerier = new UserQuerier();
  const userWithEmail = await userQuerier.queryUserWithEmail({
    email: parsed.data.email.trim().toLowerCase(),
    projection: { id: users.id },
  });

  if (userWithEmail)
    throw throwActionErrorAndLog({
      message: "This email is already in use. Please login instead.",
      logInfo: { logger, event: "email_already_in_use" },
    });

  const authService = new EmailOTPAuthService({
    logger,
    emailOTPRepository: new EmailOTPRepository(),
  });

  const url = new URL(args.request.url);
  const returnTo = url.searchParams.get("returnTo");

  await authService.sendEmailOTPForLogin({
    email: parsed.data.email.trim().toLowerCase(),
    name: parsed.data.name.trim(),
    redirectPath: returnTo ?? undefined,
  });

  return data({ success: true }, { status: 200 });
}
