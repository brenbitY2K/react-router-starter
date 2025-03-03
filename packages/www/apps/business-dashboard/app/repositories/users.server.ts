import { BaseRepository, type QueryResult } from "./index.js";
import {
  oauthAccounts,
  customers,
  customersToTeams,
  teams,
  users,
} from "@acme/database/schema";
import { type PgSelectBase } from "drizzle-orm/pg-core";
import { db } from "@acme/database";
import { and, eq, inArray } from "drizzle-orm";
import { generateCoreColumns } from "@acme/database/utils";

export type UserSelectFields = (typeof users)["_"]["columns"];
export type CustomerSelectFields = (typeof customers)["_"]["columns"];
export type OAuthAccountSelectFields = (typeof oauthAccounts)["_"]["columns"];

export interface UserMutable {
  createUser: (
    params: Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
  updateEmail: (params: {
    userId: string;
    email: (typeof users.$inferInsert)["email"];
  }) => Promise<void>;
  updateCoreProfileInfo: (params: {
    userId: string;
    data: Partial<
      Pick<typeof users.$inferInsert, "name" | "username" | "imageUrl">
    >;
  }) => Promise<void>;
  deleteOAuthAccount: (params: {
    providerId: string;
    userId: string;
  }) => Promise<void>;
}

export interface UserQueryable {
  queryUser: <P extends Partial<UserSelectFields>>(params: {
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, UserSelectFields> | undefined>;
  queryUserWithEmail: <P extends Partial<UserSelectFields>>(params: {
    email: string;
    projection: P;
  }) => Promise<QueryResult<P, UserSelectFields> | undefined>;
  queryOAuthAccounts: <P extends Partial<OAuthAccountSelectFields>>(params: {
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, OAuthAccountSelectFields>[]>;
  queryTeamsForCustomerUserIds: (userIds: string[]) => Promise<
    {
      customerId: string;
      email: string;
      userId: string;
      team: {
        name: string;
        id: string;
        slug: string;
        imageUrl: string | null;
      };
    }[]
  >;
  queryCustomersByUserIds: <
    PUserSelectFields extends Partial<UserSelectFields>,
    PCustomerSelectFields extends Partial<CustomerSelectFields>,
  >(params: {
    userIds: string[];
    userProjection: PUserSelectFields;
    customerProjection: PCustomerSelectFields;
  }) => Promise<
    {
      customer: QueryResult<PCustomerSelectFields, CustomerSelectFields>;
      user: QueryResult<PUserSelectFields, UserSelectFields>;
    }[]
  >;
}

export class UserRepository extends BaseRepository<UserQueryable, UserMutable> {
  constructor() {
    super(new UserQuerier(), new UserMutator());
  }
}

export class UserQuerier implements UserQueryable {
  async queryUser<P extends Partial<UserSelectFields>>({
    userId,
    projection,
  }: {
    userId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryUserWithEmail<P extends Partial<UserSelectFields>>({
    email,
    projection,
  }: {
    email: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(users)
      .where(eq(users.email, email))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryOAuthAccounts<P extends Partial<OAuthAccountSelectFields>>({
    userId,
    projection,
  }: {
    userId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, userId))) as Awaited<
      PgSelectBase<any, P, "single", any>
    >;

    return rows;
  }

  async queryTeamsForCustomerUserIds(userIds: string[]) {
    return await db
      .select({
        customerId: customers.id,
        email: users.email,
        userId: users.id,
        team: {
          name: teams.name,
          slug: teams.slug,
          id: teams.id,
          imageUrl: teams.imageUrl,
        },
      })
      .from(users)
      .innerJoin(customers, eq(customers.userId, users.id))
      .innerJoin(
        customersToTeams,
        eq(customersToTeams.customerId, customers.id),
      )
      .innerJoin(teams, eq(teams.id, customersToTeams.teamId))
      .where(inArray(users.id, userIds));
  }

  async queryCustomersByUserIds<
    PUserSelectFields extends Partial<UserSelectFields>,
    PCustomerSelectFields extends Partial<CustomerSelectFields>,
  >({
    userIds,
    userProjection,
    customerProjection,
  }: {
    userIds: string[];
    userProjection: PUserSelectFields;
    customerProjection: PCustomerSelectFields;
  }) {
    return db
      .select({ user: userProjection, customer: customerProjection })
      .from(users)
      .innerJoin(customers, eq(customers.userId, users.id))
      .where(inArray(users.id, userIds));
  }
}

export class UserMutator implements UserMutable {
  async createUser({
    name,
    email,
  }: Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">) {
    const coreColumns = await generateCoreColumns(users);
    await db.insert(users).values({ ...coreColumns, email, name });

    return coreColumns.id;
  }

  async updateEmail({
    userId,
    email,
  }: {
    userId: string;
    email: (typeof users.$inferInsert)["email"];
  }) {
    await db.update(users).set({ email }).where(eq(users.id, userId));
  }

  async updateCoreProfileInfo({
    userId,
    data,
  }: {
    userId: string;
    data: Partial<
      Pick<typeof users.$inferInsert, "name" | "username" | "imageUrl">
    >;
  }) {
    await db
      .update(users)
      .set({ ...data })
      .where(eq(users.id, userId));
  }

  async deleteOAuthAccount({
    providerId,
    userId,
  }: {
    providerId: string;
    userId: string;
  }) {
    await db
      .delete(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.providerId, providerId),
          eq(oauthAccounts.userId, userId),
        ),
      );
  }
}
