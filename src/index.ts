/**
 * @module declarative-rules
 * A lightweight, declarative rules engine for managing complex business logic.
 */

// --- Type Definitions ---

/**
 * A predicate function that accepts an arguments object and returns a boolean.
 * @template Context - The type of the context object.
 */
export type Predicate<Context extends object> = (context: Context) => boolean;

// --- The Rules Class ---

/**
 * A class for building a declarative set of rules.
 * It provides a fluent API for setting predicate-based rules and a default fallback.
 * @template T - The type of the value to be returned by the rules.
 * @template Context - The type of the context object passed to the predicates.
 */
export class Rules<T, Context extends object = {}> {
  // The internal map is kept private to enforce usage of the class methods.
  private _rules = new Map<Predicate<Context>, T>();
  private _default: T | null = null;

  /**
   * Adds a predicate rule to the set.
   * @param condition The predicate function.
   * @param value The value to return if the condition is true.
   * @returns The `Rules` instance for chaining.
   */
  public setRule(condition: Predicate<Context>, value: T): this {
    if (typeof condition !== 'function') {
      throw new Error('Rule condition must be a function.');
    }
    this._rules.set(condition, value);
    return this;
  }

  /**
   * Sets the default value to use if no other rules match.
   * @param value The default value.
   * @returns The `Rules` instance for chaining.
   */
  public setDefault(value: T): this {
    this._default = value;
    return this;
  }

  /**
   * @internal - Gets the rule entries for processing.
   */
  public getRules(): IterableIterator<[Predicate<Context>, T]> {
    return this._rules.entries();
  }

  /**
   * @internal - Gets the default value for processing.
   */
  public getDefault(): T | null {
    return this._default;
  }
}

// --- Core Logic ---

/**
 * The base implementation of the rules engine. It iterates through rules and applies them.
 * This function is not exported directly; it's wrapped with memoization.
 * @template T - The type of the value to be returned.
 * @template Context - The type of the context object.
 * @param context - The context to pass to the predicate functions.
 * @param rules - An instance of the `Rules` class.
 * @returns The resolved value.
 */
const baseApplyRules = <T, Context extends object>(context: Context, rules: Rules<T, Context>): T => {
  // Iterate through the predicate functions.
  for (const [condition, value] of rules.getRules()) {
    if (condition(context)) {
      return value;
    }
  }

  // If no rules match, get the default.
  const defaultValue = rules.getDefault();
  if (defaultValue !== null) {
    return defaultValue;
  }

  // If no rules match and no default is provided, throw an error.
  throw new Error('Rules set is missing a default and no conditions were met.');
};

// --- Memoization ---

/**
 * A higher-order function that wraps a rules function with a cache.
 * @param applyFn - The base function to memoize.
 */
const memoize = <T, Context extends object>(
  applyFn: (context: Context, rules: Rules<T, Context>) => T
) => {
  // A WeakMap prevents memory leaks by allowing garbage collection if the Rules object is no longer in use.
  const cache = new WeakMap<Rules<T, Context>, Map<string, T>>();

  return (context: Context, rules: Rules<T, Context>): T => {
    if (!cache.has(rules)) {
      cache.set(rules, new Map<string, T>());
    }
    const innerCache = cache.get(rules)!;
    
    // Use a stable string representation of the arguments as the cache key.
    const key = JSON.stringify(context);

    if (innerCache.has(key)) {
      return innerCache.get(key)!;
    }
    
    const result = applyFn(context, rules);
    innerCache.set(key, result);
    return result;
  };
};

// --- Exports ---

/**
 * Applies a set of rules to a given arguments object and returns the resolved value.
 * This function is memoized for performance.
 * @template T - The type of the value to be returned.
 * @template Context - The type of the context object.
 * @param context - The context to pass to the predicate functions.
 * @param rules - An instance of the `Rules` class containing the logic.
 * @returns The resolved value.
 */
export const applyRules = memoize(baseApplyRules);
