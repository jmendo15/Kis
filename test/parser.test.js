// import * as assert from "assert/strict"

// describe('Sample Test', () => {
//     it('should be that true == true', () => {
//         assert.equal(true, true)
//     });
// });

import assert from "node:assert/strict";
import parse from "../src/parser.js";

//Code that Kis should compile
// Must be of form [scenario, source_code]
const syntaxChecks = [
  ["variable declaration", "set variable = 3"],
  ["print statement", "meow(hi)"],
  ["while statement", "whisker x < 3: meow(hello) nap"],
  ["if statement", "if x < 3: meow(hello) nap"],
  ["cats++", "cat--"],
  ["if with else", "if x < 3: meow(hello) else: meow(goodbye) nap"],
  [
    "function declaration",
    "kitty func(parameter: String): meow(hi) meow(there) purr 0 nap",
  ],
  ["all logical operators", "set x = true && false || (!false)"],
  ["ternary operator", "meow( x ? y : z)"],
  ["comments", "meow(0) // comment"],
  ["for loop", "fur cat in cats: meow(cap) nap"],
  ["modularity import", "import packageExample"],
  [
    "modularity export",
    `module packageExample
      export kitty addition(a: int, b: int): purr a + b nap
    nap`,
  ],
];

//Code that Kis should NOT compile
// Must be of form [scenario, source_code, errorMessagePattern]
const syntaxErrors = [
  ["wrong variable declaration", "let variable = 3", /Line 1, col 5/],
  ["wrong print statement", "print(hi)", /Line 1, col 6/],
  ["wrong while statement", "while x < 3: meow(hello)", /Line 1, col 7/],
  ["wrong if statement", "incase x < 3 meow(hello) sleep", /Line 1, col 8/],
  [
    "missing colon after if test",
    "if x < 3 meow(hello) orelse meow(goodbye)",
    /Line 1, col 10/,
  ],
  [
    "parameter without type declaration",
    "kitty func(parameter) meow(hi) purr 0 nap",
    /Line 1, col 21/,
  ],
  [
    "using and instead of &&",
    "set x = true and false or (!false)",
    /Line 1, col 18/,
  ],
  [
    "wrong ternary operator and too many params in print statement",
    "meow( x question y colon z)",
    /Line 1, col 9/,
  ],
  ["comments with pound symbol ", "meow(0) #comment", /Line 1, col 9/],
  ["wrong for loop", "for cat in cats: meow(cap) nap", /Line 1, col 5/],
  ["wrong modularity import", "importing packagexample", /Line 1, col 11/],
  [
    "wrong modularity export",
    "module packageExample mail kitty addition(a: int, b: int): purr a + b",
    /Line 1, col 23/,
  ],
];

describe("The parser", () => {
  for (const [scenario, source] of syntaxChecks) {
    it(`properly specifies ${scenario}`, () => {
      assert(parse(source).succeeded());
    });
  }
  for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
    it(`does not permit ${scenario}`, () => {
      //let err = parse(source)
      assert.throws(() => parse(source), errorMessagePattern);
    });
  }
});
