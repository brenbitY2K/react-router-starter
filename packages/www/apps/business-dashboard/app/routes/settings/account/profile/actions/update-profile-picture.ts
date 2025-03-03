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

const updateProfilePictureSchema = z.object({
  imageUrl: z.string().min(1, "Please provide a image url").optional(),
});

export async function updateProfilePicture(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsAccountProfileRouteIntent.UPDATE_PROFILE_PICTURE,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: updateProfilePictureSchema,
    formData,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message:
        "We weren't able to update your profile picture. Please try again later.",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const userService = new UserService({
    logger,
    userRepo: new UserRepository(),
  });

  await userService.updateCoreProfileInfo({
    userId: customer.userId,
    imageUrl: parsed.data.imageUrl,
  });

  return {
    success: true,
  };
}
