import { customers } from "@acme/database/schema";
import { type ActionFunctionArgs } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { CustomerService } from "~/services/customer.server.js";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { WelcomeRouteIntent } from "../welcome-route.js";

const selectThemSchema = z.object({
  theme: z.string({ message: "Please select a style to continue" }),
});

export async function selectTheme(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    WelcomeRouteIntent.SELECT_THEME,
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
    return sendFormValidationErrorJson(parsed);
  }

  const { theme } = parsed.data;
  const customerService = new CustomerService({
    logger,
    customerRepo: new CustomerRepository(),
  });

  await customerService.selectTheme({ theme, customerId: customer.id });

  return null;
}
