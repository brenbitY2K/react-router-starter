import { redirect, type LoaderFunctionArgs } from "react-router";
import {
  throwCustomerToAccountDisconnectRootError,
  throwUnauthenticatedErrorResponseJsonAndLog,
  throwUnauthorizedErrorResponseJsonAndLog,
} from "../response.server.js";
import {
  UserRepository,
  type UserSelectFields,
} from "~/repositories/users.server.js";
import {
  CustomerRepository,
  type CustomerSelectFields,
} from "~/repositories/customers.server.js";
import {
  getCustomerOrThrow,
  getUserFromSessionOrThrow,
} from "./core.server.js";
import { type Logger } from "~/logging/index.js";
import { customers, users } from "@acme/database/schema";
import { SessionRepository } from "~/repositories/sessions.server.js";

export async function requireUserFromSession<
  P extends Partial<UserSelectFields>,
>({
  projection,
  args,
  logger,
}: {
  args: LoaderFunctionArgs;
  logger: Logger;
  projection: P;
}) {
  return getUserFromSessionOrThrow({
    sessionRepo: new SessionRepository(),
    cookieHeader: args.request.headers.get("Cookie"),
    userRepo: new UserRepository(),
    projection,
    thrower: () => {
      throw throwUnauthenticatedErrorResponseJsonAndLog({
        data: {
          message: "You are currently not logged in.",
        },
        logInfo: { logger, event: "unauthenticated" },
        location: "root",
      });
    },
  });
}

export async function requireCustomer<P extends Partial<CustomerSelectFields>>({
  args,
  logger,
  projection,
}: {
  args: LoaderFunctionArgs;
  logger: Logger;
  projection: P;
}) {
  const user = await requireUserFromSession({
    args,
    logger,
    projection: { id: users.id },
  });
  const loggerWithData = logger.child({ userId: user.id });
  return getCustomerOrThrow({
    userId: user.id,
    projection,
    customerRepo: new CustomerRepository(),
    thrower: () => {
      throw throwCustomerToAccountDisconnectRootError(loggerWithData);
    },
  });
}

export async function requireAdmin<P extends Partial<CustomerSelectFields>>({
  args,
  logger,
  projection,
}: {
  args: LoaderFunctionArgs;
  logger: Logger;
  projection: P;
}) {
  const user = await requireUserFromSession({
    args,
    logger,
    projection: { id: users.id, email: users.email },
  });
  if (!user.email.endsWith("@acme.ai"))
    throw throwUnauthorizedErrorResponseJsonAndLog({
      data: { message: "This page can only be accessed by admins." },
      logInfo: {
        logger,
        event: "unauthorized",
      },
    });

  const loggerWithData = logger.child({ userId: user.id });
  return getCustomerOrThrow({
    userId: user.id,
    projection,
    customerRepo: new CustomerRepository(),
    thrower: () => {
      throw throwCustomerToAccountDisconnectRootError(loggerWithData);
    },
  });
}

export async function requireRerouteIfLoggedIn({
  args,
  redirectPath,
  logger,
}: {
  logger: Logger;
  redirectPath: string;
  args: LoaderFunctionArgs;
}) {
  try {
    await requireCustomer({ args, logger, projection: { id: customers.id } });

    // If we reach this point, the user is logged in, so we want to reroute
    // throw redirect(redirectPath);
    throw redirect(redirectPath);
  } catch (e) {
    // Only throw the redirect
    if (e instanceof Response) {
      if (e.status === 302) throw e;
    }
  }
}
