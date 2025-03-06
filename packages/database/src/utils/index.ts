import { createId } from "@paralleldrive/cuid2";
import { eq } from "drizzle-orm";
import { db } from "../index.js";

/* eslint-disable-next-line @typescript-eslint/no-explicit-any --
    I'm not sure how to properly type this */
export async function generateUniqueCuidForTable(table: any): Promise<string> {
  let cuidAlreadyExists: boolean;
  let cuid: string;
  do {
    cuid = createId();

    const rowsWithCuid = await db
      .select()
      .from(table)
      /* eslint-disable-next-line @typescript-eslint/no-unsafe-member-access --
          I'm not sure how to properly type this */
      .where(eq(table.id, cuid));
    cuidAlreadyExists = rowsWithCuid.length !== 0;
  } while (cuidAlreadyExists);

  return cuid;
}

/* eslint-disable-next-line @typescript-eslint/no-explicit-any --
    I'm not sure how to properly type this */
export async function generateCoreColumns(table: any) {
  const id = await generateUniqueCuidForTable(table);
  return {
    createdAt: new Date(),
    id,
  };
}

export function generateCreatedAtColumn() {
  return {
    createdAt: new Date(),
  };
}
