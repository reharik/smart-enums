# API Helpers Usage Guide

This guide demonstrates how to use the Smart Enums API helpers for common use cases in web applications.

## Overview

The API helpers provide a complete solution for handling Smart Enums across different layers of your application:

1. **Client → API**: Serialize enums for API requests
2. **API receives**: Revive serialized enums from client
3. **API → Database**: Convert enums to values for storage
4. **Database → API**: Revive enum values retrieved from storage
5. **API → Client**: Serialize enums for API responses
6. **Client receives**: Revive serialized enums from API

## Setup

First, define your enums and create a registry:

```typescript
import { enumeration, type ApiHelperConfig } from 'smart-enums';

// Define your enums
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

// Create registry for API helpers
const apiConfig: ApiHelperConfig = {
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
    'data.users[].status': 'UserStatus',
    'data.users[].orders[].status': 'OrderStatus',
  },
};
```

## Complete Data Flow Example

Here's a complete example showing all 6 steps in the enum handling flow:

```typescript
// Step 1: Client → API (Serialize enums for request)
const clientData = { user: { status: UserStatus.active } };
const serializedRequest = serializeForApiRequest(clientData);
// Result: { user: { status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } } }

// Step 2: API receives (Revive serialized enums)
const revivedRequest = reviveAfterTransport(serializedRequest, apiConfig);
// Result: { user: { status: UserStatus.active } }

// Step 3: API → Database (Convert to string values)
const dbData = prepareForDatabase(revivedRequest);
// Result: { user: { status: 'ACTIVE' } }

// Step 4: Database → API (Revive from string values)
const dbRecord = { user: { status: 'ACTIVE' } }; // From database
const revivedFromDB = reviveFromDatabase(dbRecord, apiConfig);
// Result: { user: { status: UserStatus.active } }

// Step 5: API → Client (Serialize for response)
const apiResponse = { user: { status: UserStatus.active } };
const serializedResponse = serializeForTransport(apiResponse);
// Result: { user: { status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } } }

// Step 6: Client receives (Revive serialized enums)
const revivedResponse = reviveAfterTransport(serializedResponse, apiConfig);
// Result: { user: { status: UserStatus.active } }
```

## Use Case 1: Complete API Endpoint

Here's how to handle a complete API endpoint with enum processing:

### Server-Side API Handler

```typescript
import {
  reviveAfterTransport,
  serializeForTransport,
  prepareForDatabase,
  reviveFromDatabase,
} from 'smart-enums';

// Express.js example
app.post('/api/users/:id/update', async (req, res) => {
  try {
    // Step 1: Revive enums from client request
    const revivedData = reviveAfterTransport(req.body, apiConfig);

    // Step 2: Process with proper enum items
    const { userId } = req.params;
    const { status, priority } = revivedData.user;

    if (status === UserStatus.suspended) {
      // Handle suspended user logic
    }

    // Step 3: Update database (convert to string values)
    const dbData = prepareForDatabase({ status, priority });
    const updatedUser = await userRepository.update(userId, dbData);

    // Step 4: Revive from database response
    const revivedUser = reviveFromDatabase(updatedUser, apiConfig);

    // Step 5: Serialize response for client
    const response = {
      success: true,
      user: revivedUser,
    };

    res.json(serializeForTransport(response));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

### Client-Side Request

```typescript
import { reviveAfterTransport, serializeForTransport } from 'smart-enums';

// Client-side code
async function updateUserStatus(userId: string, newStatus: UserStatus) {
  const requestData = {
    user: {
      status: newStatus, // Enum item
      priority: Priority.high, // Enum item
    },
  };

  // Serialize enums for API request
  const serializedRequest = serializeForApiRequest(requestData);

  const response = await fetch(`/api/users/${userId}/update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(serializedRequest),
  });

  const responseData = await response.json();

  // Revive enums from API response
  const revivedResponse = reviveAfterTransport(responseData, apiConfig);

  // revivedResponse.user.status is now UserStatus.active (enum item)
  console.log('Updated user status:', revivedResponse.user.status.display);
}
```

## Database Field Mapping

The `reviveFromDatabase` function requires a `fieldEnumMapping` configuration to know which string values should be converted back to enum items. This mapping tells the function which fields contain enum values and which enum type to use for each field.

### Field Path Syntax

- **Simple fields**: `'user.status'` - maps `user.status` field to UserStatus enum
- **Nested fields**: `'user.profile.priority'` - maps nested priority field
- **Array fields**: `'orders[].status'` - maps status field in any order array element
- **Nested arrays**: `'data.users[].orders[].status'` - maps deeply nested array fields

### Example Mapping

```typescript
const fieldEnumMapping = {
  'user.status': 'UserStatus',
  'user.profile.priority': 'Priority',
  'orders[].status': 'OrderStatus',
  'data.users[].status': 'UserStatus',
  'data.users[].orders[].status': 'OrderStatus',
};
```

## Use Case 2: Database Operations

### Repository Pattern

```typescript
import { prepareForDatabase, reviveFromDatabase } from 'smart-enums';

class UserRepository {
  async findById(id: string) {
    const dbRecord = await this.db.users.findById(id);
    // dbRecord: { id: '123', status: 'ACTIVE', priority: 'HIGH' }

    // Revive enums from database
    return reviveFromDatabase(dbRecord, apiConfig);
    // Result: { id: '123', status: UserStatus.active, priority: Priority.high }
  }

  async update(id: string, userData: any) {
    // Convert enum items to string values for database storage
    const dbData = prepareForDatabase(userData);
    // dbData: { status: 'ACTIVE', priority: 'HIGH' }

    await this.db.users.update(id, dbData);

    // Return the updated record with enums revived
    const updatedRecord = await this.db.users.findById(id);
    return reviveFromDatabase(updatedRecord, apiConfig);
  }

  async create(userData: any) {
    // Convert enum items to string values for database storage
    const dbData = prepareForDatabase(userData);
    // dbData: { status: 'ACTIVE', priority: 'HIGH' }

    const newRecord = await this.db.users.create(dbData);

    // Revive enums from database response
    return reviveFromDatabase(newRecord, apiConfig);
  }
}
```

## Use Case 3: GraphQL Resolvers

```typescript
import { serializeForTransport, reviveAfterTransport } from 'smart-enums';

const resolvers = {
  Query: {
    user: async (parent, args, context) => {
      const user = await userRepository.findById(args.id);

      // Serialize enums for GraphQL response
      return serializeForTransport(user);
    },
  },

  Mutation: {
    updateUser: async (parent, args, context) => {
      // Revive enums from GraphQL input
      const revivedInput = reviveAfterTransport(args.input, apiConfig);

      const updatedUser = await userRepository.update(args.id, revivedInput);

      // Serialize enums for GraphQL response
      return serializeForTransport(updatedUser);
    },
  },
};
```

## Use Case 4: React Components

```typescript
import React, { useState, useEffect } from 'react';
import { reviveAfterTransport, serializeForTransport } from 'smart-enums';

function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUser() {
      const response = await fetch(`/api/users/${userId}`);
      const data = await response.json();

      // Revive enums from API response
      const revivedUser = reviveAfterTransport(data, apiConfig);
      setUser(revivedUser);
      setLoading(false);
    }

    fetchUser();
  }, [userId]);

  const handleStatusChange = async (newStatus: UserStatus) => {
    const requestData = {
      user: { status: newStatus },
    };

    // Serialize enums for API request
    const serializedRequest = serializeForApiRequest(requestData);

    const response = await fetch(`/api/users/${userId}/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializedRequest),
    });

    const responseData = await response.json();

    // Revive enums from API response
    const revivedResponse = reviveAfterTransport(responseData, apiConfig);
    setUser(revivedResponse.user);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <h1>{user?.name}</h1>
      <p>Status: {user?.status.display}</p>
      <p>Priority: {user?.priority.display}</p>

      <select
        value={user?.status.value}
        onChange={(e) => {
          const newStatus = UserStatus.fromValue(e.target.value);
          handleStatusChange(newStatus);
        }}
      >
        {UserStatus.toEnumItems().map(status => (
          <option key={status.value} value={status.value}>
            {status.display}
          </option>
        ))}
      </select>
    </div>
  );
}
```

## Use Case 5: WebSocket Messages

```typescript
import { serializeForTransport, reviveAfterTransport } from 'smart-enums';

// Server-side WebSocket handler
io.on('connection', socket => {
  socket.on('user:update', async data => {
    try {
      // Revive enums from client message
      const revivedData = reviveAfterTransport(data, apiConfig);

      // Process the update
      const updatedUser = await userRepository.update(
        revivedData.userId,
        revivedData,
      );

      // Serialize enums for broadcast
      const serializedUser = serializeForTransport(updatedUser);

      // Broadcast to all clients
      io.emit('user:updated', serializedUser);
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  });
});

// Client-side WebSocket handler
const socket = io();

socket.on('user:updated', data => {
  // Revive enums from server message
  const revivedUser = reviveAfterTransport(data, apiConfig);

  // Update UI with proper enum items
  updateUserInUI(revivedUser);
});
```

## Error Handling

The helpers handle various error scenarios gracefully:

```typescript
import { reviveAfterTransport } from 'smart-enums';

try {
  const revivedData = reviveAfterTransport(requestData, apiConfig);
  // Process revived data
} catch (error) {
  // Handle revival errors
  console.error('Failed to revive enums:', error);
}

// The helpers also handle:
// - Missing enum types in registry (leaves as-is)
// - Invalid enum values (leaves as-is)
// - Null/undefined values (preserves as-is)
// - Circular references (preserves structure)
```

## Performance Considerations

For large datasets, the helpers are optimized for performance:

```typescript
// Efficient for large arrays
const largeDataset = {
  users: Array.from({ length: 10000 }, (_, i) => ({
    id: `user-${i}`,
    status: UserStatus.active,
    orders: Array.from({ length: 100 }, (_, j) => ({
      id: `order-${i}-${j}`,
      status: OrderStatus.processing,
    })),
  })),
};

// This will complete efficiently
const serialized = serializeForTransport(largeDataset);
const revived = reviveAfterTransport(serialized, apiConfig);
```

## Type Safety

The helpers provide full TypeScript support:

```typescript
// Type-safe request handling
const handleUserUpdate = async (request: UserUpdateRequest) => {
  const revived = reviveAfterTransport<UserUpdateRequest>(request, apiConfig);
  // revived is properly typed with enum items

  return serializeForTransport<UserUpdateResponse>({
    success: true,
    user: revived.user,
  });
};
```

## Summary

The API helpers provide a complete solution for handling Smart Enums across your application stack:

- **`reviveAfterTransport`**: Convert serialized enums back to proper enum items (use for both client requests and API responses)
- **`serializeForTransport`**: Convert enum items to serialized format for transport (use for API responses)
- **`serializeForApiRequest`**: Convert enum items to serialized format for API requests (use for client requests)
- **`prepareForDatabase`**: Convert enum items to string values for database storage (returns `DatabaseFormat<T>`)
- **`reviveFromDatabase`**: Convert database string values back to enum items (requires field mapping)

These helpers ensure that enums are properly handled at every layer of your application, maintaining type safety and providing a consistent developer experience.

### Data Flow Summary

1. **Client → API**: `serializeForApiRequest()` converts enum items to `{__smart_enum_type, value}` objects
2. **API receives**: `reviveAfterTransport()` converts `{__smart_enum_type, value}` objects back to enum items
3. **API → Database**: `prepareForDatabase()` converts enum items to simple string values
4. **Database → API**: `reviveFromDatabase()` converts string values back to enum items using field mapping
5. **API → Client**: `serializeForTransport()` converts enum items to `{__smart_enum_type, value}` objects
6. **Client receives**: `reviveAfterTransport()` converts `{__smart_enum_type, value}` objects back to enum items
