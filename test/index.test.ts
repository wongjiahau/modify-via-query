import { modify } from "../src/index.ts";
import { assert, assertEquals } from "./deps.ts";

const model = {
  name: "hello",
  job: {
    title: "yo",
  },
  items: [
    { x: 1 },
    { x: 2 },
  ],
};

const m = modify(model);

Deno.test("updatable (assert not deep cloned)", () => {
  const modified = m((model) => model.name.$apply((x) => x + " world"));
  assert(model.items === modified.items);
  assert(model.job === modified.job);
  assertEquals(modified.name, "hello world");
  assertEquals(model.name, "hello");
});

Deno.test("updatable (nested update)", () => {
  const modified = m((model) => model.job.title.$set("sponge"));
  assertEquals(modified.job, { title: "sponge" });
  assert(model.items === modified.items);
  assert(model.name === modified.name);
});

Deno.test("updatable (assert original object not mutated)", () => {
  const modified = m((model) => model.name.$set("lol"));
  assertEquals(modified.name, "lol");
  assertEquals(model, {
    name: "hello",
    job: {
      title: "yo",
    },
    items: [
      { x: 1 },
      { x: 2 },
    ],
  });
});

Deno.test("updatable (array item)", () => {
  const modified = m((model) => model.items[1].x.$apply((x) => x * x));
  assertEquals(modified.items, [{ x: 1 }, { x: 4 }]);
});

Deno.test("updatable (out-of-bound array item)", () => {
  const modified = m((model) => model.items[3].x.$apply(() => 99));
  assertEquals(modified.items, [{ x: 1 }, { x: 2 }, , { x: 99 }]);
});

Deno.test("updatable (chained commands)", () => {
  const modified = m((model) =>
    model
      .name.$set("squarepants")
      .job.title.$apply((x) => x.toUpperCase())
      .items[0].x.$apply((x) => x + 1)
  );
  assertEquals(
    modified,
    { name: "squarepants", job: { title: "YO" }, items: [{ x: 2 }, { x: 2 }] },
  );
});

Deno.test("updatable (optional property)", () => {
  const model: {
    x?: string;
  } = {
    x: undefined,
  };
  const modified1 = modify(model)((model) => model.x.$set("hello"));
  assertEquals(modified1, { x: "hello" });

  const modified2 = modify(model)((model) =>
    model.x.$set("hello").x.$set(undefined)
  );
  assertEquals(modified2, { x: undefined });

  const modified3 = modify(model)((model) =>
    model.x.$apply((x) => x?.toLowerCase() ?? "lol")
  );
  assertEquals(modified3, { x: "lol" });
});

Deno.test("updatable (array with nullable element)", () => {
  const model: {
    items: (string | undefined)[];
  } = {
    items: ["hi", undefined],
  };
  const modified = modify(model)((model) => model.items[2].$set("lol"));
  assertEquals(modified, { items: ["hi", undefined, "lol"] });
});

Deno.test("updatable (nested optional object)", () => {
  type Model = {
    x?: {
      y?: string;
      z: number;
    } | undefined;
  };
  const model1: Model = {};
  const modified1 = modify(model1)((model) =>
    model.x.$default({ z: 2 }).y.$set("3")
  );
  assertEquals(modified1, { x: { z: 2, y: "3" } });

  const model2: Model = { x: { z: 5 } };
  const modified2 = modify(model2)((model) =>
    model.x.$default({ z: 2 }).y.$set("3")
  );
  assertEquals(modified2, { x: { z: 5, y: "3" } });
});

Deno.test("updatable (double nested optional object)", () => {
  type Model = {
    x?: {
      y?: {
        a: number;
        b?: boolean;
      };
      z: number;
    } | undefined;
  };
  const model1: Model = {};
  const modified1 = modify(model1)((model) =>
    model.x.$default({ z: 3 }).y.$default({ a: 1 }).b.$set(false)
  );
  assertEquals(modified1, { x: { z: 3, y: { a: 1, b: false } } });
  const model2: Model = { x: { y: { a: 8 }, z: 5 } };
  const modified2 = modify(model2)((model) =>
    model.x.$default({ z: 3 }).y.$default({ a: 1 }).b.$set(false)
  );
  assertEquals(modified2, { x: { z: 5, y: { a: 8, b: false } } });
});

Deno.test("updatable (nested optional array)", () => {
  type Model = {
    items?: { content: string }[];
  };
  const model1: Model = {};
  const modified1 = modify(model1)((model) =>
    model.items.$default([])[0].$set({ content: "hi" })
  );
  assertEquals(modified1, { items: [{ content: "hi" }] });
});
