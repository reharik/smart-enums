import type { TSESTree } from '@typescript-eslint/utils';
import ts from 'typescript';

const NULLISH_OPERATORS = new Set(['==', '!=']);

/**
 * True when `type` is a smart-enum member (has literal `__smart_enum_brand: true`).
 *
 * The check is structural on purpose: it does not import types from
 * `@reharik/smart-enum`, so it still matches members created by a duplicate
 * copy of the package.
 */
export const isSmartEnumItemType = (
  type: ts.Type | undefined,
  checker: ts.TypeChecker,
): boolean => {
  if (!type || type.flags & ts.TypeFlags.Any) {
    return false;
  }

  const candidates = type.isUnion() ? type.types : [type];

  const trueType = checker.getTrueType();

  return candidates.some(candidate => {
    const sym = checker.getPropertyOfType(candidate, '__smart_enum_brand');
    return sym !== undefined && checker.getTypeOfSymbol(sym) === trueType;
  });
};

export const isEqualityOperator = (operator: string): boolean =>
  operator === '===' ||
  operator === '!==' ||
  operator === '==' ||
  operator === '!=';

export const isNegatedEqualityOperator = (operator: string): boolean =>
  operator === '!==' || operator === '!=';

/**
 * Allows `status != null` / `status == null` (and `undefined` literal).
 */
export const isAllowedNullishComparison = (
  node: TSESTree.BinaryExpression,
): boolean => {
  if (!NULLISH_OPERATORS.has(node.operator)) {
    return false;
  }

  return isNullishExpression(node.left) || isNullishExpression(node.right);
};

const isNullishExpression = (
  node: TSESTree.Expression | TSESTree.PrivateIdentifier,
): boolean => {
  if (node.type === 'Literal' && node.value === null) {
    return true;
  }

  if (node.type === 'Identifier' && node.name === 'undefined') {
    return true;
  }

  return false;
};
