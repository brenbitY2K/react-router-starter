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

const updateCoreProfileInfoSchema = z.object({
  name: z.string().min(1, "Please provide a valid name").optional(),
});

export async function updateCoreProfileInfo(
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

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: updateCoreProfileInfoSchema,
    formData,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const userService = new UserService({
    logger,
    userRepo: new UserRepository(),
  });

  await userService.updateCoreProfileInfo({
    name: parsed.data.name,
    userId: customer.userId,
  });

  return {
    success: true,
  };
}
