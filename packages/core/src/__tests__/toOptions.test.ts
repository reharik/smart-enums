import { enumeration, pickEnum } from '../index.js';

describe('toOptions', () => {
  describe('array-based enums', () => {
    const TestEnum = enumeration('ToOptionsArrayEnum', {
      input: ['one', 'two', 'three'] as const,
    });

    it('maps every member to { value, label } in declaration order', () => {
      expect(TestEnum.toOptions()).toEqual([
        { value: 'ONE', label: 'One' },
        { value: 'TWO', label: 'Two' },
        { value: 'THREE', label: 'Three' },
      ]);
    });

    it('returns a new array of new objects on each call', () => {
      const first = TestEnum.toOptions();
      const second = TestEnum.toOptions();

      expect(first).not.toBe(second);
      expect(first[0]).not.toBe(second[0]);

      // mutating a result must not leak into later calls
      first[0]!.label = 'mutated';
      expect(TestEnum.toOptions()[0]).toEqual({ value: 'ONE', label: 'One' });
    });
  });

  describe('object-based enums', () => {
    const ObjectEnum = enumeration('ToOptionsObjectEnum', {
      input: {
        first: { value: 'FIRST', display: 'First item' },
        second: { value: 'SECOND', display: 'Second item' },
      } as const,
    });

    it('uses the custom display as the label', () => {
      expect(ObjectEnum.toOptions()).toEqual([
        { value: 'FIRST', label: 'First item' },
        { value: 'SECOND', label: 'Second item' },
      ]);
    });
  });

  describe('subset views', () => {
    const EntityType = enumeration('ToOptionsEntityType', {
      input: ['comment', 'mediaItem', 'album'] as const,
    });

    it('scopes options to the subset on pickEnum views', () => {
      const view = pickEnum(EntityType, ['comment', 'album'] as const);

      expect(view.toOptions()).toEqual([
        { value: 'COMMENT', label: 'Comment' },
        { value: 'ALBUM', label: 'Album' },
      ]);
    });
  });
});
