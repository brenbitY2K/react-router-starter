import { type ActionFunctionArgs } from "react-router";
import { type Logger, loggerWithNamedActionInfo } from "~/logging/index.js";
import { AccountSecurityRouteIntent } from "../security-route.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { customers } from "@acme/database/schema";
import { getAuthSessionStorageWithUserId } from "~/sessions/auth.server.js";
import { SessionRepository } from "~/repositories/sessions.server.js";

export async function revokeAllSessions(
  args: ActionFunctionArgs,
  parentLogger: Logger,
) {
  const logger = loggerWithNamedActionInfo(
    parentLogger,
    AccountSecurityRouteIntent.REVOKE_ALL_SESSIONS,
  );

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id, userId: customers.userId },
  });

  const sessionRepo = new SessionRepository();
  const authSessionStorage = getAuthSessionStorageWithUserId({
    userId: customer.userId,
    sessionRepo: new SessionRepository(),
  });
  const authSession = await authSessionStorage.getSession(
    args.request.headers.get("Cookie"),
  );
  const currentSessionId = authSession.id;

  await sessionRepo.getMutator().deleteAllSessionsExceptCurrent({
    userId: customer.userId,
    currentSessionId,
  });

  return { success: true };
}
