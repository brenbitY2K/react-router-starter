import { data, type ActionFunctionArgs } from "react-router";
import { validateFormData } from "~/utils/actions.server.js";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";
import { z } from "zod";
import { TeamRepository } from "~/repositories/teams.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { teams, customers } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamMemberService } from "~/services/team-members.server.js";
import { SettingsMemberRouteIntent } from "../members-route.js";

export const changeMemberRoleSchema = z.object({
  customerId: z.string().min(1, "Please select a customer to remove."),
  role: z.enum(["owner", "admin", "member"], {
    message: "Please select a valid role.",
  }),
});

export async function changeMemberRole(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsMemberRouteIntent.CHANGE_MEMBER_ROLE,
  );

  const customer = await validateCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });
  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: changeMemberRoleSchema,
    formData,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "An unknown error occured. Please try again later",
      logInfo: { logger, event: "unknown" },
    });
  }

  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: { id: teams.id },
  });

  await validateCustomerHasRole({
    customerId: customer.id,
    teamId: team.id,
    role: "admin",
    logger,
    errorMessage: "You don't have permission to remove members.",
  });

  const teamRepo = new TeamRepository();
  const teamMemberService = new TeamMemberService({
    teamRepo,
    logger,
  });

  await teamMemberService.changeCustomerRole({
    teamId: team.id,
    customerId: parsed.data.customerId,
    role: parsed.data.role,
  });

  return data(null, { status: 200 });
}
