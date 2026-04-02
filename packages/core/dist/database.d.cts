import { D as DatabaseFormat, h as ReviveRowOptions, j as RevivePayloadOptions } from './core-DgjOZ8Bg.cjs';
export { A as AnyEnumLike, E as Enumeration, F as FieldEnumMapping, b as LogLevel, L as Logger, P as PathEnumMapping, S as SmartApiHelperConfig, g as SmartEnumLike, c as SmartEnumMappingsConfig, e as enumeration, a as isSmartEnum, i as isSmartEnumItem } from './core-DgjOZ8Bg.cjs';

/**
 * Recursively replaces smart enum items with their `.value` strings for persistence.
 * Inbound revival requires explicit mapping (`reviveRowFromDatabase`, etc.).
 */
declare const prepareForDatabase: <T>(payload: T) => DatabaseFormat<T>;

declare const reviveRowFromDatabase: <T extends Record<string, unknown>>(row: T, options: ReviveRowOptions) => T;

declare const revivePayloadFromDatabase: <T>(payload: T, options: RevivePayloadOptions) => T;

declare class EnumRevivalError extends Error {
    readonly path: string;
    readonly value: unknown;
    constructor(message: string, path: string, value: unknown);
}

export { DatabaseFormat, EnumRevivalError, RevivePayloadOptions, ReviveRowOptions, prepareForDatabase, revivePayloadFromDatabase, reviveRowFromDatabase };
