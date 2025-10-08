import { enumeration } from '../../index.js';
import {
  prepareForDatabase,
  reviveFromDatabase,
  initializeSmartEnumMappings,
  getLearnedMapping,
} from '../../utilities/database/index.js';
import type { SmartApiHelperConfig } from '../../types.js';

describe('Dynamic Field Mapping Learning', () => {
  // Setup test enums
  const UserStatus = enumeration('UserStatus', {
    input: ['pending', 'active', 'suspended', 'deleted'] as const,
  });

  const Priority = enumeration('Priority', {
    input: ['low', 'medium', 'high', 'critical'] as const,
  });

  const OrderStatus = enumeration('OrderStatus', {
    input: [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ] as const,
  });

  const enumRegistry = {
    UserStatus,
    Priority,
    OrderStatus,
  };

  beforeEach(() => {
    // Initialize learning for each test
    initializeSmartEnumMappings({ enumRegistry });
  });

  describe('Learning from serializeForTransport and prepareForDatabase', () => {
    it('should learn field mappings during normal operations', () => {
      // Initially, no mappings are learned
      expect(getLearnedMapping()).toEqual({});

      // 1. API processes user data and sends to client
      const userData = {
        user: {
          status: UserStatus.active,
          profile: {
            priority: Priority.high,
          },
        },
      };

      // This should learn: { status: ['UserStatus'], priority: ['Priority'] }
      const serialized = prepareForDatabase(userData);
      expect(serialized).toEqual({
        user: {
          status: 'ACTIVE',
          profile: {
            priority: 'HIGH',
          },
        },
      });

      // Check what was learned
      const learnedMapping = getLearnedMapping();
      expect(learnedMapping).toEqual({
        status: ['UserStatus'],
        priority: ['Priority'],
      });

      // 2. Later, API processes order data
      const orderData = {
        orders: [
          {
            status: OrderStatus.processing,
          },
          {
            status: OrderStatus.shipped,
          },
        ],
      };

      // This should learn: { status: ['UserStatus', 'OrderStatus'] }
      prepareForDatabase(orderData);

      // Check updated learning
      const updatedMapping = getLearnedMapping();
      expect(updatedMapping).toEqual({
        status: ['UserStatus', 'OrderStatus'], // Conflict resolved by array
        priority: ['Priority'],
      });

      // 3. Now revive from database using learned mappings
      const dbRecord = {
        user: {
          status: 'ACTIVE', // Should match UserStatus
        },
        orders: [
          {
            status: 'PROCESSING', // Should match OrderStatus
          },
        ],
      };

      const config: SmartApiHelperConfig = {
        enumRegistry,
      };

      const revived = reviveFromDatabase(dbRecord, config);

      expect(revived).toEqual({
        user: {
          status: UserStatus.active,
        },
        orders: [
          {
            status: OrderStatus.processing,
          },
        ],
      });
    });

    it('should work with manual overrides', () => {
      // Learn some mappings first
      const userData = {
        user: {
          status: UserStatus.active,
        },
      };
      prepareForDatabase(userData);

      // Manual override should take precedence
      const config: SmartApiHelperConfig = {
        enumRegistry,
        fieldEnumMapping: {
          status: 'Priority', // Override learned mapping
        },
      };

      const dbRecord = {
        user: {
          status: 'HIGH', // This should be treated as Priority, not UserStatus
        },
      };

      const revived = reviveFromDatabase(dbRecord, config);

      expect(revived).toEqual({
        user: {
          status: Priority.high,
        },
      });
    });

    it('should work without auto-learning (backward compatibility)', () => {
      // Learn some mappings
      const userData = {
        user: {
          status: UserStatus.active,
        },
      };
      prepareForDatabase(userData);

      // Use manual mapping instead of learned mapping
      const config: SmartApiHelperConfig = {
        enumRegistry,
        fieldEnumMapping: {
          status: 'OrderStatus',
        },
      };

      const dbRecord = {
        user: {
          status: 'PROCESSING', // Should match OrderStatus, not learned UserStatus
        },
      };

      const revived = reviveFromDatabase(dbRecord, config);

      expect(revived).toEqual({
        user: {
          status: OrderStatus.processing,
        },
      });
    });
  });

  describe('Real-world workflow', () => {
    it('should demonstrate complete learning workflow', () => {
      // 1. Initialize learning
      initializeSmartEnumMappings({ enumRegistry });

      // 2. API receives request with Smart Enums
      const apiData = {
        users: [
          {
            id: '1',
            status: UserStatus.active,
            profile: {
              priority: Priority.high,
            },
            orders: [
              {
                id: 'o1',
                status: OrderStatus.processing,
              },
              {
                id: 'o2',
                status: OrderStatus.shipped,
              },
            ],
          },
          {
            id: '2',
            status: UserStatus.suspended,
            profile: {
              priority: Priority.low,
            },
            orders: [],
          },
        ],
      };

      // 3. Convert to database format (learns mappings)
      const dbData = prepareForDatabase(apiData);

      // 4. Check what was learned
      const learnedMapping = getLearnedMapping();
      expect(learnedMapping).toEqual({
        status: ['UserStatus', 'OrderStatus'], // Learned from both user.status and orders.status
        priority: ['Priority'],
      });

      // 5. Later, revive from database using learned mappings
      const config: SmartApiHelperConfig = {
        enumRegistry,
      };

      const revived = reviveFromDatabase(dbData, config);

      // 6. Verify the round-trip worked
      expect(revived).toEqual(apiData);
    });
  });
});
