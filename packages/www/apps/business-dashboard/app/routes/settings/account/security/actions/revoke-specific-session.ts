import { type ActionFunctionArgs } from "react-router";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { AccountSecurityRouteIntent } from "../security-route.js";
import { customers } from "@acme/database/schema";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { validateFormData } from "~/utils/actions.server.js";
import { z } from "zod";
import { throwActionErrorAndLog } from "~/utils/response.server.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";

const revokeSpecificSessionSchema = z.object({
  sessionId: z.string().min(1, "Please select a session"),
});

export async function revokeSpecificSession(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    AccountSecurityRouteIntent.REVOKE_SPECIFIC_SESSION,
  );

  const formData = await args.request.formData();

  const parsed = await validateFormData({
    schema: revokeSpecificSessionSchema,
    formData,
  });

  if (!parsed.success) {
    throw throwActionErrorAndLog({
      message: "Please select a session to disconnect",
      logInfo: { logger, event: "form_validation_action_error" },
    });
  }

  const sessionRepo = new SessionRepository();

  await requireCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  await sessionRepo.getMutator().deleteSession(parsed.data.sessionId);

  return { success: true };
}
