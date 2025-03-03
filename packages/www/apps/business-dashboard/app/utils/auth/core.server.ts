import { type Thrower } from "~/types/errors.js";
import {
  type CustomerSelectFields,
  type CustomerRepository,
} from "~/repositories/customers.server.js";
import {
  type UserQueryable,
  type UserRepository,
  type UserSelectFields,
} from "~/repositories/users.server.js";
import { type ActionFunctionArgs, type LoaderFunctionArgs } from "react-router";
import { serverConfig } from "~/config.server.js";
import {
  currentUserSessionStorage,
  getAuthSessionStorageWithUserId,
  authSessionExpirationTimeSpan,
} from "~/sessions/auth.server.js";
import { isWithinExpirationDate } from "oslo";
import { parse } from "cookie";
import { users } from "@acme/database/schema";
import { type SetCookieHeader } from "~/cookies.server.js";
import { type SessionRepository } from "~/repositories/sessions.server.js";

export type UserFromSessionFetcher = () => Promise<{ userId: string | null }>;
export type UserRepoCreator = (
  args: LoaderFunctionArgs | ActionFunctionArgs,
) => Promise<UserRepository | undefined>;

export type CustomerRepoCreator = (
  userId: string,
) => Promise<CustomerRepository | undefined>;

export async function getUserFromSessionOrThrow<
  P extends Partial<UserSelectFields>,
>({
  cookieHeader,
  userRepo,
  sessionRepo,
  thrower,
  projection,
}: {
  cookieHeader: string | null;
  userRepo: UserRepository;
  sessionRepo: SessionRepository;
  thrower: Thrower;
  projection: P;
}) {
  const userId = await confirmSessionIsValidAndGetUserId({
    sessionRepo,
    cookieHeader,
    thrower,
  });

  const user = await userRepo.getQuerier().queryUser({
    projection,
    userId,
  });

  if (!user) throw thrower();

  return user;
}

export async function getCustomerOrThrow<
  P extends Partial<CustomerSelectFields>,
>({
  userId,
  customerRepo,
  projection,
  thrower,
}: {
  userId: string;
  thrower: Thrower;
  projection: P;
  customerRepo: CustomerRepository;
}) {
  const customer = await customerRepo
    .getQuerier()
    .queryCustomerByUserId({ projection, userId });

  if (customer === undefined) throw thrower();

  return customer;
}

export function createEmailOTPLoginLink({
  token,
  redirectPath,
}: {
  token: string;
  redirectPath?: string;
}) {
  const params = new URLSearchParams({
    token: token,
  });
  if (redirectPath) {
    params.append("redirect", redirectPath);
  }

  if (serverConfig.domain === "localhost")
    return `http://${serverConfig.domain}:3000/login?${params.toString()}`;

  return `https://${serverConfig.domain}/login?${params.toString()}`;
}

export function createEmailOTPEmailChangeLink({
  token,
  teamSlug,
}: {
  token: string;
  teamSlug: string;
}) {
  if (serverConfig.domain === "localhost")
    return `http://${serverConfig.domain}:3000/${teamSlug}/settings/account/profile?emailChangeToken=${token}`;

  return `https://${serverConfig.domain}/${teamSlug}/settings/account/profile?emailChangeToken=${token}`;
}

async function confirmSessionIsValidAndGetUserId({
  sessionRepo,
  cookieHeader,
  thrower,
}: {
  sessionRepo: SessionRepository;
  cookieHeader: string | null;
  thrower: Thrower;
}) {
  const currentUserSession =
    await currentUserSessionStorage.getSession(cookieHeader);

  const currentUserIdFromCookie = currentUserSession.get("id");

  if (!currentUserIdFromCookie) throw thrower();

  const authSessionStorage = getAuthSessionStorageWithUserId({
    userId: currentUserIdFromCookie,
    sessionRepo,
  });

  const session = await authSessionStorage.getSession(cookieHeader);
  const userId = session.get("userId");
  const expiresAt = session.get("expiresAt");

  if (!userId || !expiresAt) throw thrower();

  if (!isWithinExpirationDate(expiresAt)) {
    authSessionStorage.destroySession(session);
    throw thrower();
  }

  const activePeriodExpirationDate = new Date(
    expiresAt.getTime() - authSessionExpirationTimeSpan.milliseconds() / 2,
  );

  if (!isWithinExpirationDate(activePeriodExpirationDate)) {
    // Session is halfway through its lifespan. Refresh it's expiration.
    authSessionStorage.commitSession(session, {
      maxAge: authSessionExpirationTimeSpan.seconds(),
    });
  }

  return userId;
}

export async function getAllSessionsAndInvalidateStaleOnes({
  sessionRepo,
  userQuerier,
  cookieHeader,
}: {
  sessionRepo: SessionRepository;
  userQuerier: UserQueryable;
  cookieHeader: string | null;
}) {
  const cookies = cookieHeader ? parse(cookieHeader) : {};

  const sessionStorages = Object.entries(cookies)
    .filter(([key]) => key.startsWith("session-"))
    .map(([key]) => {
      const userId = key.split("-")[1];
      return getAuthSessionStorageWithUserId({
        userId,
        sessionRepo,
      });
    });

  const setCookieHeaders: SetCookieHeader[] = [];
  const userDataList: Array<{
    user: Pick<typeof users.$inferSelect, "name" | "id" | "email">;
    expiresAt: Date;
  }> = [];

  await Promise.all(
    sessionStorages.map(async (storage) => {
      const session = await storage.getSession(cookieHeader);
      const expiresAt = session.get("expiresAt");
      const userId = session.get("userId");

      if (!expiresAt || !userId || !isWithinExpirationDate(expiresAt)) {
        const destroySessionCookie = await storage.destroySession(session);
        setCookieHeaders.push(["Set-Cookie", destroySessionCookie]);
        return;
      }

      const user = await userQuerier.queryUser({
        userId,
        projection: { email: users.email, id: users.id, name: users.name },
      });

      if (!user) {
        const destroySessionCookie = await storage.destroySession(session);
        setCookieHeaders.push(["Set-Cookie", destroySessionCookie]);
        return;
      }

      userDataList.push({ user, expiresAt: new Date(expiresAt) });
    }),
  );

  userDataList.sort((a, b) => b.expiresAt.getTime() - a.expiresAt.getTime());

  const sortedUsers = userDataList.map((item) => item.user);

  return { users: sortedUsers, setCookieHeaders };
}

export async function invalidateAllAuthSessions({
  cookieHeader,
  sessionRepo,
}: {
  sessionRepo: SessionRepository;
  cookieHeader: string | null;
}) {
  const cookies = cookieHeader ? parse(cookieHeader) : {};

  const sessionStorages = Object.entries(cookies)
    .filter(([key]) => key.startsWith("session-"))
    .map(([key]) => {
      const userId = key.split("-")[1];
      return getAuthSessionStorageWithUserId({
        userId,
        sessionRepo,
      });
    });

  const destroyAuthSessionHeaders: SetCookieHeader[] = [];

  await Promise.all(
    sessionStorages.map(async (storage) => {
      const session = await storage.getSession(cookieHeader);

      const destroySessionCookie = await storage.destroySession(session);
      destroyAuthSessionHeaders.push(["Set-Cookie", destroySessionCookie]);
    }),
  );

  return { destroyAuthSessionHeaders };
}

export async function checkIfSessionExistsForUserId({
  userId,
  cookieHeader,
  sessionRepo,
}: {
  userId: string;
  cookieHeader: string | null;
  sessionRepo: SessionRepository;
}) {
  const authSessionStorage = getAuthSessionStorageWithUserId({
    userId,
    sessionRepo,
  });

  const authSession = await authSessionStorage.getSession(cookieHeader);

  const expiresAt = authSession.get("expiresAt");
  const userIdFromSession = authSession.get("userId");

  if (!expiresAt || !userIdFromSession || !isWithinExpirationDate(expiresAt))
    return false;

  return true;
}
