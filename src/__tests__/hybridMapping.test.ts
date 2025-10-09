import { enumeration } from '../enumeration.js';
import {
  initializeSmartEnumMappings,
  prepareForDatabase,
  reviveFromDatabase,
  mergeFieldMappings,
} from '../utilities/database/index.js';

describe('Hybrid Field Mapping', () => {
  // Create test enums
  const UserStatus = enumeration('UserStatus', {
    input: ['ACTIVE', 'INACTIVE', 'PENDING'],
  });

  const Priority = enumeration('Priority', {
    input: ['LOW', 'MEDIUM', 'HIGH'],
  });

  const OrderStatus = enumeration('OrderStatus', {
    input: ['PENDING', 'SHIPPED', 'DELIVERED'],
  });

  beforeEach(() => {
    // Initialize with all enums
    initializeSmartEnumMappings({
      enumRegistry: { UserStatus, Priority, OrderStatus },
    });
  });

  describe('mergeFieldMappings', () => {
    it('should merge learned and manual mappings with deduplication', () => {
      const learnedMapping = {
        status: ['UserStatus'],
        priority: ['Priority'],
      };

      const manualMapping = {
        status: ['OrderStatus'], // Different enum type
        priority: ['Priority'], // Same enum type (should be deduplicated)
        method: ['ContactMethod'], // New field
      };

      const merged = mergeFieldMappings(learnedMapping, manualMapping);

      expect(merged).toEqual({
        status: ['OrderStatus', 'UserStatus'], // Manual first, then learned
        priority: ['Priority'], // Deduplicated
        method: ['ContactMethod'], // New field from manual
      });
    });

    it('should return learned mapping when no manual mapping provided', () => {
      const learnedMapping = {
        status: ['UserStatus'],
        priority: ['Priority'],
      };

      const merged = mergeFieldMappings(learnedMapping);

      expect(merged).toEqual(learnedMapping);
    });

    it('should return empty object when no mappings provided', () => {
      const merged = mergeFieldMappings({});

      expect(merged).toEqual({});
    });
  });

  describe('reviveFromDatabase with hybrid mapping', () => {
    it('should use manual mappings when no learning has occurred', () => {
      // No learning has occurred yet
      const dbData = {
        user: {
          status: 'ACTIVE',
          priority: 'HIGH',
        },
      };

      // Use manual mappings as fallback
      const revived = reviveFromDatabase<typeof dbData>(dbData, {
        fieldEnumMapping: {
          status: ['UserStatus'],
          priority: ['Priority'],
        },
      });

      expect(revived.user.status).toBe(UserStatus.ACTIVE);
      expect(revived.user.priority).toBe(Priority.HIGH);
    });

    it('should merge manual and learned mappings', () => {
      // First, learn some mappings by preparing data
      const dataToLearn = {
        user: {
          status: UserStatus.ACTIVE,
          priority: Priority.HIGH,
        },
      };

      prepareForDatabase(dataToLearn);

      // Now try to revive with additional manual mappings
      const dbData = {
        user: {
          status: 'INACTIVE', // Should work with learned UserStatus
          priority: 'MEDIUM', // Should work with learned Priority
          method: 'EMAIL', // New field, should work with manual mapping
        },
      };

      const revived = reviveFromDatabase<typeof dbData>(dbData, {
        fieldEnumMapping: {
          method: ['ContactMethod'], // Manual mapping for new field
        },
      });

      expect(revived.user.status).toBe(UserStatus.INACTIVE);
      expect(revived.user.priority).toBe(Priority.MEDIUM);
      // Note: ContactMethod doesn't exist in our registry, so method will remain as string
      expect(revived.user.method).toBe('EMAIL');
    });

    it('should prioritize manual mappings over learned mappings', () => {
      // Learn that 'status' maps to UserStatus
      const dataToLearn = {
        user: {
          status: UserStatus.ACTIVE,
        },
      };

      prepareForDatabase(dataToLearn);

      // But manually specify that 'status' should try OrderStatus first
      const dbData = {
        user: {
          status: 'SHIPPED', // This should match OrderStatus, not UserStatus
        },
      };

      const revived = reviveFromDatabase<typeof dbData>(dbData, {
        fieldEnumMapping: {
          status: ['OrderStatus', 'UserStatus'], // OrderStatus first
        },
      });

      expect(revived.user.status).toBe(OrderStatus.SHIPPED);
    });

    it('should work with pure learning (no manual mappings)', () => {
      // Learn mappings
      const dataToLearn = {
        user: {
          status: UserStatus.ACTIVE,
          priority: Priority.HIGH,
        },
      };

      prepareForDatabase(dataToLearn);

      // Revive using only learned mappings
      const dbData = {
        user: {
          status: 'INACTIVE',
          priority: 'MEDIUM',
        },
      };

      const revived = reviveFromDatabase<typeof dbData>(dbData);

      expect(revived.user.status).toBe(UserStatus.INACTIVE);
      expect(revived.user.priority).toBe(Priority.MEDIUM);
    });
  });
});
