import { BaseEnum, EnumFromObj, EnumFromObjProps, EnumItem } from './types';
export type ExpandedSource<T extends {
    [k: string]: unknown;
}> = {
    [K in keyof T]: EnumItem<T>;
};
export declare const enumFromObj: <TInput extends {
    [k: string]: BaseEnum;
}, TEnumItemExtension, TExtraExtensionMethods = {}>({ input, extraExtensionMethods, propertyAutoFormatters, }: EnumFromObjProps<TInput, TEnumItemExtension, TExtraExtensionMethods>) => EnumFromObj<ExpandedSource<TInput>, TEnumItemExtension, TExtraExtensionMethods>;
//# sourceMappingURL=enumFromObj.d.ts.map