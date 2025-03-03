import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  type Mock,
  vi,
} from "vitest";
import {
  checkIfSessionExistsForUserId,
  getAllSessionsAndInvalidateStaleOnes,
  getUserFromSessionOrThrow,
  invalidateAllAuthSessions,
} from "../core.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { users } from "@acme/database/schema";
import {
  mockUserRepoQueryUserUndefined,
  mockUserRepoQueryUser,
} from "~/repositories/mocks/users/queries.server.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import { authSessionExpirationTimeSpan } from "~/sessions/auth.server.js";
import {
  mockAuthAndCurrentUserCookieHeader,
  mockAuthSessionCookieHeaderForUserId,
  mockCurrentUserSessionCookieHeaderForUserId,
} from "~/sessions/tests/mocks/auth.server.js";
import {
  mockSessionRepoCreateSession,
  mockSessionRepoDeleteSession,
  mockSessionRepoUpdateSession,
} from "~/repositories/mocks/sessions/mutations.server.js";
import { mockedSessionFullSelect } from "~/repositories/mocks/sessions/data.server.js";
import { mockSessionRepoQuerySession } from "~/repositories/mocks/sessions/queries.server.js";
import { mockFullCookieHeader } from "~/sessions/tests/mocks/core.server.js";
import { TimeSpan } from "oslo";

describe("Core auth utils", () => {
  let sessionRepo: SessionRepository;
  let userRepo: UserRepository;
  let throwerMock: Mock<[], never>;
  let expiresAt: Date;
  let expiresAtDateInThePast: Date;

  let userId: string;

  beforeEach(() => {
    sessionRepo = new SessionRepository();
    userRepo = new UserRepository();
    throwerMock = vi.fn(() => {
      throw new Error("Thrown");
    });
    expiresAt = new Date(Date.now() + authSessionExpirationTimeSpan.seconds());
    expiresAtDateInThePast = new Date(
      Date.now() - new TimeSpan(30, "s").seconds(),
    );
    userId = "1234";

    mockSessionRepoCreateSession({ sessionRepo });
    mockSessionRepoUpdateSession({ sessionRepo });
    mockSessionRepoDeleteSession({ sessionRepo });
    mockSessionRepoQuerySession({
      sessionRepo,
      data: { userId, expiresAt },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("getUserFromSessionOrThrow", () => {
    it("should pass user ID from active session to querier", async () => {
      const expirationDate = new Date(
        Date.now() + authSessionExpirationTimeSpan.seconds(),
      );

      const cookieHeader = await mockAuthAndCurrentUserCookieHeader({
        userId,
        expiresAt: expirationDate,
        sessionRepo,
      });

      const queryUserMock = mockUserRepoQueryUser({ userRepo });

      await getUserFromSessionOrThrow({
        cookieHeader,
        thrower: throwerMock,
        sessionRepo,
        userRepo,
        projection: { id: users.id },
      });

      expect(queryUserMock).toHaveBeenCalledWith(
        expect.objectContaining({ userId }),
      );
      expect(throwerMock).not.toHaveBeenCalled();
    });

    it("should throw for expired session", async () => {
      mockSessionRepoQuerySession({
        sessionRepo,
        data: { userId, expiresAt: expiresAtDateInThePast },
      });

      const cookieHeader = await mockAuthAndCurrentUserCookieHeader({
        userId,
        expiresAt: expiresAtDateInThePast,
        sessionRepo,
      });

      await expect(
        getUserFromSessionOrThrow({
          cookieHeader,
          thrower: throwerMock,
          sessionRepo,
          userRepo,
          projection: { id: users.id },
        }),
      ).rejects.toThrow();
      expect(throwerMock).toHaveBeenCalled();
    });
  });

  describe("getAllSessionsAndInvalidateStaleOnes", () => {
    it("should query users for multiple sessions", async () => {
      const userIds = ["1234", "5689"];
      const expirationDate = mockedSessionFullSelect().expiresAt;

      const querySessionMock = vi.spyOn(
        sessionRepo.getQuerier(),
        "querySession",
      );

      userIds.forEach((userId) => {
        querySessionMock.mockImplementationOnce(({ id }) =>
          Promise.resolve({
            ...mockedSessionFullSelect(),
            id,
            userId,
          }),
        );
      });

      const userRepo = new UserRepository();
      const userQueryMock = mockUserRepoQueryUser({ userRepo });

      const authSessionCookieHeaders = await Promise.all(
        userIds.map((userId) =>
          mockAuthSessionCookieHeaderForUserId({
            sessionRepo,
            userId,
            expirationDate,
          }),
        ),
      );

      const currentUserSessionCookieHeader =
        await mockCurrentUserSessionCookieHeaderForUserId(userIds[0]);

      const cookieHeader = mockFullCookieHeader(
        ...authSessionCookieHeaders,
        currentUserSessionCookieHeader,
      );

      await getAllSessionsAndInvalidateStaleOnes({
        sessionRepo,
        cookieHeader,
        userQuerier: userRepo.getQuerier(),
      });

      expect(userQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ userId: userIds[0] }),
      );

      expect(userQueryMock).toHaveBeenCalledWith(
        expect.objectContaining({ userId: userIds[1] }),
      );
    });

    it("should delete expired sessions", async () => {
      const expirationDate = new Date(
        Date.now() - new TimeSpan(30, "s").seconds(),
      );

      vi.spyOn(sessionRepo.getQuerier(), "querySession").mockResolvedValue({
        ...mockedSessionFullSelect(),
        userId,
        expiresAt: expirationDate,
      });

      const deleteSessionMock = mockSessionRepoDeleteSession({ sessionRepo });
      mockUserRepoQueryUser({ userRepo });

      const cookieHeader = await mockAuthAndCurrentUserCookieHeader({
        userId,
        expiresAt: expirationDate,
        sessionRepo,
      });

      await getAllSessionsAndInvalidateStaleOnes({
        sessionRepo,
        cookieHeader,
        userQuerier: userRepo.getQuerier(),
      });

      expect(deleteSessionMock).toHaveBeenCalledOnce();
    });

    it("should delete sessions for non-existent users", async () => {
      const expirationDate = mockedSessionFullSelect().expiresAt;

      const deleteSessionMock = mockSessionRepoDeleteSession({ sessionRepo });
      mockUserRepoQueryUserUndefined({ userRepo });

      const cookieHeader = await mockAuthAndCurrentUserCookieHeader({
        userId,
        expiresAt: expirationDate,
        sessionRepo,
      });

      await getAllSessionsAndInvalidateStaleOnes({
        sessionRepo,
        cookieHeader,
        userQuerier: userRepo.getQuerier(),
      });

      expect(deleteSessionMock).toHaveBeenCalledOnce();
    });
  });

  describe("invalidateAllAuthSessions", () => {
    it("destroys all active and inactive sessions", async () => {
      const userIds = ["1234", "5678"];

      const deleteSessionMock = mockSessionRepoDeleteSession({ sessionRepo });

      const authSessionCookieHeaders = await Promise.all(
        userIds.map((userId, index) =>
          mockAuthSessionCookieHeaderForUserId({
            sessionRepo,
            userId,
            expirationDate: index === 0 ? expiresAt : expiresAtDateInThePast,
          }),
        ),
      );

      const cookieHeader = mockFullCookieHeader(...authSessionCookieHeaders);

      const { destroyAuthSessionHeaders } = await invalidateAllAuthSessions({
        cookieHeader,
        sessionRepo,
      });

      destroyAuthSessionHeaders.forEach(([header, value]) => {
        expect(header).toBe("Set-Cookie");

        expect(value).toMatch(/^session-/);
        const userIdFromSession = value.split("-")[1].split("=")[0];

        expect(userIdFromSession).toBeTruthy();
        expect(typeof userIdFromSession).toBe("string");

        expect(userIds).toContain(userIdFromSession);
      });

      expect(deleteSessionMock).toBeCalledTimes(2);
    });
  });

  it("does nothing if no sessions exist", async () => {
    const deleteSessionMock = mockSessionRepoDeleteSession({ sessionRepo });

    const cookieHeader = mockFullCookieHeader("");

    const { destroyAuthSessionHeaders } = await invalidateAllAuthSessions({
      cookieHeader,
      sessionRepo,
    });

    expect(destroyAuthSessionHeaders.length).toBe(0);
    expect(deleteSessionMock).toBeCalledTimes(0);
  });

  describe("checkIfSessionExistsForUserId", () => {
    let cookieHeader: string;
    let userIds: string[];

    beforeEach(async () => {
      userIds = ["1234", "5678"];

      const authSessionCookieHeaders = await Promise.all(
        userIds.map((userId, index) =>
          mockAuthSessionCookieHeaderForUserId({
            sessionRepo,
            userId,
            expirationDate: index === 0 ? expiresAt : expiresAtDateInThePast,
          }),
        ),
      );

      cookieHeader = mockFullCookieHeader(...authSessionCookieHeaders);
    });

    it("returns true if session exists", async () => {
      const userIdToCheckFor = userIds[0];

      const sessionExists = await checkIfSessionExistsForUserId({
        userId: userIdToCheckFor,
        sessionRepo,
        cookieHeader,
      });

      expect(sessionExists).toBeTruthy();
    });

    it("returns false if session does not exists", async () => {
      const userIdToCheckFor = "this-session-id-does-not-exist";

      const sessionExists = await checkIfSessionExistsForUserId({
        userId: userIdToCheckFor,
        sessionRepo,
        cookieHeader,
      });

      expect(sessionExists).toBeFalsy();
    });

    it("returns false if no sessions exist", async () => {
      const cookieHeader = "";

      const sessionExists = await checkIfSessionExistsForUserId({
        userId: "1234",
        sessionRepo,
        cookieHeader,
      });

      expect(sessionExists).toBeFalsy();
    });
  });
});
