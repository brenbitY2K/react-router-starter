import { oauthAccounts, customers, users } from "@acme/database/schema";
import { type GoogleTokens } from "arctic";
import { type SetCookieHeader } from "~/cookies.server.js";
import { type Logger } from "~/logging/index.js";
import { type OAuthAccountRepository } from "~/repositories/oauth-accounts.server.js";
import {
  type CustomerMutable,
  type CustomerQueryable,
  type CustomerRepository,
} from "~/repositories/customers.server.js";
import { type SessionRepository } from "~/repositories/sessions.server.js";
import { type UserRepository } from "~/repositories/users.server.js";
import {
  currentUserSessionStorage,
  getAuthSessionStorageWithUserId,
} from "~/sessions/auth.server.js";
import { type AsyncThrower } from "~/types/errors.js";
import {
  createNewAuthSessionAndSetActiveUser,
  type SessionClientInformation,
} from "~/utils/sessions.server.js";

export class OAuthService {
  private logger: Logger;
  private customerQuerier: CustomerQueryable;
  private customerMutator: CustomerMutable;
  private sessionRepo: SessionRepository;
  private userRepo: UserRepository;
  private oAuthAccountRepo: OAuthAccountRepository;
  private clientInfo: SessionClientInformation;

  constructor({
    customerRepo,
    userRepo,
    oAuthAccountRepo,
    logger,
    clientInfo,
    sessionRepo,
  }: {
    logger: Logger;
    customerRepo: CustomerRepository;
    userRepo: UserRepository;
    oAuthAccountRepo: OAuthAccountRepository;
    sessionRepo: SessionRepository;
    clientInfo: SessionClientInformation;
  }) {
    this.logger = logger;
    this.oAuthAccountRepo = oAuthAccountRepo;
    this.userRepo = userRepo;
    this.customerQuerier = customerRepo.getQuerier();
    this.customerMutator = customerRepo.getMutator();
    this.clientInfo = clientInfo;
    this.sessionRepo = sessionRepo;
  }

  async loginWithGoogle({
    tokens,
    userFetcher,
    baseThrower,
    cookieHeader,
  }: {
    tokens: GoogleTokens;
    userFetcher: (tokens: GoogleTokens) => Promise<GoogleUser>;
    baseThrower: AsyncThrower;
    cookieHeader: string | null;
  }): Promise<{
    setCookieHeaders: ["Set-Cookie", string][];
  }> {
    let googleUser: GoogleUser;

    try {
      googleUser = await userFetcher(tokens);
    } catch (e) {
      throw await baseThrower();
    }

    if (!googleUser) {
      throw await baseThrower();
    }

    const existingUserId = await this.getExistingUserFromGoogleData(googleUser);

    if (existingUserId !== null)
      return await this.loginExistingUser({ existingUserId, cookieHeader });

    return await this.loginNewUser({ googleUser, cookieHeader });
  }

  async connectGoogleAccountToLoggedInUser({
    tokens,
    userId,
    userFetcher,
    baseThrower,
  }: {
    tokens: GoogleTokens;
    userId: string;
    userFetcher: (tokens: GoogleTokens) => Promise<GoogleUser>;
    baseThrower: AsyncThrower;
  }) {
    let googleUser: GoogleUser;

    try {
      googleUser = await userFetcher(tokens);
    } catch (e) {
      throw await baseThrower();
    }

    if (!googleUser) {
      throw await baseThrower();
    }

    await this.oAuthAccountRepo.getMutator().createOAuthAccount({
      providerId: "google",
      providerUserId: googleUser.sub,
      userId,
      providerEmail: googleUser.email,
    });
  }

  private async getExistingUserFromGoogleData(googleUser: GoogleUser) {
    const existingOauthAccount = await this.oAuthAccountRepo
      .getQuerier()
      .queryOAuthAccount({
        providerId: "google",
        providerUserId: googleUser.sub,
        projection: { userId: oauthAccounts.userId },
      });

    const existingUserWithEmail = await this.userRepo
      .getQuerier()
      .queryUserWithEmail({
        email: googleUser.email,
        projection: { id: users.id },
      });

    if (existingUserWithEmail && !existingOauthAccount) {
      // This is normally unsafe when working with oauth, but I think
      // Google is trustworthy enough to allow this for a better UX
      await this.oAuthAccountRepo.getMutator().createOAuthAccount({
        providerId: "google",
        providerUserId: googleUser.sub,
        userId: existingUserWithEmail.id,
        providerEmail: googleUser.email,
      });
    }

    return existingUserWithEmail?.id ?? existingOauthAccount?.userId ?? null;
  }

  private async loginExistingUser({
    existingUserId,
    cookieHeader,
  }: {
    existingUserId: string;
    cookieHeader: string | null;
  }): Promise<{
    setCookieHeaders: SetCookieHeader[];
  }> {
    const authSessionStorage = getAuthSessionStorageWithUserId({
      userId: existingUserId,
      sessionRepo: this.sessionRepo,
    });
    const { authSession, currentUserSession } =
      await createNewAuthSessionAndSetActiveUser({
        data: { userId: existingUserId, ...this.clientInfo },
        cookieHeader,
        authSessionStorage,
      });

    const customer = await this.customerQuerier.queryCustomerByUserId({
      userId: existingUserId,
      projection: { id: customers.id, activeTeamId: customers.activeTeamId },
    });

    if (!customer) {
      // User has a creator account, but no customer account yet. Create one.
      await this.customerMutator.createCustomer({
        userId: existingUserId,
      });
    }

    return {
      setCookieHeaders: [
        ["Set-Cookie", await authSessionStorage.commitSession(authSession)],
        [
          "Set-Cookie",
          await currentUserSessionStorage.commitSession(currentUserSession),
        ],
      ],
    };
  }

  private async loginNewUser({
    googleUser,
    cookieHeader,
  }: {
    googleUser: GoogleUser;
    cookieHeader: string | null;
  }): Promise<{
    setCookieHeaders: SetCookieHeader[];
  }> {
    const newUserId = await this.userRepo
      .getMutator()
      .createUser({ email: googleUser.email, name: googleUser.name });

    await this.oAuthAccountRepo.getMutator().createOAuthAccount({
      providerId: "google",
      providerUserId: googleUser.sub,
      userId: newUserId,
      providerEmail: googleUser.email,
    });

    await this.customerMutator.createCustomer({ userId: newUserId });

    const authSessionStorage = getAuthSessionStorageWithUserId({
      userId: newUserId,
      sessionRepo: this.sessionRepo,
    });
    const { authSession, currentUserSession } =
      await createNewAuthSessionAndSetActiveUser({
        authSessionStorage,
        data: { userId: newUserId, ...this.clientInfo },
        cookieHeader,
      });

    return {
      setCookieHeaders: [
        ["Set-Cookie", await authSessionStorage.commitSession(authSession)],
        [
          "Set-Cookie",
          await currentUserSessionStorage.commitSession(currentUserSession),
        ],
      ],
    };
  }
}

export interface GoogleUser {
  name: string;
  picture: string;
  email: string;
  email_verified: boolean;
  sub: string;
}
