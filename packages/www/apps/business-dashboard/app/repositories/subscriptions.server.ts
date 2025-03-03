import { BaseRepository, type QueryResult } from "./index.js";
import { db } from "@acme/database";
import { seatChangeHistory, subscriptions } from "@acme/database/schema";
import { eq } from "drizzle-orm";
import { type PgSelectBase } from "drizzle-orm/pg-core";
import { generateCoreColumns } from "@acme/database/utils";

export type SubscriptionSelectFields = (typeof subscriptions)["_"]["columns"];

export interface SubscriptionMutable {
  createOrUpdateSubscription(
    data: Omit<
      typeof subscriptions.$inferInsert,
      "id" | "createdAt" | "updatedAt"
    >,
  ): Promise<string>;
  updateSubscription: (params: {
    teamId: string;
    data: Partial<
      Pick<typeof subscriptions.$inferInsert, "quantity" | "currentPeriodSeats">
    >;
  }) => Promise<void>;
  deleteSubscription: ({
    stripeSubscriptionId,
  }: {
    stripeSubscriptionId: string;
  }) => Promise<void>;
  recordSeatChange: (params: {
    teamId: string;
    previousCount: number;
    newCount: number;
  }) => Promise<void>;
}

export interface SubscriptionQueryable {
  querySubscription: <P extends Partial<SubscriptionSelectFields>>(params: {
    teamId: string;
    projection: P;
  }) => Promise<QueryResult<P, SubscriptionSelectFields> | undefined>;
  querySubscriptionByStripeSubscriptionId: <
    P extends Partial<SubscriptionSelectFields>,
  >(params: {
    stripeSubscriptionId: string;
    projection: P;
  }) => Promise<QueryResult<P, SubscriptionSelectFields> | undefined>;
}

export class SubscriptionRepository extends BaseRepository<
  SubscriptionQueryable,
  SubscriptionMutable
> {
  constructor() {
    super(new SubscriptionQuerier(), new SubscriptionMutator());
  }
}

export class SubscriptionQuerier implements SubscriptionQueryable {
  async querySubscription<P extends Partial<SubscriptionSelectFields>>({
    teamId,
    projection,
  }: {
    teamId: string;
    projection: P;
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

  async querySubscriptionByStripeSubscriptionId<
    P extends Partial<SubscriptionSelectFields>,
  >({
    stripeSubscriptionId,
    projection,
  }: {
    stripeSubscriptionId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }
}

export class SubscriptionMutator implements SubscriptionMutable {
  async createOrUpdateSubscription(
    data: Omit<
      typeof subscriptions.$inferInsert,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    const coreColumns = await generateCoreColumns(subscriptions);

    await db
      .insert(subscriptions)
      .values({
        ...coreColumns,
        ...data,
      })
      .onConflictDoUpdate({
        target: subscriptions.stripeSubscriptionId,
        set: {
          ...data,
        },
      });

    return coreColumns.id;
  }

  async updateSubscription({
    teamId,
    data,
  }: {
    teamId: string;
    data: Partial<Pick<typeof subscriptions.$inferInsert, "quantity">>;
  }) {
    await db
      .update(subscriptions)
      .set({
        ...data,
      })
      .where(eq(subscriptions.teamId, teamId));
  }

  async recordSeatChange({
    teamId,
    previousCount,
    newCount,
  }: {
    teamId: string;
    previousCount: number;
    newCount: number;
  }) {
    const coreColumns = await generateCoreColumns(seatChangeHistory);
    await db.insert(seatChangeHistory).values({
      ...coreColumns,
      teamId,
      newCount,
      previousCount,
    });
  }

  async deleteSubscription({
    stripeSubscriptionId,
  }: {
    stripeSubscriptionId: string;
  }) {
    await db
      .delete(subscriptions)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscriptionId));
  }
}
