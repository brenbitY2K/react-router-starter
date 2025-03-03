import { timestamp, varchar } from "drizzle-orm/pg-core";

export function createdAtUpdatedAtColumns() {
  return {
    createdAt: timestamp("created_at", { mode: "date", precision: 3 })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "date",
      precision: 3,
    }).$onUpdate(() => new Date()),
  };
}

export function coreColumns() {
  return {
    ...createdAtUpdatedAtColumns(),
    id: varchar("id", {
      length: 32,
    }).primaryKey(),
  };
}
