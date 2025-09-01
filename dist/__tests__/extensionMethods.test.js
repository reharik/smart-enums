import { enumeration } from '../enumeration.js';
import { addExtensionMethods } from '../extensionMethods.js';
const input = ['one', 'two'];
describe('ENUM EXTENSION METHODS', () => {
    describe('Add Extension Methods', () => {
        beforeEach(() => { });
        describe('when calling addExtensionMethods with out extras', () => {
            it('should return extensionMethods. i.e. not break', () => {
                const TestEnum = enumeration({ input });
                const enumItems = TestEnum.toEnumItems();
                const result = addExtensionMethods(enumItems);
                expect(result).not.toBeUndefined();
            });
        });
        describe('when calling addExtensionMethods with extra functions', () => {
            it('should return extensionMethods with the extra functions', () => {
                const testEnum = enumeration({
                    input,
                });
                const enumItems = testEnum.toEnumItems();
                const em = (enumItems) => ({
                    func1: (target) => {
                        return enumItems.filter(x => x.value.includes(target));
                    },
                });
                const result = addExtensionMethods(enumItems, em);
                expect(result.func1).not.toBeUndefined();
            });
        });
        describe('when calling addExtensionMethods with extra functions that work', () => {
            it('should return extensionMethods and they should work', () => {
                const testEnum = enumeration({
                    input,
                });
                const enumItems = testEnum.toEnumItems();
                const em = (enumItems) => ({
                    func1: (target) => {
                        return enumItems.filter(x => x.value.includes(target));
                    },
                });
                const result = addExtensionMethods(enumItems, em);
                expect(result.func1('T')).toEqual([
                    { display: 'Two', index: 1, key: 'two', value: 'TWO' },
                ]);
            });
        });
    });
    describe('From Value', () => {
        describe('when calling fromValue with no match', () => {
            it('should throw', () => {
                const TestEnum = enumeration({
                    input,
                });
                expect(() => TestEnum.fromValue('bubba')).toThrow(`No enum value found for 'bubba'`);
            });
        });
        describe('when calling fromValue WITH match', () => {
            it('should return proper item', () => {
                const TestEnum = enumeration({
                    input,
                });
                expect(TestEnum.fromValue('TWO')).toEqual({
                    display: 'Two',
                    index: 1,
                    key: 'two',
                    value: 'TWO',
                });
            });
        });
        describe('Try From Value', () => {
            describe('when calling tryFomValue with no match', () => {
                it('should return undefined', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(TestEnum.tryFromValue('bubba')).toBeUndefined();
                });
            });
            describe('when calling fromValue WITH match', () => {
                it('should return proper item', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(TestEnum.tryFromValue('TWO')).toEqual({
                        display: 'Two',
                        index: 1,
                        key: 'two',
                        value: 'TWO',
                    });
                });
            });
        });
        describe('From Key', () => {
            describe('when calling fromKey with no match', () => {
                it('should throw', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(() => TestEnum.fromKey('bubba')).toThrow(`No enum key found for 'bubba'`);
                });
            });
            describe('when calling fromKey WITH match', () => {
                it('should return proper item', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(TestEnum.fromKey('two')).toEqual({
                        display: 'Two',
                        index: 1,
                        key: 'two',
                        value: 'TWO',
                    });
                });
            });
            describe('Try From Key', () => {
                describe('when calling tryFomKey with no match', () => {
                    it('should return undefined', () => {
                        const TestEnum = enumeration({
                            input,
                        });
                        expect(TestEnum.tryFromKey('bubba')).toBeUndefined();
                    });
                });
                describe('when calling fromKey WITH match', () => {
                    it('should return proper item', () => {
                        const TestEnum = enumeration({
                            input,
                        });
                        expect(TestEnum.tryFromKey('two')).toEqual({
                            display: 'Two',
                            index: 1,
                            key: 'two',
                            value: 'TWO',
                        });
                    });
                });
            });
        });
        describe('From Display', () => {
            describe('when calling fromDisplay with no match', () => {
                it('should throw', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(() => TestEnum.fromDisplay('bubba')).toThrow(`No enum display found for 'bubba'`);
                });
            });
            describe('when calling fromDisplay WITH match', () => {
                it('should return proper item', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(TestEnum.fromDisplay('Two')).toEqual({
                        display: 'Two',
                        index: 1,
                        key: 'two',
                        value: 'TWO',
                    });
                });
            });
            describe('Try From Display', () => {
                describe('when calling tryFomDisplay with no match', () => {
                    it('should return undefined', () => {
                        const TestEnum = enumeration({
                            input,
                        });
                        expect(TestEnum.tryFromDisplay('bubba')).toBeUndefined();
                    });
                });
                describe('when calling fromDisplay WITH match', () => {
                    it('should return proper item', () => {
                        const TestEnum = enumeration({
                            input,
                        });
                        expect(TestEnum.tryFromDisplay('Two')).toEqual({
                            display: 'Two',
                            index: 1,
                            key: 'two',
                            value: 'TWO',
                        });
                    });
                });
            });
        });
        describe('Try From Custom Field', () => {
            describe('when calling tryFromCustomField when no custom fields are set', () => {
                it('should return undefined', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    const result = TestEnum.tryFromCustomField('bubba', 'likesIt');
                    expect(result).toBeUndefined();
                });
            });
        });
        describe('when calling tryFromCustomField when no custom fields have been set but no match', () => {
            it('should return undefined', () => {
                const TestEnum = enumeration({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.tryFromCustomField('bubba', 'likesIt');
                expect(result).toBeUndefined();
            });
        });
        describe('when calling tryFromCustomField when no custom fields have been set AND IS match', () => {
            it('should return return proper enumItem', () => {
                const TestEnum = enumeration({
                    input,
                });
                TestEnum.one.bubba = 'likesIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.tryFromCustomField('bubba', 'likesIt');
                expect(result).toEqual({
                    bubba: 'likesIt',
                    display: 'One',
                    index: 0,
                    key: 'one',
                    value: 'ONE',
                });
            });
        });
    });
    describe('To Custom Field Values', () => {
        describe('when calling toCustomFieldValues with no options', () => {
            it('should return proper array of values', () => {
                const TestEnum = enumeration({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.toCustomFieldValues('bubba');
                expect(result).toEqual(['donLikeIt', 'reallyDonLikeIt']);
            });
            it('should omit undefined', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = enumeration({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.toCustomFieldValues('bubba');
                expect(result).toEqual(['donLikeIt', 'reallyDonLikeIt']);
            });
        });
        describe('when calling toCustomFieldValues with options set', () => {
            it('should not omit undefined', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = enumeration({
                    input,
                });
                TestEnum.one.bubba = 'donLikeIt';
                TestEnum.two.bubba = 'reallyDonLikeIt';
                const result = TestEnum.toCustomFieldValues('bubba', undefined, {
                    showEmpty: true,
                });
                expect(result).toEqual(['donLikeIt', 'reallyDonLikeIt', undefined]);
            });
        });
    });
    describe('To Options', () => {
        describe('when calling toOptions with no filter', () => {
            it('should return proper array of values', () => {
                const TestEnum = enumeration({
                    input,
                });
                const result = TestEnum.toOptions();
                expect(result).toEqual([
                    {
                        label: 'One',
                        value: 'ONE',
                    },
                    {
                        label: 'Two',
                        value: 'TWO',
                    },
                ]);
            });
        });
        describe('when calling toOptions WITH filter', () => {
            it('should return proper array of values', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = enumeration({
                    input,
                });
                const result = TestEnum.toOptions(x => {
                    return x.value !== 'TWO';
                });
                expect(result).toEqual([
                    {
                        label: 'One',
                        value: 'ONE',
                    },
                    {
                        label: 'Three',
                        value: 'THREE',
                    },
                ]);
            });
        });
        describe('when calling toOptions', () => {
            it('should sort by index', () => {
                const input = ['one', 'two', 'three'];
                const TestEnum = enumeration({
                    input,
                });
                TestEnum.one.index = 100;
                TestEnum.three.index = 10;
                TestEnum.two.index = 200;
                const result = TestEnum.toOptions();
                expect(result).toEqual([
                    {
                        label: 'Three',
                        value: 'THREE',
                    },
                    {
                        label: 'One',
                        value: 'ONE',
                    },
                    {
                        label: 'Two',
                        value: 'TWO',
                    },
                ]);
            });
        });
        describe('To Values', () => {
            describe('when calling toValues', () => {
                it('should return all the values', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(TestEnum.toValues()).toEqual(['ONE', 'TWO']);
                });
            });
        });
        describe('To Keys', () => {
            describe('when calling toKeys', () => {
                it('should return all the Keys', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(TestEnum.toKeys()).toEqual(['one', 'two']);
                });
            });
        });
        describe('To Enum Items', () => {
            describe('when calling toEnumItems', () => {
                it('should return all the toEnumItems', () => {
                    const TestEnum = enumeration({
                        input,
                    });
                    expect(TestEnum.toEnumItems()).toEqual([
                        {
                            display: 'One',
                            index: 0,
                            key: 'one',
                            value: 'ONE',
                        },
                        {
                            display: 'Two',
                            index: 1,
                            key: 'two',
                            value: 'TWO',
                        },
                    ]);
                });
            });
        });
    });
});
