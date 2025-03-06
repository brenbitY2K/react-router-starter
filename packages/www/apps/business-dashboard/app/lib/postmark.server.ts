import { ServerClient } from "postmark";
import { serverConfig } from "~/config.server";

export const postmarkClient = new ServerClient(
  serverConfig.postmarkServerToken,
);
