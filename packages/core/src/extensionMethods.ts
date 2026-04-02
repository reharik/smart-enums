import type { CoreEnumMethods, StandardEnumItem } from './types.js';
export const addExtensionMethods = <TItem extends StandardEnumItem>(
  enumItems: readonly TItem[],
): CoreEnumMethods<TItem> => {
  const findBy = <K extends keyof TItem>(field: K, target: TItem[K]) =>
    enumItems.find(item => item[field] === target);

  const requireBy = <K extends keyof TItem>(
    field: K,
    target: TItem[K],
    label: string,
  ) => {
    const item = findBy(field, target);
    if (!item) {
      throw new Error(`No enum ${label} found for '${String(target)}'`);
    }
    return item;
  };

  return {
    fromValue: value => requireBy('value', value as TItem['value'], 'value'),
    tryFromValue: value =>
      value ? findBy('value', value as TItem['value']) : undefined,

    fromKey: key => requireBy('key', key as TItem['key'], 'key'),
    tryFromKey: key => (key ? findBy('key', key as TItem['key']) : undefined),

    items: () => [...enumItems],
    values: () => enumItems.map(item => item.value),
    keys: () => enumItems.map(item => item.key),
  };
};
