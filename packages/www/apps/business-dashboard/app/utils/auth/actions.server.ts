import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
  redirect,
} from "react-router";
import {
  throwActionErrorAndLog,
  throwCustomerToAccountDisconnectRootError,
} from "../response.server.js";
import {
  getUserFromSessionOrThrow,
  getCustomerOrThrow,
} from "./core.server.js";
import { type Logger } from "~/logging/index.js";
import {
  CustomerRepository,
  type CustomerSelectFields,
} from "~/repositories/customers.server.js";
import {
  UserRepository,
  type UserSelectFields,
} from "~/repositories/users.server.js";
import { requireUserFromSession } from "./loaders.server.js";
import { verifyRequestOrigin } from "oslo/request";
import { users } from "@acme/database/schema";
import { SessionRepository } from "~/repositories/sessions.server.js";

export async function validateUserFromSession<
  P extends Partial<UserSelectFields>,
>({
  args,
  logger,
  projection,
}: {
  args: ActionFunctionArgs;
  logger: Logger;
  projection: P;
}) {
  const originHeader = args.request.headers.get("origin") ?? null;
  const hostHeader = args.request.headers.get("host") ?? null;
  if (
    !originHeader ||
    !hostHeader ||
    !verifyRequestOrigin(originHeader, [hostHeader])
  ) {
    throw throwActionErrorAndLog({
      message: "You do not have permission to perform this action",
      logInfo: {
        logger,
        event: "bad_origin",
        data: originHeader,
      },
    });
  }

  return getUserFromSessionOrThrow({
    sessionRepo: new SessionRepository(),
    cookieHeader: args.request.headers.get("Cookie"),
    userRepo: new UserRepository(),
    projection,
    thrower: () => {
      throw redirect("/select-account");
    },
  });
}

export async function validateCustomer<
  P extends Partial<CustomerSelectFields>,
>({
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
    customerRepo: new CustomerRepository(),
    projection,
    thrower: () => {
      /* The user has a user_account table row , but for some reason they don't have a
       * customer account. Show an error boundary.
       */
      throwCustomerToAccountDisconnectRootError(loggerWithData);
    },
  });
}
