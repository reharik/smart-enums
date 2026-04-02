import { d as SerializedSmartEnums, A as AnyEnumLike, c as SmartEnumMappingsConfig } from './core-CiRjfQTt.cjs';
export { E as Enumeration, b as LogLevel, R as RevivedSmartEnums, f as SmartEnumItemSerialized, e as enumeration, a as isSmartEnum, i as isSmartEnumItem } from './core-CiRjfQTt.cjs';

type PlainObject = Record<string, unknown>;
/**
 * Recursively replaces Smart Enum items with self-describing objects
 * `{ __smart_enum_type, value }` for JSON transport or storage.
 *
 * @param input - Object or array that may contain enum items
 * @returns Same structure with enum items replaced by serialized shape
 *
 * @example
 * ```typescript
 * const dto = { id: '1', status: Status.active, color: Color.red };
 * const wire = serializeSmartEnums(dto);
 * // wire: { id: '1', status: { __smart_enum_type: 'Status', value: 'ACTIVE' }, color: { __smart_enum_type: 'Color', value: 'RED' } }
 * ```
 */
declare function serializeSmartEnums<T>(input: T): SerializedSmartEnums<T>;
declare function serializeSmartEnums<S extends Readonly<PlainObject> | readonly unknown[]>(input: unknown): S;
/**
 * Recursively revives serialized enum objects back to Smart Enum items
 * using a registry of enum types. Expects payload to contain
 * `{ __smart_enum_type, value }` where the type exists in the registry.
 *
 * @param input - Serialized payload (e.g. from JSON)
 * @param registry - Map of enum type name to enum object (e.g. `{ Status, Color }`)
 * @returns Payload with serialized enums revived to enum items
 *
 * @example
 * ```typescript
 * const wire = { status: { __smart_enum_type: 'Status', value: 'ACTIVE' } };
 * const revived = reviveSmartEnums(wire, { Status, Color });
 * // revived.status === Status.active
 * ```
 */
declare function reviveSmartEnums<R>(input: unknown, registry: Record<string, AnyEnumLike>): R;

/**
 * Revives smart enums after transport. Requires `initializeSmartEnumMappings`.
 */
declare const reviveAfterTransport: <T>(payload: unknown) => T;

/**
 * Serializes smart enums for transport (to client or API).
 * Wire payloads include `__smart_enum_type` for `reviveAfterTransport`.
 */
declare const serializeForTransport: <T>(payload: T) => SerializedSmartEnums<T>;

/**
 * Wire-format registry for `reviveAfterTransport` / `reviveSmartEnums`.
 * Not used for database string revival.
 */
declare const initializeSmartEnumMappings: (config: SmartEnumMappingsConfig) => void;
declare const getGlobalEnumRegistry: () => Record<string, AnyEnumLike> | undefined;

export { AnyEnumLike, SerializedSmartEnums, SmartEnumMappingsConfig, getGlobalEnumRegistry, initializeSmartEnumMappings, reviveAfterTransport, reviveSmartEnums, serializeForTransport, serializeSmartEnums };
