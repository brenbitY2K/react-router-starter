import { faker } from "@faker-js/faker";
import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import "dotenv/config";
import { createId } from "@paralleldrive/cuid2";
import {
  teamEmailInvites,
  teams,
  customers,
  customersToTeams,
  sessions,
  users,
} from "../schema/index.js";

const queryClient = postgres(process.env.DATABASE_URL ?? "");

const db: PostgresJsDatabase = drizzle(queryClient, {
  logger: true,
});

type CustomerToBeInserted = typeof customers.$inferInsert;
type UserToBeInserted = typeof users.$inferInsert;

const generateCustomerAndUserRows = (count: number) => {
  const customerRows: CustomerToBeInserted[] = [];
  const userRows: UserToBeInserted[] = [];

  for (let i = 0; i < count; i++) {
    const userId = createId();

    userRows.push({
      id: userId,
      email: faker.internet.email(),
      name: faker.person.fullName(),
    });

    customerRows.push({
      id: createId(),
      userId,
      activeTheme: "dark",
    });
  }

  return { customerRows, userRows };
};

type TeamsToBeInserted = typeof teams.$inferInsert;
const generateTeams = (count: number): TeamsToBeInserted[] => {
  const rows: TeamsToBeInserted[] = [];

  for (let i = 0; i < count; i++) {
    rows.push({
      id: createId(),
      name: faker.company.name(),
      slug: faker.company.name().toLowerCase().split(" ").join("-"),
    });
  }

  return rows;
};

type CustomerOwnersToBeInserted = typeof customersToTeams.$inferInsert;

const generateCustomerOwners = (
  newCustomers: CustomerToBeInserted[],
  newTeams: TeamsToBeInserted[],
): CustomerOwnersToBeInserted[] => {
  const rows: CustomerOwnersToBeInserted[] = [];

  for (let i = 0; i < newTeams.length; i++) {
    if (newTeams[i] === undefined) break;

    rows.push({
      customerId: newCustomers[i].id,
      teamId: newTeams[i].id,
      role: "owner",
    });
  }

  return rows;
};

async function seed() {
  console.log("Seeding...");

  // rowsbase teardown
  await db.delete(customersToTeams);
  await db.delete(teamEmailInvites);
  await db.delete(teams);
  await db.delete(customers);
  await db.delete(sessions);
  await db.delete(users);

  const { customerRows, userRows } = generateCustomerAndUserRows(2);
  await db.insert(users).values(userRows).returning();
  await db.insert(customers).values(customerRows).returning();

  const newTeams = generateTeams(1);
  await db.insert(teams).values(newTeams).returning();

  const newCustomerToTeams = generateCustomerOwners(customerRows, newTeams);
  await db.insert(customersToTeams).values(newCustomerToTeams);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("Seeding done!");
    process.exit(0);
  });
