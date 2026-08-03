/**
 * Compile-time coverage for the mapping-key constraint on `withEnumRevival`.
 *
 * The `@ts-expect-error` directives are the assertions: `npm run typecheck`
 * fails if a rejected case starts compiling (the directive goes unused) or an
 * accepted case stops compiling. Jest only executes the runtime `expect` at the
 * bottom — swc strips types, so the suite alone proves nothing here.
 */

import knexFactory from 'knex';
import { enumeration } from '@reharik/smart-enum';

import { withEnumRevival } from '../withEnumRevival.js';

const db = knexFactory({ client: 'pg' });

const Operation = enumeration('TypingOperation', {
  input: ['view', 'download'] as const,
});

const UserStatus = enumeration('TypingUserStatus', {
  input: ['pending', 'active'] as const,
});

type UserRow = {
  id: number;
  status: string;
  operations: string[];
};

describe('withEnumRevival mapping-key typing', () => {
  it('should constrain mapping keys to the query row type', () => {
    // A `.select<T[]>()` assertion — the shape the reported bug had.
    withEnumRevival(db('users').select<UserRow[]>('*'), {
      operations: Operation,
    });
    withEnumRevival(db('users').select<UserRow[]>('*'), {
      // @ts-expect-error `operation` is singular; the row field is `operations`
      operation: Operation,
    });

    // A typed table.
    withEnumRevival(db<UserRow>('users').select('*'), { status: UserStatus });
    withEnumRevival(db<UserRow>('users').select('*'), {
      // @ts-expect-error no such field
      statuss: UserStatus,
    });

    // `.first()` resolves to `T | undefined`; the row type must survive that.
    withEnumRevival(db<UserRow>('users').first(), { status: UserStatus });

    // A partial select narrows the allowed keys — mapping an unselected column
    // is the same bug, and would throw at runtime under strict.
    withEnumRevival(db<UserRow>('users').select('id', 'status'), {
      status: UserStatus,
    });
    withEnumRevival(db<UserRow>('users').select('id', 'status'), {
      // @ts-expect-error `operations` was not selected
      operations: Operation,
    });

    // An untyped query has no row type to check against, so it stays permissive
    // and the strict-mode runtime check is the only backstop.
    withEnumRevival(db('users').select('*'), { anything: UserStatus });

    // Values are required, so an explicitly-undefined mapping entry is rejected
    // rather than reaching `tryFromValue` at runtime.
    withEnumRevival(db('users').select<UserRow[]>('*'), {
      operations: Operation,
      // @ts-expect-error a mapping value may not be undefined
      status: undefined,
    });

    expect(Operation.view.value).toBe('VIEW');
  });
});
