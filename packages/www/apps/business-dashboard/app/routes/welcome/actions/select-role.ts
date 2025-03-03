import { type ActionFunctionArgs, redirect } from "react-router";
import { type Logger, loggerWithNamedActionInfo } from "~/logging";
import { validateCustomer } from "~/utils/auth/actions.server";
import { customers } from "@acme/database/schema";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server";
import { CustomerService } from "~/services/customer.server";
import { CustomerRepository } from "~/repositories/customers.server";
import { z } from "zod";
import { RoleSelectionRouteIntent } from "../role-selection-route";

export const jobTypeSchema = z.object({
  jobType: z.enum(
    [
      "contractor",
      "appraiser",
      "lender",
      "developer",
      "investor",
      "builder",
      "government",
      "other",
    ],
    {
      required_error: "Please select your role",
      invalid_type_error: "Please select a valid role",
    },
  ),
});

export async function selectRole(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    RoleSelectionRouteIntent.SELECT_ROLE,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const parsed = await validateFormData({
    schema: jobTypeSchema,
    request: args.request,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const customerService = new CustomerService({
    logger,
    customerRepo: new CustomerRepository(),
  });

  await customerService.completeWelcomeFlow({ customerId: customer.id });
  await customerService.selectJobRole({
    jobRole: parsed.data.jobType,
    customerId: customer.id,
  });

  throw redirect("/teams/new");
}
