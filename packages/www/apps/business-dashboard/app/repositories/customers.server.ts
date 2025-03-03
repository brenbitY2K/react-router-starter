import { db } from "@acme/database";
import {
  customerFlowTrackers,
  teams,
  customers,
  customersToTeams,
  teamNotificationSettings,
} from "@acme/database/schema";
import { and, eq, inArray } from "drizzle-orm";
import { BaseRepository, type QueryResult } from "./index.js";
import { type PgSelectBase } from "drizzle-orm/pg-core";
import {
  type TeamSelectFields,
  type CustomerToTeamRelationSelectFields,
} from "./teams.server.js";
import { generateCoreColumns } from "@acme/database/utils";

export type CustomerSelectFields = (typeof customers)["_"]["columns"];
export type CustomerFlowTrackerFields =
  (typeof customerFlowTrackers)["_"]["columns"];
export type TeamNotificationSettings =
  (typeof teamNotificationSettings)["_"]["columns"];

export interface CustomerMutable {
  updateThemePreference: (params: {
    customerId: string;
    theme: string;
  }) => Promise<void>;
  updateJobRole: (params: {
    customerId: string;
    jobRole: string;
  }) => Promise<void>;
  updateActiveTeamId: (params: {
    teamId: string;
    customerId: string;
  }) => Promise<void>;
  updateFlowTracker: (params: {
    customerFlowTrackerId: string;
    data: Partial<typeof customerFlowTrackers.$inferInsert>;
  }) => Promise<void>;
  createCustomer: (
    params: Omit<
      typeof customers.$inferInsert,
      "id" | "createdAt" | "updatedAt"
    >,
  ) => Promise<string>;
  toggleTeamNotificationSettings: (params: {
    enabled: boolean;
    notificationIds: string[];
    teamId: string;
    customerId: string;
  }) => Promise<void>;
  createTeamNotificationSettings: (params: {
    notificationIds: string[];
    teamId: string;
    customerId: string;
    enabled?: boolean;
  }) => Promise<void>;
  setHasUsedTrialStatus: (params: {
    value: boolean;
    customerIds: string[];
  }) => Promise<void>;
}

export interface CustomerQueryable {
  queryCustomer: <P extends Partial<CustomerSelectFields>>(params: {
    customerId: string;
    projection: P;
  }) => Promise<QueryResult<P, CustomerSelectFields> | undefined>;
  queryCustomerByUserId: <P extends Partial<CustomerSelectFields>>(params: {
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, CustomerSelectFields> | undefined>;
  queryCustomerFlowTracker: <
    P extends Partial<CustomerFlowTrackerFields>,
  >(params: {
    customerId: string;
    projection: P;
  }) => Promise<QueryResult<P, CustomerFlowTrackerFields> | undefined>;
  queryTeams: <
    PCustomerToTeamSelectFields extends
      Partial<CustomerToTeamRelationSelectFields>,
    PTeamSelectFields extends Partial<TeamSelectFields>,
  >(params: {
    customerId: string;
    teamProjection: PTeamSelectFields;
    customerToTeamsProjection: PCustomerToTeamSelectFields;
  }) => Promise<
    | {
        customer_to_customer_teams: QueryResult<
          PCustomerToTeamSelectFields,
          CustomerToTeamRelationSelectFields
        >;
        customer_team: QueryResult<PTeamSelectFields, TeamSelectFields>;
      }[]
    | undefined
  >;
  queryTeamNotificationSettings: <
    P extends Partial<TeamNotificationSettings>,
  >(params: {
    teamId: string;
    customerId: string;
    projection: P;
  }) => Promise<QueryResult<P, TeamNotificationSettings>[] | undefined>;
}

export class CustomerRepository extends BaseRepository<
  CustomerQueryable,
  CustomerMutable
> {
  constructor() {
    super(new CustomerQuerier(), new CustomerMutator());
  }
}

export class CustomerQuerier implements CustomerQueryable {
  async queryCustomer<P extends Partial<CustomerSelectFields>>({
    customerId,
    projection,
  }: {
    customerId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(customers)
      .where(eq(customers.id, customerId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryCustomerByUserId<P extends Partial<CustomerSelectFields>>({
    userId,
    projection,
  }: {
    userId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(customers)
      .where(eq(customers.userId, userId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryTeams<
    PCustomerToTeamSelectFields extends
      Partial<CustomerToTeamRelationSelectFields>,
    PTeamSelectFields extends Partial<TeamSelectFields>,
  >({
    customerId,
    teamProjection,
    customerToTeamsProjection,
  }: {
    customerId: string;
    teamProjection: PTeamSelectFields;
    customerToTeamsProjection: PCustomerToTeamSelectFields;
  }) {
    return await db
      .select({
        customer_team: teamProjection,
        customer_to_customer_teams: customerToTeamsProjection,
      })
      .from(customersToTeams)
      .innerJoin(teams, eq(customersToTeams.teamId, teams.id))
      .where(eq(customersToTeams.customerId, customerId));
  }

  async queryCustomerFlowTracker<P extends Partial<CustomerFlowTrackerFields>>({
    customerId,
    projection,
  }: {
    customerId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(customerFlowTrackers)
      .where(eq(customerFlowTrackers.customerId, customerId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryTeamNotificationSettings<
    P extends Partial<TeamNotificationSettings>,
  >({
    customerId,
    teamId,
    projection,
  }: {
    teamId: string;
    customerId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(teamNotificationSettings)
      .where(
        and(
          eq(teamNotificationSettings.teamId, teamId),
          eq(teamNotificationSettings.customerId, customerId),
        ),
      )) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows;
  }
}

export class CustomerMutator implements CustomerMutable {
  async createCustomer(
    data: Omit<typeof customers.$inferInsert, "id" | "createdAt" | "updatedAt">,
  ) {
    const coreCustomerColumns = await generateCoreColumns(customers);
    await db
      .insert(customers)
      .values({ ...coreCustomerColumns, activeTheme: "light", ...data });

    const coreFlowTrackerColumns =
      await generateCoreColumns(customerFlowTrackers);
    await db.insert(customerFlowTrackers).values({
      ...coreFlowTrackerColumns,
      customerId: coreCustomerColumns.id,
    });

    return coreCustomerColumns.id;
  }

  async updateThemePreference({
    theme,
    customerId,
  }: {
    theme: string;
    customerId: string;
  }) {
    await db
      .update(customers)
      .set({ activeTheme: theme })
      .where(eq(customers.id, customerId));
  }

  async updateJobRole({
    jobRole,
    customerId,
  }: {
    jobRole: string;
    customerId: string;
  }) {
    await db
      .update(customers)
      .set({ jobRole })
      .where(eq(customers.id, customerId));
  }

  async updateActiveTeamId({
    teamId,
    customerId,
  }: {
    teamId: string;
    customerId: string;
  }) {
    await db
      .update(customers)
      .set({ activeTeamId: teamId })
      .where(eq(customers.id, customerId));
  }

  async updateFlowTracker({
    customerFlowTrackerId,
    data,
  }: {
    customerFlowTrackerId: string;
    data: Partial<typeof customerFlowTrackers.$inferInsert>;
  }) {
    await db
      .update(customerFlowTrackers)
      .set({ ...data })
      .where(eq(customerFlowTrackers.id, customerFlowTrackerId));
  }

  async toggleTeamNotificationSettings({
    enabled,
    notificationIds,
    customerId,
    teamId,
  }: {
    enabled: boolean;
    notificationIds: string[];
    customerId: string;
    teamId: string;
  }) {
    await db
      .update(teamNotificationSettings)
      .set({ emailEnabled: enabled })
      .where(
        and(
          eq(teamNotificationSettings.customerId, customerId),
          eq(teamNotificationSettings.teamId, teamId),
          inArray(teamNotificationSettings.notificationId, notificationIds),
        ),
      );
  }

  async createTeamNotificationSettings({
    enabled = true,
    notificationIds,
    customerId,
    teamId,
  }: {
    enabled?: boolean;
    notificationIds: string[];
    customerId: string;
    teamId: string;
  }) {
    const valuesToInsert = await Promise.all(
      notificationIds.map(async (settingId) => ({
        ...(await generateCoreColumns(teamNotificationSettings)),
        emailEnabled: enabled,
        customerId,
        teamId,
        notificationId: settingId,
      })),
    );

    await db.insert(teamNotificationSettings).values(valuesToInsert);
  }

  async setHasUsedTrialStatus({
    value,
    customerIds,
  }: {
    value: boolean;
    customerIds: string[];
  }) {
    await db
      .update(customers)
      .set({ hasUsedTrial: value })
      .where(inArray(customers.id, customerIds));
  }
}
