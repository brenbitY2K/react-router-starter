import { type ActionFunctionArgs, redirect, data } from "react-router";
import {
  sendFormValidationErrorJson,
  validateFormData,
} from "~/utils/actions.server.js";
import { loggerWithNamedActionInfo, type Logger } from "~/logging/index.js";
import { requireTeamSlugRouteParam } from "~/utils/url/loaders.server.js";
import { validateCustomerHasRole } from "~/utils/permissions/actions.server.js";
import { z } from "zod";
import { TeamRepository } from "~/repositories/teams.server.js";
import { teams, customers } from "@acme/database/schema";
import { validateTeamFromSlug } from "~/utils/team/actions.js";
import { validateCustomer } from "~/utils/auth/actions.server.js";
import { TeamService } from "~/services/team.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { SettingsGeneralRouteIntent } from "../general-route.js";

const updateGeneralSchema = z.object({
  teamName: z
    .string()
    .min(1, { message: "Please enter a team name" })
    .regex(/[a-zA-Z]{3,}/, {
      message: "Team name must contain at least three letters",
    }),
  teamSlug: z
    .string()
    .min(1, { message: "Team slug is required." })
    .regex(/^-*[a-z]-*[a-z]-*[a-z]-*$/, {
      message: "Please include at least three letters.",
    }),
});

export async function updateGeneral(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    SettingsGeneralRouteIntent.UPDATE_GENERAL,
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
    schema: updateGeneralSchema,
    formData,
  });

  if (!parsed.success) {
    return sendFormValidationErrorJson(parsed);
  }

  const team = await validateTeamFromSlug({
    teamSlug,
    logger,
    projection: {
      id: teams.id,
    },
  });

  await validateCustomerHasRole({
    customerId: customer.id,
    teamId: team.id,
    role: "admin",
    logger,
    errorMessage: "You don't have permission to change general settings.",
  });

  try {
    const teamRepo = new TeamRepository();
    const teamService = new TeamService({
      teamRepo,
      logger,
    });

    await teamService.updateGeneralInfo({
      teamId: team.id,
      name: parsed.data.teamName,
      slug: parsed.data.teamSlug,
    });
  } catch (error) {
    if (error instanceof Error && error.name === "PostgresError") {
      throw throwActionErrorAndLog({
        message:
          "A team with this slug already exists. Please type a different one.",
        logInfo: {
          logger,
          event: "team_slug_already_in_use",
          data: { slug: parsed.data.teamSlug, name: parsed.data.teamSlug },
        },
      });
    }
    throw error;
  }

  if (parsed.data.teamSlug !== teamSlug)
    throw redirect(`/${parsed.data.teamSlug}/settings/general`);
  else return data({ success: true }, { status: 200 });
}
