/**
 * Local ESLint rules: `max-lines` and `max-lines-per-function`.
 *
 * These exist as a local plugin rather than an npm dependency because no
 * maintained `eslint-plugin-max-lines` is published for ESLint 9 flat config.
 * Keeping it in-repo means the 250-line rule is enforced by the project's own
 * gate and cannot drift or disappear with a dependency update.
 *
 * Rule source, one responsibility per export, no comments explaining "what".
 */

const FUNCTION_NODE_TYPES = new Set([
  "FunctionDeclaration",
  "FunctionExpression",
  "ArrowFunctionExpression",
]);

/** Strip trailing and leading blank lines so padding cannot inflate a file. */
function countPhysicalLines(text) {
  return text.split("\n").filter((line) => line.trim().length > 0).length;
}

function lineOf(sourceCode, index) {
  return sourceCode.getLocFromIndex(index).start.line;
}

const maxLinesRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce a maximum number of physical lines per source file.",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        "File has {{count}} lines, which exceeds the maximum of {{max}}. Split it by responsibility.",
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const max = options.max ?? 250;
    const sourceCode = context.sourceCode ?? context.getSourceCode();
    const count = countPhysicalLines(sourceCode.getText());

    return {
      Program() {
        if (count > max) {
          context.report({
            node: sourceCode.ast,
            messageId: "tooLong",
            data: { count, max },
          });
        }
      },
    };
  },
};

const maxLinesPerFunctionRule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Enforce a maximum number of physical lines per function.",
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        "Function is {{count}} lines, which exceeds the maximum of {{max}}. Extract a helper.",
    },
  },
  create(context) {
    const options = context.options[0] ?? {};
    const max = options.max ?? 120;
    const sourceCode = context.sourceCode ?? context.getSourceCode();

    /** Every function-shaped node, including class methods and object methods. */
    function isFunctionNode(node) {
      if (FUNCTION_NODE_TYPES.has(node.type)) return true;
      if (node.type === "MethodDefinition") return true;
      if (node.type === "Property" && typeof node.value === "object" && node.value !== null) {
        return FUNCTION_NODE_TYPES.has(node.value.type);
      }
      return false;
    }

    return {
      ":function": (node) => {
        if (!isFunctionNode(node)) return;
        const body = node.type === "MethodDefinition" ? node.value : node;
        const text = sourceCode.getText(body);
        const count = countPhysicalLines(text);
        if (count > max) {
          context.report({
            node: body,
            messageId: "tooLong",
            data: { count, max },
          });
        }
      },
    };
  },
};

export default {
  rules: {
    "max-lines": maxLinesRule,
    "max-lines-per-function": maxLinesPerFunctionRule,
  },
};

/** Exported for the unit test that guards this rule's own arithmetic. */
export const __test = { countPhysicalLines, lineOf };