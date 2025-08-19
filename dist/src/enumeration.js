"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.enumeration = enumeration;
const case_anything_1 = require("case-anything");
const extensionMethods_1 = require("./extensionMethods");
/**
 * Creates a type-safe enumeration with built-in utility methods.
 *
 * @example
 * // Simple string array input
 * const Status = enumeration({
 *   input: ['PENDING', 'ACTIVE', 'COMPLETED'] as const
 * });
 *
 * // Object input with overrides
 * const UserRole = enumeration({
 *   input: {
 *     ADMIN: { display: 'Administrator', value: 'admin' },
 *     USER: { display: 'Regular User' },
 *     GUEST: { deprecated: true }
 *   }
 * });
 *
 * // With custom extensions
 * const Priority = enumeration({
 *   input: {
 *     LOW: { level: 1 },
 *     MEDIUM: { level: 2 },
 *     HIGH: { level: 3 }
 *   },
 *   extraExtensionMethods: (items) => ({
 *     getByLevel: (level: number) => items.find(i => i.level === level),
 *     getSorted: () => items.sort((a, b) => a.level - b.level)
 *   })
 * });
 *
 * // Usage examples:
 * const active = Status.ACTIVE; // EnumItem with key, value, display, etc.
 * const statusFromValue = Status.fromValue('PENDING'); // Lookup by value
 * const allOptions = Status.toOptions(); // Convert to dropdown options
 * const activeOnly = UserRole.toEnumItems(item => !item.deprecated);
 *
 * @param props Configuration for the enumeration
 * @returns An object with enum items as properties plus all extension methods
 */
function enumeration({ input, extraExtensionMethods, propertyAutoFormatters, }) {
    // Step 1: Normalize input to object format
    // Arrays become objects with empty values: ['A', 'B'] -> { A: {}, B: {} }
    const normalizedInput = (Array.isArray(input)
        ? input.reduce((acc, k) => (Object.assign(Object.assign({}, acc), { [k]: {} })), {})
        : input);
    // Step 2: Set up property formatters with defaults
    // By default: value = CONSTANT_CASE, display = Capital Case
    const formattersWithDefaults = [
        { key: 'value', format: case_anything_1.constantCase },
        { key: 'display', format: case_anything_1.capitalCase },
        ...(propertyAutoFormatters || []),
    ];
    // Helper to apply all formatters to a key
    const formatProperties = (k, formatters) => formatters.reduce((acc, formatter) => {
        acc[formatter.key] = formatter.format(k);
        return acc;
    }, {});
    // Step 3: Build the enum items object
    const rawEnumItems = {};
    // Step 4: Populate each enum item with formatted properties and user overrides
    let index = 0;
    for (const key in normalizedInput) {
        // eslint requires hasOwnProperty check
        if (Object.prototype.hasOwnProperty.call(normalizedInput, key)) {
            const value = normalizedInput[key];
            // Create enum item:
            // 1. Set index and key
            // 2. Apply auto-formatters (value, display, custom)
            // 3. Override with any user-provided values
            const enumItem = Object.assign(Object.assign({ index, key: key }, formatProperties(key, formattersWithDefaults)), value);
            rawEnumItems[key] = enumItem;
            index++;
        }
    }
    // Step 5: Combine enum items with extension methods
    // This creates the final enum object with both data and methods
    return Object.assign(Object.assign({}, rawEnumItems), (0, extensionMethods_1.addExtensionMethods)(Object.values(rawEnumItems), extraExtensionMethods));
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZW51bWVyYXRpb24uanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi9zcmMvZW51bWVyYXRpb24udHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6Ijs7QUFvSVMsa0NBQVc7QUFuSXBCLGlEQUEwRDtBQUMxRCx5REFBeUQ7QUFVekQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztHQXVDRztBQUNILFNBQVMsV0FBVyxDQUlsQixFQUNBLEtBQUssRUFDTCxxQkFBcUIsRUFDckIsc0JBQXNCLEdBQytDO0lBV3JFLDJDQUEyQztJQUMzQywwRUFBMEU7SUFDMUUsTUFBTSxlQUFlLEdBQW9CLENBQ3ZDLEtBQUssQ0FBQyxPQUFPLENBQUMsS0FBSyxDQUFDO1FBQ2xCLENBQUMsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsR0FBRyxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsaUNBQU0sR0FBRyxLQUFFLENBQUMsQ0FBQyxDQUFDLEVBQUUsRUFBRSxJQUFHLEVBQUUsRUFBRSxDQUFDO1FBQ3JELENBQUMsQ0FBQyxLQUFLLENBQ1MsQ0FBQztJQUVyQixtREFBbUQ7SUFDbkQsNERBQTREO0lBQzVELE1BQU0sc0JBQXNCLEdBQUc7UUFDN0IsRUFBRSxHQUFHLEVBQUUsT0FBTyxFQUFFLE1BQU0sRUFBRSw0QkFBWSxFQUFFO1FBQ3RDLEVBQUUsR0FBRyxFQUFFLFNBQVMsRUFBRSxNQUFNLEVBQUUsMkJBQVcsRUFBRTtRQUN2QyxHQUFHLENBQUMsc0JBQXNCLElBQUksRUFBRSxDQUFDO0tBQ2xDLENBQUM7SUFFRiwwQ0FBMEM7SUFDMUMsTUFBTSxnQkFBZ0IsR0FBRyxDQUFDLENBQVMsRUFBRSxVQUFtQyxFQUFFLEVBQUUsQ0FDMUUsVUFBVSxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQTJCLEVBQUUsU0FBUyxFQUFFLEVBQUU7UUFDM0QsR0FBRyxDQUFDLFNBQVMsQ0FBQyxHQUF1QixDQUFDLEdBQUcsU0FBUyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUM3RCxPQUFPLEdBQUcsQ0FBQztJQUNiLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQztJQUVULHNDQUFzQztJQUN0QyxNQUFNLFlBQVksR0FFZCxFQUVILENBQUM7SUFFRiwrRUFBK0U7SUFDL0UsSUFBSSxLQUFLLEdBQUcsQ0FBQyxDQUFDO0lBQ2QsS0FBSyxNQUFNLEdBQUcsSUFBSSxlQUFlLEVBQUUsQ0FBQztRQUNsQyx1Q0FBdUM7UUFDdkMsSUFBSSxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQyxJQUFJLENBQUMsZUFBZSxFQUFFLEdBQUcsQ0FBQyxFQUFFLENBQUM7WUFDL0QsTUFBTSxLQUFLLEdBQUcsZUFBZSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1lBRW5DLG9CQUFvQjtZQUNwQix1QkFBdUI7WUFDdkIsb0RBQW9EO1lBQ3BELDRDQUE0QztZQUM1QyxNQUFNLFFBQVEsR0FBa0QsOEJBQzlELEtBQUssRUFDTCxHQUFHLEVBQUUsR0FBd0MsSUFDMUMsZ0JBQWdCLENBQUMsR0FBRyxFQUFFLHNCQUFzQixDQUFDLEdBQzdDLEtBQUssQ0FDd0MsQ0FBQztZQUVuRCxZQUFZLENBQUMsR0FBRyxDQUFDLEdBQUcsUUFBUSxDQUFDO1lBQzdCLEtBQUssRUFBRSxDQUFDO1FBQ1YsQ0FBQztJQUNILENBQUM7SUFFRCxvREFBb0Q7SUFDcEQsZ0VBQWdFO0lBQ2hFLHVDQUNLLFlBQVksR0FDWixJQUFBLHNDQUFtQixFQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsWUFBWSxDQUFDLEVBQUUscUJBQXFCLENBQUMsRUFDMUU7QUFDSixDQUFDIn0=