# Platform Architecture Guide

This guide outlines the core architecture patterns and development standards for our React Router v7 application.

## Table of Contents

- [Overview](#overview)
- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
  - [Route Components](#route-components)
  - [Repositories](#repositories)
  - [Services](#services)
  - [Utils](#utils)
- [Services and Utils Synergy](#services-and-utils-synergy)
- [Error Handling](#error-handling)
- [Code Examples](#code-examples)

## Overview

Our application is built on React Router v7, which unifies Remix and React Router into a single framework. The architecture emphasizes:

- Strong dependency injection patterns
- Clear separation of concerns
- Type safety with TypeScript
- Consistent error handling
- Testable code structure

## Getting Started

The application uses three main architectural components:

2. Route components - Handle the loaders / actions for a route and rendering
3. Repositories - Handle database operations
4. Services - Manage business logic
5. Utils - Provide shared functionality

## Core Concepts

### Route Components

Route components follow a specific folder structure and organizational pattern that promotes clarity and maintainability.

#### Folder Structure

```
routes/
  ├── billing/
  │   ├── billing-route.tsx       # Main route component
  │   ├── actions/               # Action handlers
  │   │   ├── example-action-1.ts
  │   │   └── example-action-2.ts
  │   ├── components/           # Route-specific components
  │   └── utils/               # Route-specific utilities

```

#### Route Component Responsibilities

The main route component (e.g., billing-route.tsx) has three primary responsibilities:

1. Handle the loader to define available route data
2. Define and coordinate actions through an intent-based system
3. Handle the initial route rendering

#### Action Handling Pattern

Actions are organized using an intent-based system for better type safety and maintainability:

```typescript
export enum RouteIntent {
  ACTION_ONE = "route_intent_action_one",
  ACTION_TWO = "route_intent_action_two",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    switch (intent) {
      case RouteIntent.ACTION_ONE:
        return await actionOneHandler(args, logger);
      case RouteIntent.ACTION_TWO:
        return await actionTwoHandler(args, logger);
    }
  },
);
```

Key principles:

- Actions are defined in the route component but implemented in separate files
- Intent enums provide type-safe action identification
- Each action handler is isolated for better testing and maintenance
- Common error handling is provided through the actionWithDefaultErrorHandling wrapper

#### Example Implementation

```typescript
// billing-route.tsx
export enum BillingRouteIntent {
  CREATE_CHECKOUT_SESSION = "billing_route_intent_create_checkout_session",
  CREATE_PORTAL_SESSION = "billing_route_intent_create_portal_session",
}

export const action = actionWithDefaultErrorHandling(
  async (args: ActionFunctionArgs, logger: Logger) => {
    const intent = await getActionIntent(args.request);

    if (intent === BillingRouteIntent.CREATE_CHECKOUT_SESSION) {
      return await createCheckoutSession(args, logger);
    }
    if (intent === BillingRouteIntent.CREATE_PORTAL_SESSION) {
      return await createPortalSession(args, logger);
    }
  },
);

// Component implementation...
```

### Repositories

Repositories abstract database operations using Drizzle ORM. Never make direct database calls in actions/loaders.

#### Structure

```typescript
// Querier interface (read operations)
interface UserQueryable {
  queryUser: <P extends Partial<UserSelectFields>>(params: {
    userId: string;
    projection: P;
  }) => Promise<QueryResult<P, UserSelectFields> | undefined>;
}

// Mutator interface (write operations)
interface UserMutable {
  createUser: (
    params: Omit<typeof users.$inferInsert, "id" | "createdAt" | "updatedAt">,
  ) => Promise<string>;
}

// Main repository class
class UserRepository extends BaseRepository<UserQueryable, UserMutable> {
  constructor() {
    super(new UserQuerier(), new UserMutator());
  }
}
```

#### Usage

```typescript
const userService = new UserService({
  logger,
  userRepo: new UserRepository(),
});
```

### Services

Services encapsulate business logic and can be used across different entry points (requests, webhooks, etc.).

#### Key Principles

1. Parameters should be pre-validated before reaching services
2. Focus exclusively on business logic
3. Dependencies injected via constructor
4. Context-independent operation

#### Example

```typescript
export class UserService {
  private logger: Logger;
  private userQuerier: UserQueryable;
  private userMutator: UserMutable;

  constructor({
    logger,
    userRepo,
  }: {
    logger: Logger;
    userRepo: UserRepository;
  }) {
    this.logger = logger;
    this.userQuerier = userRepo.getQuerier();
    this.userMutator = userRepo.getMutator();
  }

  async updateCoreProfileInfo({
    name,
    username,
    imageUrl,
    userId,
  }: {
    name?: string;
    username?: string;
    imageUrl?: string;
    userId: string;
  }) {
    await this.userMutator.updateCoreProfileInfo({
      userId,
      data: { name, username, imageUrl },
    });
  }
}
```

### Utils

Utils follow a specific organization pattern for loader/action utilities:

```
utils/
  ├── {util_name}/
  │   ├── core.server.ts      # Core logic
  │   ├── actions.server.ts   # Action-specific utilities
  │   └── loaders.server.ts   # Loader-specific utilities
```

#### Naming Conventions

- Action utilities must start with "validate"
- Loader utilities must start with "require"

### Services and Utils Synergy

Services and validation utilities work together in a pattern that enhances testability, reusability, and error handling. This section explains the key principles and benefits of this approach.

#### Key Pattern: Pre-validated Dependencies

Instead of having services fetch their own dependencies, we pass pre-validated data into services. This pattern is implemented through our validation utilities, with distinct patterns for actions and loaders:

- Actions use `validate` utilities (e.g., `validateSubscription`)
- Loaders use `require` utilities (e.g., `requireSubscription`)

```typescript
// Instead of this:
class TeamMemberService {
  async redeemInvite(teamId: string) {
    const subscription = await this.getSubscription(teamId); // Service fetches dependency
    // ... rest of logic
  }
}

// We do this:
class TeamMemberService {
  async redeemInvite({
    teamId,
    subscription, // Pre-validated dependency
    subscriptionService,
  }: {
    teamId: string;
    subscription: Pick<
      typeof subscriptions.$inferSelect,
      "stripeSubscriptionId" | "subscriptionItemId" | "currentPeriodSeats"
    >;
    subscriptionService: SubscriptionService;
  }) {
    // Service uses pre-validated dependency
  }
}
```

#### Example Implementation

```typescript
// Action validation utility
export async function validateSubscription({
  teamId,
  logger,
}: {
  teamId: string;
  logger: Logger;
}) {
  const subscription = await subscriptionRepo.querySubscription({ teamId });

  if (!subscription) {
    throw throwActionErrorAndLog({
      message: "Subscription not found",
      logInfo: { logger, event: "subscription_not_found" },
    });
  }

  return subscription;
}

// Loader validation utility
export async function requireSubscription({
  teamId,
  logger,
}: {
  teamId: string;
  logger: Logger;
}) {
  const subscription = await subscriptionRepo.querySubscription({ teamId });

  if (!subscription) {
    throw throwNotFoundErrorResponseJsonAndLog({
      data: { message: "Subscription not found" },
      logInfo: { logger, event: "subscription_not_found" },
    });
  }

  return subscription;
}

// Action implementation
export const action = async (args: ActionFunctionArgs) => {
  const logger = createActionLogger(args);

  // Validate dependencies using action-specific validation
  const subscription = await validateSubscription({
    teamId,
    logger,
  });

  // Service receives pre-validated data
  const teamMemberService = new TeamMemberService({
    logger,
    teamRepo,
  });

  await teamMemberService.redeemInvite({
    subscription,
    // ... other dependencies
  });
};

// Loader implementation
export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  // Validate dependencies using loader-specific validation
  const subscription = await requireSubscription({
    teamId,
    logger,
  });

  return { subscription };
};
```

#### Validation Naming Conventions

1. **Action Utilities**

   - Must start with "validate"
   - Throw action errors that trigger toast notifications
   - Example: `validateSubscription`, `validateTeamMember`

2. **Loader Utilities**
   - Must start with "require"
   - Throw error responses that display full-screen errors
   - Example: `requireSubscription`, `requireTeamMember`

## Error Handling

Error handling differs between actions and loaders:

- **Actions**: Throw action errors that trigger toast notifications

  ```typescript
  throw throwActionErrorAndLog({
    message: "User-friendly error message",
    logInfo: {
      logger,
      event: "event_name",
      data: {
        /* relevant data */
      },
    },
  });
  ```

- **Loaders**: Throw error responses that display full-screen errors
  ```typescript
  throw throwNotFoundErrorResponseJsonAndLog({
    data: { message: "Not Found" },
    logInfo: {
      logger,
      event: "not_found_event",
    },
  });
  ```

## Code Examples

### Loader Example

```typescript
export const loader = async (args: LoaderFunctionArgs) => {
  const logger = createLoaderLogger(args);

  const customer = await requireCustomer({
    args,
    logger,
    projection: { id: customers.id },
  });

  const teamSlug = requireTeamSlugRouteParam({
    params: args.params,
    logger,
  });

  const team = await requireTeamFromSlug({
    teamSlug,
    logger,
    projection: { id: teams.id },
  });

  return { customer, team };
};
```

```

## Best Practices

1. **Dependency Injection**

   - Inject dependencies through constructors
   - Use interfaces for better testability
   - Avoid direct instantiation in methods

2. **Data Access**

   - Never access database directly from actions/loaders
   - Use repositories for data operations
   - Use projections to specify needed data

3. **Validation**

   - Validate inputs before passing to services
   - Use Zod schemas for form validation
   - Follow validate/require naming convention

4. **Error Handling**
   - Use context-appropriate error types
   - Include logging with error throws
   - Provide clear user feedback
```
