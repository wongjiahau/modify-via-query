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

Deno.test("deno: nested array", () => {
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

Deno.test("deno: updating nullable property", () => {
  const model: { items: ({ x?: { y?: string } } | undefined)[] } = {
    items: [],
  };
  const modified1 = modify2(model)((model) => model.items[0].x.$set(undefined));
  assertEquals(modified1, { items: [{ x: undefined }] });

  const modified2 = modify2(model)((model) =>
    model.items[0].x.$set({ y: "hi" })
  );
  assertEquals(modified2, { items: [{ x: { y: "hi" } }] });
});
