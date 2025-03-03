import { describe, it, expect, vi, beforeEach } from "vitest";
import { OAuthService, type GoogleUser } from "../oauth.server.js";
import { CustomerRepository } from "~/repositories/customers.server.js";
import { UserRepository } from "~/repositories/users.server.js";
import { OAuthAccountRepository } from "~/repositories/oauth-accounts.server.js";
import { SessionRepository } from "~/repositories/sessions.server.js";
import {
  mockCustomerRepoQueryCustomerByUserId,
  mockCustomerRepoQueryCustomerByUserIdUndefined,
} from "~/repositories/mocks/customers/queries.server.js";
import { mockCustomerRepoCreateCustomer } from "~/repositories/mocks/customers/mutations.server.js";
import { mockUserRepoCreateUser } from "~/repositories/mocks/users/mutations.server.js";
import { mockOAuthAccountRepoCreateOAuthAccount } from "~/repositories/mocks/oauth-accounts/mutations.server.js";
import {
  mockOAuthAccountRepoQueryOAuthAccount,
  mockOAuthAccountRepoQueryOAuthAccountUndefined,
} from "~/repositories/mocks/oauth-accounts/queries.server.js";
import {
  mockUserRepoQueryUserWithEmail,
  mockUserRepoQueryUserWithEmailUndefined,
} from "~/repositories/mocks/users/queries.server.js";
import {
  mockSessionRepoCreateSession,
  mockSessionRepoDeleteSession,
  mockSessionRepoUpdateSession,
} from "~/repositories/mocks/sessions/mutations.server.js";
import { mockSessionRepoQuerySession } from "~/repositories/mocks/sessions/queries.server.js";
import { mockedLogger } from "~/logging/mocks/index.js";
import { type Logger } from "~/logging/index.js";

describe("OAuthService", () => {
  let oauthService: OAuthService;
  let mockLogger: Logger;
  let mockCustomerRepo: CustomerRepository;
  let mockSessionRepo: SessionRepository;
  let mockUserRepo: UserRepository;
  let mockOAuthAccountRepo: OAuthAccountRepository;
  let mockClientInfo: any;

  beforeEach(() => {
    mockLogger = mockedLogger;
    mockCustomerRepo = new CustomerRepository();
    mockUserRepo = new UserRepository();
    mockOAuthAccountRepo = new OAuthAccountRepository();
    mockSessionRepo = new SessionRepository();
    mockClientInfo = { ip: "127.0.0.1", userAgent: "test-agent" };

    mockSessionRepoCreateSession({ sessionRepo: mockSessionRepo });
    mockSessionRepoUpdateSession({ sessionRepo: mockSessionRepo });
    mockSessionRepoDeleteSession({ sessionRepo: mockSessionRepo });
    mockSessionRepoQuerySession({
      sessionRepo: mockSessionRepo,
      data: { userId: "1234", expiresAt: new Date() },
    });

    oauthService = new OAuthService({
      logger: mockLogger,
      customerRepo: mockCustomerRepo,
      userRepo: mockUserRepo,
      oAuthAccountRepo: mockOAuthAccountRepo,
      clientInfo: mockClientInfo,
      sessionRepo: mockSessionRepo,
    });
  });

  describe("loginWithGoogle", () => {
    const mockTokens = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      accessTokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      idToken: "mock-id-token",
    };
    const mockGoogleUser: GoogleUser = {
      name: "Test User",
      picture: "https://example.com/pic.jpg",
      email: "test@example.com",
      email_verified: true,
      sub: "google-123",
    };
    const mockUserFetcher = vi.fn().mockResolvedValue(mockGoogleUser);
    const mockBaseThrower = vi.fn(() => {
      throw new Error();
    });
    it("should login existing user", async () => {
      const existingUserId = "existing-user-id";
      mockOAuthAccountRepoQueryOAuthAccount({
        oauthAccountRepo: mockOAuthAccountRepo,
        data: { userId: existingUserId },
      });
      mockUserRepoQueryUserWithEmail({
        userRepo: mockUserRepo,
        data: { email: "test@gmail.com" },
      });
      mockCustomerRepoQueryCustomerByUserId({
        customerRepo: mockCustomerRepo,
        data: { id: "existing-customer-id", activeTeamId: "team-1" },
      });

      const result = await oauthService.loginWithGoogle({
        tokens: mockTokens,
        userFetcher: mockUserFetcher,
        baseThrower: mockBaseThrower,
        cookieHeader: null,
      });

      expect(result.setCookieHeaders).toHaveLength(2);
      expect(result.setCookieHeaders[0][0]).toBe("Set-Cookie");
      expect(result.setCookieHeaders[1][0]).toBe("Set-Cookie");
    });

    it("should create customer account for existing user without one", async () => {
      const existingUserId = "existing-user-id";
      mockOAuthAccountRepoQueryOAuthAccount({
        oauthAccountRepo: mockOAuthAccountRepo,
        data: { userId: existingUserId },
      });
      mockUserRepoQueryUserWithEmailUndefined({
        userRepo: mockUserRepo,
      });
      mockCustomerRepoQueryCustomerByUserIdUndefined({
        customerRepo: mockCustomerRepo,
      });
      const mockCreateCustomer = mockCustomerRepoCreateCustomer({
        customerRepo: mockCustomerRepo,
      });

      await oauthService.loginWithGoogle({
        tokens: mockTokens,
        userFetcher: mockUserFetcher,
        baseThrower: mockBaseThrower,
        cookieHeader: null,
      });

      expect(mockCreateCustomer).toHaveBeenCalledWith({
        userId: existingUserId,
      });
    });

    it("should auto-link existing gmail account if used as email", async () => {
      const emailUsedOnGoogleAccount = "email.used.on.google.account@gmail.com";

      mockOAuthAccountRepoQueryOAuthAccountUndefined({
        oauthAccountRepo: mockOAuthAccountRepo,
      });
      mockUserRepoQueryUserWithEmail({
        userRepo: mockUserRepo,
        data: { email: emailUsedOnGoogleAccount },
      });
      mockCustomerRepoQueryCustomerByUserId({
        customerRepo: mockCustomerRepo,
      });
      const mockCreateOAuthAccount = mockOAuthAccountRepoCreateOAuthAccount({
        oauthAccountRepo: mockOAuthAccountRepo,
      });

      const mockUserFetcher = vi.fn().mockResolvedValue({
        ...mockGoogleUser,
        email: emailUsedOnGoogleAccount,
      });
      await oauthService.loginWithGoogle({
        tokens: mockTokens,
        userFetcher: mockUserFetcher,
        baseThrower: mockBaseThrower,
        cookieHeader: null,
      });

      expect(mockCreateOAuthAccount).toHaveBeenCalledWith(
        expect.objectContaining({
          providerEmail: "email.used.on.google.account@gmail.com",
        }),
      );
    });

    it("should create new user and login", async () => {
      mockOAuthAccountRepoQueryOAuthAccountUndefined({
        oauthAccountRepo: mockOAuthAccountRepo,
      });
      mockUserRepoQueryUserWithEmailUndefined({ userRepo: mockUserRepo });
      const mockCreateUser = mockUserRepoCreateUser({ userRepo: mockUserRepo });
      mockCreateUser.mockResolvedValue("new-user-id");
      const mockCreateOAuthAccount = mockOAuthAccountRepoCreateOAuthAccount({
        oauthAccountRepo: mockOAuthAccountRepo,
      });
      const mockCreateCustomer = mockCustomerRepoCreateCustomer({
        customerRepo: mockCustomerRepo,
      });

      const result = await oauthService.loginWithGoogle({
        tokens: mockTokens,
        userFetcher: mockUserFetcher,
        baseThrower: mockBaseThrower,
        cookieHeader: null,
      });

      expect(mockCreateUser).toHaveBeenCalledWith({
        email: "test@example.com",
        name: "Test User",
      });
      expect(mockCreateOAuthAccount).toHaveBeenCalledWith({
        providerId: "google",
        providerUserId: "google-123",
        userId: "new-user-id",
        providerEmail: "test@example.com",
      });
      expect(mockCreateCustomer).toHaveBeenCalledWith({
        userId: "new-user-id",
      });
      expect(result.setCookieHeaders).toHaveLength(2);
    });
  });

  describe("connectGoogleAccountToLoggedInUser", () => {
    const mockTokens = {
      accessToken: "mock-access-token",
      refreshToken: "mock-refresh-token",
      accessTokenExpiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      idToken: "mock-id-token",
    };
    const mockGoogleUser: GoogleUser = {
      name: "Test User",
      picture: "https://example.com/pic.jpg",
      email: "test@example.com",
      email_verified: true,
      sub: "google-123",
    };
    const mockUserFetcher = vi.fn().mockResolvedValue(mockGoogleUser);
    const mockBaseThrower = vi.fn(() => {
      throw new Error();
    });

    it("should connect Google account to logged-in user", async () => {
      const mockCreateOAuthAccount = mockOAuthAccountRepoCreateOAuthAccount({
        oauthAccountRepo: mockOAuthAccountRepo,
      });

      await oauthService.connectGoogleAccountToLoggedInUser({
        tokens: mockTokens,
        userId: "logged-in-user-id",
        userFetcher: mockUserFetcher,
        baseThrower: mockBaseThrower,
      });

      expect(mockCreateOAuthAccount).toHaveBeenCalledWith({
        providerId: "google",
        providerUserId: "google-123",
        userId: "logged-in-user-id",
        providerEmail: "test@example.com",
      });
    });

    it("should throw if userFetcher fails", async () => {
      const errorUserFetcher = vi
        .fn()
        .mockRejectedValue(new Error("Fetch failed"));

      await expect(
        oauthService.connectGoogleAccountToLoggedInUser({
          tokens: mockTokens,
          userId: "logged-in-user-id",
          userFetcher: errorUserFetcher,
          baseThrower: mockBaseThrower,
        }),
      ).rejects.toThrow();
    });
  });
});
