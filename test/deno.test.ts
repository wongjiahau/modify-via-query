import { assert, assertEquals } from "./deps.ts";
import { testCases } from "./cases.ts";
import { modify } from "../src/index.ts";

testCases({
  modify,
  assertReferentialEqual: (actual, expected) => assert(actual === expected),
  assertStructuralEqual: (actual, expected) => assertEquals(actual, expected),
})
  .forEach((testCase) => {
    Deno.test(testCase.name, testCase.body);
  });
