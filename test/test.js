const {modify}  = require('immutability-helper-two')

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

const modified = m((model) => model.name.$apply((x) => x + " world"));