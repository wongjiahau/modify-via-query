type Command<Target, Parent> = {
  $apply: (update: (value: Target) => Target) => Updatable<Parent, Parent>;
  $set: (newValue: Target) => Updatable<Parent, Parent>;
};

type MakeAllPropsRequired<T> = NonNullable<
  { [K in keyof T]-?: NonNullable<T[K]> }
>;

type IsNillableObject<T> = undefined extends T
  ? MakeAllPropsRequired<T> extends object ? "true"
  : never
  : null extends T ? MakeAllPropsRequired<T> extends object ? "true"
  : never
  : never;

export type Updatable<Target, Parent> =
  & {
    [Key in keyof Target]-?: Target[Key] extends Function ? Target[Key]
      : (
        Target[Key] extends Array<infer E> ? Array<Updatable<E, Parent>>
          : "true" extends IsNillableObject<Target[Key]> ? {
            $default: (
              value: NonNullable<Target[Key]>,
            ) => Updatable<NonNullable<Target[Key]>, Parent>;
          }
          : Target[Key] extends {} ? (Updatable<Target[Key], Parent>)
          : NonNullable<Target[Key]> & Command<Target[Key], Parent>
      );
  }
  & Command<Target, Parent>;

function update(
  obj: Record<string, any> | undefined,
  [currentProp, ...restProps]: string[],
  updatedValue: any,
  options?: {
    onlyAssignIfOriginalValueIsUndefined?: boolean;
  },
): object {
  if (restProps.length === 0) {
    // console.log("options?.onlyAssignIfOriginalValueIsUndefined", "->", options?.onlyAssignIfOriginalValueIsUndefined)
    // console.log("\n", currentProp, "->", obj)
    // console.log("obj?.[currentProp]", "->", obj?.[currentProp])
    if (options?.onlyAssignIfOriginalValueIsUndefined) {
    }
    return Object.assign(
      Array.isArray(obj) ? [] : {},
      obj,
      {
        [currentProp]: options?.onlyAssignIfOriginalValueIsUndefined
          ? (obj?.[currentProp] ?? updatedValue)
          : updatedValue,
      },
    );
  } else {
    return Object.assign(
      Array.isArray(obj) ? [] : {},
      obj,
      {
        [currentProp]: update(
          obj?.[currentProp],
          restProps,
          updatedValue,
          options,
        ),
      },
    );
  }
}

const handler = (initialState: any, props: string[]) => {
  // console.log("initalState", "->", initialState)
  return {
    get: (target: any, prop: string, receiver: any): any => {
      if (prop === "$value") {
        return initialState;
      } else if (prop === "$default") {
        // console.log("props", "->", props)
        return (defaultValue: any) => {
          // console.log("defaultValue", "->", defaultValue)
          return new Proxy(
            {
              ...target[prop],
            },
            handler(
              update(
                initialState,
                props,
                defaultValue,
                { onlyAssignIfOriginalValueIsUndefined: true },
              ),
              props,
            ),
          );
        };
      } else if (prop !== "$apply" && prop !== "$set") {
        return new Proxy({
          ...target[prop],
        }, handler(initialState, props.concat(prop)));
      } else {
        const value = props.reduce((state, prop) => {
          return state?.[prop];
        }, initialState);

        return (valueOrFunction: object | ((_: object) => object)) => {
          const updatedValue = typeof valueOrFunction === "function"
            ? valueOrFunction(value)
            : valueOrFunction;
          const answer = update(initialState, props, updatedValue);
          return new Proxy(answer, handler(answer, []));
        };
      }
    },
  };
};

const makeUpdatable = <T>(model: T): Updatable<T, T> => {
  return new Proxy(model, handler(model, [])) as any;
};

export const modify = <T>(model: T) =>
  (updater: (model: Updatable<T, T>) => Updatable<T, T>): T => {
    return (updater(makeUpdatable(model)) as any)["$value"];
  };
