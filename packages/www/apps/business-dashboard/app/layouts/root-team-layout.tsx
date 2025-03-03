import { customers, teams } from "@acme/database/schema";
import { type LoaderFunctionArgs } from "react-router";
import { CustomerRepository } from "~/repositories/customers.server";
import { CustomerService } from "~/services/customer.server";
import { requireCustomer } from "~/utils/auth/loaders.server";
import { createLoaderLogger } from "~/utils/loaders.server";
import { requireCustomerWithRole } from "~/utils/permissions/loaders.server";
import { requireTeamFromSlug } from "~/utils/team/loaders";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
    },
  });

  await requireCustomerWithRole({
    customerId: customer.id,
    teamId: team.id,
    role: "member",
    logger,
    errorMessage: "You are not a member of this team.",
  });

  const customerService = new CustomerService({
    logger,
    customerRepo: new CustomerRepository(),
  });

  await customerService.selectActiveTeam({
    customerId: customer.id,
    teamId: team.id,
  });

  return null;
};
