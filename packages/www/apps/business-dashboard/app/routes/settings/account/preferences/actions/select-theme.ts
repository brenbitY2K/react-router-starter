import { customers } from "@acme/database/schema";
import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { CustomerService } from "~/services/customer.server.js";
import { validateFormData } from "~/utils/actions.server.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { AccountPreferencesRouteIntent } from "../preferences-route.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";

const selectThemSchema = z.object({
  theme: z.string({ message: "Please select a style to continue" }),
});

export async function selectTheme(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    AccountPreferencesRouteIntent.SELECT_THEME,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const parsed = await validateFormData({
    request: args.request,
    schema: selectThemSchema,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "An unexpected error occured. Please try again later.",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const { theme } = parsed.data;
  const customerService = new CustomerService({
    logger,
    customerRepo: new CustomerRepository(),
  });

  await customerService.selectTheme({ customerId: customer.id, theme });

  return null;
}
