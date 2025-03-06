import { type SelectResultField } from "drizzle-orm/query-builders/select.types";

export abstract class BaseRepository<Querier, Mutator> {
  protected querier: Querier;
  protected mutator: Mutator;

  constructor(querier: Querier, mutator: Mutator) {
    this.querier = querier;
    this.mutator = mutator;
  }

  getQuerier(): Querier {
    return this.querier;
  }

  getMutator(): Mutator {
    return this.mutator;
  }
}

export abstract class BaseRepositoryFactory<Repository, InsertData> {
  abstract create(data: InsertData): Promise<Repository>;
}

export type QueryResult<P extends Partial<F>, F> = {
  [K in keyof {
    [Key in keyof P & string]: SelectResultField<P[Key], true>;
  }]: { [Key in keyof P & string]: SelectResultField<P[Key], true> }[K];
};
