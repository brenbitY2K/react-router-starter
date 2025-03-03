import { type SessionStorage } from "react-router";
import { type SessionRepository } from "~/repositories/sessions.server.js";
import {
  type AuthSessionData,
  currentUserSessionStorage,
  getAuthSessionStorageWithUserId,
} from "~/sessions/auth.server.js";
import { mockFullCookieHeader } from "./core.server.js";

const emptyCookieHeader = "";

export async function mockCurrentUserSessionCookieHeaderForUserId(
  userId: string,
) {
  const currentUserSession =
    await currentUserSessionStorage.getSession(emptyCookieHeader);
  currentUserSession.set("id", userId);

  const setCookieString =
    await currentUserSessionStorage.commitSession(currentUserSession);

  return setCookieString.split(";")[0];
}

export async function mockAuthSessionCookieHeaderForUserId({
  userId,
  expirationDate,
  sessionRepo,
}: {
  userId: string;
  expirationDate: Date;
  sessionRepo: SessionRepository;
}) {
  const authSessionStorage = getAuthSessionStorageWithUserId({
    userId,
    sessionRepo,
  });
  return mockCreateAndCommitAuthSession({
    authSessionStorage,
    userId,
    expiresAt: expirationDate,
  });
}

export async function mockCreateAndCommitAuthSession({
  userId,
  expiresAt,
  authSessionStorage,
}: {
  authSessionStorage: SessionStorage<AuthSessionData>;
  userId: string;
  expiresAt: Date;
}) {
  const authSession = await authSessionStorage.getSession(emptyCookieHeader);

  authSession.set("userId", userId);
  authSession.set("expiresAt", expiresAt);

  const setCookieString = await authSessionStorage.commitSession(authSession);

  return setCookieString.split(";")[0];
}

export async function mockAuthAndCurrentUserCookieHeader({
  userId,
  expiresAt,
  sessionRepo,
}: {
  userId: string;
  expiresAt: Date;
  sessionRepo: SessionRepository;
}) {
  const currentUserSessionCookieHeader =
    await mockCurrentUserSessionCookieHeaderForUserId(userId);
  const authSessionCookieHeader = await mockAuthSessionCookieHeaderForUserId({
    userId,
    expirationDate: expiresAt,
    sessionRepo,
  });
  const cookieHeader = mockFullCookieHeader(
    currentUserSessionCookieHeader,
    authSessionCookieHeader,
  );

  return cookieHeader;
}
