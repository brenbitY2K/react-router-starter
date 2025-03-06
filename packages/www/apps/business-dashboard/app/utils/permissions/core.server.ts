import { customersToTeams } from "@acme/database/schema";
import { type TeamQuerier } from "~/repositories/teams.server.js";
import { type Thrower } from "~/types/errors.js";

export type CustomerRoleFetcher = (params: {
  customerId: string;
  teamSlug: string;
}) => Promise<TeamRole | undefined>;

export type TeamRole = "owner" | "admin" | "member";

export async function checkIfCustomerHasPermissionsOrThrow({
  customerId,
  role,
  teamQuerier,
  teamId,
  thrower,
}: {
  customerId: string;
  role: TeamRole;
  teamQuerier: TeamQuerier;
  teamId: string;
  thrower: Thrower;
}) {
  const relation = await teamQuerier.queryCustomerToTeamRelation({
    customerId,
    projection: { role: customersToTeams.role },
    teamId,
  });

  if (relation === undefined) throw thrower();

  if (role === "owner" && relation.role !== "owner") throw thrower();

  if (
    role === "admin" &&
    relation.role !== "owner" &&
    relation.role !== "admin"
  )
    throw thrower();
}
