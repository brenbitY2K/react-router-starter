import { defineConfig } from "drizzle-kit";

/* eslint-disable import/no-default-export --
 *  Default export needed to fit Drizzle requirements
 */
export default defineConfig({
  schema: "./dist/schema",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "",
  },
});
