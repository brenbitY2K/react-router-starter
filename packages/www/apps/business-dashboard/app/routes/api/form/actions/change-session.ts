import { type ActionFunctionArgs, redirect } from "react-router";
import { z } from "zod";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { validateFormData } from "~/utils/actions.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { checkIfSessionExistsForUserId } from "~/utils/auth/core.server.js";
import { currentUserSessionStorage } from "~/sessions/auth.server.js";
import { getSessionFromRequest } from "~/utils/sessions.server.js";
import { FormLayoutIntent } from "../intents.js";
import { SessionRepository } from "~/repositories/sessions.server.js";

const changeSessionSchema = z.object({
  userId: z.string({ message: "Please select a user." }),
});

export async function changeSession(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    FormLayoutIntent.CHANGE_SESSION,
  );

  const parsed = await validateFormData({
    request: args.request,
    schema: changeSessionSchema,
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
      message: "This session has expired. Please choose a different one.",
      logInfo: { logger, event: "unauthorized" },
    });
  }

  const currentUserSession = await getSessionFromRequest(
    currentUserSessionStorage,
    args.request,
  );

  currentUserSession.set("id", parsed.data.userId);

  const referer = args.request.headers.get("referer");

  throw redirect(referer ?? "/flow-selector", {
    headers: [
      [
        "Set-Cookie",
        await currentUserSessionStorage.commitSession(currentUserSession),
      ],
    ],
  });
}
