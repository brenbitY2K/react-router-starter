import { customers, users } from "@acme/database/schema";
import {
  type TeamRepository,
  type TeamSelectFields,
} from "~/repositories/teams.server.js";
import { type UserQueryable } from "~/repositories/users.server.js";
import { type Thrower } from "~/types/errors.js";

export async function getTeamFromSlugOrThrow<
  P extends Partial<TeamSelectFields>,
>({
  teamSlug,
  projection,
  teamRepo,
  thrower,
}: {
  thrower: Thrower;
  projection: P;
  teamSlug: string;
  teamRepo: TeamRepository;
}) {
  const team = await teamRepo
    .getQuerier()
    .queryTeamWithSlug({ slug: teamSlug, projection });

  if (team === undefined) {
    throw thrower();
  }

  return team;
}

type TeamsByCustomerUser = {
  customerId: string;
  email: string;
  userId: string;
  teams: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
  }[];
}[];

export async function getAllTeamsByCustomerUser({
  userQuerier,
  usersWithActiveSession,
}: {
  userQuerier: UserQueryable;
  usersWithActiveSession: Pick<
    typeof users.$inferSelect,
    "name" | "id" | "email"
  >[];
}) {
  const userIds = usersWithActiveSession.map((user) => user.id);
  let teamsForCustomerUserIds =
    await userQuerier.queryTeamsForCustomerUserIds(userIds);

  const userIdsWithoutATeam = userIds.filter(
    (id) =>
      !teamsForCustomerUserIds.map((customer) => customer.userId).includes(id),
  );

  const teamlessUserQuery =
    userIdsWithoutATeam.length > 0
      ? await userQuerier.queryCustomersByUserIds({
          userIds: userIdsWithoutATeam,
          customerProjection: { id: customers.id },
          userProjection: { id: users.id, email: users.email },
        })
      : [];

  const teamsByCustomerUser =
    teamsForCustomerUserIds.reduce<TeamsByCustomerUser>((acc, row) => {
      const { userId, customerId, team, email } = row;

      let userEntry = acc.find((entry) => entry.email === email);

      if (!userEntry) {
        userEntry = { userId, email, customerId, teams: [] };
        acc.push(userEntry);
      }

      userEntry.teams.push(team);

      return acc;
    }, []);

  teamlessUserQuery.forEach((result) =>
    teamsByCustomerUser.push({
      userId: result.user.id,
      email: result.user.email,
      customerId: result.customer.id,
      teams: [],
    }),
  );

  return teamsByCustomerUser;
}
