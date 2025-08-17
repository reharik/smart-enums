import { enumFromArr } from './enumFromArr';
import { enumFromObj, ExpandedSource } from './enumFromObj';
import {
  BaseEnum,
  EnumFromArr,
  EnumFromArrProps,
  EnumFromObj,
  EnumFromObjProps,
} from './types';

function enumeration<
  TSource extends readonly string[],
  TEnumItemExtension,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TExtraExtensionMethods = {},
>({
  input,
  extraExtensionMethods,
  transform,
  propertyAutoFormatters,
}: EnumFromArrProps<
  TSource,
  TEnumItemExtension,
  TExtraExtensionMethods
>): EnumFromArr<TSource, TEnumItemExtension, TExtraExtensionMethods>;

function enumeration<
  TSource extends { [k: string]: BaseEnum & TEnumItemExtension },
  TEnumItemExtension,
  // eslint-disable-next-line @typescript-eslint/ban-types
  TExtraExtensionMethods = {},
>({
  input,
  extraExtensionMethods,
  transform,
  propertyAutoFormatters,
}: EnumFromObjProps<
  TSource,
  TEnumItemExtension,
  TExtraExtensionMethods
>): EnumFromObj<
  ExpandedSource<TSource>,
  TEnumItemExtension,
  TExtraExtensionMethods
>;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function enumeration(arg: any) {
  if (Array.isArray(arg.input)) {
    return enumFromArr(arg);
  }
  if (typeof arg.input === 'object') {
    return enumFromObj(arg);
  }
}

export { enumeration };
