import assert from "node:assert/strict"
import optimize from "../src/optimizer.js"
import * as core from "../src/core.js"

// Make some test cases easier to read
const x = core.variable("x", false, core.intType)
const a = core.variable("a", false, core.arrayType(core.intType))
const emptyArrayInt = core.emptyArray(core.intType);
const nullValue = core.variable("null", core.anyType);

// Simulating the addOrConcat function
function simulatedAddOrConcat(left, right) {
  if ((left.type === core.intType && right.type === core.intType) ||
      (left.type === core.stringType && right.type === core.stringType)) {
      return core.binary("+", left, right, left.type);
  }
  return nullValue
}

const tests = [
  ["folds +", core.binary("+", 5, 8), 13],
  ["folds -", core.binary("-", 5n, 8n), -3n],
  ["folds *", core.binary("*", 5, 8), 40],
  ["folds /", core.binary("/", 5, 8), 0.625],
  ["folds **", core.binary("**", 5, 8), 390625],
  ["folds <", core.binary("<", 5, 8), true],
  ["folds <=", core.binary("<=", 5, 8), true],
  ["folds ==", core.binary("==", 5, 8), false],
  ["folds !=", core.binary("!=", 5, 8), true],
  ["folds >=", core.binary(">=", 5, 8), false],
  ["folds >", core.binary(">", 5, 8), false],
  ["folds negation", core.unary("-", 8), -8],
  ["optimizes integer addition", simulatedAddOrConcat(core.variable(5, core.intType), core.variable(3, core.intType)), core.variable(8, core.intType)],
  ["optimizes string concatenation", simulatedAddOrConcat(core.variable("Hewwo", core.stringType), core.variable(" World", core.stringType)), core.variable("Hewwo World", core.stringType)],
  // Test failure to concatenate int and string resulting in null
  ["mismatched types", simulatedAddOrConcat({ value: 5, type: core.intType }, { value: "test", type: core.stringType }), nullValue],
  // Additional tests to check optimizer behavior
  ["optimizes +0", core.binary("+", x, 0, core.intType), x],
  ["optimizes 0+", core.binary("+", 0, x, core.intType), x],
  ["optimizes 1*", core.binary("*", 1, x, core.intType), x],
  ["optimizes *1", core.binary("*", x, 1, core.intType), x],
  ["optimizes /1", core.binary("/", x, 1, core.intType), x],
  ["optimizes *0", core.binary("*", x, 0, core.intType), 0],
  ["optimizes 0*", core.binary("*", 0, x, core.intType), 0],
  ["optimizes 0/", core.binary("/", 0, x, core.intType), 0],
  ["optimizes 1*", core.binary("*", 1, x, core.intType), x],
  // Logical optimizations
  ["removes left false from or", core.binary("or", false, core.binary("<", x, 1, core.boolType), core.boolType), core.binary("<", x, 1, core.boolType)],
  ["removes right false from or", core.binary("or", core.binary("<", x, 1, core.boolType), false, core.boolType), core.binary("<", x, 1, core.boolType)],
  // Control structure optimizations
  ["optimizes if-true", core.ifStatement(true, [core.returnStatement(x)], []), [core.returnStatement(x)]],
  ["optimizes if-false", core.ifStatement(false, [], [core.returnStatement(x)]), [core.returnStatement(x)]],
  ["optimizes short-if-true", core.shortIfStatement(true, [core.returnStatement(x)]), [core.returnStatement(x)]],
  ["optimizes short-if-false", core.shortIfStatement(false, []), []],
  ["optimizes while-false", core.whileStatement(false, core.block([core.returnStatement(x)])), []],
  // Loop and collection optimizations
  ["optimizes for-empty-array", core.forStatement(x, emptyArrayInt, [core.increment(x)]), []]
];

describe("The optimizer", () => {
    for (const [scenario, before, after] of tests) {
      it(`${scenario}`, () => {
        assert.deepEqual(optimize(before), after)
      })
    }
});