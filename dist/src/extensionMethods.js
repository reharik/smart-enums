"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addExtensionMethods = void 0;
const types_1 = require("./types");
/**
 * Adds extension methods to an enum object.
 * This is the main factory that creates all the utility methods for enum lookup and filtering.
 *
 * @param enumItems - Array of all enum items
 * @param extraExtensionMethods - Optional factory for additional custom methods
 * @returns An object containing all standard extension methods plus any custom methods
 */
const addExtensionMethods = (enumItems, extraExtensionMethods) => {
    const extensionMethods = buildExtensionMethods(enumItems);
    let extra = {};
    if (extraExtensionMethods) {
        extra = extraExtensionMethods(enumItems);
    }
    return Object.assign(Object.assign({}, extensionMethods), extra);
};
exports.addExtensionMethods = addExtensionMethods;
/**
 * Builds all standard extension methods for enum objects.
 * These methods provide various ways to look up, filter, and transform enum items.
 *
 * @internal
 */
const buildExtensionMethods = (rawEnum) => {
    return {
        // Lookup methods - these find enum items by different properties
        fromValue: (target) => {
            const item = Object.values(rawEnum).find((value) => value.value === target);
            if (!item) {
                throw new Error(`No enum value found for '${target}'`);
            }
            return item;
        },
        tryFromValue: (target) => {
            if (!target) {
                return undefined;
            }
            return Object.values(rawEnum).find((value) => value.value === target);
        },
        fromKey: (target) => {
            const item = Object.values(rawEnum).find((value) => value.key === target);
            if (!item) {
                throw new Error(`No enum key found for '${target}'`);
            }
            return item;
        },
        tryFromKey: (target) => {
            if (!target) {
                return undefined;
            }
            return Object.values(rawEnum).find((value) => value.key === target);
        },
        /**
         * Flexible lookup by any custom field.
         * Useful when enum items have additional properties beyond the standard ones.
         */
        tryFromCustomField: (field, target, filter) => {
            if (!target) {
                return undefined;
            }
            return Object.values(rawEnum)
                .filter(filter || (() => true))
                .find((value) => value[field] === target);
        },
        fromDisplay: (target) => {
            const item = Object.values(rawEnum).find((value) => value.display === target);
            if (!item) {
                throw new Error(`No enum display found for '${target}'`);
            }
            return item;
        },
        tryFromDisplay: (target) => {
            if (!target) {
                return undefined;
            }
            return Object.values(rawEnum).find((value) => value.display === target);
        },
        // Transformation methods - these convert enum items to different formats
        /**
         * Extract values from a specific custom field across all items.
         * Respects filter options for empty and deprecated items.
         */
        toCustomFieldValues: (field, filter, filterOptions) => {
            return Object.values(rawEnum)
                .filter(x => (filter ? filter(x) : true) &&
                ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showEmpty)
                    ? true
                    : (0, types_1.notEmpty)(x[field])) &&
                ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showDeprecated) ? true : !x.deprecated))
                .map(x => x[field]);
        },
        /**
         * Convert to dropdown options, automatically sorted by index.
         * Includes optional iconText if present in the enum item.
         */
        toOptions: (filter, filterOptions) => {
            return [
                ...(rawEnum || []),
            ]
                .sort((a, b) => ((a === null || a === void 0 ? void 0 : a.index) && (b === null || b === void 0 ? void 0 : b.index) ? ((a === null || a === void 0 ? void 0 : a.index) || 0) - ((b === null || b === void 0 ? void 0 : b.index) || 0) : 0))
                .filter(x => (filter ? filter(x) : true) &&
                ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showEmpty) ? true : (0, types_1.notEmpty)(x)) &&
                ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showDeprecated) ? true : !x.deprecated))
                .map(item => (Object.assign({ label: item.display || item.key, value: item.value }, (item.iconText ? { iconText: item.iconText } : {}))));
        },
        // Array extraction methods - these get arrays of specific properties
        toValues: (filter, filterOptions) => Object.values(rawEnum)
            .filter(x => (filter ? filter(x) : true) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showEmpty) ? true : (0, types_1.notEmpty)(x)) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showDeprecated) ? true : !x.deprecated))
            .map((item) => item.value),
        toKeys: (filter, filterOptions) => Object.values(rawEnum)
            .filter(x => (filter ? filter(x) : true) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showEmpty) ? true : (0, types_1.notEmpty)(x)) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showDeprecated) ? true : !x.deprecated))
            .map((item) => item.key),
        toDisplays: (filter, filterOptions) => Object.values(rawEnum)
            .filter(x => (filter ? filter(x) : true) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showEmpty) ? true : (0, types_1.notEmpty)(x)) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showDeprecated) ? true : !x.deprecated))
            .map((item) => item.display),
        toEnumItems: (filter, filterOptions) => Object.values(rawEnum).filter(x => (filter ? filter(x) : true) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showEmpty) ? true : (0, types_1.notEmpty)(x)) &&
            ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showDeprecated) ? true : !x.deprecated)),
        /**
         * Creates a new object with filtered enum items.
         * Useful for creating subset enums or when you need an object format.
         */
        toExtendableObject: (filter, filterOptions) => {
            return Object.values(rawEnum)
                .filter(x => (filter ? filter(x) : true) &&
                ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showEmpty) ? true : (0, types_1.notEmpty)(x)) &&
                ((filterOptions === null || filterOptions === void 0 ? void 0 : filterOptions.showDeprecated) ? true : !x.deprecated))
                .reduce((acc, item) => {
                acc[item.key] = item;
                return acc;
            }, {});
        },
    };
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZXh0ZW5zaW9uTWV0aG9kcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uL3NyYy9leHRlbnNpb25NZXRob2RzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7OztBQUNBLG1DQU9pQjtBQUVqQjs7Ozs7OztHQU9HO0FBQ0ksTUFBTSxtQkFBbUIsR0FBRyxDQUtqQyxTQUE0QyxFQUM1QyxxQkFFMkIsRUFDM0IsRUFBRTtJQUNGLE1BQU0sZ0JBQWdCLEdBQUcscUJBQXFCLENBQzVDLFNBQVMsQ0FDVixDQUFDO0lBQ0YsSUFBSSxLQUFLLEdBQUcsRUFBNEIsQ0FBQztJQUN6QyxJQUFJLHFCQUFxQixFQUFFLENBQUM7UUFDMUIsS0FBSyxHQUFHLHFCQUFxQixDQUFDLFNBQVMsQ0FBQyxDQUFDO0lBQzNDLENBQUM7SUFDRCx1Q0FBWSxnQkFBZ0IsR0FBSyxLQUFLLEVBQUc7QUFDM0MsQ0FBQyxDQUFDO0FBbEJXLFFBQUEsbUJBQW1CLHVCQWtCOUI7QUFFRjs7Ozs7R0FLRztBQUNILE1BQU0scUJBQXFCLEdBQUcsQ0FDNUIsT0FBMEMsRUFDRCxFQUFFO0lBQzNDLE9BQU87UUFDTCxpRUFBaUU7UUFFakUsU0FBUyxFQUFFLENBQUMsTUFBYyxFQUFFLEVBQUU7WUFDNUIsTUFBTSxJQUFJLEdBQ1IsTUFBTSxDQUFDLE1BQU0sQ0FBQyxPQUFPLENBQ3RCLENBQUMsSUFBSSxDQUNKLENBQUMsS0FBc0MsRUFBRSxFQUFFLENBQUMsS0FBSyxDQUFDLEtBQUssS0FBSyxNQUFNLENBQ25FLENBQUM7WUFDRixJQUFJLENBQUMsSUFBSSxFQUFFLENBQUM7Z0JBQ1YsTUFBTSxJQUFJLEtBQUssQ0FBQyw0QkFBNEIsTUFBTSxHQUFHLENBQUMsQ0FBQztZQUN6RCxDQUFDO1lBQ0QsT0FBTyxJQUFJLENBQUM7UUFDZCxDQUFDO1FBRUQsWUFBWSxFQUFFLENBQUMsTUFBc0IsRUFBRSxFQUFFO1lBQ3ZDLElBQUksQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDWixPQUFP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