import { relations } from "drizzle-orm";
import {
  customers,
  customersToTeams,
  subscriptions,
  teams,
} from "./customers.js";

export const customerRelations = relations(customers, ({ many, one }) => ({
  customerToGroups: many(customersToTeams),
  activeTeam: one(teams, {
    fields: [customers.activeTeamId],
    references: [teams.id],
  }),
}));

export const teamRelations = relations(teams, ({ many }) => ({
  teamToCustomers: many(customersToTeams),
}));

export const subscriptionRelations = relations(subscriptions, ({ one }) => ({
  team: one(teams, {
    fields: [subscriptions.teamId],
    references: [teams.id],
  }),
}));
