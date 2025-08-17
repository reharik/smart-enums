import { capitalCase, constantCase } from 'case-anything';
import { addExtensionMethods } from './extensionMethods';
import {
  BaseEnum,
  EnumerationProps,
  EnumItem,
  ExpandedSource,
  ExtensionMethods,
  NormalizedInputType,
  PropertyAutoFormatter,
} from './types';

function enumeration<
  TInput extends readonly string[] | { [k: string]: BaseEnum },
  TEnumItemExtension = Record<string, never>,
  TExtraExtensionMethods = Record<string, never>,
>({
  input,
  extraExtensionMethods,
  propertyAutoFormatters,
}:{
  [K in keyof NormalizedInputType<TInput>]: EnumItem<NormalizedInputType<TInput>, TEnumItemExtension, K>;
} & ExtensionMethods<NormalizedInputType<TInput>, TEnumItemExtension> & TExtraExtensionMethods) {

  
  // Convert array to object format with proper typing
  type NormalizedInput = NormalizedInputType<TInput>;

  const normalizedInput: NormalizedInput = (
    Array.isArray(input)
      ? input.reduce((acc, k) => ({ ...acc, [k]: {} }), {})
      : input
  ) as NormalizedInput;

  // Default formatters
  const formattersWithDefaults = [
    { key: 'value', format: constantCase },
    { key: 'display', format: capitalCase },
    ...propertyAutoFormatters||[],
  ];

  const formatProperties = (k: string, formatters: PropertyAutoFormatter[]) =>
    formatters.reduce((acc: Record<string, string>, formatter) => {
      acc[formatter.key as keyof typeof acc] = formatter.format(k);
      return acc;
    }, {});

  const rawEnum = Object.fromEntries(
    Object.entries(normalizedInput).map(([k, v], i) => [
      k,
      {
        index: i,
        key: k,
        ...formatProperties(k, formattersWithDefaults),
        ...v, // Custom props from original object (or empty {} from converted array)
      },
    ]),
  ) as ExpandedSource<NormalizedInput>;

  return {
    ...rawEnum,
    // this is safe because we are certain that the rawEnum has the base properties as we have added them
    ...addExtensionMethods(
      Object.values(rawEnum) as EnumItem<NormalizedInput, TEnumItemExtension>[],
      extraExtensionMethods,
    ),
  };
}

export { enumeration };
