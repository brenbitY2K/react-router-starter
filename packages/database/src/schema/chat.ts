import {
  pgTable,
  text,
  json,
  varchar,
  pgEnum,
  primaryKey,
  integer,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import type { InferSelectModel } from "drizzle-orm";
import { coreColumns, createdAtUpdatedAtColumns } from "./common.js";
import { customers, teams } from "./customers.js";

export const visibilityEnum = pgEnum("visibility", [
  "private",
  "unlisted",
  "team",
]);

export const projects = pgTable("project", {
  ...coreColumns(),
  name: text("name").notNull(),
  description: text("description"),
  context: json("context").$type<
    {
      role: "system" | "user";
      content: string;
    }[]
  >(),
  ownerId: varchar("owner_id", { length: 32 })
    .notNull()
    .references(() => customers.id),
  teamId: varchar("team_id", { length: 32 })
    .notNull()
    .references(() => teams.id),
  visibility: visibilityEnum("visibility").notNull().default("private"),
  icon: text("icon").notNull(),
});

export const chats = pgTable("chat", {
  ...coreColumns(),
  projectId: varchar("project_id").references(() => projects.id),
  title: text("title").notNull(),
  ownerId: varchar("owner_id", { length: 32 })
    .notNull()
    .references(() => customers.id),
  teamId: varchar("team_id", { length: 32 })
    .notNull()
    .references(() => teams.id),
  visibility: visibilityEnum("visibility").notNull().default("private"),
});

export const messages = pgTable("message", {
  ...coreColumns(),
  chatId: varchar("chat_id").references(() => chats.id),
  role: varchar("role").notNull(),
  content: json("content").notNull(),
});

export type Message = InferSelectModel<typeof messages>;

export const notes = pgTable("message_note", {
  ...coreColumns(),
  messageId: varchar("message_id").references(() => messages.id),
  content: text("content").notNull(),
});

export const documents = pgTable("document", {
  ...coreColumns(),
  kind: varchar("text", { enum: ["text", "sheet", "map"] })
    .notNull()
    .default("text"),
  projectId: varchar("project_id", { length: 32 }).references(
    () => projects.id,
  ),
  customerId: varchar("customer_id", { length: 32 })
    .notNull()
    .references(() => customers.id),
  teamId: varchar("team_id", { length: 32 })
    .notNull()
    .references(() => teams.id),
});

export const documentVersions = pgTable(
  "document_version",
  {
    ...coreColumns(),
    documentId: varchar("document_id")
      .notNull()
      .references(() => documents.id),
    versionNumber: integer("version_number").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    content: text("content").notNull(),
  },
  (table) => [
    uniqueIndex("document_version_idx").on(
      table.documentId,
      table.versionNumber,
    ),
  ],
);

export type Document = InferSelectModel<typeof documents>;
export type DocumentVersion = InferSelectModel<typeof documentVersions>;

export const projectShares = pgTable(
  "project_share",
  {
    ...createdAtUpdatedAtColumns(),
    projectId: varchar("project_id", { length: 32 })
      .notNull()
      .references(() => projects.id),
    customerId: varchar("customer_id", { length: 32 })
      .notNull()
      .references(() => customers.id),
  },
  (t) => [
    primaryKey({
      name: "composite_key",
      columns: [t.projectId, t.customerId],
    }),
  ],
);
