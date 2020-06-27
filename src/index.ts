type Command<Target, Parent> = {
  $apply: (update: (value: Target) => Target) => Modifiable<Parent, Parent>;
  $set: (newValue: Target) => Modifiable<Parent, Parent>;
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

export type Modifiable<Target, Parent> =
  & {
    [Key in keyof Target]-?: Target[Key] extends Function ? Target[Key]
      : (
        Target[Key] extends Array<infer E>
          ? (Array<Modifiable<E, Parent>> & Command<Target[Key], Parent>)
          : "true" extends IsNillableObject<Target[Key]> ? {
            $default: (
              value: NonNullable<Target[Key]>,
            ) => Modifiable<NonNullable<Target[Key]>, Parent>;
          } & Command<Target[Key], Parent>
          : Target[Key] extends {} ? (Modifiable<Target[Key], Parent>)
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

const makeUpdatable = <T>(model: T): Modifiable<T, T> => {
  return new Proxy(model, handler(model, [])) as any;
};

/**
 * Variant 1:
 * ```
 * State => Update => State
 * ```
 * 
 * Example:
 * ```ts
 * modify(state)(state => state.count.$set(1))
 * ```
 * 
 * Can be curried, for example:
 * ```ts
 * const m = modify({count: 0})
 * const add = m(state => state.count.$apply(x => x + 1))
 * const minus = m(state => state.count.$apply(x => x - 1))
 * ```
 */
export function modify<T>(
  state: T,
): (update: (state: Modifiable<T, T>) => Modifiable<T, T>) => T;

/**
 * Variant 2:
 * ```
 * Update => State => State
 * ```
 * 
 * Example:
 * ```ts
 * modify(state => state.count.$set(1))(state)
 * ```
 * 
 * This variant is useful when used with function that takes 
 * a function with the type of `State -> State`. Example of such function is `setState` or `this.setState` of React.  
 * Usage example:
 * ```ts
 * const [state, setState] = React.useState({count: 0})
 * const add = () => setState(
 *  modify(state => state.count.$apply(x => x + 1))
 * )
 * const minus = () => setState(
 *  modify(state => state.count.$apply(x => x - 1))
 * )
 * ```
 */
export function modify<T>(
  update: (state: Modifiable<T, T>) => Modifiable<T, T>,
): (state: T) => T;

export function modify<T>(
  updateOrModel: any,
) {
  if (typeof updateOrModel === "function") {
    return (model: T) => {
      return (updateOrModel(makeUpdatable(model)) as any)["$value"];
    };
  } else {
    return (update: (model: Modifiable<T, T>) => Modifiable<T, T>) => {
      return (update(makeUpdatable<T>(updateOrModel)) as any)["$value"];
    };
  }
}
