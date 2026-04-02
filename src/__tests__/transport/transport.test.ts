import { enumeration } from '../../index.js';
import {
  reviveAfterTransport,
  serializeForTransport,
  initializeSmartEnumMappings,
} from '../../utilities/transport/index.js';
import type { SmartApiHelperConfig } from '../../types.js';

describe('Transport Helpers', () => {
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
  };

  beforeEach(() => {
    // Initialize global configuration for each test
    initializeSmartEnumMappings({ enumRegistry: config.enumRegistry });
  });

  describe('reviveAfterTransport', () => {
    it('should revive enums from client request payload', () => {
      const clientRequest = {
        user: {
          id: '123',
          status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' },
          profile: {
            priority: { __smart_enum_type: 'Priority', value: 'HIGH' },
          },
        },
        orders: [
          {
            id: 'o1',
            status: { __smart_enum_type: 'OrderStatus', value: 'PROCESSING' },
          },
          {
            id: 'o2',
            status: { __smart_enum_type: 'OrderStatus', value: 'SHIPPED' },
          },
        ],
      };

      const revived = reviveAfterTransport<typeof clientRequest>(clientRequest);

      expect(revived.user.status).toBe(UserStatus.active);
      expect(revived.user.profile.priority).toBe(Priority.high);
      expect(revived.orders[0].status).toBe(OrderStatus.processing);
      expect(revived.orders[1].status).toBe(OrderStatus.shipped);
    });

    it('should handle nested objects and arrays', () => {
      const complexRequest = {
        data: {
          users: [
            {
              status: { __smart_enum_type: 'UserStatus', value: 'PENDING' },
              orders: [
                {
                  status: {
                    __smart_enum_type: 'OrderStatus',
                    value: 'DRAFT',
                  },
                },
              ],
            },
          ],
        },
      };

      const revived =
        reviveAfterTransport<typeof complexRequest>(complexRequest);

      expect(revived.data.users[0].status).toBe(UserStatus.pending);
      expect(revived.data.users[0].orders[0].status).toBe(OrderStatus.draft);
    });

    it('should leave non-enum data unchanged', () => {
      const request = {
        id: '123',
        name: 'John Doe',
        age: 30,
        active: true,
        tags: ['tag1', 'tag2'],
      };

      const revived = reviveAfterTransport(request);

      expect(revived).toEqual(request);
    });
  });

  describe('serializeForTransport', () => {
    it('should serialize enums in response payload', () => {
      const apiResponse = {
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

      const serialized = serializeForTransport(apiResponse);

      expect(serialized.user.status).toEqual({
        __smart_enum_type: 'UserStatus',
        value: 'ACTIVE',
      });
      expect(serialized.user.profile.priority).toEqual({
        __smart_enum_type: 'Priority',
        value: 'HIGH',
      });
      expect(serialized.orders[0].status).toEqual({
        __smart_enum_type: 'OrderStatus',
        value: 'PROCESSING',
      });
      expect(serialized.orders[1].status).toEqual({
        __smart_enum_type: 'OrderStatus',
        value: 'SHIPPED',
      });
    });

    it('should handle nested objects and arrays', () => {
      const complexResponse = {
        data: {
          users: [
            {
              status: UserStatus.pending,
              orders: [{ status: OrderStatus.draft }],
            },
          ],
        },
      };

      const serialized = serializeForTransport(complexResponse);

      expect(serialized.data.users[0].status).toEqual({
        __smart_enum_type: 'UserStatus',
        value: 'PENDING',
      });
      expect(serialized.data.users[0].orders[0].status).toEqual({
        __smart_enum_type: 'OrderStatus',
        value: 'DRAFT',
      });
    });

    it('should leave non-enum data unchanged', () => {
      const response = {
        id: '123',
        name: 'John Doe',
        age: 30,
        active: true,
        tags: ['tag1', 'tag2'],
      };

      const serialized = serializeForTransport(response);

      expect(serialized).toEqual(response);
    });
  });
});
