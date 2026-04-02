import { Knex } from 'knex';
import { FieldEnumMapping } from 'smart-enums';

declare const createSmartEnumPostProcessResponse: () => Knex.Config["postProcessResponse"];

/**
 * Query context fields read by {@link createSmartEnumPostProcessResponse}.
 * Attach via {@link withEnumRevival} on a Knex query builder.
 */
type SmartEnumKnexQueryContext = {
    smartEnumFieldMapping?: FieldEnumMapping;
    smartEnumStrict?: boolean;
};

declare const withEnumRevival: <T extends Knex.QueryBuilder>(query: T, fieldEnumMapping: FieldEnumMapping, options?: {
    strict?: boolean;
}) => T;

export { type SmartEnumKnexQueryContext, createSmartEnumPostProcessResponse, withEnumRevival };
