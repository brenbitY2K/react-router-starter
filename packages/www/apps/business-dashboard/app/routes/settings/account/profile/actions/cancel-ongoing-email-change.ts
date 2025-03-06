import { type ActionFunctionArgs } from "react-router";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { SettingsAccountProfileRouteIntent } from "../profile-route.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { customers } from "@acme/database/schema";
import { EmailOTPRepository } from "~/repositories/email-otps.server.js";
import { EmailOTPAuthService } from "~/services/email-otp-auth.server.js";

export async function cancelOngoingEmailChange(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsAccountProfileRouteIntent.CANCEL_ONGOING_EMAIL_CHANGE,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const emailOtpAuthService = new EmailOTPAuthService({
    logger,
    emailOTPRepository: new EmailOTPRepository(),
  });

  await emailOtpAuthService.cancelOngoingEmailChangeForUser({
    userId: customer.userId,
  });

  return { success: true };
}
