import { assert, assertEquals } from "./deps.ts";
import { testCases } from "./cases.ts";
import { modify2, modify } from "../mod.ts";

testCases({
  modify: modify2,
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
    modify((model) => model.c[0].d.$apply((xs) => xs.concat({ e: "ha" }))),
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
