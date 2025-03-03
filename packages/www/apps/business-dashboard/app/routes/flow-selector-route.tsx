import { customers } from "@acme/database/schema";
import { type LoaderFunctionArgs, redirect } from "react-router";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { FlowSelectorService } from "~/services/flow-selector.server.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  let customer;
  try {
    customer = await requireCustomer({
      projection: {
        id: customers.id,
        activeTheme: customers.activeTheme,
        activeTeamId: customers.activeTeamId,
      },
      args,
      logger,
    });
  } catch (e) {
    throw redirect("/select-account");
  }

  const flowSelectorService = new FlowSelectorService({
    customerRepo: new CustomerRepository(),
    customer,
  });

  const redirectPath = await flowSelectorService.getRedirectPath();

  throw redirect(redirectPath);
};
