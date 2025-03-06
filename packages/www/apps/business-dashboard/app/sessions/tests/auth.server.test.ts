import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  authSessionExpirationTimeSpan,
  getAuthSessionStorageWithUserId,
} from "../auth.server.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import {
  mockAuthSessionCookieHeaderForUserId,
  mockCreateAndCommitAuthSession,
} from "./mocks/auth.server.js";
import {
  mockSessionRepoCreateSession,
  mockSessionRepoDeleteSession,
  mockSessionRepoUpdateSession,
} from "~/repositories/mocks/sessions/mutations.server.js";
import { mockSessionRepoQuerySession } from "~/repositories/mocks/sessions/queries.server.js";

describe("getAuthSessionStorageWithUserId", () => {
  let sessionRepo: SessionRepository;
  let expirationDate: Date;

  beforeEach(() => {
    expirationDate = new Date(
      Date.now() + authSessionExpirationTimeSpan.seconds(),
    );
    sessionRepo = new SessionRepository();
    mockSessionRepoCreateSession({ sessionRepo });
    mockSessionRepoQuerySession({
      sessionRepo,
      data: { expiresAt: expirationDate, userId: "1234" },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createAuthSessionStorage = (userId: string) =>
    getAuthSessionStorageWithUserId({
      userId,
      sessionRepo,
    });

  it("maps session storage to correct user ID", async () => {
    const userId = "1234";
    const authSessionStorage = createAuthSessionStorage(userId);
    const cookieHeader = await mockCreateAndCommitAuthSession({
      authSessionStorage,
      userId,
      expiresAt: expirationDate,
    });

    const authSession = await authSessionStorage.getSession(cookieHeader);
    expect(authSession.get("userId")).toBe(userId);
    expect(authSession.get("expiresAt")).toEqual(expirationDate);
  });

  it("returns undefined for non-existent session", async () => {
    const authSessionStorage = createAuthSessionStorage("1234");
    const authSession = await authSessionStorage.getSession("");

    expect(authSession.get("userId")).toBeUndefined();
    expect(authSession.get("expiresAt")).toBeUndefined();
  });

  it("doesn't register other user's session for current user", async () => {
    const userId = "1234";
    const otherUserId = "5678";
    const authSessionStorage = createAuthSessionStorage(userId);

    const cookieHeader = await mockAuthSessionCookieHeaderForUserId({
      userId: otherUserId,
      sessionRepo,
      expirationDate,
    });

    const authSession = await authSessionStorage.getSession(cookieHeader);
    expect(authSession.get("userId")).toBeUndefined();
    expect(authSession.get("expiresAt")).toBeUndefined();
  });

  it("calls update mutation on existing session", async () => {
    const userId = "1234";
    const createSessionMock = mockSessionRepoCreateSession({ sessionRepo });
    const updateSessionMock = mockSessionRepoUpdateSession({ sessionRepo });

    const authSessionStorage = createAuthSessionStorage(userId);
    const cookieHeader = await mockCreateAndCommitAuthSession({
      authSessionStorage,
      userId,
      expiresAt: expirationDate,
    });

    expect(createSessionMock).toHaveBeenCalledTimes(1);

    const authSession = await authSessionStorage.getSession(cookieHeader);
    await authSessionStorage.commitSession(authSession);
    expect(updateSessionMock).toHaveBeenCalledTimes(1);
  });

  it("calls delete mutation when destroySession is triggered", async () => {
    const userId = "1234";
    const createSessionMock = mockSessionRepoCreateSession({ sessionRepo });
    const deleteSessionMock = mockSessionRepoDeleteSession({ sessionRepo });

    const authSessionStorage = createAuthSessionStorage(userId);
    const cookieHeader = await mockCreateAndCommitAuthSession({
      authSessionStorage,
      userId,
      expiresAt: expirationDate,
    });

    const authSession = await authSessionStorage.getSession(cookieHeader);
    await authSessionStorage.destroySession(authSession);

    expect(createSessionMock).toHaveBeenCalledTimes(1);
    expect(deleteSessionMock).toHaveBeenCalledTimes(1);
  });
});
