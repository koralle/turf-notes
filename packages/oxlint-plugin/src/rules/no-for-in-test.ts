import type { RuleTester } from "oxlint/plugins-dev";

type Rule = Parameters<RuleTester["run"]>[1];

type Visitor = ReturnType<NonNullable<Rule["create"]>>;

type ForNode =
  | Parameters<NonNullable<Visitor["ForInStatement"]>>[0]
  | Parameters<NonNullable<Visitor["ForOfStatement"]>>[0]
  | Parameters<NonNullable<Visitor["ForStatement"]>>[0];

type AstParent = ForNode["parent"];

const message =
  "test() を for 文で回さない。パラメータ化には test.for（フィクスチャなしなら test.each）を使う。";

const isDescribeCallee = (callee: AstParent | undefined): boolean => {
  if (callee === undefined || callee === null) {
    return false;
  }

  if (callee.type === "Identifier") {
    return callee.name === "describe";
  }

  if (callee.type === "CallExpression") {
    return isDescribeCallee(callee.callee);
  }

  return (
    callee.type === "MemberExpression" &&
    callee.object.type === "Identifier" &&
    callee.object.name === "describe"
  );
};

const isSuiteScope = (node: ForNode): boolean => {
  const { parent } = node;

  if (parent.type === "Program") {
    return true;
  }

  if (parent.type !== "BlockStatement") {
    return false;
  }

  const fn = parent.parent;

  if (
    fn.type !== "ArrowFunctionExpression" &&
    fn.type !== "FunctionExpression"
  ) {
    return false;
  }

  const call = fn.parent;

  return call.type === "CallExpression" && isDescribeCallee(call.callee);
};

/** テストケースの反復（Program 直下および describe 内）での for / for..in / for..of 文を禁止するルール。 */
export const noForInTest: Rule = {
  create(context) {
    const report = (node: ForNode) => {
      if (isSuiteScope(node)) {
        context.report({ messageId: "forbidden", node });
      }
    };

    return {
      ForInStatement: report,
      ForOfStatement: report,
      ForStatement: report,
    };
  },
  meta: {
    messages: { forbidden: message },
    type: "problem",
  },
};
