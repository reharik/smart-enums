import { capitalCase, constantCase } from 'case-anything';

import { addExtensionMethods } from './extensionMethods';
import { EnumFromArr, EnumFromArrProps, PropertyAutoFormatter } from './types';

export const enumFromArr = <
  TSource extends readonly string[],
  TEnumItemExtension,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TExtraExtensionMethods = {},
>({
  input,
  extraExtensionMethods,
  propertyAutoFormatters,
}: EnumFromArrProps<
  TSource,
  TEnumItemExtension,
  TExtraExtensionMethods
>): EnumFromArr<TSource, TEnumItemExtension, TExtraExtensionMethods> => {
  const formatProperties = (
    k: string,
    formatters: PropertyAutoFormatter[] = [],
  ) =>
    formatters.reduce((acc: Record<string, string>, formatter) => {
      acc[formatter.key as keyof typeof acc] = formatter.format(k);
      return acc;
    }, {});
  const rawEnum = Object.fromEntries(
    input.map((k, i) => [
      k,
      {
        key: k,
        index: i,
        value: constantCase(k),
        display: capitalCase(k),
        ...formatProperties(k, propertyAutoFormatters),
      },
    ]),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;

  return {
    ...rawEnum,
    ...addExtensionMethods<TSource, TEnumItemExtension, TExtraExtensionMethods>(
      Object.values(rawEnum),
      extraExtensionMethods,
    ),
  };
};
