import { pino } from "pino";
import "@logtail/pino";

const MODE = process.env.NODE_ENV;

const liveTransport = pino.transport({
  targets: [
    {
      target: "@logtail/pino",
      options: { sourceToken: process.env.BETTERSTACK_LOGGING_SOURCE_TOKEN },
    },
    {
      target: "pino/file",
    },
  ],
});

const levels = {
  production: "info",
  staging: "info",
  development: "info",
  test: "error",
};

const activeTransport =
  /* @ts-ignore */
  MODE === "production" || MODE === "staging" ? liveTransport : undefined;
/* @ts-ignore */
const level = levels[MODE ?? "development"] || "info";

export const logger = pino({ level }, activeTransport);
