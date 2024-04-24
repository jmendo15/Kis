import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

// Make some test cases easier to read
const x = core.variable("x", false, core.intType)
const a = core.variable("a", false, core.arrayType(core.intType))
const xpp = core.increment(x)
const xmm = core.decrement(x)

describe("The optimizer", () => {
    for (const [scenario, before, after] of tests) {
      it(`${scenario}`, () => {
        assert.deepEqual(optimize(before), after)
      })
    }
  })