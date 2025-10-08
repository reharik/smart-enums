import { enumeration } from '../../index.js';
import {
  prepareForDatabase,
  reviveFromDatabase,
} from '../../utilities/database/index.js';
import type { SmartApiHelperConfig } from '../../types.js';

describe('Database Helpers', () => {
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
      status: ['UserStatus', 'OrderStatus'], // Try UserStatus first, then OrderStatus
      priority: ['Priority'],
    },
  };

  describe('prepareForDatabase', () => {
    it('should convert enum items to string values for database storage', () => {
      const apiData = {
        user: {
          id: '123',
          status: UserStatus.active,
          profile: {
            priority: Priority.high,
          },
        },
        orders: [
          { id: 'o1', status: OrderStatus.processing },
          { id: 'o2', status: OrderStatus.shipped },
        ],
      };

      const dbData = prepareForDatabase(apiData);

      expect(dbData.user.status).toBe('ACTIVE');
      expect(dbData.user.profile.priority).toBe('HIGH');
      expect(dbData.orders[0].status).toBe('PROCESSING');
      expect(dbData.orders[1].status).toBe('SHIPPED');
    });

    it('should handle complex nested structures', () => {
      const complexData = {
        data: {
          users: [
            {
              status: UserStatus.pending,
              orders: [{ status: OrderStatus.draft }],
            },
          ],
        },
      };

      const dbData = prepareForDatabase(complexData);

      expect(dbData.data.users[0].status).toBe('PENDING');
      expect(dbData.data.users[0].orders[0].status).toBe('DRAFT');
    });
  });

  describe('reviveFromDatabase', () => {
    it('should revive enum values from database records', () => {
      const dbRecord = {
        user: {
          id: '123',
          status: 'ACTIVE',
          profile: {
            priority: 'HIGH',
          },
        },
        orders: [
          {
            id: 'o1',
            status: 'PROCESSING',
          },
          {
            id: 'o2',
            status: 'SHIPPED',
          },
        ],
      };

      const revived = reviveFromDatabase<typeof dbRecord>(dbRecord, config);

      expect(revived.user.status).toBe(UserStatus.active);
      expect(revived.user.profile.priority).toBe(Priority.high);
      expect(revived.orders[0].status).toBe(OrderStatus.processing);
      expect(revived.orders[1].status).toBe(OrderStatus.shipped);
    });

    it('should handle nested objects and arrays', () => {
      const complexRecord = {
        data: {
          users: [
            {
              status: 'PENDING',
              orders: [
                {
                  status: 'DRAFT',
                },
              ],
            },
          ],
        },
      };

      const revived = reviveFromDatabase<typeof complexRecord>(
        complexRecord,
        config,
      );

      expect(revived.data.users[0].status).toBe(UserStatus.pending);
      expect(revived.data.users[0].orders[0].status).toBe(OrderStatus.draft);
    });

    it('should return data as-is when no field mapping is provided', () => {
      const dbRecord = {
        user: {
          id: '123',
          status: 'ACTIVE',
          profile: {
            priority: 'HIGH',
          },
        },
      };

      const configWithoutMapping: SmartApiHelperConfig = {
        enumRegistry: {
          UserStatus,
          OrderStatus,
          Priority,
        },
        // No fieldEnumMapping provided
      };

      const revived = reviveFromDatabase<typeof dbRecord>(
        dbRecord,
        configWithoutMapping,
      );

      // Should return data as-is since no mapping provided
      expect(revived.user.status).toBe('ACTIVE');
      expect(revived.user.profile.priority).toBe('HIGH');
    });
  });
});
