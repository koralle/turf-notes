import { RuleTester } from "oxlint/plugins-dev";
import { describe, expect, test } from "vitest";

import { noForInTest } from "./no-for-in-test";

RuleTester.describe = (text, fn) => {
  describe(text, () => {
    fn();
  });
};

RuleTester.it = (text, fn) => {
  test(text, () => {
    expect(() => {
      fn();
    }).not.toThrow();
  });
};

const tester = new RuleTester();

tester.run("no-for-in-test", noForInTest, {
  invalid: [
    {
      code: "for (let i = 0; i < 3; i++) {}",
      errors: [{ message: /test\(\) を for 文で回さない/u }],
    },
    {
      code: "for (const x of [1, 2]) {}",
      errors: [{ message: /test\(\) を for 文で回さない/u }],
    },
    {
      code: "for (const k in obj) {}",
      errors: [{ message: /test\(\) を for 文で回さない/u }],
    },
    {
      code: 'describe("suite", () => { for (const x of [1, 2]) { test("t", () => {}); } });',
      errors: [{ message: /test\(\) を for 文で回さない/u }],
    },
    {
      code: 'describe.only("suite", () => { for (let i = 0; i < 2; i++) {} });',
      errors: [{ message: /test\(\) を for 文で回さない/u }],
    },
    {
      code: 'describe.each(["a"])("suite %s", () => { for (const x of [1, 2]) {} });',
      errors: [{ message: /test\(\) を for 文で回さない/u }],
    },
    {
      code: 'describe.for(["a"])("suite %s", () => { for (const x of [1, 2]) {} });',
      errors: [{ message: /test\(\) を for 文で回さない/u }],
    },
  ],
  valid: [
    'test.for(["%", "_"])("case %s", () => {});',
    'test.each([1, 2])("case %i", () => {});',
    'test("loop inside test", () => { for (const x of [1, 2]) {} });',
    "const seed = () => { for (let i = 0; i < 3; i++) {} };",
  ],
});
