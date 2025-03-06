import { throwActionErrorAndLog } from "../response.server.js";
import { type Logger } from "~/logging/index.js";
import { getTeamInviteInfoIfValid } from "./core.server.js";
import { TeamQuerier } from "~/repositories/teams.server.js";

export async function validateTeamInvite({
  team,
  inviteCode,
  logger,
}: {
  team: {
    id: string;
    slug: string;
  };
  inviteCode: string;
  logger: Logger;
}) {
  const teamQuerier = new TeamQuerier();

  const inviteInfo = await getTeamInviteInfoIfValid({
    teamQuerier,
    teamId: team.id,
    code: inviteCode,
  });

  if (inviteInfo === null) {
    throw throwActionErrorAndLog({
      message: "This invite code does not exist or has expired.",
      logInfo: {
        logger,
        data: { teamSlug: team.slug, code: inviteCode },
        event: "customer_team_invite_code_not_valid",
      },
    });
  }

  return inviteInfo;
}
