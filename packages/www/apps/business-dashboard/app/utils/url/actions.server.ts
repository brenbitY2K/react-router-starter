import { type Params } from "react-router";
import { getRouteParamOrThrow } from "./core.server.js";
import { type Logger } from "~/logging/index.js";
import { throwActionErrorAndLog } from "../response.server.js";

export function validateTeamSlugRouteParam({
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
      throw throwActionErrorAndLog({
        message: "Please enter a team slug in the URL.",
        logInfo: {
          logger,
          event: "customer_team_slug_not_in_path",
        },
      });
    },
  });
}
