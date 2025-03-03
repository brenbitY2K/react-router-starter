import { pino } from "pino";
import { serverConfig } from "~/config.server.js";
import "@logtail/pino";

const levels = {
  production: "info",
  staging: "info",
  development: "info",
  test: "error",
};

const level = levels[serverConfig.nodeEnv] || "info";

const transport =
  serverConfig.nodeEnv === "production" || serverConfig.nodeEnv === "staging"
    ? pino.transport({
        target: "@logtail/pino",
        options: { sourceToken: serverConfig.betterstackLoggingSourceToken },
      })
    : undefined;

export const logger = pino({ level }, transport);
