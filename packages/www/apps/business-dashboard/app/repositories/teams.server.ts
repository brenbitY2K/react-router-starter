import { db } from "@acme/database";
import {
  teamEmailInvites,
  teams,
  customers,
  customersToTeams,
  subscriptions,
} from "@acme/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { type PgSelectBase } from "drizzle-orm/pg-core";
import { type TeamRole } from "~/utils/permissions/core.server.js";
import {
  generateCoreColumns,
  generateCreatedAtColumn,
} from "@acme/database/utils";
import { BaseRepository, type QueryResult } from "./index.js";
import { createId } from "@paralleldrive/cuid2";
import { type CustomerSelectFields } from "./customers.server.js";

export type TeamSelectFields = (typeof teams)["_"]["columns"];
export type CustomerToTeamRelationSelectFields =
  (typeof customersToTeams)["_"]["columns"];
export type TeamEmailInviteSelectFields =
  (typeof teamEmailInvites)["_"]["columns"];
export type SubscriptionSelectFields = (typeof subscriptions)["_"]["columns"];

export interface TeamMutable {
  addCustomer: (params: {
    customerId: string;
    teamId: string;
    role?: TeamRole;
  }) => Promise<void>;
  updateGeneralInfo: (params: {
    teamId: string;
    data: Partial<
      Pick<typeof teams.$inferInsert, "name" | "slug" | "imageUrl">
    >;
  }) => Promise<void>;
  createTeam: (
    params: Omit<typeof teams.$inferInsert, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  removeCustomerFromTeam: (params: {
    customerId: string;
    teamId: string;
  }) => Promise<void>;
  updateCustomerRole: (params: {
    customerId: string;
    teamId: string;
    role: TeamRole;
  }) => Promise<void>;
  createEmailInvitations: (params: {
    emails: string[];
    role: TeamRole;
    teamId: string;
  }) => Promise<string[]>;
  createShareableInvitation: (params: { teamId: string }) => Promise<string>;
  deleteShareableInvitaiton: (params: { teamId: string }) => Promise<void>;
  deleteEmailInvite: (params: {
    code: string;
    teamId: string;
  }) => Promise<void>;
  deleteExistingEmailInvites: (params: {
    emails: string[];
    teamId: string;
  }) => Promise<void>;
  updateStripeCustomerId: (params: {
    stripeCustomerId: string;
    teamId: string;
  }) => Promise<void>;
}

export interface TeamQueryable {
  queryTeam: <P extends Partial<TeamSelectFields>>(params: {
    projection: P;
    teamId: string;
  }) => Promise<QueryResult<P, TeamSelectFields> | undefined>;
  queryTeamByStripeCustomerId: <P extends Partial<TeamSelectFields>>(params: {
    projection: P;
    stripeCustomerId: string;
  }) => Promise<QueryResult<P, TeamSelectFields> | undefined>;

  queryTeamWithSlug: <P extends Partial<TeamSelectFields>>(params: {
    projection: P;
    slug: string;
  }) => Promise<QueryResult<P, TeamSelectFields> | undefined>;
  queryCustomerToTeamRelation: <
    P extends Partial<CustomerToTeamRelationSelectFields>,
  >(params: {
    customerId: string;
    teamId: string;
    projection: P;
  }) => Promise<QueryResult<P, CustomerToTeamRelationSelectFields> | undefined>;
  queryCustomers: <
    PCustomerToTeamSelectFields extends
      Partial<CustomerToTeamRelationSelectFields>,
    PCustomerSelectFields extends Partial<CustomerSelectFields>,
  >(params: {
    teamId: string;
    customerProjection: PCustomerSelectFields;
    customerToTeamsProjection: PCustomerToTeamSelectFields;
  }) => Promise<
    | {
        customer_to_customer_teams: QueryResult<
          PCustomerToTeamSelectFields,
          CustomerToTeamRelationSelectFields
        >;
        customer: QueryResult<PCustomerSelectFields, CustomerSelectFields>;
      }[]
    | undefined
  >;
  queryEmailInvite: <P extends Partial<TeamEmailInviteSelectFields>>(params: {
    teamId: string;
    code: string;
    projection: P;
  }) => Promise<QueryResult<P, TeamEmailInviteSelectFields> | undefined>;
  queryEmailInvites: <P extends Partial<TeamEmailInviteSelectFields>>(params: {
    teamId: string;
    projection: P;
  }) => Promise<QueryResult<P, TeamEmailInviteSelectFields>[] | undefined>;
  querySubscription: <P extends Partial<SubscriptionSelectFields>>(params: {
    teamId: string;
    projection: P;
  }) => Promise<QueryResult<P, SubscriptionSelectFields> | undefined>;
}

export class TeamRepository extends BaseRepository<TeamQueryable, TeamMutable> {
  constructor() {
    super(new TeamQuerier(), new TeamMutator());
  }
}

export class TeamQuerier implements TeamQueryable {
  async queryCustomerToTeamRelation<
    P extends Partial<CustomerToTeamRelationSelectFields>,
  >({
    projection,
    customerId,
    teamId,
  }: {
    projection: P;
    customerId: string;
    teamId: string;
  }) {
    const rows = (await db
      .select(projection)
      .from(customersToTeams)
      .where(
        and(
          eq(customersToTeams.customerId, customerId),
          eq(customersToTeams.teamId, teamId),
        ),
      )
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryTeam<P extends Partial<TeamSelectFields>>({
    projection,
    teamId,
  }: {
    projection: P;
    teamId: string;
  }) {
    const rows = (await db
      .select(projection)
      .from(teams)
      .where(eq(teams.id, teamId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryTeamByStripeCustomerId<P extends Partial<TeamSelectFields>>({
    projection,
    stripeCustomerId,
  }: {
    projection: P;
    stripeCustomerId: string;
  }) {
    const rows = (await db
      .select(projection)
      .from(teams)
      .where(eq(teams.stripeCustomerId, stripeCustomerId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryTeamWithSlug<P extends Partial<TeamSelectFields>>({
    projection,
    slug,
  }: {
    projection: P;
    slug: string;
  }) {
    const rows = (await db
      .select(projection)
      .from(teams)
      .where(eq(teams.slug, slug))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryCustomers<
    PCustomerToTeamSelectFields extends
      Partial<CustomerToTeamRelationSelectFields>,
    PCustomerSelectFields extends Partial<CustomerSelectFields>,
  >({
    teamId,
    customerProjection,
    customerToTeamsProjection,
  }: {
    teamId: string;
    customerProjection: PCustomerSelectFields;
    customerToTeamsProjection: PCustomerToTeamSelectFields;
  }) {
    return await db
      .select({
        customer: customerProjection,
        customer_to_customer_teams: customerToTeamsProjection,
      })
      .from(customersToTeams)
      .innerJoin(customers, eq(customersToTeams.customerId, customers.id))
      .where(eq(customersToTeams.teamId, teamId));
  }

  async queryEmailInvite<P extends Partial<TeamEmailInviteSelectFields>>({
    projection,
    teamId,
    code,
  }: {
    projection: P;
    teamId: string;
    code: string;
  }) {
    const rows = (await db
      .select(projection)
      .from(teamEmailInvites)
      .where(
        and(
          eq(teamEmailInvites.code, code),
          eq(teamEmailInvites.teamId, teamId),
        ),
      )
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryEmailInvites<P extends Partial<TeamEmailInviteSelectFields>>({
    projection,
    teamId,
  }: {
    teamId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(teamEmailInvites)
      .where(eq(teamEmailInvites.teamId, teamId))) as Awaited<
      PgSelectBase<any, P, "single", any>
    >;

    if (!rows.length) {
      return undefined;
    }

    return rows;
  }
  async querySubscription<P extends Partial<SubscriptionSelectFields>>({
    projection,
    teamId,
  }: {
    projection: P;
    teamId: string;
  }) {
    const rows = (await db
      .select(projection)
      .from(subscriptions)
      .where(eq(subscriptions.teamId, teamId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }
}

export class TeamMutator implements TeamMutable {
  async createTeam({ slug, name }: { slug: string; name: string }) {
    const coreColumns = await generateCoreColumns(teams);
    await db.insert(teams).values({ name, slug, ...coreColumns });

    return coreColumns.id;
  }

  async addCustomer({
    customerId,
    teamId,
    role = "member",
  }: {
    teamId: string;
    customerId: string;
    role?: TeamRole;
  }) {
    await db
      .insert(customersToTeams)
      .values({ customerId, teamId: teamId, role });
  }
  async removeCustomerFromTeam({
    customerId,
    teamId,
  }: {
    teamId: string;
    customerId: string;
  }) {
    await db
      .delete(customersToTeams)
      .where(
        and(
          eq(customersToTeams.teamId, teamId),
          eq(customersToTeams.customerId, customerId),
        ),
      );
  }

  async updateCustomerRole({
    customerId,
    teamId,
    role,
  }: {
    customerId: string;
    teamId: string;
    role: TeamRole;
  }) {
    await db
      .update(customersToTeams)
      .set({ role })
      .where(
        and(
          eq(customersToTeams.customerId, customerId),
          eq(customersToTeams.teamId, teamId),
        ),
      );
  }

  async createEmailInvitations({
    emails,
    role,
    teamId,
  }: {
    emails: string[];
    teamId: string;
    role: TeamRole;
  }) {
    const { createdAt } = generateCreatedAtColumn();

    const invitations: (typeof teamEmailInvites.$inferInsert)[] = [];

    for (let i = 0; i < emails.length; i++) {
      const code = await this.generateUniqueCuidEmailInviteCode({
        teamId,
      });
      invitations.push({
        code,
        email: emails[i],
        createdAt: createdAt,
        teamId,
        role,
      });
    }

    await db.insert(teamEmailInvites).values(invitations);

    return invitations.map(({ code }) => code);
  }

  async createShareableInvitation({ teamId }: { teamId: string }) {
    const code = await this.generateUniqueCuidShareableInviteCode({
      teamId,
    });

    await db
      .update(teams)
      .set({ shareableInviteCode: code })
      .where(eq(teams.id, teamId));

    return code;
  }

  async deleteShareableInvitaiton({ teamId }: { teamId: string }) {
    await db
      .update(teams)
      .set({ shareableInviteCode: null })
      .where(eq(teams.id, teamId));
  }

  async deleteEmailInvite({ code, teamId }: { code: string; teamId: string }) {
    await db
      .delete(teamEmailInvites)
      .where(
        and(
          eq(teamEmailInvites.code, code),
          eq(teamEmailInvites.teamId, teamId),
        ),
      );
  }

  async deleteExistingEmailInvites({
    emails,
    teamId,
  }: {
    emails: string[];
    teamId: string;
  }) {
    await db
      .delete(teamEmailInvites)
      .where(
        and(
          inArray(teamEmailInvites.email, emails),
          eq(teamEmailInvites.teamId, teamId),
        ),
      );
  }

  async updateGeneralInfo({
    teamId,
    data,
  }: {
    teamId: string;
    data: Partial<
      Pick<typeof teams.$inferInsert, "name" | "slug" | "imageUrl">
    >;
  }) {
    await db.update(teams).set(data).where(eq(teams.id, teamId));
  }

  async updateStripeCustomerId({
    teamId,
    stripeCustomerId,
  }: {
    teamId: string;
    stripeCustomerId: (typeof teams.$inferInsert)["stripeCustomerId"];
  }) {
    await db
      .update(teams)
      .set({ stripeCustomerId })
      .where(eq(teams.id, teamId));
  }

  private async generateUniqueCuidEmailInviteCode({
    teamId,
  }: {
    teamId: string;
  }): Promise<string> {
    let cuidAlreadyExists: boolean;
    let cuid: string;
    do {
      cuid = createId();

      const rowsWithCuid = await db
        .select()
        .from(teamEmailInvites)
        .where(
          and(
            eq(teamEmailInvites.code, cuid),
            eq(teamEmailInvites.teamId, teamId),
          ),
        );
      cuidAlreadyExists = rowsWithCuid.length !== 0;
    } while (cuidAlreadyExists);

    return cuid;
  }

  private async generateUniqueCuidShareableInviteCode({
    teamId,
  }: {
    teamId: string;
  }): Promise<string> {
    let cuidAlreadyExists: boolean;
    let cuid: string;
    do {
      cuid = createId();

      const rowsWithCuid = await db
        .select()
        .from(teams)
        .where(and(eq(teams.shareableInviteCode, cuid), eq(teams.id, teamId)));
      cuidAlreadyExists = rowsWithCuid.length !== 0;
    } while (cuidAlreadyExists);

    return cuid;
  }
}
