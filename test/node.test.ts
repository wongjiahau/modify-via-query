import {modify} from 'immutability-helper-two'
import { testCases } from './cases'

describe("modify", () => {
  testCases({
    modify,
    assertReferentialEqual: (actual, expected) => {
      expect(actual === expected).toEqual(true)
    },
    assertStructuralEqual: (actual, expected) => {
      expect(actual).toEqual(expected)
    }
  })
  .forEach((testCase) => {
    test(testCase.name, testCase.body) 
  })

  test("nested property", () => {
    const model = { x: {y: 2} }
    expect(modify(model)(model => model.x.y.$set(3))).toEqual({x: {y: 3}})
  })
})
