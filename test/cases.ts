const originalModel = {
  name: "hello",
  job: {
    title: "yo",
  },
  items: [
    { x: 1 },
    { x: 2 },
  ],
};

export const testCases = (
  {
    modify,
    assertReferentialEqual,
    assertStructuralEqual,
  }: {
    assertStructuralEqual: <T>(actual: T, expected: T) => void;
    assertReferentialEqual: <T>(actual: T, expected: T) => void;
    modify: <T>(model: T) => (f: (modifiable: any) => any) => T;
  },
): {
  name: string;
  body: () => void;
}[] => {
  const m = modify(originalModel);

  return [
    {
      name: "updatable (assert not deep cloned)",
      body: () => {
        const modified = m((model) =>
          model.name.$apply((x: string) => x + " world")
        );
        assertReferentialEqual(originalModel.items, modified.items);
        assertReferentialEqual(originalModel.job, modified.job);
        assertStructuralEqual(modified.name, "hello world");
        assertStructuralEqual(originalModel.name, "hello");
      },
    },
    {
      name: "updatable (nested update)",
      body: () => {
        const modified = m((model) => model.job.title.$set("sponge"));
        assertStructuralEqual(modified.job, { title: "sponge" });
        assertReferentialEqual(originalModel.items, modified.items);
        assertReferentialEqual(originalModel.name, modified.name);
      },
    },
    {
      name: "updatable (assert original object not mutated)",
      body: () => {
        const modified = m((model) => model.name.$set("lol"));
        assertStructuralEqual(modified.name, "lol");
        assertStructuralEqual(originalModel, {
          name: "hello",
          job: {
            title: "yo",
          },
          items: [
            { x: 1 },
            { x: 2 },
          ],
        });
      },
    },
    {
      name: "updatable (array item)",
      body: () => {
        const modified = m((model) =>
          model.items[1].x.$apply((x: number) => x * x)
        );
        assertStructuralEqual(modified.items, [{ x: 1 }, { x: 4 }]);
      },
    },
    {
      name: "updatable (out-of-bound array item)",
      body: () => {
        const modified = m((model) => model.items[3].x.$apply(() => 99));
        assertStructuralEqual(
          modified.items,
          [{ x: 1 }, { x: 2 }, , { x: 99 }],
        );
      },
    },
    {
      name: "updatable (chained commands)",
      body: () => {
        const modified = m((model) =>
          model
            .name.$set("squarepants")
            .job.title.$apply((x: string) => x.toUpperCase())
            .items[0].x.$apply((x: number) => x + 1)
        );
        assertStructuralEqual(
          modified,
          {
            name: "squarepants",
            job: { title: "YO" },
            items: [{ x: 2 }, { x: 2 }],
          },
        );
      },
    },
    {
      name: "updatable (optional property)",
      body: () => {
        const model: {
          x?: string;
        } = {
          x: undefined,
        };
        const modified1 = modify(model)((model) => model.x.$set("hello"));
        assertStructuralEqual(modified1, { x: "hello" });

        const modified2 = modify(model)((model) =>
          model.x.$set("hello").x.$set(undefined)
        );
        assertStructuralEqual(modified2, { x: undefined });

        const modified3 = modify(model)((model) =>
          model.x.$apply((x: string) => x?.toLowerCase() ?? "lol")
        );
        assertStructuralEqual(modified3, { x: "lol" });
      },
    },
    {
      name: "updatable (array with nullable element)",
      body: () => {
        const model: {
          items: (string | undefined)[];
        } = {
          items: ["hi", undefined],
        };
        const modified = modify(model)((model) => model.items[2].$set("lol"));
        assertStructuralEqual(modified, { items: ["hi", undefined, "lol"] });
      },
    },
    {
      name: "updatable (nested optional object)",
      body: () => {
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
        assertStructuralEqual(modified1, { x: { z: 2, y: "3" } });

        const model2: Model = { x: { z: 5 } };
        const modified2 = modify(model2)((model) =>
          model.x.$default({ z: 2 }).y.$set("3")
        );
        assertStructuralEqual(modified2, { x: { z: 5, y: "3" } });
      },
    },
    {
      name: "updatable (double nested optional object)",
      body: () => {
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
        assertStructuralEqual(
          modified1,
          { x: { z: 3, y: { a: 1, b: false } } },
        );
        const model2: Model = { x: { y: { a: 8 }, z: 5 } };
        const modified2 = modify(model2)((model) =>
          model.x.$default({ z: 3 }).y.$default({ a: 1 }).b.$set(false)
        );
        assertStructuralEqual(
          modified2,
          { x: { z: 5, y: { a: 8, b: false } } },
        );
      },
    },
    {
      name: "updatable (nested optional array)",
      body: () => {
        type Model = {
          items?: { content: string }[];
        };
        const model1: Model = {};
        const modified1 = modify(model1)((model) =>
          model.items.$default([])[0].$set({ content: "hi" })
        );
        assertStructuralEqual(modified1, { items: [{ content: "hi" }] });
      },
    },
    {
      name: "nested array",
      body: () => {
        const model = {
          c: [{
            d: [{
              e: "yo",
            }],
          }],
        };
        const modified = modify(model)((model) =>
          model.c[0].d.$apply((xs: any[]) => xs.concat({ e: "ha" }))
        );
        assertStructuralEqual(modified, {
          c: [{
            d: [{
              e: "yo",
            }, {
              e: "ha",
            }],
          }],
        });
      },
    },
  ];
};
