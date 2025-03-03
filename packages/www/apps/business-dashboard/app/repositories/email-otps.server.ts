import { BaseRepository, type QueryResult } from "./index.js";
import { db } from "@acme/database";
import { emailOTPs, emailOTPsForEmailChange } from "@acme/database/schema";
import { and, eq } from "drizzle-orm";
import { type PgSelectBase } from "drizzle-orm/pg-core";
import { generateUniqueCuidForTable } from "@acme/database/utils";

export type EmailOTPSelectFields = (typeof emailOTPs)["_"]["columns"];
export type EmailOTPForEmailChangeSelectFields =
  (typeof emailOTPsForEmailChange)["_"]["columns"];

export interface EmailOTPMutable {
  createLoginOTP(
    data: Omit<typeof emailOTPs.$inferInsert, "id" | "createdAt" | "updatedAt">,
  ): Promise<string>;
  createEmailChangeOTP(
    data: Omit<
      typeof emailOTPsForEmailChange.$inferInsert,
      "id" | "createdAt" | "updatedAt"
    >,
  ): Promise<string>;
  deleteAllLoginOTPsForEmail(email: string): Promise<void>;
  deleteEmailChangeOTPForUserId(userId: string): Promise<void>;
}

export interface EmailOTPQueryable {
  queryEmailOTPForLogin: <P extends Partial<EmailOTPSelectFields>>(params: {
    email: string;
    code: string;
    projection: P;
  }) => Promise<QueryResult<P, EmailOTPSelectFields> | undefined>;
  queryEmailOTPForEmailChange: <
    P extends Partial<EmailOTPForEmailChangeSelectFields>,
  >(params: {
    code: string;
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, EmailOTPForEmailChangeSelectFields> | undefined>;
  queryEmailOTPForEmailChangeByUserId: <
    P extends Partial<EmailOTPForEmailChangeSelectFields>,
  >(params: {
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, EmailOTPForEmailChangeSelectFields> | undefined>;
}

export class EmailOTPRepository extends BaseRepository<
  EmailOTPQueryable,
  EmailOTPMutable
> {
  constructor() {
    super(new EmailOTPQuerier(), new EmailOTPMutator());
  }
}

export class EmailOTPQuerier implements EmailOTPQueryable {
  async queryEmailOTPForLogin<P extends Partial<EmailOTPSelectFields>>({
    email,
    code,
    projection,
  }: {
    email: string;
    code: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(emailOTPs)
      .where(and(eq(emailOTPs.code, code), eq(emailOTPs.email, email)))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryEmailOTPForEmailChange<
    P extends Partial<EmailOTPForEmailChangeSelectFields>,
  >({
    userId,
    code,
    projection,
  }: {
    userId: string;
    code: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(emailOTPsForEmailChange)
      .where(
        and(
          eq(emailOTPsForEmailChange.code, code),
          eq(emailOTPsForEmailChange.userId, userId),
        ),
      )
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }

  async queryEmailOTPForEmailChangeByUserId<
    P extends Partial<EmailOTPForEmailChangeSelectFields>,
  >({ userId, projection }: { userId: string; projection: P }) {
    const rows = (await db
      .select(projection)
      .from(emailOTPsForEmailChange)
      .where(eq(emailOTPsForEmailChange.userId, userId))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }
}

export class EmailOTPMutator implements EmailOTPMutable {
  async createLoginOTP(
    data: Omit<typeof emailOTPs.$inferInsert, "id" | "createdAt" | "updatedAt">,
  ) {
    const id = await generateUniqueCuidForTable(emailOTPs);

    await db.insert(emailOTPs).values({ id, ...data });

    return id;
  }

  async createEmailChangeOTP(
    data: Omit<
      typeof emailOTPsForEmailChange.$inferInsert,
      "id" | "createdAt" | "updatedAt"
    >,
  ) {
    const id = await generateUniqueCuidForTable(emailOTPsForEmailChange);

    await db.insert(emailOTPsForEmailChange).values({ id, ...data });

    return id;
  }

  async deleteAllLoginOTPsForEmail(email: string) {
    await db.delete(emailOTPs).where(eq(emailOTPs.email, email));
  }

  async deleteEmailChangeOTPForUserId(userId: string) {
    await db
      .delete(emailOTPsForEmailChange)
      .where(eq(emailOTPsForEmailChange.userId, userId));
  }
}
