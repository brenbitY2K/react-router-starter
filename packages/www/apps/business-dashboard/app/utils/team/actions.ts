import { type Logger } from "~/logging/index.js";
import { getTeamFromSlugOrThrow } from "./core.server.js";
import { throwNotFoundErrorResponseJsonAndLog } from "../response.server.js";
import {
  TeamRepository,
  type TeamSelectFields,
} from "~/repositories/teams.server.js";

export async function validateTeamFromSlug<
  P extends Partial<TeamSelectFields>,
>({
  teamSlug,
  projection,
  logger,
}: {
  teamSlug: string;
  logger: Logger;
  projection: P;
}) {
  return await getTeamFromSlugOrThrow({
    teamSlug,
    teamRepo: new TeamRepository(),
    projection,
    thrower: () => {
      throw throwNotFoundErrorResponseJsonAndLog({
        data: { message: `Team with slug ${teamSlug} does not exist.` },
        logInfo: {
          logger,
          event: "customer_team_does_not_exist",
          data: { teamSlug },
        },
      });
    },
  });
}
