import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { SettingsAccountProfileRouteIntent } from "../profile-route.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server.js";
import { customers } from "@acme/database/schema";
import { UserService } from "~/services/user.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { EmailOTPAuthService } from "~/services/email-otp-auth.server.js";
import { EmailOTPRepository } from "~/repositories/email-otps.server.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";

const checkForExistingEmailSchema = z.object({
  email: z.string().email("Please provide a valid email."),
});

export async function checkForExistingEmail(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsAccountProfileRouteIntent.CHECK_FOR_EXISTING_EMAIL,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: checkForExistingEmailSchema,
    formData,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const userService = new UserService({
    logger,
    userRepo: new UserRepository(),
  });

  const canUseEmail = await userService.checkIfEmailIsAvailableForUse({
    email: parsed.data.email.trim().toLowerCase(),
    userId: customer.userId,
  });

  if (!canUseEmail) {
    return { emailTaken: true, email: parsed.data.email };
  }

  const emailOtpAuthService = new EmailOTPAuthService({
    logger,
    emailOTPRepository: new EmailOTPRepository(),
  });

  await emailOtpAuthService.sendEmailOTPForEmailChange({
    email: parsed.data.email.trim().toLowerCase(),
    userId: customer.userId,
    teamSlug,
  });

  return { emailTaken: false, email: parsed.data.email };
}
