import { type LoaderFunctionArgs, redirect } from "react-router";
import { SessionRepository } from "~/repositories/sessions.server.js";
import {
  currentUserSessionStorage,
  getAuthSessionStorageWithUserId,
} from "~/sessions/auth.server.js";
import { invalidateAllAuthSessions } from "~/utils/auth/core.server.js";

export const loader = async (args: LoaderFunctionArgs) => {
  const mode =
    new URL(args.request.url).searchParams.get("mode") ?? "currentAccount";

  const cookieHeader = args.request.headers.get("Cookie");

  const currentUserSession =
    await currentUserSessionStorage.getSession(cookieHeader);
  const currentUserId = currentUserSession.get("id");

  // If current user is undefined, it's probably best to just log out
  // of everything
  if (mode === "currentAccount" && currentUserId !== undefined) {
    const authSessionStorage = getAuthSessionStorageWithUserId({
      userId: currentUserId,
      sessionRepo: new SessionRepository(),
    });
    const authSession = await authSessionStorage.getSession(cookieHeader);

    throw redirect("/select-account", {
      headers: [
        ["Set-Cookie", await authSessionStorage.destroySession(authSession)],
        [
          "Set-Cookie",
          await currentUserSessionStorage.destroySession(currentUserSession),
        ],
      ],
    });
  }

  const { destroyAuthSessionHeaders } = await invalidateAllAuthSessions({
    cookieHeader: args.request.headers.get("Cookie"),
    sessionRepo: new SessionRepository(),
  });
  throw redirect("/login", {
    headers: [
      ...destroyAuthSessionHeaders,
      [
        "Set-Cookie",
        await currentUserSessionStorage.destroySession(currentUserSession),
      ],
    ],
  });
};
