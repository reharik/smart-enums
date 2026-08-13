import type { CoreEnumMethods, StandardEnumItem } from './types.js';
import { enumItemsEqual } from './utilities/enumItemsEqual.js';
import { isSmartEnumItem } from './utilities/typeGuards.js';

const switchOnImpl = (
  obj: object,
  prop: string,
  handlers: Record<string, ((v: unknown) => unknown) | undefined>,
): unknown => {
  const member = (obj as Record<string, unknown> | undefined)?.[prop];
  if (!isSmartEnumItem(member)) {
    throw new TypeError(
      `switchOn: '${prop}' does not hold a smart-enum member`,
    );
  }
  const fn = handlers[member.key];
  if (!fn) {
    throw new Error(`switchOn: no arm for '${member.key}' on '${prop}'`);
  }
  return fn(obj);
};

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
    // The literal-preserving conditional return type only resolves per call
    // site; the runtime lookup is unchanged, so assert the declared shape.
    fromValue: ((value: string) =>
      requireBy(
        'value',
        value as TItem['value'],
        'value',
      )) as CoreEnumMethods<TItem>['fromValue'],
    tryFromValue: value =>
      value ? findBy('value', value as TItem['value']) : undefined,

    fromKey: key => requireBy('key', key as TItem['key'], 'key'),
    tryFromKey: key => (key ? findBy('key', key as TItem['key']) : undefined),

    equals: enumItemsEqual,

    has: (x: unknown): x is TItem =>
      enumItems.some(item => enumItemsEqual(item, x)),

    items: () => [...enumItems],
    values: () => enumItems.map(item => item.value),
    keys: () => enumItems.map(item => item.key),

    switchOn: switchOnImpl as CoreEnumMethods<TItem>['switchOn'],

    toOptions: (): Array<{ value: string; label: string }> =>
      [...enumItems].map(item => ({ value: item.value, label: item.display })),
  };
};
