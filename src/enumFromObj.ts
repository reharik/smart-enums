import { addExtensionMethods } from './extensionMethods';
import {
  BaseEnum,
  EnumFromObj,
  EnumFromObjProps,
  EnumItem,
  PropertyAutoFormatter,
} from './types';
import { capitalCase } from 'case-anything';

export type ExpandedSource<T extends { [k: string]: unknown }> = {
  [K in keyof T]: EnumItem<T>;
};

export const enumFromObj = <
  TInput extends { [k: string]: BaseEnum },
  TEnumItemExtension,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TExtraExtensionMethods = {},
>({
  input,
  extraExtensionMethods,
  propertyAutoFormatters,
}: EnumFromObjProps<
  TInput,
  TEnumItemExtension,
  TExtraExtensionMethods
>): EnumFromObj<
  ExpandedSource<TInput>,
  TEnumItemExtension,
  TExtraExtensionMethods
> => {
  const formatProperties = (
    k: string,
    formatters: PropertyAutoFormatter[] = [],
  ) =>
    formatters.reduce((acc: Record<string, string>, formatter) => {
      acc[formatter.key as keyof typeof acc] = formatter.format(k);
      return acc;
    }, {});

  const rawEnum = Object.fromEntries(
    Object.entries(input).map(([k, v], i) => [
      k,
      {
        index: i,
        display: capitalCase(k),
        ...formatProperties(k, propertyAutoFormatters),
        ...v,
        key: k,
      },
    ]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  return {
    ...rawEnum,
    ...addExtensionMethods<TInput, TEnumItemExtension, TExtraExtensionMethods>(
      Object.values(rawEnum),
      extraExtensionMethods,
    ),
  };
};
