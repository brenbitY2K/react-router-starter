import { type Logger } from "~/logging/index.js";
import {
  type EmailOTPQueryable,
  type EmailOTPMutable,
  type EmailOTPRepository,
} from "~/repositories/email-otps.server.js";
import { EmailService } from "~/services/email/email.server.js";

import crypto from "crypto";
import jwt from "jsonwebtoken";
import { serverConfig } from "~/config.server.js";
import {
  emailOTPs,
  emailOTPsForEmailChange,
  users,
} from "@acme/database/schema";
import { type UserRepository } from "~/repositories/users.server.js";
import {
  createEmailOTPLoginLink,
  createEmailOTPEmailChangeLink,
} from "~/utils/auth/core.server.js";
import { type Thrower } from "~/types/errors.js";
import { type CustomerRepository } from "~/repositories/customers.server.js";
import {
  UserEmailOTPEmailChangeTemplate,
  UserEmailOTPLoginTemplate,
} from "./email/templates.js";
import { PostmarkEmailClient } from "./email/postmark-client.server.js";
import { fromEmailAddress } from "~/utils/email.server.js";

export class EmailOTPAuthService {
  private logger: Logger;
  private emailOTPQuerier: EmailOTPQueryable;
  private emailOTPMutator: EmailOTPMutable;

  constructor({
    emailOTPRepository,
    logger,
  }: {
    logger: Logger;
    emailOTPRepository: EmailOTPRepository;
  }) {
    this.logger = logger;

    this.emailOTPQuerier = emailOTPRepository.getQuerier();
    this.emailOTPMutator = emailOTPRepository.getMutator();
  }

  async sendEmailOTPForLogin({
    email,
    redirectPath,
    name,
  }: {
    email: string;
    redirectPath?: string;
    name?: string;
  }) {
    const code = generateOTPCode();

    const hashedCode = crypto.createHash("md5").update(code).digest("hex");
    const token = jwt.sign(
      { email, code, name },
      serverConfig.emailOtpJwtSecret ?? "",
    );

    await this.emailOTPMutator.createLoginOTP({ email, code: hashedCode });

    const emailService = new EmailService(new PostmarkEmailClient());

    const link = createEmailOTPLoginLink({ token, redirectPath });

    await emailService.sendTemplate({
      template: new UserEmailOTPLoginTemplate({
        login_code: code,
        login_url: link,
      }),
      to: email,
      from: fromEmailAddress.noReply,
    });
  }

  async sendEmailOTPForEmailChange({
    email,
    userId,
    teamSlug,
  }: {
    email: string;
    userId: string;
    teamSlug: string;
  }) {
    const code = generateOTPCode();

    const hashedCode = crypto.createHash("md5").update(code).digest("hex");
    const token = jwt.sign(
      { email, code },
      serverConfig.emailOtpJwtSecret ?? "",
    );

    await this.emailOTPMutator.createEmailChangeOTP({
      emailToChangeTo: email,
      code: hashedCode,
      userId,
    });

    const emailService = new EmailService(new PostmarkEmailClient());

    const link = createEmailOTPEmailChangeLink({ token, teamSlug });

    await emailService.sendTemplate({
      template: new UserEmailOTPEmailChangeTemplate({
        email_change_link: link,
      }),
      to: email,
      from: fromEmailAddress.noReply,
    });
  }

  async verifyEmailOTPForLogin({
    email,
    name,
    code,
    userRepo,
    customerRepo,
    invalidCodeThrower,
    expiredCodeThrower,
    userDoesNotExistThrower,
  }: {
    email: string;
    name?: string;
    code: string;
    userRepo: UserRepository;
    customerRepo: CustomerRepository;
    invalidCodeThrower: Thrower;
    expiredCodeThrower: Thrower;
    userDoesNotExistThrower: Thrower;
  }) {
    const hashedCode = hashCodeWithMD5(code);

    const result = await this.emailOTPQuerier.queryEmailOTPForLogin({
      email,
      code: hashedCode,
      projection: { createdAt: emailOTPs.createdAt, email: emailOTPs.email },
    });

    if (!result) {
      throw invalidCodeThrower();
    }

    if (isDateMoreThanTenMinutesOld(result.createdAt)) {
      throw expiredCodeThrower();
    }

    // TODO: We can't delete the code b/c it may have been used
    // by some email defender software. In the future, we should
    // set up some job that clears old OTPs.
    // await this.emailOTPMutator.deleteAllLoginOTPsForEmail(email);

    const userWithEmail = await userRepo
      .getQuerier()
      .queryUserWithEmail({ projection: { id: users.id }, email });

    if (userWithEmail) {
      if (name)
        userRepo
          .getMutator()
          .updateCoreProfileInfo({ data: { name }, userId: userWithEmail.id });

      return userWithEmail.id;
    }

    // At this point, we're trying to create a new account
    // but if name is undefined, they came from the login route
    // so we'll throw and tell them to create an account first
    if (name === undefined) throw userDoesNotExistThrower();

    const newUserId = await userRepo.getMutator().createUser({ email, name });

    await customerRepo.getMutator().createCustomer({ userId: newUserId });

    return newUserId;
  }

  async verifyEmailOTPForEmailChange({
    code,
    userRepo,
    userId,
    invalidCodeThrower,
    emailAlreadyInUseThrower,
    expiredCodeThrower,
  }: {
    code: string;
    userId: string;
    userRepo: UserRepository;
    invalidCodeThrower: Thrower;
    emailAlreadyInUseThrower: Thrower;
    expiredCodeThrower: Thrower;
  }) {
    const hashedCode = hashCodeWithMD5(code);

    const result = await this.emailOTPQuerier.queryEmailOTPForEmailChange({
      userId,
      code: hashedCode,
      projection: {
        createdAt: emailOTPsForEmailChange.createdAt,
        emailToChangeTo: emailOTPsForEmailChange.emailToChangeTo,
      },
    });

    if (!result) {
      throw invalidCodeThrower();
    }

    if (isDateMoreThanTenMinutesOld(result.createdAt)) {
      await this.emailOTPMutator.deleteEmailChangeOTPForUserId(userId);
      throw expiredCodeThrower();
    }

    await this.emailOTPMutator.deleteEmailChangeOTPForUserId(userId);

    const userWithEmail = await userRepo.getQuerier().queryUserWithEmail({
      projection: { id: users.id },
      email: result.emailToChangeTo,
    });

    if (userWithEmail) throw emailAlreadyInUseThrower();

    await userRepo
      .getMutator()
      .updateEmail({ userId, email: result.emailToChangeTo });

    return result.emailToChangeTo;
  }

  async cancelOngoingEmailChangeForUser({ userId }: { userId: string }) {
    await this.emailOTPMutator.deleteEmailChangeOTPForUserId(userId);
  }
}

function isDateMoreThanTenMinutesOld(date: Date) {
  const now = new Date();

  const diffInMilliseconds = now.getTime() - date.getTime();

  const diffInMinutes = diffInMilliseconds / (1000 * 60);

  return diffInMinutes > 10;
}

function hashCodeWithMD5(code: string) {
  return crypto.createHash("md5").update(code).digest("hex");
}

function generateOTPCode(length = 12) {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const charactersLength = characters.length;
  let token = "";

  for (let i = 0; i < length / 2; i++) {
    const randomIndex = crypto.randomBytes(1)[0] % charactersLength;
    token += characters[randomIndex];
  }

  token += "-";

  for (let i = 0; i < length / 2; i++) {
    const randomIndex = crypto.randomBytes(1)[0] % charactersLength;
    token += characters[randomIndex];
  }

  return token;
}
