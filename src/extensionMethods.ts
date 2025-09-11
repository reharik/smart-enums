import {
  DropdownOption,
  BaseEnum,
  EnumFilterOptions,
  EnumItem,
  ExtensionMethods,
  notEmpty,
} from './types.js';

/**
 * Adds extension methods to an enum object.
 * This is the main factory that creates all the utility methods for enum lookup and filtering.
 *
 * @param enumItems - Array of all enum items
 * @param extraExtensionMethods - Optional factory for additional custom methods
 * @returns An object containing all standard extension methods plus any custom methods
 */

export const addExtensionMethods = <
  T,
  TEnumItemExtension = Record<string, never>,
  TExtraExtensionMethods = Record<string, never>,
>(
  enumItems: EnumItem<T, TEnumItemExtension>[],
  extraExtensionMethods?: (
    enumItems: EnumItem<T, TEnumItemExtension>[],
  ) => TExtraExtensionMethods,
) => {
  const extensionMethods = buildExtensionMethods<T, TEnumItemExtension>(
    enumItems,
  );
  let extra = {} as TExtraExtensionMethods;
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
const buildExtensionMethods = <T, TEnumItemExtension>(
  rawEnum: EnumItem<T, TEnumItemExtension>[],
): ExtensionMethods<
  { [k: string]: EnumItem<T, TEnumItemExtension> },
  TEnumItemExtension
> => {
  return {
    // Lookup methods - these find enum items by different properties

    fromValue: (target: string) => {
      const item = Object.values(rawEnum).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.value === target,
      );
      if (!item) {
        throw new Error(`No enum value found for '${target}'`);
      }
      return item;
    },

    tryFromValue: (target?: string | null) => {
      if (!target) {
        return;
      }
      return Object.values(rawEnum).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.value === target,
      );
    },

    fromKey: (target: string) => {
      const item = Object.values(rawEnum).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.key === target,
      );
      if (!item) {
        throw new Error(`No enum key found for '${target}'`);
      }
      return item;
    },

    tryFromKey: (target?: string | null) => {
      if (!target) {
        return;
      }
      return Object.values(rawEnum).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.key === target,
      );
    },

    /**
     * Flexible lookup by any custom field.
     * Useful when enum items have additional properties beyond the standard ones.
     */
    tryFromCustomField: (
      field: keyof EnumItem<T, TEnumItemExtension>,
      target?: string | null,
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    ) => {
      if (!target) {
        return;
      }
      return (
        Object.values(rawEnum)
          // eslint-disable-next-line unicorn/no-array-callback-reference
          .filter(filter || (() => true))
          .find(
            (value: EnumItem<T, TEnumItemExtension>) => value[field] === target,
          )
      );
    },

    fromDisplay: (target: string) => {
      const item = Object.values(rawEnum).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.display === target,
      );
      if (!item) {
        throw new Error(`No enum display found for '${target}'`);
      }
      return item;
    },

    tryFromDisplay: (target?: string | null) => {
      if (!target) {
        return;
      }
      return Object.values(rawEnum).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.display === target,
      );
    },

    // Transformation methods - these convert enum items to different formats

    /**
     * Extract values from a specific custom field across all items.
     * Respects filter options for empty and deprecated items.
     */
    toCustomFieldValues: <CustomFieldType = string>(
      field: keyof TEnumItemExtension,
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) => {
      return Object.values(rawEnum)
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty
              ? true
              : notEmpty(x[field] as CustomFieldType)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .map(x => x[field] as CustomFieldType);
    },

    /**
     * Convert to dropdown options, automatically sorted by index.
     * Includes optional iconText if present in the enum item.
     */
    toOptions: (
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ): DropdownOption[] => {
      return [
        ...((rawEnum as (EnumItem<T, TEnumItemExtension> & {
          iconText?: string;
        })[]) || []),
      ]
        .sort(
          (
            a: EnumItem<T, TEnumItemExtension>,
            b: EnumItem<T, TEnumItemExtension>,
          ) => (a?.index && b?.index ? (a?.index || 0) - (b?.index || 0) : 0),
        )
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .map(item => ({
          label: item.display || item.key,
          value: item.value,
          ...(item.iconText ? { iconText: item.iconText } : {}),
        }));
    },

    // Array extraction methods - these get arrays of specific properties

    toValues: (
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) =>
      Object.values(rawEnum)
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .map((item: EnumItem<T, TEnumItemExtension>) => item.value),

    toKeys: (
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) =>
      Object.values(rawEnum)
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .map((item: EnumItem<T, TEnumItemExtension>) => item.key),

    toDisplays: (
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) =>
      Object.values(rawEnum)
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .map(
          (item: EnumItem<T, TEnumItemExtension>) => item.display,
        ) as string[],

    toEnumItems: (
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) =>
      Object.values(rawEnum).filter(
        x =>
          (filter ? filter(x) : true) &&
          (filterOptions?.showEmpty ? true : notEmpty(x)) &&
          (filterOptions?.showDeprecated ? true : !x.deprecated),
      ),

    /**
     * Creates a new object with filtered enum items.
     * Useful for creating subset enums or when you need an object format.
     */
    toExtendableObject: <ITEM_TYPE extends BaseEnum>(
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) => {
      type ExtObject = Record<string, ITEM_TYPE>;
      return Object.values(rawEnum)
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .reduce((acc: ExtObject, item) => {
          acc[item.key] = item as unknown as ITEM_TYPE;
          return acc;
        }, {} as ExtObject);
    },
  };
};
