import { type Logger } from "~/logging/index.js";
import { throwNotFoundErrorResponseJsonAndLog } from "../response.server.js";
import { getTeamInviteInfoIfValid } from "./core.server.js";
import { TeamQuerier } from "~/repositories/teams.server.js";

export async function requireValidCustomerInviteCode({
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
    code: inviteCode,
    teamId: team.id,
  });

  if (inviteInfo === null) {
    throw throwNotFoundErrorResponseJsonAndLog({
      data: { message: "This invite code does not exist or has expired." },
      logInfo: {
        logger,
        event: "customer_team_invite_code_not_valid",
      },
    });
  }

  return inviteInfo;
}
