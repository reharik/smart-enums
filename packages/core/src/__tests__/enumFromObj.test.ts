import { cobolCase } from 'case-anything';

import { Enumeration } from '../types.js';
import { enumeration } from '../index.js';

describe('ENUM FROM OBJECT', () => {
  const input = {
    one: { value: 'ONE' },
    two: { value: 'TWO' },
    three: { value: 'THREE' },
  };
  describe('When calling enumeration', () => {
    it('should create the enum with the props from object values', () => {
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

  describe('when extending enum items with extra properties', () => {
    it('should allow accessing custom fields defined in the input', () => {
      const inputWithExt = {
        one: { slug: '/one' },
        two: { slug: '/two', title: 'Two' },
        three: { slug: '/three' },
      } as const;

      const TestEnum = enumeration<typeof inputWithExt>('TestEnum', {
        input: inputWithExt,
      });

      expect(TestEnum.one.slug).toBe('/one');
      expect(TestEnum.two.slug).toBe('/two');
      expect(TestEnum.two.title).toBe('Two');
      expect(Object.hasOwn(TestEnum.three, 'title')).toBe(false);
    });

    describe('when passing function for displayFormatter', () => {
      it('should return proper result for display', () => {
        const inputForDisplay = {
          favoriteColor: { value: 'FAVORITE_COLOR' },
          lastKnownAddress: { value: 'LAST_KNOWN_ADDRESS' },
        };
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
      });
    });
    // describe('when using an enum as a param for a func ', () => {
    //   it('should only accept parm from specified enum. i.e. not from any other enums', () => {
    //     const color = {
    //       red: { value: 'RED' },
    //       blue: { value: 'BLUE' },
    //       green: { value: 'GREEN' },
    //     };
    //     type ColorEnum = (typeof ColorEnum)[keyof typeof color];
    //     const ColorEnum = enumeration('TestEnum', {
    //       input: color,
    //     });
    //     type TestEnum = (typeof TestEnum)[keyof typeof input];
    //     const TestEnum = enumeration('TestEnum', {
    //       input,
    //     });

    //     const func = (x: ColorEnum) => {};
    //     func(TestEnum.one);
    //   });
    // });
  });
});
