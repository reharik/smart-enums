import type { FieldEnumMapping } from 'smart-enums';

/**
 * Query context fields read by {@link createSmartEnumPostProcessResponse}.
 * Attach via {@link withEnumRevival} on a Knex query builder.
 */
export type SmartEnumKnexQueryContext = {
  smartEnumFieldMapping?: FieldEnumMapping;
  smartEnumStrict?: boolean;
};
