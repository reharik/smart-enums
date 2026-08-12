/**
 * Hand-written stand-in for the 'enums' output of a schema with one generated
 * enum (ErrorCategory) and one external enum (EntityType). Mirrors the emitted
 * shape: generated enums + input definer, no user imports, no registry.
 */
import { enumeration, type Enumeration } from '@reharik/smart-enum';

/** any key not in the schema resolves to `never`, so unknown keys are rejected */
type Exact<X, K extends string> = X & Record<Exclude<keyof X, K>, never>;

const errorCategoryInput = ['auth', 'validation'] as const;

export type ErrorCategory = Enumeration<typeof ErrorCategory>;
export const ErrorCategory = enumeration<typeof errorCategoryInput>(
  'ErrorCategory',
  { input: errorCategoryInput },
);

export const entityTypeKeys = ['album', 'comment'] as const;
export type EntityTypeKeys = (typeof entityTypeKeys)[number];

export const defineEntityTypeInput = <
  const X extends Record<EntityTypeKeys, Record<string, unknown>>,
>(
  input: Exact<X, EntityTypeKeys>,
): X => input;
