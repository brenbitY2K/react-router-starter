import {
  pgTable,
  primaryKey,
  text,
  timestamp,
  varchar,
  unique,
  numeric,
} from "drizzle-orm/pg-core";
import { coreColumns } from "./common.js";

export const users = pgTable("user_account", {
  ...coreColumns(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  imageUrl: text("image_url"),
  username: varchar("username", { length: 255 }).unique(),
});

export const sessions = pgTable("session", {
  ...coreColumns(),
  userId: varchar("user_id", { length: 32 })
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp("expires_at", {
    withTimezone: true,
    mode: "date",
  }).notNull(),
  ip: varchar("ip", { length: 50 }),
  ipCity: varchar("ip_city", { length: 255 }),
  ipCountryCode: varchar("ip_country_code", { length: 10 }),
  ipCountryName: varchar("ip_country_name", { length: 100 }),
  ipRegionCode: varchar("ip_region_code", { length: 255 }),
  ipRegionName: varchar("ip_region_name", { length: 255 }),
  ipLatitude: numeric("ip_latitude"),
  ipLongitude: numeric("ip_longitude"),
  userAgentOS: varchar("user_agent_os", { length: 100 }),
  userAgentBrowser: varchar("user_agent_browser", { length: 100 }),
});

export const oauthAccounts = pgTable(
  "oauth_account",
  {
    providerId: text("provider_id").notNull(),
    providerUserId: text("provider_user_id").notNull(),
    providerEmail: text("provider_email").notNull(),
    userId: varchar("user_id", { length: 32 })
      .notNull()
      .references(() => users.id),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.providerId, t.providerUserId] }),
    unique: unique().on(t.providerId, t.userId),
  }),
);

export const emailOTPs = pgTable(
  "email_otp",
  {
    ...coreColumns(),
    email: varchar("email", { length: 255 }).notNull(),
    code: varchar("code", { length: 100 }).notNull(),
  },
  (t) => ({
    unique: unique().on(t.email, t.code),
  }),
);

export const emailOTPsForEmailChange = pgTable("email_otp_for_email_change", {
  ...coreColumns(),
  emailToChangeTo: varchar("email_to_change_to", { length: 255 }).notNull(),
  userId: varchar("user_id", { length: 32 })
    .notNull()
    .references(() => users.id)
    .unique(),
  code: varchar("code", { length: 100 }).notNull(),
});
