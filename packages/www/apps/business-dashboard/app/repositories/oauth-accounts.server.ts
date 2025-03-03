import { BaseRepository, type QueryResult } from "./index.js";
import { oauthAccounts } from "@acme/database/schema";
import { type PgSelectBase } from "drizzle-orm/pg-core";
import { db } from "@acme/database";
import { eq, and } from "drizzle-orm";
import { generateCreatedAtColumn } from "@acme/database/utils";

export type OAuthAccountSelectFields = (typeof oauthAccounts)["_"]["columns"];

export interface OAuthAccountMutable {
  createOAuthAccount: (
    params: Omit<
      typeof oauthAccounts.$inferInsert,
      "id" | "createdAt" | "updatedAt"
    >,
  ) => Promise<void>;
}

export interface OAuthAccountQueryable {
  queryOAuthAccount: <P extends Partial<OAuthAccountSelectFields>>(params: {
    providerId: string;
    providerUserId: string;
    projection: P;
  }) => Promise<QueryResult<P, OAuthAccountSelectFields> | undefined>;
  queryOAuthAccountsByUserId: <
    P extends Partial<OAuthAccountSelectFields>,
  >(params: {
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, OAuthAccountSelectFields>[] | undefined>;
}

export class OAuthAccountRepository extends BaseRepository<
  OAuthAccountQueryable,
  OAuthAccountMutable
> {
  constructor() {
    super(new OAuthAccountQuerier(), new OAuthAccountMutator());
  }
}

export class OAuthAccountQuerier implements OAuthAccountQueryable {
  async queryOAuthAccount<P extends Partial<OAuthAccountSelectFields>>({
    providerId,
    providerUserId,
    projection,
  }: {
    providerId: string;
    providerUserId: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(oauthAccounts)
      .where(
        and(
          eq(oauthAccounts.providerId, providerId),
          eq(oauthAccounts.providerUserId, providerUserId),
        ),
      )
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryOAuthAccountsByUserId<
    P extends Partial<OAuthAccountSelectFields>,
  >({ userId, projection }: { userId: string; projection: P }) {
    const rows = (await db
      .select(projection)
      .from(oauthAccounts)
      .where(eq(oauthAccounts.userId, userId))) as Awaited<
        PgSelectBase<any, P, "single", any>
      >;

    if (!rows.length) {
      return undefined;
    }

    return rows;
  }
}
export class OAuthAccountMutator implements OAuthAccountMutable {
  async createOAuthAccount(
    data: Omit<
      typeof oauthAccounts.$inferInsert,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    const { createdAt } = generateCreatedAtColumn();
    await db.insert(oauthAccounts).values({ ...createdAt, ...data });
  }
}
