import { type LoaderFunctionArgs } from "react-router";
import { logger as baseLogger } from "~/lib/pino.server.js";
import { loggerWithLoaderInfo } from "~/logging/index.js";

export function createLoaderLogger(args: LoaderFunctionArgs) {
  return loggerWithLoaderInfo(baseLogger, args);
}
