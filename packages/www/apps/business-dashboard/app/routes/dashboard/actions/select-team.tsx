import { type ActionFunctionArgs, redirect } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { validateFormData } from "~/utils/actions.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { checkIfSessionExistsForUserId } from "~/utils/auth/core.server.js";
import { currentUserSessionStorage } from "~/sessions/auth.server.js";
import { getSessionFromRequest } from "~/utils/sessions.server.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { TeamSlugDashboardRouteIntent } from "../dashboard-route";

const selectTeamSchema = z.object({
  teamSlug: z.string({ message: "Please select a team." }),
  userId: z.string({ message: "Please select a user." }),
});

export async function selectTeam(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    TeamSlugDashboardRouteIntent.SELECT_TEAM,
  );

  const parsed = await validateFormData({
    request: args.request,
    schema: selectTeamSchema,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "An unknown error occured. Please try again later.",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const sessionExists = await checkIfSessionExistsForUserId({
    sessionRepo: new SessionRepository(),
    userId: parsed.data.userId,
    cookieHeader: args.request.headers.get("Cookie"),
  });

  if (!sessionExists) {
    throw throwActionErrorAndLog({
      message: "You don't have permission to access this team.",
      logInfo: { logger, event: "unauthorized" },
    });
  }

  const currentUserSession = await getSessionFromRequest(
    currentUserSessionStorage,
    args.request,
  );

  currentUserSession.set("id", parsed.data.userId);

  throw redirect(`/${parsed.data.teamSlug}`, {
    headers: [
      [
        "Set-Cookie",
        await currentUserSessionStorage.commitSession(currentUserSession),
      ],
    ],
  });
}
