/**
 * @module declarative-rules
 * A lightweight, declarative rules engine for managing complex business logic.
 */

// --- Type Definitions ---

/**
 * A predicate function that accepts an arguments object and returns a boolean.
 * @template Args - The type of the arguments object.
 */
export type Predicate<Args extends object> = (args: Args) => boolean;

// --- The Rules Class ---

/**
 * A class for building a declarative set of rules.
 * It provides a fluent API for setting predicate-based rules and a default fallback.
 * @template T - The type of the value to be returned by the rules.
 * @template Args - The type of the arguments object passed to the predicates.
 */
export class Rules<T, Args extends object = {}> {
  // The internal map is kept private to enforce usage of the class methods.
  private _rules = new Map<Predicate<Args>, T>();
  private _default: T | null = null;

  /**
   * Adds a predicate rule to the set.
   * @param condition The predicate function.
   * @param value The value to return if the condition is true.
   * @returns The `Rules` instance for chaining.
   */
  public setRule(condition: Predicate<Args>, value: T): this {
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
  public getRules(): IterableIterator<[Predicate<Args>, T]> {
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
 * @template Args - The type of the arguments object.
 * @param args - The arguments to pass to the predicate functions.
 * @param rules - An instance of the `Rules` class.
 * @returns The resolved value.
 */
const baseApplyRules = <T, Args extends object>(args: Args, rules: Rules<T, Args>): T => {
  // Iterate through the predicate functions.
  for (const [condition, value] of rules.getRules()) {
    if (condition(args)) {
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
const memoize = <T, Args extends object>(
  applyFn: (args: Args, rules: Rules<T, Args>) => T
) => {
  // A WeakMap prevents memory leaks by allowing garbage collection if the Rules object is no longer in use.
  const cache = new WeakMap<Rules<T, Args>, Map<string, T>>();

  return (args: Args, rules: Rules<T, Args>): T => {
    if (!cache.has(rules)) {
      cache.set(rules, new Map<string, T>());
    }
    const innerCache = cache.get(rules)!;
    
    // Use a stable string representation of the arguments as the cache key.
    const key = JSON.stringify(args);

    if (innerCache.has(key)) {
      return innerCache.get(key)!;
    }
    
    const result = applyFn(args, rules);
    innerCache.set(key, result);
    return result;
  };
};

// --- Exports ---

/**
 * Applies a set of rules to a given arguments object and returns the resolved value.
 * This function is memoized for performance.
 * @template T - The type of the value to be returned.
 * @template Args - The type of the arguments object.
 * @param args - The arguments to pass to the predicate functions.
 * @param rules - An instance of the `Rules` class containing the logic.
 * @returns The resolved value.
 */
export const applyRules = memoize(baseApplyRules);
