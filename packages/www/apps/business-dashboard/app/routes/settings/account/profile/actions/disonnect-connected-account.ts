import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { SettingsAccountProfileRouteIntent } from "../profile-route.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { validateFormData } from "~/utils/actions.server.js";
import { customers } from "@acme/database/schema";
import { UserService } from "~/services/user.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";

const disconnectConnectedAccountSchema = z.object({
  providerId: z.string().min(1, "Please select an account"),
});

export async function disconnectConnectedAccount(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsAccountProfileRouteIntent.DISCONNECT_CONNECTED_ACCOUNT,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: disconnectConnectedAccountSchema,
    formData,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "Please select an account to disconnect",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const userService = new UserService({
    logger,
    userRepo: new UserRepository(),
  });

  userService.disconnectConnectedAccount({
    providerId: parsed.data.providerId,
    userId: customer.userId,
  });

  return { success: true };
}
