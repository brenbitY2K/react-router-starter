import type { Logger as PinoLogger } from "pino";
import type { ErrorResponseType } from "~/utils/response.js";
import {
  type ActionFunctionArgs,
  type LoaderFunctionArgs,
} from "react-router";
import { type LogEvent } from "./events.js";

export interface Logger extends PinoLogger {}

export function loggerWithErrorResponseType(
  logger: Logger,
  errorResponseType: ErrorResponseType,
) {
  const modifiedLogger = logger.child({ errorResponseType });

  return modifiedLogger;
}

export function loggerWithLoaderInfo(logger: Logger, args: LoaderFunctionArgs) {
  const { request } = args;

  const url = new URL(request.url);
  const path = url.pathname;

  const modifiedLogger = logger.child({ path, remixSource: "loader" });

  return modifiedLogger;
}

export function loggerWithActionInfo(logger: Logger, args: ActionFunctionArgs) {
  const { request } = args;

  const url = new URL(request.url);
  const path = url.pathname;

  const modifiedLogger = logger.child({ path, remixSource: "action" });

  return modifiedLogger;
}

export function loggerWithNamedActionInfo(logger: Logger, actionName: string) {
  const modifiedLogger = logger.child({ actionName });

  return modifiedLogger;
}

export function logInfoEvent(logger: Logger, event: LogEvent, data?: unknown) {
  logger.info(data === undefined ? {} : data, event);
}

export function logErrorEvent(logger: Logger, event: LogEvent, data?: unknown) {
  logger.error(data === undefined ? {} : data, event);
}
