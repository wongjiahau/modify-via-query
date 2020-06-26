# modify-via-query

![](https://github.com/wongjiahau/immutability-helper-2/workflows/deno/badge.svg)
![](https://github.com/wongjiahau/immutability-helper-2/workflows/node/badge.svg)
![](https://img.shields.io/npm/v/modify-via-query.svg?style=flat-square)
![](https://badgen.net/bundlephobia/min/modify-via-query?label=minified)
![](https://badgen.net/bundlephobia/minzip/modify-via-query?label=gzip)

Mutate a copy of data without changing the original source with **natural and type-safe query**.

## Why use this library?

This is for users that are sick of updating large states.
For example:

```ts
setState((state) => ({
  ...state,
  book: {
    ...state.book,
    author: {
      ...state.book.author,
      nickNames: state.book.author.map((name, index) =>
        index === targetIndex ? "new name" : name
      ),
    },
  },
}));
```

With this library, the code above can be simplified as:

```ts
setState(
  modify((state) => state
    .book
    .author
    .nickNames[targetIndex]
    .$set("new name")
  )
);
```

## How to install?
### Node.js
```
npm install modify-via-query --save
```
```ts
import {modify} from "modify-via-query"
```

### Deno
```ts
import { modify } from "https://raw.githubusercontent.com/wongjiahau/modify-via-query/master/mod.ts";
```

## Features
- Type-safe
- Autocomplete via Intellisense
- Chainable
- Immutable
- Shallow copy

## Main concept
Like the name of this package, you *modify* by *querying* the property. 
The `modify` function make the object *modifiable*. A modifiable object comes with a few commands like `$set` and `$apply`.   
Basically, the commands can be access in any hierarchy of the object, and once the command is invoked, an updated modifiable object will be returned, such that more modifications can be chained.

## Examples
### Modify object
```ts
modify(state => state.x.$set(3))({ x: 2 }) // {x: 3}
```
### Modify array item
```ts
modify(state => state[0].$set(3))([1, 2]) // [3, 2]
```
### Modify nested object array
```ts
modify(state => state.todos[0].done.$apply(done => !done))({
  todos: [
    {content: "code", done: false},
    {content: "sleep", done: false},
  ]
})
// {todos: [{content: "code", done: true}, {content: "sleep", done: false}]}
```
### Chaining commands
```ts
modify(state => state
  .name.$apply(name => name + " " + "squarepants")
  .job.at.$set("Krabby Patty")
)({
  name: "spongebob",
  job: {
    title: "chef"
    at: undefined
  }
})
// { name: "spongebob squarepants", job: {title: "chef", at: "Krabby Patty"} }
```

### Removing array item
```ts
modify(state => state.filter((_, index) => index !== 2))(
  ["a", "b", "c"]
)
// ["a", "b"]
```

## Modify property of optional object
For example, if you have the following state:
```ts
const state: {
  pet?: {
    name: string
    age?: number
  }
} = {}
```
Let say you want to update `pet.age`, you cannot do this:
```ts
modify(state => state.pet.age.$set(9))(state)
```
You will get compile-error by doing so. The is prohibited in order to maintain the type consistency, else the resulting value would be `{pet: {age: 9}}`, which breaks the type of `state`, because `name` should be present.

To fix this, you have to provide a default value for `pet` using the `$default` command:
```ts
modify(state => state.pet.$default({name: "bibi"}).age.$set(9))(state)
```
This tells the library that if `pet` is undefined, then its name will be `"bibi"` otherwise the original name will be used.  

## Available commands
- `$set`
  - to set the value of the queried property
- `$apply`
  - to update the value of the queried property based on its previous value
- `$default`
  - to provide a default value if the queried property is a nullable object

## Can I use this library in non-React projects?
Yes. Although this library is primarily for users who uses React users, this package can actually be used anywhere since it has zero dependency.

## Can I use this library with Typescript?
Yes! In fact the default package already contain the type definitions, so you don't have to install it somewhere else.

## How this library works?
It works by using [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy)


## Variants
There are two variants being exported. If you are using React, the first variant `modify` will be more convenient.

```ts
modify: (update: (state: Modifiable<State>) => Modifiable<State>) => (
  state: State
) => State;

modify2: (state: State) => (
  update: (state: Modifiable<State>) => Modifiable<State>
) => State;
```

## References

This library is inspired by:

- [immutability helper](https://github.com/kolodny/immutability-helper)
- [Keli Language property setter](https://keli-language.gitbook.io/doc/specification/section-4-magic-expressions#4-1-3-property-setter)
