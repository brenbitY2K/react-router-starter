import {
  type Cookie,
  createCookie,
  createCookieSessionStorage,
} from "react-router";
import { serverConfig } from "../config.server.js";
import { sessions } from "@acme/database/schema";
import { createSessionStorage } from "react-router";
import crypto from "crypto";
import { TimeSpan } from "oslo";
import { type SessionRepository } from "~/repositories/sessions.server.js";

type CurrentUser = {
  id: string;
};

export const authSessionExpirationTimeSpan = new TimeSpan(7, "d");
// This is crazy long (TWSS) because if this is deleted before the session
// expires, then the session is basically nullified since the server
// won't know which session to check for.
const currentUserSessionTimeSpan = new TimeSpan(1000, "w");

export const currentUserSessionStorage =
  createCookieSessionStorage<CurrentUser>({
    cookie: {
      name: "current_user",

      domain: serverConfig.domain,
      httpOnly: true,
      maxAge: currentUserSessionTimeSpan.seconds(),
      path: "/",
      sameSite: "lax",
      secrets:
        serverConfig.nodeEnv === "production"
          ? (serverConfig.sessionSecret ?? "").split(",")
          : undefined,
      secure: serverConfig.nodeEnv === "production" ? true : false,
    },
  });

export type AuthSessionData = typeof sessions.$inferSelect;

export function getAuthSessionStorageWithUserId({
  userId,
  sessionRepo,
}: {
  userId: string;
  sessionRepo: SessionRepository;
}) {
  const session = createDatabaseAuthSessionStorage({
    sessionRepo,
    cookie: createCookie(`session-${userId}`, {
      domain: serverConfig.domain,
      httpOnly: true,
      maxAge: authSessionExpirationTimeSpan.seconds(),
      path: "/",
      sameSite: "lax",
      secrets:
        serverConfig.nodeEnv === "production"
          ? (serverConfig.sessionSecret ?? "").split(",")
          : undefined,
      secure: serverConfig.nodeEnv === "production" ? true : false,
    }),
  });

  return session;
}

function createDatabaseAuthSessionStorage({
  sessionRepo,
  cookie,
}: {
  sessionRepo: SessionRepository;
  cookie: Cookie;
}) {
  return createSessionStorage<AuthSessionData>({
    cookie,
    async createData(data, expires) {
      const id = crypto.randomBytes(16).toString("hex");
      if (expires === undefined)
        throw new Error("Expiration date not set on session");
      if (data.userId === undefined)
        throw new Error("User ID not set in session");

      await sessionRepo.getMutator().createSession({
        id,
        userId: data.userId,
        expiresAt: expires,
        ...data,
      });

      return id;
    },
    async readData(id) {
      return ((await sessionRepo.getQuerier().querySession({
        id,
        projection: {
          id: sessions.id,
          expiresAt: sessions.expiresAt,
          userId: sessions.userId,
          ipCity: sessions.ipCity,
          ipCountryCode: sessions.ipCountryCode,
          ipCountryName: sessions.ipCountryName,
          ipRegionCode: sessions.ipRegionCode,
          ipRegionName: sessions.ipRegionName,
          ipLatitude: sessions.ipLatitude,
          ipLongitude: sessions.ipLongitude,
          userAgentOS: sessions.userAgentOS,
          userAgentBrowser: sessions.userAgentBrowser,
        },
      })) ?? null) as AuthSessionData | null;
    },
    async updateData(id, { ipLatitude, ipLongitude, ...data }, expires) {
      await sessionRepo
        .getMutator()
        .updateSession({ id, data: { ...data, expiresAt: expires } });
    },
    async deleteData(id) {
      await sessionRepo.getMutator().deleteSession(id);
    },
  });
}
