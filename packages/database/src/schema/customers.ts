import {
  pgEnum,
  pgTable,
  primaryKey,
  text,
  varchar,
  boolean,
  timestamp,
  integer,
} from "drizzle-orm/pg-core";
import { coreColumns, createdAtUpdatedAtColumns } from "./common.js";
import { users } from "./auth.js";

export const customerRoleEnum = pgEnum("customer_role", [
  "owner",
  "admin",
  "member",
]);

export const customers = pgTable("customer", {
  ...coreColumns(),
  userId: varchar("user_id", { length: 32 })
    .notNull()
    .references(() => users.id),
  hasUsedTrial: boolean("has_used_trial").default(false),
  activeTheme: varchar("active_theme", { length: 100 }).default("light"),
  jobRole: varchar("job_role", { length: 100 }),
  activeTeamId: varchar("active_team_id", { length: 32 }),
});

export const customerFlowTrackers = pgTable("customer_flow_tracker", {
  ...coreColumns(),
  customerId: varchar("customer_id", { length: 32 })
    .notNull()
    .unique()
    .references(() => customers.id),
  hasCompletedWelcomeFlow: boolean("has_completed_welcome_flow").default(false),
});

export const teams = pgTable("team", {
  ...coreColumns(),
  name: varchar("name", { length: 150 }).notNull(),
  slug: varchar("slug", { length: 200 }).notNull().unique(),
  imageUrl: text("image_url"),
  stripeCustomerId: varchar("stripe_customer_id", { length: 100 }).unique(),
  shareableInviteCode: varchar("shareable_invite_code", { length: 32 }),
});

export const customersToTeams = pgTable(
  "customer_to_team",
  {
    ...createdAtUpdatedAtColumns(),
    customerId: varchar("customer_id", { length: 32 })
      .notNull()
      .references(() => customers.id),
    teamId: varchar("team_id", { length: 32 })
      .notNull()
      .references(() => teams.id),
    role: customerRoleEnum("role").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.customerId, t.teamId] }),
  }),
);

export const teamEmailInvites = pgTable("team_email_invite", {
  ...createdAtUpdatedAtColumns(),
  code: varchar("code", { length: 32 }).notNull().primaryKey(),
  email: varchar("email", { length: 250 }).notNull(),
  role: customerRoleEnum("role").notNull(),
  teamId: varchar("team_id", { length: 32 })
    .notNull()
    .references(() => teams.id),
});

export const subscriptions = pgTable("subscription", {
  ...coreColumns(),
  teamId: varchar("team_id", { length: 32 })
    .notNull()
    .references(() => teams.id)
    .unique(),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 100 })
    .notNull()
    .unique(),
  status: varchar("status", { length: 50 }).notNull(),
  productId: varchar("product_id", { length: 100 }).notNull(),
  priceId: varchar("price_id", { length: 100 }).notNull(),
  subscriptionItemId: varchar("subscription_item_id", {
    length: 100,
  }).notNull(),
  currentPeriodEnd: timestamp("current_period_end").notNull(),
  billingInterval: varchar("billing_interval", { length: 24 }).notNull(),
  quantity: integer("quantity").notNull().default(1),
  currentPeriodSeats: integer("current_period_seats").notNull().default(1),
});

export const seatChangeHistory = pgTable("seat_change_history", {
  ...coreColumns(),
  teamId: varchar("team_id", { length: 32 })
    .notNull()
    .references(() => teams.id),
  newCount: integer("new_count").notNull(),
  previousCount: integer("previous_count").notNull(),
});
