import { d as SerializedSmartEnums, A as AnyEnumLike } from './core-D2kChDMb.js';
export { B as BaseEnum, D as DropdownOption, a as EnumItem, b as EnumItemType, E as Enumeration, e as enumeration, i as isSmartEnumItem } from './core-D2kChDMb.js';

type PlainObject = Record<string, unknown>;
declare function serializeSmartEnums<T>(input: T): SerializedSmartEnums<T>;
declare function serializeSmartEnums<S extends Readonly<PlainObject> | readonly unknown[]>(input: unknown): S;
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
 * // Then revive using global config
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

export { AnyEnumLike, reviveAfterTransport, reviveSmartEnums, serializeForTransport, serializeSmartEnums };
