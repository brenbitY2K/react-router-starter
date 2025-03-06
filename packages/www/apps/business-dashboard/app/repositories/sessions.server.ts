import { sessions } from "@acme/database/schema";
import { type PgSelectBase } from "drizzle-orm/pg-core";
import { db } from "@acme/database";
import { eq, gt, and, desc, ne } from "drizzle-orm";
import { generateCreatedAtColumn } from "@acme/database/utils";
import { BaseRepository, type QueryResult } from "./index.js";

export type SessionSelectFields = (typeof sessions)["_"]["columns"];

export interface SessionMutable {
  createSession: (params: typeof sessions.$inferInsert) => Promise<void>;
  updateSession: ({
    id,
    data,
  }: {
    id: string;
    data: Partial<
      Omit<typeof sessions.$inferInsert, "id" | "createdAt" | "updatedAt">
    >;
  }) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  deleteAllSessionsExceptCurrent: (params: {
    currentSessionId: string;
    userId: string;
  }) => Promise<void>;
}

export interface SessionQueryable {
  querySession: <P extends Partial<SessionSelectFields>>(params: {
    id: string;
    projection: P;
  }) => Promise<QueryResult<P, SessionSelectFields> | undefined>;
  queryAllActiveSessions: <P extends Partial<SessionSelectFields>>(params: {
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, SessionSelectFields>[] | undefined>;
}

export class SessionRepository extends BaseRepository<
  SessionQueryable,
  SessionMutable
> {
  constructor() {
    super(new SessionQuerier(), new SessionMutator());
  }
}

export class SessionQuerier implements SessionQueryable {
  async querySession<P extends Partial<SessionSelectFields>>({
    id,
    projection,
  }: {
    id: string;
    projection: P;
  }) {
    const rows = (await db
      .select(projection)
      .from(sessions)
      .where(eq(sessions.id, id))
      .limit(1)) as Awaited<PgSelectBase<any, P, "single", any>>;

    if (!rows.length) {
      return undefined;
    }

    return rows[0];
  }
  async queryAllActiveSessions<P extends Partial<SessionSelectFields>>({
    userId,
    projection,
  }: {
    userId: string;
    projection: P;
  }) {
    const currentDate = new Date();
    const rows = (await db
      .select(projection)
      .from(sessions)
      .where(
        and(eq(sessions.userId, userId), gt(sessions.expiresAt, currentDate)),
      )
      .orderBy(desc(sessions.updatedAt))) as Awaited<
      PgSelectBase<any, P, "single", any>
    >;

    if (!rows.length) {
      return undefined;
    }
    return rows;
  }
}

export class SessionMutator implements SessionMutable {
  async createSession(data: typeof sessions.$inferInsert) {
    const { createdAt } = generateCreatedAtColumn();
    await db.insert(sessions).values({ ...data, createdAt });
  }

  async updateSession({
    id,
    data,
  }: {
    id: string;
    data: Partial<
      Omit<typeof sessions.$inferInsert, "id" | "createdAt" | "updatedAt">
    >;
  }) {
    await db.update(sessions).set(data).where(eq(sessions.id, id));
  }

  async deleteSession(id: string) {
    await db.delete(sessions).where(eq(sessions.id, id));
  }

  async deleteAllSessionsExceptCurrent({
    currentSessionId,
    userId,
  }: {
    currentSessionId: string;
    userId: string;
  }) {
    await db
      .delete(sessions)
      .where(
        and(eq(sessions.userId, userId), ne(sessions.id, currentSessionId)),
      );
  }
}
