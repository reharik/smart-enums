import {
  DropdownOption,
  BaseEnum,
  EnumFilterOptions,
  EnumItem,
  ExtensionMethods,
  notEmpty,
} from './types';

export const addExtensionMethods = <
  T,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TEnumItemExtension = {},
  // eslint-disable-next-line @typescript-eslint/ban-types
  TExtraExtensionMethods = {},
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

const buildExtensionMethods = <T, TEnumItemExtension>(
  rawEnum: EnumItem<T, TEnumItemExtension>[],
): ExtensionMethods<T, TEnumItemExtension> => {
  return {
    fromValue: (target: string) => {
      const item = (
        Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[]
      ).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.value === target,
      );
      if (!item) {
        throw new Error(`No enum value found for '${target}'`);
      }
      return item;
    },

    tryFromValue: (target?: string | null) => {
      if (!target) {
        return undefined;
      }
      return (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[]).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.value === target,
      );
    },
    fromKey: (target: string) => {
      const item = (
        Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[]
      ).find((value: EnumItem<T, TEnumItemExtension>) => value.key === target);
      if (!item) {
        throw new Error(`No enum key found for '${target}'`);
      }
      return item;
    },
    tryFromKey: (target?: string | null) => {
      if (!target) {
        return undefined;
      }
      return (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[]).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.key === target,
      );
    },
    tryFromCustomField: (
      field: keyof EnumItem<T, TEnumItemExtension>,
      target?: string | null,
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
    ) => {
      if (!target) {
        return undefined;
      }
      return (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[])
        .filter(filter || (() => true))
        .find(
          (value: EnumItem<T, TEnumItemExtension>) => value[field] === target,
        );
    },
    fromDisplay: (target: string) => {
      const item = (
        Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[]
      ).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.display === target,
      );
      if (!item) {
        throw new Error(`No enum display found for '${target}'`);
      }
      return item;
    },
    tryFromDisplay: (target?: string | null) => {
      if (!target) {
        return undefined;
      }
      return (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[]).find(
        (value: EnumItem<T, TEnumItemExtension>) => value.display === target,
      );
    },
    toCustomFieldValues: <CustomFieldType = string>(
      field: keyof TEnumItemExtension,
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) => {
      return (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[])
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty
              ? true
              : notEmpty(
                  x[field as keyof TEnumItemExtension] as CustomFieldType,
                )) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .map(x => x[field as keyof TEnumItemExtension] as CustomFieldType);
    },
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
          label: item.display || (item.key as string),
          value: item.value,
          ...(item.iconText ? { iconText: item.iconText } : {}),
        }));
    },
    toValues: (
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) =>
      (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[])
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
      (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[])
        .filter(
          x =>
            (filter ? filter(x) : true) &&
            (filterOptions?.showEmpty ? true : notEmpty(x)) &&
            (filterOptions?.showDeprecated ? true : !x.deprecated),
        )
        .map((item: EnumItem<T, TEnumItemExtension>) => item.key) as string[],
    toDisplays: (
      filter?: (item: EnumItem<T, TEnumItemExtension>) => boolean,
      filterOptions?: EnumFilterOptions,
    ) =>
      (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[])
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
      (Object.values(rawEnum) as EnumItem<T, TEnumItemExtension>[]).filter(
        x =>
          (filter ? filter(x) : true) &&
          (filterOptions?.showEmpty ? true : notEmpty(x)) &&
          (filterOptions?.showDeprecated ? true : !x.deprecated),
      ),
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
          acc[item.key as keyof ExtObject] = item as unknown as ITEM_TYPE;
          return acc;
        }, {} as ExtObject);
    },
  };
};
