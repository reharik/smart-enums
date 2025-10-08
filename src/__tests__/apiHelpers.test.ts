import { enumeration } from '../index.js';
import { reviveAfterTransport, serializeForTransport } from '../index.js';
import type { SmartApiHelperConfig } from '../types.js';

describe('API Helpers - Edge Cases and Performance', () => {
  // Setup test enums
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active', 'suspended', 'deleted'] as const,
  });

  const OrderStatus = enumeration('OrderStatus', {
    input: [
      'draft',
      'submitted',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ] as const,
  });

  const Priority = enumeration('Priority', {
    input: ['low', 'medium', 'high', 'urgent'] as const,
  });

  const config: SmartApiHelperConfig = {
    enumRegistry: {
      UserStatus,
      OrderStatus,
      Priority,
    },
    fieldEnumMapping: {
      'user.status': 'UserStatus',
      'user.profile.priority': 'Priority',
      'orders.status': 'OrderStatus',
      'orders[].status': 'OrderStatus',
      'data.users.status': 'UserStatus',
      'data.users.orders.status': 'OrderStatus',
      'data.users[].status': 'UserStatus',
      'data.users[].orders[].status': 'OrderStatus',
    },
  };

  describe('Edge Cases', () => {
    it('should handle empty objects and arrays', () => {
      const emptyData = { users: [], metadata: {} };
      const serialized = serializeForTransport(emptyData);
      expect(serialized).toEqual(emptyData);

      const revived = reviveAfterTransport(emptyData, config);
      expect(revived).toEqual(emptyData);
    });

    it('should handle null and undefined values', () => {
      const dataWithNulls = {
        user: undefined,
        status: undefined,
        orders: [undefined, undefined],
      };

      const serialized = serializeForTransport(dataWithNulls);
      expect(serialized).toEqual(dataWithNulls);

      const revived = reviveAfterTransport(dataWithNulls, config);
      expect(revived).toEqual(dataWithNulls);
    });

    it('should handle missing enum types in registry', () => {
      const requestWithUnknownEnum = {
        user: {
          status: { __smart_enum_type: 'UnknownEnum', value: 'SOME_VALUE' },
        },
      };

      const revived = reviveAfterTransport<typeof requestWithUnknownEnum>(
        requestWithUnknownEnum,
        config,
      );
      // Should leave unknown enum types as-is
      expect(revived.user.status).toEqual({
        __smart_enum_type: 'UnknownEnum',
        value: 'SOME_VALUE',
      });
    });

    it('should handle invalid enum values', () => {
      const requestWithInvalidValue = {
        user: {
          status: { __smart_enum_type: 'UserStatus', value: 'INVALID_STATUS' },
        },
      };

      const revived = reviveAfterTransport<typeof requestWithInvalidValue>(
        requestWithInvalidValue,
        config,
      );
      // Should leave invalid enum values as-is
      expect(revived.user.status).toEqual({
        __smart_enum_type: 'UserStatus',
        value: 'INVALID_STATUS',
      });
    });
  });

  describe('Performance and Memory', () => {
    it('should handle large datasets efficiently', () => {
      const largeDataset = {
        users: Array.from({ length: 1000 }, (_, i) => ({
          id: `user-${i}`,
          status: UserStatus.active,
          orders: Array.from({ length: 10 }, (_, j) => ({
            id: `order-${i}-${j}`,
            status: OrderStatus.processing,
          })),
        })),
      };

      const start = Date.now();
      const serialized = serializeForTransport(largeDataset);
      const serializationTime = Date.now() - start;

      const start2 = Date.now();
      const revived = reviveAfterTransport<typeof largeDataset>(
        serialized,
        config,
      );
      const revivalTime = Date.now() - start2;

      // Should complete within reasonable time (adjust thresholds as needed)
      expect(serializationTime).toBeLessThan(1000); // 1 second
      expect(revivalTime).toBeLessThan(1000); // 1 second

      // Verify data integrity
      expect(revived.users).toHaveLength(1000);
      expect(revived.users[0].status).toBe(UserStatus.active);
      expect(revived.users[0].orders).toHaveLength(10);
      expect(revived.users[0].orders[0].status).toBe(OrderStatus.processing);
    });
  });
});
