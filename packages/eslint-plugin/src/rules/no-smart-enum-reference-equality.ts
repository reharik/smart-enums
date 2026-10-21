import { ESLintUtils, type TSESTree } from '@typescript-eslint/utils';
import {
  isAllowedNullishComparison,
  isEqualityOperator,
  isNegatedEqualityOperator,
  isSmartEnumItemType,
} from '../utils/is-smart-enum-item-type.js';

const createRule = ESLintUtils.RuleCreator(
  name => `https://reharik.github.io/smart-enums/eslint/${name}`,
);

export const noSmartEnumReferenceEquality = createRule({
  name: 'no-smart-enum-reference-equality',
  meta: {
    type: 'problem',
    docs: {
      description:
        'Disallow reference equality (===, !==, ==, !=) for smart-enum values; use .equals() instead.',
    },
    messages: {
      useEquals:
        'Compare smart-enum values with `.equals()`, not `{{operator}}`. Prefer: `{{suggestion}}`.',
    },
    schema: [],
  },
  defaultOptions: [],
  create(context) {
    const sourceCode = context.sourceCode;
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();

    const operandIsSmartEnum = (node: TSESTree.Node): boolean => {
      const type = parserServices.getTypeAtLocation(node);
      return isSmartEnumItemType(type, checker);
    };

    const buildSuggestion = (node: TSESTree.BinaryExpression): string => {
      const left = sourceCode.getText(node.left);
      const right = sourceCode.getText(node.right);
      const negation = isNegatedEqualityOperator(node.operator) ? '!' : '';
      return `${negation}${left}.equals(${right})`;
    };

    return {
      BinaryExpression(node) {
        if (!isEqualityOperator(node.operator)) {
          return;
        }

        if (isAllowedNullishComparison(node)) {
          return;
        }

        const leftIsSmartEnum = operandIsSmartEnum(node.left);
        const rightIsSmartEnum = operandIsSmartEnum(node.right);

        if (!leftIsSmartEnum && !rightIsSmartEnum) {
          return;
        }

        context.report({
          node,
          messageId: 'useEquals',
          data: {
            operator: node.operator,
            suggestion: buildSuggestion(node),
          },
        });
      },
    };
  },
});
