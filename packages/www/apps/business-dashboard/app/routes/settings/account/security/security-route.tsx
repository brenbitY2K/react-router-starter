import { customers, sessions } from "@acme/database/schema";
import { Separator } from "@www/ui/separator";
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { createLoaderLogger } from "~/utils/loaders.server.js";
import {
  getDeviceTextForSession,
  getLastSeenString,
  getLocationTextForSession,
} from "./utils.js";
import { requireCustomer } from "~/utils/auth/loaders.server.js";
import { getAuthSessionStorageWithUserId } from "~/sessions/auth.server.js";
import { throwUnauthenticatedErrorResponseJsonAndLog } from "~/utils/response.server.js";
import { type Logger } from "~/logging/index.js";
import {
  actionWithDefaultErrorHandling,
  getActionIntent,
} from "~/utils/actions.server.js";
import { revokeAllSessions } from "./actions/revoke-all-sessions.js";
import { revokeSpecificSession } from "./actions/revoke-specific-session.js";
import { CurrentSession } from "./components/current-session.js";
import { OtherSessions } from "./components/other-sessions.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const customer = await requireCustomer({
    args,
    logger,
    projection: { userId: customers.userId },
  });

  const sessionRepo = new SessionRepository();

  const allActiveSessions = await sessionRepo
    .getQuerier()
    .queryAllActiveSessions({
      userId: customer.userId,
      projection: {
        id: sessions.id,
        updatedAt: sessions.updatedAt,
        ipCity: sessions.ipCity,
        ipCountryCode: sessions.ipCountryCode,
        userAgentBrowser: sessions.userAgentBrowser,
        userAgentOS: sessions.userAgentOS,
      },
    });

  if (!allActiveSessions)
    throw throwUnauthenticatedErrorResponseJsonAndLog({
      data: { message: "You are not currently logged in." },
      logInfo: { logger, event: "unauthenticated" },
      location: "root",
    });

  const authSessionStorage = getAuthSessionStorageWithUserId({
    userId: customer.userId,
    sessionRepo,
  });
  const authSession = await authSessionStorage.getSession(
    args.request.headers.get("Cookie"),
  );
  const currentSessionId = authSession.id;

  const otherSessions = allActiveSessions.filter(
    (session) => session.id !== currentSessionId,
  );
  const currentSession = allActiveSessions.find(
    (session) => session.id === currentSessionId,
  );

  if (!currentSession)
    throw throwUnauthenticatedErrorResponseJsonAndLog({
      data: { message: "You are not currently logged in." },
      logInfo: { logger, event: "unauthenticated" },
      location: "root",
    });

  return {
    currentSession: {
      locationText: getLocationTextForSession(currentSession),
      deviceText: getDeviceTextForSession(currentSession),
      lastSeenText: getLastSeenString(currentSession.updatedAt),
      browser: currentSession.userAgentBrowser,
    },
    otherSessions: otherSessions.map((session) => {
      return {
        id: session.id,
        locationText: getLocationTextForSession(session),
        deviceText: getDeviceTextForSession(session),
        lastSeenText: getLastSeenString(session.updatedAt),
        browser: session.userAgentBrowser,
      };
    }),
  };
};

export enum AccountSecurityRouteIntent {
  REVOKE_ALL_SESSIONS = "settings_account_security_route_intent_revoke_all_sessions",
  REVOKE_SPECIFIC_SESSION = "settings_account_security_route_intent_revoke_specific_session",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === AccountSecurityRouteIntent.REVOKE_ALL_SESSIONS)
      return await revokeAllSessions(args, logger);
    if (intent === AccountSecurityRouteIntent.REVOKE_SPECIFIC_SESSION)
      return await revokeSpecificSession(args, logger);
  },
);

export default function AccountSecurity() {
  return (
    <div className="min-h-screen w-full py-20 sm:px-8">
      <div className="mx-auto space-y-8 sm:max-w-2xl">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Security</h1>
          <p className="text-muted-foreground">Keep your account secure</p>
        </div>
        <Separator />

        <div className="mx-auto max-w-2xl">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-semibold">Sessions</h2>
              <p className="text-muted-foreground">
                Devices logged into your account
              </p>
            </div>
            <CurrentSession />
            <OtherSessions />
          </div>
        </div>
      </div>
    </div>
  );
}
