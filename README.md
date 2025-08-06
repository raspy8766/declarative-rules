# 🚦 Declarative Rules

Tired of messy `if/else` chains? Spiraling conditional complexity got you down?

**Declarative Rules** offers a clean, powerful, and flexible way to manage complex business logic. Define your conditions as a set of "rules," and let the engine find the right answer.

## Why you'll love it:

- **✅ Clean & Readable:** Say goodbye to nested ternaries and complex conditional blocks. Your logic becomes self-documenting.
- **✨ Extensible:** Adding new rules is as simple as a single line of code, without touching the core logic.
- **🔒 Type-Safe:** Full TypeScript support ensures that your rules and their outputs are always correct.
- **🚀 Flexible:** Works for simple role lookups or complex, nested logic trees.

## Core Concepts

The pattern consists of three main components:

1. **The Rules Class**: An abstraction over a standard Map that provides a declarative, fluent API for defining rules (e.g., `.setRule()`) and a fallback case (`.setDefault()`). It encapsulates the logic and ensures type safety.
2. **The applyRules Function**: A generic function that works with an instance of the Rules class, executes each predicate, and returns the value of the first rule that matches. If no rules match, it returns the configured default value.
3. **The Predicate Functions**: Simple, pure functions that contain a single piece of business logic. They accept an `args` object and return a boolean.

This structure decouples your business rules from the code that executes them, making your logic much easier to manage and scale.

## Simple Use Case: Determining a User's Role

Let's start with a basic example: finding a user's role based on their properties.

### 1. Define the Data and Predicates

First, we define our data structure (User) and the predicate functions that check a user's status.

```typescript
import { Rules, applyRules } from 'declarative-rules';

type User = {
  username: string;
  postCount: number;
  isModerator: boolean;
};

// Predicates
const isAdmin = ({ user }: { user: User }) => user.username === 'admin';
const isModerator = ({ user }: { user: User }) => user.isModerator;
const isPowerUser = ({ user }: { user: User }) => user.postCount > 100;
```

### 2. Create the Rules Set

Next, we use the `Rules` class to define our set of rules in a clean, fluent chain. The order is important—the first rule that matches wins.

```typescript
const userRoleRules = new Rules<string, { user: User }>()
  .setRule(isAdmin, 'Administrator')
  .setRule(isModerator, 'Moderator')
  .setRule(isPowerUser, 'Power User')
  .setDefault('Member'); // The default is set with a dedicated method
```

### 3. Use applyRules

Now, we can use the `applyRules` function to find the role for any user.

```typescript
const regularUser = { username: 'jane', postCount: 10, isModerator: false };
const adminUser = { username: 'admin', postCount: 999, isModerator: true };

// The `applyRules` function works with the Rules instance.
const role1 = applyRules({ user: regularUser }, userRoleRules); // "Member"
const role2 = applyRules({ user: adminUser }, userRoleRules);   // "Administrator"
```

## Advanced Use Case: Nested Rules

The true power of this pattern emerges when the values in one `Rules` set are functions that, in turn, call `applyRules` with another `Rules` set.

### 1. Define the Rules

We have two distinct sets of rules, both built with the `Rules` class.

```typescript
import { Rules, applyRules } from 'declarative-rules';

// --- Description Rules ---
const descriptionRules = new Rules<string, ShippingArgs>()
  .setRule(isHighValue, 'Requires signature and insurance.')
  .setRule(isFragile, 'Handled with extreme care.')
  .setDefault('Standard international handling.');

// --- Shipping Cost Rules ---
// The values here are FUNCTIONS that call applyRules again.
const shippingCostRules = new Rules<(args: ShippingArgs) => ShippingInfo, ShippingArgs>()
  .setRule(isHeavyAndInternational, (args) => ({
    cost: 150.00,
    description: applyRules(args, descriptionRules), // Nested call
  }))
  .setRule(isFragile, (args) => ({
    cost: 55.00,
    description: applyRules(args, descriptionRules), // Nested call
  }))
  .setDefault((args) => ({
    cost: 25.00,
    description: applyRules(args, descriptionRules), // Nested call
  }));
```

### 2. The Execution Flow

The execution flow remains the same, but the logic is cleaner and more type-safe:

1. **Primary Resolution**: `applyRules` is called with `shippingCostRules`. It finds the first matching rule and returns the associated function.
2. **Secondary (Nested) Resolution**: You then execute that function, which makes a nested call to `applyRules` with `descriptionRules` to find the description.

## Best Practices

* **Order Matters**: Always chain your most specific rules first using `.setRule()`, as the first match wins.
* **Always Set a Default**: Every `Rules` instance should end with a `.setDefault()` call to handle cases where no other conditions are met. This makes your logic robust.
* **Use Memoization**: For performance-critical code, wrap your `applyRules` function with a memoization layer to cache results and avoid re-computing values for the same inputs.
