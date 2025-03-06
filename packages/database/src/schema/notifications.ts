import { pgTable, varchar, boolean, foreignKey } from "drizzle-orm/pg-core";
import { coreColumns } from "./common.js";
import { customersToTeams } from "./customers.js";

export const teamNotificationSettings = pgTable(
  "team_notification_setting",
  {
    ...coreColumns(),
    customerId: varchar("customer_id", { length: 32 }).notNull(),
    teamId: varchar("team_id", { length: 32 }).notNull(),
    notificationId: varchar("notification_id", { length: 255 }).notNull(),
    emailEnabled: boolean("email_enabled").notNull().default(true),
  },
  (table) => ({
    customerToTeamFk: foreignKey({
      columns: [table.customerId, table.teamId],
      foreignColumns: [customersToTeams.customerId, customersToTeams.teamId],
    }).onDelete("cascade"),
  }),
);
