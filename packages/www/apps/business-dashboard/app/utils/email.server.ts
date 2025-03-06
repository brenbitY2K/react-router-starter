import { serverConfig } from "~/config.server";

export const fromEmailAddress = {
  noReply:
    serverConfig.nodeEnv === "production"
      ? "no-reply@acme.ai"
      : "no-reply@acme.ai",
};
