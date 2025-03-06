import { type Params } from "react-router";
import { getRouteParamOrThrow } from "./core.server.js";
import { type Logger } from "~/logging/index.js";
import { throwNotFoundErrorResponseJsonAndLog } from "../response.server.js";

export function requireTeamSlugRouteParam({
  params,
  logger,
}: {
  params: Params<string>;
  logger: Logger;
}) {
  return getRouteParamOrThrow({
    param: "teamSlug",
    params,
    thrower: () => {
      throw throwNotFoundErrorResponseJsonAndLog({
        data: { message: "This team does not exist." },
        logInfo: {
          logger,
          event: "customer_team_slug_not_in_path",
        },
      });
    },
  });
}

export function requireChatIdRouteParam({
  params,
  logger,
}: {
  params: Params<string>;
  logger: Logger;
}) {
  return getRouteParamOrThrow({
    param: "chatId",
    params,
    thrower: () => {
      throw throwNotFoundErrorResponseJsonAndLog({
        data: { message: "This converstaion does not exist." },
        logInfo: {
          logger,
          event: "TODO",
        },
      });
    },
  });
}
