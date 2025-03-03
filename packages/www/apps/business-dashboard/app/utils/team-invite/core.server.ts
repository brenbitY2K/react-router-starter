import { teams, teamEmailInvites } from "@acme/database/schema";
import { serverConfig } from "~/config.server.js";
import { type TeamQueryable } from "~/repositories/teams.server.js";
import { type TeamRole } from "../permissions/core.server.js";

export interface TeamInviteInfo {
  code: string;
  type: "email" | "shareable";
  teamId: string;
  role?: TeamRole;
}

export async function getTeamInviteInfoIfValid({
  code,
  teamId,
  teamQuerier,
}: {
  code: string;
  teamId: string;
  teamQuerier: TeamQueryable;
}): Promise<TeamInviteInfo | null> {
  const emailInvite = await teamQuerier.queryEmailInvite({
    projection: {
      code: teamEmailInvites.code,
      teamId: teamEmailInvites.teamId,
      role: teamEmailInvites.role,
    },
    teamId,
    code,
  });

  if (emailInvite !== undefined) {
    return {
      code: emailInvite.code,
      type: "email",
      teamId: emailInvite.teamId,
      role: emailInvite.role,
    };
  }

  const team = await teamQuerier.queryTeam({
    teamId,
    projection: {
      shareableInviteCode: teams.shareableInviteCode,
    },
  });

  if (team?.shareableInviteCode != null && team.shareableInviteCode === code) {
    return {
      code: team.shareableInviteCode,
      type: "shareable",
      teamId,
      role: "member",
    };
  }

  return null;
}

export function createTeamInviteLink(teamSlug: string, code: string) {
  if (serverConfig.domain === "localhost")
    return `http://${serverConfig.domain}:3000/teams/${teamSlug}/join/${code}`;

  return `https://${serverConfig.domain}/teams/${teamSlug}/join/${code}`;
}
