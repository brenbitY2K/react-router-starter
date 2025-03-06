import { Google } from "arctic";
import { serverConfig } from "~/config.server.js";

const callbackRoute = "/login/google/callback";
const root =
  serverConfig.domain === "localhost"
    ? "http://localhost:3000"
    : `https://${serverConfig.domain}`;

export const google = new Google(
  serverConfig.googleClientId ?? "",
  serverConfig.googleClientSecret ?? "",
  root + callbackRoute,
);
