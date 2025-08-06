import { Rules, applyRules } from '../src/index';

// Simple use case: User roles
export type User = {
  username: string;
  postCount: number;
  isModerator: boolean;
};

export const isAdmin = ({ user }: { user: User }) => user.username === 'admin';
export const isModerator = ({ user }: { user: User }) => user.isModerator;
export const isPowerUser = ({ user }: { user: User }) => user.postCount > 100;

export const userRoleRules = new Rules<string, { user: User }>()
  .setRule(isAdmin, 'Administrator')
  .setRule(isModerator, 'Moderator')
  .setRule(isPowerUser, 'Power User')
  .setDefault('Member');

// Advanced use case: Nested rules for shipping
export type ShippingArgs = {
  weight: number;
  destination: 'domestic' | 'international';
  isFragile: boolean;
  isHighValue: boolean;
};

export type ShippingInfo = {
  cost: number;
  description: string;
};

export const isHeavyAndInternational = ({ weight, destination }: ShippingArgs) =>
  weight > 50 && destination === 'international';
export const isFragile = ({ isFragile }: ShippingArgs) => isFragile;
export const isHighValue = ({ isHighValue }: ShippingArgs) => isHighValue;

export const descriptionRules = new Rules<string, ShippingArgs>()
  .setRule(isHighValue, 'Requires signature and insurance.')
  .setRule(isFragile, 'Handled with extreme care.')
  .setDefault('Standard international handling.');

export const shippingCostRules = new Rules<(args: ShippingArgs) => ShippingInfo, ShippingArgs>()
  .setRule(isHeavyAndInternational, (args) => ({
    cost: 150.0,
    description: applyRules(args, descriptionRules),
  }))
  .setRule(isFragile, (args) => ({
    cost: 55.0,
    description: applyRules(args, descriptionRules),
  }))
  .setDefault((args) => ({
    cost: 25.0,
    description: applyRules(args, descriptionRules),
  }));
