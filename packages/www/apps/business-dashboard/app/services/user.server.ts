import { users } from "@acme/database/schema";
import { type Logger } from "~/logging/index.js";
import {
  type UserMutable,
  type UserQueryable,
  type UserRepository,
} from "~/repositories/users.server.js";
import { throwActionErrorAndLog } from "~/utils/response.server.js";

export class UserService {
  private logger: Logger;
  private userQuerier: UserQueryable;
  private userMutator: UserMutable;

  constructor({
    logger,
    userRepo,
  }: {
    logger: Logger;
    userRepo: UserRepository;
  }) {
    this.logger = logger;
    this.userQuerier = userRepo.getQuerier();
    this.userMutator = userRepo.getMutator();
  }

  async checkIfEmailIsAvailableForUse({
    userId,
    email,
  }: {
    userId: string;
    email: string;
  }) {
    const user = await this.userQuerier.queryUser({
      userId,
      projection: { email: users.email },
    });

    if (!user) {
      // This shouldn't ever happen
      throw throwActionErrorAndLog({
        message: "An unkown error occured. Please try again later.",
        logInfo: {
          logger: this.logger,
          event: "user_with_no_connected_customer_account",
        },
      });
    }

    if (user.email === email) {
      throw throwActionErrorAndLog({
        message: "You're already using this email.",
        logInfo: {
          logger: this.logger,
          event: "form_validation_action_error",
        },
      });
    }

    const userWithEmail = await this.userQuerier.queryUserWithEmail({
      email,
      projection: { id: users.id },
    });

    return userWithEmail === undefined;
  }

  async updateCoreProfileInfo({
    name,
    username,
    imageUrl,
    userId,
  }: {
    name?: string;
    username?: string;
    imageUrl?: string;
    userId: string;
  }) {
    await this.userMutator.updateCoreProfileInfo({
      userId,
      data: { name, username, imageUrl },
    });
  }

  async disconnectConnectedAccount({
    userId,
    providerId,
  }: {
    providerId: string;
    userId: string;
  }) {
    await this.userMutator.deleteOAuthAccount({ userId, providerId });
  }
}
