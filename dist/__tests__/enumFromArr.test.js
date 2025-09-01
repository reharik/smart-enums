import { cobolCase } from 'case-anything';
import { enumeration } from '../enumeration.js';
describe('ENUM FROM ARRAY', () => {
    const input = ['one', 'two', 'three'];
    describe('When calling enumeration', () => {
        it('should create the enum with the props from array values', () => {
            const TestEnum = enumeration({
                input,
            });
            expect(TestEnum.toKeys()).toEqual(['one', 'two', 'three']);
        });
    });
    it('should create the enum items with the correct properties and values', () => {
        const TestEnum = enumeration({
            input,
        });
        expect(TestEnum.one.key).toBe('one');
        expect(TestEnum.one.value).toBe('ONE');
        expect(TestEnum.one.display).toBe('One');
        expect(TestEnum.one.index).toBe(0);
        expect(TestEnum.two.index).toBe(1);
    });
    describe('when creating an enum with an extended enumItem type', () => {
        // TODO this is actually a problem, perhaps insurmountable, but here's
        // a test in case someone does figure it out
        it('should not put those extra properties on the enum unless you add values later', () => {
            const color = ['red', 'blue', 'green'];
            const ColorEnum = enumeration({
                input: color,
            });
            const TestEnum = enumeration({
                input,
            });
            expect(TestEnum.one).not.toHaveProperty('favoriteColor');
            expect(TestEnum.two).not.toHaveProperty('favoriteColor');
        });
        it('should allow you to set those extra properties on the enum', () => {
            const color = ['red', 'blue', 'green'];
            const ColorEnum = enumeration({
                input: color,
            });
            const TestEnum = enumeration({
                input,
            });
            TestEnum.one.favoriteColor = ColorEnum.red;
            TestEnum.two.favoriteColor = ColorEnum.green;
            TestEnum.three.favoriteColor = ColorEnum.blue;
            expect(TestEnum.one.favoriteColor).toBe(ColorEnum.red);
            expect(TestEnum.two.favoriteColor).toBe(ColorEnum.green);
            expect(TestEnum.three.favoriteColor).toBe(ColorEnum.blue);
        });
    });
    describe('when creating an enum with extra extension methods', () => {
        it('should add the extension method to the enum', () => {
            const extra = (items) => ({
                concatKeys: () => items.reduce((acc, x) => {
                    acc += x.key;
                    return acc;
                }, ''),
            });
            const TestEnum = enumeration({
                input,
                extraExtensionMethods: extra,
            });
            expect(TestEnum.concatKeys).not.toBeNull();
        });
        it('should add the extension method which should perform against enum items in current enum', () => {
            const extra = (items) => {
                return {
                    concatKeys: () => items.reduce((acc, x) => {
                        acc += x.key;
                        return acc;
                    }, ''),
                };
            };
            const TestEnum = enumeration({
                input,
                extraExtensionMethods: extra,
            });
            expect(TestEnum.concatKeys()).toBe('onetwothree');
        });
    });
    describe('when creating an enum with extra extension methods that act against custom props', () => {
        it('should add the extension method which should perform against enum items in current enum', () => {
            const color = ['red', 'blue', 'green'];
            const ColorEnum = enumeration({
                input: color,
            });
            const extra = (items) => ({
                concatKeys: () => items.reduce((acc, x) => {
                    acc += x.favoriteColor.key;
                    return acc;
                }, ''),
            });
            const TestEnum = enumeration({
                input,
                extraExtensionMethods: extra,
            });
            TestEnum.one.favoriteColor = ColorEnum.red;
            TestEnum.two.favoriteColor = ColorEnum.green;
            TestEnum.three.favoriteColor = ColorEnum.blue;
            expect(TestEnum.concatKeys()).toBe('redgreenblue');
        });
    });
    describe('when passing function for displayFormatter', () => {
        it('should return proper result for display', () => {
            const inputForDisplay = ['favoriteColor', 'lastKnownAddress'];
            const propertyAutoFormatters = [
                {
                    key: 'display',
                    format: (k) => {
                        return cobolCase(k);
                    },
                },
            ];
            const TestEnum = enumeration({
                input: inputForDisplay,
                propertyAutoFormatters,
            });
            expect(TestEnum.toDisplays()).toEqual([
                'FAVORITE-COLOR',
                'LAST-KNOWN-ADDRESS',
            ]);
        });
    });
    // describe('when using an enum as a param for a func ', () => {
    //   it('should only accept parm from specified enum. i.e. not from any other enums', () => {
    //     const color = ['red', 'blue', 'green'] as const;
    //     type ColorEnum = Enumeration<typeof ColorEnum, typeof color>;
    //     const ColorEnum = enumeration({
    //       input: color,
    //     });
    //     type TestEnum = Enumeration<typeof TestEnum, typeof input>;
    //     const TestEnum = enumeration({
    //       input,
    //     });
    //     const func = (x: ColorEnum) => {};
    //     func(TestEnum.one);
    //   });
    // });
});
