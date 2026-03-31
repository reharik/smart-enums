import { d as SerializedSmartEnums, A as AnyEnumLike } from './core-DBfLukg6.js';
export { E as Enumeration, R as RevivedSmartEnums, f as SmartEnumItemSerialized, e as enumeration, a as isSmartEnum, i as isSmartEnumItem } from './core-DBfLukg6.js';

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
 * Revives smart enums after transport (from client request or API response).
 * Use this when receiving data that contains serialized enums.
 * Uses the global configuration set up with initializeSmartEnumMappings().
 *
 * @param payload - The payload received after transport
 * @returns The payload with enums revived to their proper enum items
 *
 * @example
 * ```typescript
 * // First, initialize the global configuration
 * initializeSmartEnumMappings({ enumRegistry: { UserStatus, Priority } });
 *
 * // Received: { user: { status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } } }
 * const revivedPayload = reviveAfterTransport(requestBody);
 * // Result: { user: { status: UserStatus.ACTIVE } }
 * ```
 */
declare function reviveAfterTransport<T>(payload: unknown): T;

/**
 * Serializes smart enums for transport (to client or API).
 * Use this when sending data that contains enum items.
 * Automatically learns field mappings for future database operations.
 *
 * @param payload - The payload to send via transport
 * @returns The payload with enums serialized for transport
 *
 * @example
 * ```typescript
 * // API has: { user: { status: UserStatus.ACTIVE } }
 * const serializedPayload = serializeForTransport(responseData);
 * // Result: { user: { status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } } }
 * // Also learns: { status: ['UserStatus'] } for future database operations
 * ```
 */
declare function serializeForTransport<T>(payload: T): SerializedSmartEnums<T>;

export { AnyEnumLike, SerializedSmartEnums, reviveAfterTransport, reviveSmartEnums, serializeForTransport, serializeSmartEnums };
