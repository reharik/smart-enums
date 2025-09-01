import { notEmpty, } from './types.js';
/**
 * Adds extension methods to an enum object.
 * This is the main factory that creates all the utility methods for enum lookup and filtering.
 *
 * @param enumItems - Array of all enum items
 * @param extraExtensionMethods - Optional factory for additional custom methods
 * @returns An object containing all standard extension methods plus any custom methods
 */
export const addExtensionMethods = (enumItems, extraExtensionMethods) => {
    const extensionMethods = buildExtensionMethods(enumItems);
    let extra = {};
    if (extraExtensionMethods) {
        extra = extraExtensionMethods(enumItems);
    }
    return { ...extensionMethods, ...extra };
};
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
                return;
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
                return;
            }
            return Object.values(rawEnum).find((value) => value.key === target);
        },
        /**
         * Flexible lookup by any custom field.
         * Useful when enum items have additional properties beyond the standard ones.
         */
        tryFromCustomField: (field, target, filter) => {
            if (!target) {
                return;
            }
            return (Object.values(rawEnum)
                // eslint-disable-next-line unicorn/no-array-callback-reference
                .filter(filter || (() => true))
                .find((value) => value[field] === target));
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
                return;
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
                (filterOptions?.showEmpty
                    ? true
                    : notEmpty(x[field])) &&
                (filterOptions?.showDeprecated ? true : !x.deprecated))
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
                .sort((a, b) => (a?.index && b?.index ? (a?.index || 0) - (b?.index || 0) : 0))
                .filter(x => (filter ? filter(x) : true) &&
                (filterOptions?.showEmpty ? true : notEmpty(x)) &&
                (filterOptions?.showDeprecated ? true : !x.deprecated))
                .map(item => ({
                label: item.display || item.key,
                value: item.value,
                ...(item.iconText ? { iconText: item.iconText } : {}),
            }));
        },
        // Array extraction methods - these get arrays of specific properties
        toValues: (filter, filterOptions) => Object.values(rawEnum)
            .filter(x => (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated))
            .map((item) => item.value),
        toKeys: (filter, filterOptions) => Object.values(rawEnum)
            .filter(x => (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated))
            .map((item) => item.key),
        toDisplays: (filter, filterOptions) => Object.values(rawEnum)
            .filter(x => (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated))
            .map((item) => item.display),
        toEnumItems: (filter, filterOptions) => Object.values(rawEnum).filter(x => (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated)),
        /**
         * Creates a new object with filtered enum items.
         * Useful for creating subset enums or when you need an object format.
         */
        toExtendableObject: (filter, filterOptions) => {
            return Object.values(rawEnum)
                .filter(x => (filter ? filter(x) : true) &&
                (filterOptions?.showEmpty ? true : notEmpty(x)) &&
                (filterOptions?.showDeprecated ? true : !x.deprecated))
                .reduce((acc, item) => {
                acc[item.key] = item;
                return acc;
            }, {});
        },
    };
};
