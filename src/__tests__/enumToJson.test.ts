import { enumeration } from '../enumeration.js';

describe('ENUM TO JSON', () => {
  describe('when enumTypeId is provided', () => {
    it('should emit { __enum, value } for enum items via JSON.stringify', () => {
      const input = ['pending', 'active', 'completed'] as const;
      const Status = enumeration({ input, enumType: 'Status' });

      const payload = { status: Status.active };
      const json = JSON.stringify(payload);
      const parsed = JSON.parse(json) as typeof payload;

      expect(parsed).toEqual({
        status: { __smart_enum_type: 'Status', value: 'ACTIVE' },
      });
    });

    it('should emit { __enum, value } for items nested in arrays', () => {
      const input = ['red', 'blue'] as const;
      const Color = enumeration({ input, enumType: 'Color' });

      const payload = { items: [Color.red, Color.blue] };
      const json = JSON.stringify(payload);
      const parsed = JSON.parse(json) as typeof payload;

      expect(parsed).toEqual({
        items: [
          { __smart_enum_type: 'Color', value: 'RED' },
          { __smart_enum_type: 'Color', value: 'BLUE' },
        ],
      });
    });
  });
});
