import { assert, assertEquals } from "./deps.ts";
import { testCases } from "./cases.ts";
import { modify, modify2 } from "../src/index.ts";

testCases({
  modify,
  assertReferentialEqual: (actual, expected) => assert(actual === expected),
  assertStructuralEqual: (actual, expected) => assertEquals(actual, expected),
})
  .forEach((testCase) => {
    Deno.test(testCase.name, testCase.body);
  });

Deno.test("nested array in Deno", () => {
  const model = {
    c: [{
      d: [{
        e: "yo",
      }],
    }],
  };
  const f = (u: (m: typeof model) => typeof model) => {
    return u(model);
  };
  const modified = f(
    modify2((model) => model.c[0].d.$apply((xs) => xs.concat({ e: "ha" }))),
  );
  assertEquals(modified, {
    c: [{
      d: [{
        e: "yo",
      }, {
        e: "ha",
      }],
    }],
  });
});
