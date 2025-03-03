# Repository Mocking Methodology

## Overview

This document outlines our approach to mocking repository classes for unit testing. Our methodology allows for flexible, reusable, and type-safe mocks that can be easily customized for different test scenarios.

## Key Principles

1. **Separation of Concerns**: We separate mocks for queries and mutations.
2. **Type Safety**: We use TypeScript to ensure type consistency between mocks and actual implementations.
3. **Flexibility**: Our mocks allow for easy customization of return values.
4. **Default Behavior**: We provide sensible defaults while allowing overrides.
5. **Deep Partial Mocking**: We allow partial mocking of nested structures.

## Structure

For each repository, we typically create three files:

1. `data.server.ts`: Contains mock data generators.
2. `queries.server.ts`: Contains mock implementations for query methods.
3. `mutations.server.ts`: Contains mock implementations for mutation methods.

## Mock Data Generation

In `data.server.ts`, we define functions that generate mock data for each entity. These functions should mirror the structure of our database tables.

### Example: Drizzle Table Definition

First, let's look at an example of a Drizzle table definition:

```typescript
import { pgTable, varchar, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user_account", {
  id: varchar("id", { length: 32 }).primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  imageUrl: varchar("image_url", { length: 255 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});
```

### Example: Mock Full Select Function

Now, let's create a mock function that generates data matching this table structure:

```typescript
import { generateMockCuid } from "../utils.js";

export function mockedUserFullSelect() {
  return {
    id: generateMockCuid(),
    name: "John Doe",
    email: "john.doe@example.com",
    imageUrl: "https://example.com/john-doe.jpg",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function mockedMultipleUsers(count: number = 3) {
  return Array.from({ length: count }, (_, index) => ({
    ...mockedUserFullSelect(),
    name: `User ${index + 1}`,
    email: `user${index + 1}@example.com`,
  }));
}
```

### Multiple Data Mocks for a Single Repository

A repository might interact with multiple related tables. In such cases, we need to create mock data functions for each table the repository accesses.
For example, consider a UserRepository that interacts with both users and userProfiles tables:

```typescript
// Additional table definition
export const userProfiles = pgTable("user_profile", {
  id: varchar("id", { length: 32 }).primaryKey(),
  userId: varchar("user_id", { length: 32 }).references(() => users.id),
  bio: varchar("bio", { length: 500 }),
  birthDate: timestamp("birth_date"),
});

// Additional mock function in data.server.ts
export function mockedUserProfileFullSelect() {
  return {
    id: generateMockCuid(),
    userId: generateMockCuid(),
    bio: "This is a sample bio.",
    birthDate: new Date("1990-01-01"),
  };
}
```

By providing mock functions for all relevant tables, we ensure that our repository mocks can handle all possible query and mutation scenarios.

# Query Mocks

In queries.server.ts, we create mock functions for each query method. Here's an example:

```typescript
typescriptCopyimport { type UserRepository } from "../../users.server.js";
import { vi } from "vitest";
import { mockedUserFullSelect } from "./data.server.js";
import { DeepPartial, mergeDeep } from "../utils.js";

export function mockUserRepoQueryUser({
  userRepo,
  data,
}: {
  userRepo: UserRepository;
  data?: DeepPartial<ReturnType<typeof mockedUserFullSelect>>;
}) {
  return vi
    .spyOn(userRepo.getQuerier(), "queryUser")
    .mockImplementation(({ userId }: { userId: string }) => {
      const mockData = mockedUserFullSelect();
      const mergedData = mergeDeep({ ...mockData, id: userId }, data || {});
      return Promise.resolve(mergedData);
    });
}
```

## Why We Use DeepPartial and mergeDeep

In our repository mocking strategy, we utilize `DeepPartial` and `mergeDeep` functions to enhance the flexibility and robustness of our mocks. Here's why these tools are crucial to our approach:

### 1. Flexibility in Test Data

By using `DeepPartial`, we enable test writers to specify only the parts of the data structure they want to customize. This means they don't need to provide a complete object every time they want to mock a query, making tests more concise and focused on the specific data points relevant to each test case.

### 2. Nested Object Support

The `DeepPartial` type allows for partial specification of nested objects. This is particularly useful when dealing with complex data structures. For example, if a user has a nested `address` object, testers can override just specific fields of the address without needing to specify the entire address structure.

### 3. Type Safety

`DeepPartial` maintains type safety while allowing flexibility. It ensures that the properties specified in the test are valid properties of the object, catching potential errors at compile-time.

### 4. Default Values

By using `mergeDeep`, we ensure that any fields not specified in the test data are filled with default values from our mock data generator (e.g., `mockedUserFullSelect()`). This means tests don't break when new fields are added to the object, as long as those fields have sensible defaults in the mock generator.

### 5. Deep Merging

The `mergeDeep` function allows for deep merging of objects. This means that if a nested object is partially specified in the test data, it will be merged with the corresponding nested object from the default mock data, rather than completely overwriting it.

### 6. Consistency with Real-World Data

This approach allows our mock data to more closely resemble real-world scenarios where you might retrieve a full object but only need to assert or manipulate certain fields of it in a given test.

### Example Usage

Here's an example of how this flexibility can be used in a test:

```typescript
it("should handle user with custom address", async () => {
  mockUserRepoQueryUser({
    userRepo,
    data: {
      name: "Jane Doe",
      address: {
        city: "New York",
        // Other address fields will be filled with default values
      },
    },
  });

  const userService = new UserService(userRepo);
  const result = await userService.getUserCity("user-1");

  expect(result).toBe("New York");
});
```

## Complex DeepMerge Query Example

In our `TeamRepository`, we have a query that fetches customers associated with a customer team. This query involves multiple nested objects and arrays, making it a perfect candidate for demonstrating the power of our DeepMerge approach.

Here's the mock implementation:

```typescript
import { type TeamRepository } from "../../teams.server.js";
import { vi } from "vitest";
import {
  mockedCustomerToTeamRelationFullSelect,
  mockedTeamFullSelect,
} from "./data.server.js";
import { mockedCustomerFullSelect } from "../customers/data.server.js";
import { DeepPartial, mergeDeep } from "../utils.js";

export function mockTeamRepoQueryCustomers({
  teamRepo,
  data,
}: {
  teamRepo: TeamRepository;
  data?:
    | DeepPartial<{
        customer_to_customer_teams: ReturnType<
          typeof mockedCustomerToTeamRelationFullSelect
        >;
        customer: ReturnType<typeof mockedCustomerFullSelect>;
      }>[]
    | null;
}) {
  return vi
    .spyOn(teamRepo.getQuerier(), "queryCustomers")
    .mockImplementation(({ teamId }: { teamId: string }) => {
      if (data === undefined) {
        const defaultData = [
          {
            customer_to_customer_teams: {
              ...mockedCustomerToTeamRelationFullSelect(),
              teamId,
            },
            customer: mockedCustomerFullSelect(),
          },
        ];
        return Promise.resolve(defaultData);
      }

      if (data === null || data.length === 0) {
        return Promise.resolve([]);
      }

      const mergedData = data.map((item) => {
        const defaultItem = {
          customer_to_customer_teams: {
            ...mockedCustomerToTeamRelationFullSelect(),
            teamId,
          },
          customer: mockedCustomerFullSelect(),
        };
        return mergeDeep(defaultItem, item);
      });

      return Promise.resolve(mergedData);
    });
}
```

## Breakdown of Complex DeepMerge Query

Our complex DeepMerge queries, such as the one used in the `TeamRepository`, have several key components that make them powerful and flexible. Here's a breakdown of these complex parts:

### 1. Nested Structure

The mock data includes multiple nested objects, each with its own complex structure. For example:

- `customer_to_customer_teams`: Represents the relationship between a customer and a customer team.
- `customer`: Contains the customer's information.

This nested structure allows us to mock complex, real-world data relationships.

### 2. Array Handling

The function is designed to handle an array of these nested objects. This capability allows for mocking multiple customers or relationships at once, mirroring scenarios where we might fetch multiple records from a database.

### 3. Conditional Logic

The function incorporates conditional logic to handle various input scenarios:

- If `data` is undefined, it generates and returns default data.
- If `data` is null or an empty array, it returns an empty array.
- If `data` contains values, it processes each item.

This flexibility allows the mock to behave appropriately in different test scenarios.

### 4. Default Data Generation

When no custom data is provided (i.e., `data` is undefined), the function generates default data using predefined mock functions:

- `mockedCustomerToTeamRelationFullSelect()`: Generates default customer-to-team relationship data.
- `mockedCustomerFullSelect()`: Generates default customer data.

This ensures that even without custom input, the mock returns realistic, fully-formed data structures.

### 5. Deep Merging

For each item in the input data array, the function performs a deep merge with the default data. This allows for partial overrides at any level of the nested structure. Testers can specify only the fields they want to customize, while the rest of the structure is filled with default values.

This deep merging capability is what gives our mocks their power and flexibility, allowing for precise control over test data while maintaining the overall data structure integrity.

By incorporating these complex elements, our DeepMerge queries provide a robust and flexible way to mock intricate data structures and relationships, greatly enhancing our ability to write comprehensive and maintainable tests.

## Mutation Mocks

In our repository mocking strategy, we create mock functions for each mutation method in a `mutations.server.ts` file. These mocks allow us to simulate database operations without actually modifying any data, making our tests fast and isolated.

### Structure

Here's an example of how we structure our mutation mocks:

```typescript
import { type UserRepository } from "../../users.server.js";
import { vi } from "vitest";
import { generateMockCuid } from "../utils.js";

export function mockUserRepoCreateUser({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getMutator(), "createUser")
    .mockImplementation(() => Promise.resolve(generateMockCuid()));
}

export function mockUserRepoUpdateUser({
  userRepo,
}: {
  userRepo: UserRepository;
}) {
  return vi
    .spyOn(userRepo.getMutator(), "updateUser")
    .mockImplementation(() => Promise.resolve());
}
```

This one is very straight forward. Just make sure the return type matches the actual return type of the real mutation.
