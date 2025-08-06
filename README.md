# 🚦 Declarative Rules

Tired of messy `if/else` chains? Spiraling conditional complexity got you down?

**Declarative Rules** offers a clean, powerful, and flexible way to manage complex business logic. Define your conditions as a set of "rules," and let the engine find the right answer.

## Why you'll love it

- **✅ Clean & Readable:** Say goodbye to nested ternaries and complex conditional blocks. Your logic becomes self-documenting.
- **✨ Extensible:** Adding new rules is as simple as a single line of code, without touching the core logic.
- **🔒 Type-Safe:** Full TypeScript support ensures that your rules and their outputs are always correct.
- **🚀 Flexible:** Works for simple role lookups or complex, nested logic trees.

## Core Concepts

The pattern is simple. There are three main players:

1. **The `Rules` Class**: Your rulebook! It's a super-powered `Map` with a friendly, fluent API for defining rules (`.setRule()`) and a safety net (`.setDefault()`).
2. **The `applyRules` Function**: The referee! It takes your rulebook and some data, runs through the rules, and returns the prize from the first one that matches.
3. **Predicate Functions**: The players! These are tiny, pure functions that hold a single piece of logic. They take some data and return `true` or `false`.

This setup keeps your business rules separate from the code that runs them, making your logic a joy to work with.

---

## Example 1: The VIP Lounge 👑

Let's start with a classic: figuring out who gets access to the VIP lounge at an exclusive club.

### 1. Meet the Guests & Write the Rules

First, we define our `Guest` and the rules for entry.

```typescript
import { Rules, applyRules } from 'declarative-rules';

// A guest at our club
type Guest = {
  name: string;
  visits: number;
  isFriendOfOwner: boolean;
};

// Our simple, single-purpose predicate functions
const isVIP = (guest: Guest) => guest.name === 'Taylor Swift';
const isFriend = (guest: Guest) => guest.isFriendOfOwner;
const isLoyal = (guest: Guest) => guest.visits > 100;

```

### 2. Build the Rulebook

Next, we use the `Rules` class to create our access list. The order is key—the first rule that matches wins!

```typescript
const accessLevelRules = new Rules<string, Guest>()
  .setRule(isVIP, 'Access All Areas 🌟')
  .setRule(isFriend, 'VIP Lounge Access 🥂')
  .setRule(isLoyal, 'Free Drink Voucher 🍹')
  .setDefault('General Admission 🎟️'); // Everyone else gets this
```

### 3. Check the List!

Now, let's see who gets in. We use `applyRules` to check our guests against the rulebook.

```typescript
const regularJoe = { name: 'Joe', visits: 10, isFriendOfOwner: false };
const taylor = { name: 'Taylor Swift', visits: 999, isFriendOfOwner: true };

// applyRules does the hard work for us!
const joesAccess = applyRules(regularJoe, accessLevelRules); // "General Admission 🎟️"
const taylorsAccess = applyRules(taylor, accessLevelRules);   // "Access All Areas 🌟"
```

---

## Example 2: The Magic Item Shop 🧙‍♂️ (Advanced)

This is where the real magic happens! What if a rule's outcome was... *another set of rules*?

Let's determine the price and description of a magic item based on its properties.

### 1. Define the Rules for Magic Items

First, let's define the shape of our data and the predicates that will test it. This makes our rules easier to read and maintain.

```typescript
import { Rules, applyRules } from 'declarative-rules';

// The data for a magic item
type Item = {
  rarity: 'legendary' | 'enchanted' | 'common';
  isCursed: boolean;
};

// The final object we want to create
type ItemInfo = {
  price: string;
  description: string;
};

// Predicates to check the item's properties
const isLegendary = (item: Item) => item.rarity === 'legendary';
const isEnchanted = (item: Item) => item.rarity === 'enchanted';
const isLegendaryAndCursed = (item: Item) => isLegendary(item) && item.isCursed;
```

Now we'll build two rulebooks: one for the item's *description* and a more complex one for its *pricing*, which will use the first one.

```typescript
// --- First, the Description Rulebook ---
// This one is simple: it just returns a string.
const descriptionRules = new Rules<string, Item>()
  .setRule(isLegendary, 'Forged in dragon fire! 🔥')
  .setRule(isEnchanted, 'Glows with a faint magical aura. ✨')
  .setDefault('A standard, well-made item.');

// --- Now, the Pricing Rulebook ---
// The values here are FUNCTIONS that call applyRules with our other rulebook!
const pricingRules = new Rules<(item: Item) => ItemInfo, Item>()
  .setRule(isLegendaryAndCursed, (item) => ({
    price: 'Priceless',
    description: 'A powerful but dangerous artifact!', // Custom description
  }))
  .setRule(isLegendary, (item) => ({
    price: '10,000 Gold',
    description: applyRules(item, descriptionRules), // Nested call!
  }))
  .setRule(isEnchanted, (item) => ({
    price: '500 Gold',
    description: applyRules(item, descriptionRules), // Nested call!
  }))
  .setDefault((item) => ({
    price: '50 Gold',
    description: applyRules(item, descriptionRules), // Nested call!
  }));
```

### 2. How It Works

The flow is like a waterfall:

1. **Top Level**: We call `applyRules` with `pricingRules`. It finds the first match (e.g., `isLegendary`) and returns the function associated with it.
2. **Nested Level**: We then call *that function*, which in turn calls `applyRules` with `descriptionRules` to get the final, detailed description.

This keeps our logic neatly organized, even when it gets complex!

> **💡 Pro Tip:** When nesting, the context object passed to the root `applyRules` call is automatically available to all child rules. If a child rule needs extra data, simply include it in the context object passed to the initial call.

## Best Practices 🚀

- **Order Matters**: Chain your most specific rules first with `.setRule()`. The first match always wins.
- **Always Set a Default**: Every `Rules` instance should end with `.setDefault()`. This is your safety net, ensuring you never have an unhandled case.