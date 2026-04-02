import { cobolCase } from 'case-anything';

import { Enumeration } from '../types.js';
import { enumeration } from '../index.js';

describe('ENUM FROM ARRAY', () => {
  const input = ['one', 'two', 'three'] as const;
  describe('When calling enumeration', () => {
    it('should create the enum with the props from array values', () => {
      type TestEnum = Enumeration<typeof TestEnum>;
      const TestEnum = enumeration('TestEnum', {
        input,
      });
      expect(TestEnum.keys()).toEqual(['one', 'two', 'three']);
    });
  });
  it('should create the enum items with the correct properties and values', () => {
    type TestEnum = Enumeration<typeof TestEnum>;
    const TestEnum = enumeration('TestEnum', {
      input,
    });
    expect(TestEnum.one.key).toBe('one');
    expect(TestEnum.one.value).toBe('ONE');
    expect(TestEnum.one.display).toBe('One');
    expect(TestEnum.one.index).toBe(0);
    expect(TestEnum.two.index).toBe(1);
  });

  describe('when passing function for displayFormatter', () => {
    it('should return proper result for display', () => {
      const inputForDisplay = ['favoriteColor', 'lastKnownAddress'] as const;
      const propertyAutoFormatters = [
        {
          key: 'display',
          format: (k: string) => {
            return cobolCase(k);
          },
        },
      ];
      type TestEnum = Enumeration<typeof TestEnum>;
      const TestEnum = enumeration('TestEnum', {
        input: inputForDisplay,
        propertyAutoFormatters,
      });
      expect(TestEnum.favoriteColor.display).toEqual('FAVORITE-COLOR');
      expect(TestEnum.lastKnownAddress.display).toEqual('LAST-KNOWN-ADDRESS');
    });
  });
  // describe('when using an enum as a param for a func ', () => {
  //   it('should only accept parm from specified enum. i.e. not from any other enums', () => {
  //     const color = ['red', 'blue', 'green'] as const;

  //     type ColorEnum = Enumeration<typeof ColorEnum, typeof color>;
  //     const ColorEnum = enumeration('TestEnum', {
  //       input: color,
  //     });
  //     type TestEnum = Enumeration<typeof TestEnum, typeof input>;
  //     const TestEnum = enumeration('TestEnum', {
  //       input,
  //     });

  //     const func = (x: ColorEnum) => {};
  //     func(TestEnum.one);
  //   });
  // });
});
