import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import * as core from "../src/core.js";

const semanticChecks = [
  ["variables can be assigned to string", 'set catName = "Kis"'],
  ["variables can be assigned to number", "set catAge = 500"],
  ["strings can be printed", 'meow("Hi, my name is Kis!")'],
  ["variables can be printed string", 'set catName = "Kis" meow(catName)'],
  ["variables can be printed", "set x = 1 meow(x)"],
  ["variables can be reassigned", "set x = 1 reset x = x * 5 / ((-3) + x)"],
  ["increment and decrement", "set x = 10 pounce x-- pounce x++"],
  [
    "for loops with arrays",
    'set cats = ["garfield", "cleopatra", "sphinx"] fur cat in cats: meow(cat) nap',
  ],
  [
    "for loop with break",
    'set cats = ["garfield", "cleopatra", "sphinx"] fur cat in cats: if cat == "sphinx" || cat == "garfield": break else: meow(cat) nap nap',
  ],
  [
    "while loop with break print evens",
    "set max = 10 set i = 0 whisker i < max: if i % 2 == 0: meow(i) nap nap",
  ],

  [
    "function calling and mathematical operations",
    "set dozen = 12 meow(dozen % 3 ** 1) kitty gcd(x: int, y: int): purr y == 0 ? x : gcd(y, x % y) whisker dozen >= 3 || (gcd(1, 10) != 5): reset dozen = dozen - 200 ** 1 ** 3 nap nap",
  ],
];
const semanticErrors = [
  ["undeclared variable access", "meow(x)", /Identifier\s+x\s+not\s+declared/],

  ["invalid type usage", 'set x = "hello" pounce x++', /Expected an integer/],
  ["invalid function call", "set x = 1 x()", /Expected end of input/],
  [
    "assignment to undeclared variable",
    "reset x = 10",
    /Identifier x not declared/,
  ],
];

describe("Kis language analyzer", () => {
  // Loop over semantic checks to ensure they are processed without errors
  for (const [scenario, source] of semanticChecks) {
    it(`should correctly analyze: ${scenario}`, () => {
      assert.ok(analyze(parse(source)));
    });
  }
  // Loop over semantic errors to ensure the analyzer throws the expected errors
  for (const [scenario, source, errorMessagePattern] of semanticErrors) {
    it(`should report error for: ${scenario}`, () => {
      assert.throws(() => analyze(parse(source)), errorMessagePattern);
    });
  }
  // Test to ensure the analyzer produces the expected representation for a trivial program
  it("produces the expected representation for a trivial program", () => {
    const sample = "set x = 5 + 3 meow(x)"; // An example simple program
    const expected = {
      kind: "Script",
      statements: [
        {
          kind: "VariableDeclaration",
          variable: {
            kind: "Variable",
            name: "x",
            type: {
              kind: "IntType",
            },
          },
          initializer: {
            kind: "BinaryExpression",
            left: 5,
            op: "+",
            right: 3,
            type: {
              kind: "IntType",
            },
          },
        },
        {
          kind: "PrintStatement",
          expression: {
            kind: "Variable",
            name: "x",
            type: {
              kind: "IntType",
            },
          },
        },
      ],
    };

    const analyzedProgram = analyze(parse(sample));
    assert.deepStrictEqual(analyzedProgram, expected);
  });
});
