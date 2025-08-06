import { Rules, applyRules } from '../src/index';
import {
  type ShippingArgs,
  userRoleRules,
  shippingCostRules,
} from './fixtures';

describe('Declarative Rules Engine', () => {
  describe('Simple Use Case: User Roles', () => {
    it('should return "Administrator" for an admin user', () => {
      const adminUser = { username: 'admin', postCount: 999, isModerator: true };
      expect(applyRules({ user: adminUser }, userRoleRules)).toBe('Administrator');
    });

    it('should return "Moderator" for a non-admin moderator', () => {
      const moderatorUser = { username: 'mod', postCount: 50, isModerator: true };
      expect(applyRules({ user: moderatorUser }, userRoleRules)).toBe('Moderator');
    });

    it('should return "Power User" for a user with over 100 posts', () => {
      const powerUser = { username: 'power', postCount: 101, isModerator: false };
      expect(applyRules({ user: powerUser }, userRoleRules)).toBe('Power User');
    });

    it('should return "Member" for a regular user', () => {
      const regularUser = { username: 'jane', postCount: 10, isModerator: false };
      expect(applyRules({ user: regularUser }, userRoleRules)).toBe('Member');
    });
  });

  describe('Advanced Use Case: Nested Shipping Rules', () => {
    it('should calculate cost for heavy international and describe as high value', () => {
      const args: ShippingArgs = {
        weight: 60,
        destination: 'international',
        isFragile: false,
        isHighValue: true,
      };
      const resolver = applyRules(args, shippingCostRules);
      const result = resolver(args);
      expect(result.cost).toBe(150.0);
      expect(result.description).toBe('Requires signature and insurance.');
    });

    it('should calculate cost for fragile items and describe handling', () => {
      const args: ShippingArgs = {
        weight: 10,
        destination: 'domestic',
        isFragile: true,
        isHighValue: false,
      };
      const resolver = applyRules(args, shippingCostRules);
      const result = resolver(args);
      expect(result.cost).toBe(55.0);
      expect(result.description).toBe('Handled with extreme care.');
    });

    it('should use default cost and standard handling for a standard package', () => {
      const args: ShippingArgs = {
        weight: 5,
        destination: 'domestic',
        isFragile: false,
        isHighValue: false,
      };
      const resolver = applyRules(args, shippingCostRules);
      const result = resolver(args);
      expect(result.cost).toBe(25.0);
      expect(result.description).toBe('Standard international handling.');
    });
  });

  describe('Core Functionality and Edge Cases', () => {
    it('should throw an error if no rules match and no default is provided', () => {
      const rules = new Rules<string, { x: number }>().setRule(({ x }) => x > 10, 'large');
      expect(() => applyRules({ x: 5 }, rules)).toThrow(
        'Rules set is missing a default and no conditions were met.'
      );
    });

    it('should throw an error if a rule condition is not a function', () => {
      const rules = new Rules();
      // @ts-expect-error - Intentionally testing invalid input
      expect(() => rules.setRule('not-a-function', 'invalid')).toThrow(
        'Rule condition must be a function.'
      );
    });

    it('should return the default value if no rules match', () => {
      const rules = new Rules<string, { x: number }>()
        .setRule(({ x }) => x > 0, 'positive')
        .setDefault('not positive');
      expect(applyRules({ x: -1 }, rules)).toBe('not positive');
    });

    it('should be memoized, calling the base function only once for the same inputs', () => {
      const predicate = jest.fn(({ x }: { x: number }) => x > 0);
      const rules = new Rules<string, { x: number }>()
        .setRule(predicate, 'positive')
        .setDefault('zero');

      applyRules({ x: 5 }, rules);
      applyRules({ x: 5 }, rules);

      expect(predicate).toHaveBeenCalledTimes(1);
    });
  });
});