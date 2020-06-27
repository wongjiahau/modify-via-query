import { assert, assertEquals } from "./deps.ts";
import { testCases } from "./cases.ts";
import { modify } from "../mod.ts";

testCases({
  modify,
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
  const modified1 = modify(model)((model) => model.items[0].x.$set(undefined));
  assertEquals(modified1, { items: [{ x: undefined }] });

  const modified2 = modify(model)((model) =>
    model.items[0].x.$set({ y: "hi" })
  );
  assertEquals(modified2, { items: [{ x: { y: "hi" } }] });

  const modified3 = modify(model)((model) =>
    model.items[0].x.$apply((x) => ({ ...x, y: x?.y ?? "lol" }))
  );
  assertEquals(modified3, { items: [{ x: { y: "lol" } }] });

  const modified4 = modify<typeof model>({ items: [{ x: { y: "hey" } }] })((
    model,
  ) => model.items[0].x.$apply((x) => ({ ...x, y: x?.y ?? "lol" })));
  assertEquals(modified4, { items: [{ x: { y: "hey" } }] });
});

Deno.test("deno: overloaded variations", () => {
  const model = {
    x: {
      y: [{ z: 2 }],
    },
  };

  // Variant 1: model -> update -> model
  assertEquals(modify(model)((model) => model.x.y[0].z.$apply((x) => x + 1)), {
    x: { y: [{ z: 3 }] },
  });

  // Variant 2: update -> model -> model
  assertEquals(
    modify<typeof model>((model) => model.x.y[0].z.$apply((x) => x + 1))(model),
    {
      x: { y: [{ z: 3 }] },
    },
  );
});
