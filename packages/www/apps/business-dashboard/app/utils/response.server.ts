import { data as dataResponse } from "react-router";
import {
  ActionError,
  type ErrorResponseType,
  type ErrorResponseData,
  type ErrorResponseLocation,
  type UnauthenticatedErrorResponseData,
  type UnauthorizedErrorResponseData,
  type NotFoundErrorResponseData,
} from "./response.js";
import { logInfoEvent, type Logger } from "~/logging/index.js";
import { type LogEvent } from "~/logging/events.js";

export function throwErrorResponseJsonAndLog({
  data,
  init,
  location = "local",
  logInfo,
}: {
  data: Omit<ErrorResponseData, "location" | "type">;
  init: ResponseInit;
  location?: ErrorResponseLocation;
  logInfo: {
    logger: Logger;
    data?: any;
    event: LogEvent;
  };
}) {
  const { logger, data: logData, event } = logInfo;
  logInfoEvent(logger, event, logData);
  throw dataResponse({ ...data, location }, { ...init });
}

function throwErrorResponseJsonWithTypeAndLog({
  data,
  init,
  location = "local",
  type,
  logInfo,
}: {
  data: Omit<ErrorResponseData, "location" | "type">;
  init: ResponseInit;
  location?: ErrorResponseLocation;
  type: ErrorResponseType;
  logInfo: {
    logger: Logger;
    data?: any;
    event: LogEvent;
  };
}) {
  const { logger, data: logData, event } = logInfo;
  logInfoEvent(logger, event, logData);
  throw dataResponse({ ...data, type, location }, init);
}

export function throwNotFoundErrorResponseJsonAndLog({
  data,
  location = "local",
  logInfo,
}: {
  data: Omit<NotFoundErrorResponseData, "location" | "type">;
  location?: ErrorResponseLocation;
  logInfo: {
    logger: Logger;
    data?: any;
    event: LogEvent;
  };
}) {
  throw throwErrorResponseJsonWithTypeAndLog({
    data,
    init: { status: 404 },
    location,
    type: "not_found",
    logInfo,
  });
}

export function throwUnauthenticatedErrorResponseJsonAndLog({
  data,
  location = "local",
  logInfo,
}: {
  data: Omit<UnauthenticatedErrorResponseData, "location" | "type">;
  location?: ErrorResponseLocation;
  logInfo: {
    logger: Logger;
    data?: any;
    event: LogEvent;
  };
}) {
  throw throwErrorResponseJsonWithTypeAndLog({
    data,
    init: { status: 401 },
    location,
    type: "unauthenticated",
    logInfo,
  });
}

export function throwUnauthorizedErrorResponseJsonAndLog({
  data,
  location = "local",
  logInfo,
}: {
  data: Omit<UnauthorizedErrorResponseData, "location" | "type">;
  location?: ErrorResponseLocation;
  logInfo: {
    logger: Logger;
    data?: any;
    event: LogEvent;
  };
}) {
  throw throwErrorResponseJsonWithTypeAndLog({
    data,
    init: { status: 403 },
    location,
    type: "unauthorized",
    logInfo,
  });
}

export function throwCustomerToAccountDisconnectRootError(
  logger: Logger,
): never {
  throw throwUnauthenticatedErrorResponseJsonAndLog({
    data: {
      message:
        "We had trouble authenticating your account. Please try signing out and signing back in.",
    },
    logInfo: { logger, event: "user_with_no_connected_customer_account" },
    location: "root",
  });
}

export function throwActionErrorAndLog({
  message,
  logInfo,
}: {
  message: string;
  logInfo: { logger: Logger; event: LogEvent; data?: any };
}) {
  const { logger, event, data } = logInfo;

  logInfoEvent(logger, event, data);
  throw new ActionError(message);
}

export function throwAPIerrorAndLog({
  message,
  status,
  logInfo,
}: {
  message: string;
  status: number;
  logInfo: { logger: Logger; event: LogEvent; data?: any };
}) {
  const { logger, event, data } = logInfo;

  logInfoEvent(logger, event, data);
  throw Response.json({ message }, { status });
}
