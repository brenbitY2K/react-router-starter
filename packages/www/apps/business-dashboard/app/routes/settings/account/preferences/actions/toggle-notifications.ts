import { customers, teams } from "@acme/database/schema";
import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { validateFormData } from "~/utils/actions.server.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { AccountPreferencesRouteIntent } from "../preferences-route.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { CustomerService } from "~/services/customer.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { validateTeamSlugRouteParam } from "~/utils/url/actions.server.js";
import { validateTeamFromSlug } from "~/utils/team/actions.js";

const toggleNotificationsSchema = z.object({
  notificationIds: z
    .array(z.string())
    .nonempty({ message: "Please select a notification setting to continue" }),
  enabled: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export async function toggleNotifications(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    AccountPreferencesRouteIntent.TOGGLE_NOTIFICATIONS,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const teamSlug = validateTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: { id: teams.id },
  });

  const parsed = await validateFormData({
    request: args.request,
    schema: toggleNotificationsSchema,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "An unexpected error occured. Please try again later.",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const customerService = new CustomerService({
    logger,
    customerRepo: new CustomerRepository(),
  });

  await customerService.toggleTeamNotificationSettingsRows({
    enabled: parsed.data.enabled,
    notificationIds: parsed.data.notificationIds,
    customerId: customer.id,
    teamId: team.id,
  });

  return null;
}
