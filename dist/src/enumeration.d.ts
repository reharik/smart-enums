import { ExpandedSource } from './enumFromObj';
import { BaseEnum, EnumFromArr, EnumFromArrProps, EnumFromObj, EnumFromObjProps } from './types';
declare function enumeration<TSource extends readonly string[], TEnumItemExtension, TExtraExtensionMethods = {}>({ input, extraExtensionMethods, transform, propertyAutoFormatters, }: EnumFromArrProps<TSource, TEnumItemExtension, TExtraExtensionMethods>): EnumFromArr<TSource, TEnumItemExtension, TExtraExtensionMethods>;
declare function enumeration<TSource extends {
    [k: string]: BaseEnum & TEnumItemExtension;
}, TEnumItemExtension, TExtraExtensionMethods = {}>({ input, extraExtensionMethods, transform, propertyAutoFormatters, }: EnumFromObjProps<TSource, TEnumItemExtension, TExtraExtensionMethods>): EnumFromObj<ExpandedSource<TSource>, TEnumItemExtension, TExtraExtensionMethods>;
export { enumeration };
//# sourceMappingURL=enumeration.d.ts.map