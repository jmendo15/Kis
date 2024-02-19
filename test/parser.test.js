// import * as assert from "assert/strict"

// describe('Sample Test', () => {
//     it('should be that true == true', () => {
//         assert.equal(true, true)
//     });
// });

import assert from "node:assert/strict"
import parse from "../src/parser.js"
import { match } from "node:assert"

//Code that Kis should compile
// Must be of form [scenario, source_code]
const syntaxChecks = [
    ["variable declaration", "set variable = 3"],
    ["print statement", "meow(hi)"],
    ["while statement", "whisker x < 3: meow(hello) nap"],
    ["if statement", "if x < 3: meow(hello) nap"],
    ["if with else", "if x < 3: meow(hello) else: meow(goodbye)"],
    ["function declaration", "kitty func(parameter: String): meow(hi) purr 0 nap"],
    ["all logical operators", "set x = true && false || (!false)"],
    ["ternary operator", "meow( x ? y : z)"],
    ["comments", "meow(0) // comment"],
    ["for loop", "fur cat in cats: meow(cap) nap"],
    ["modularity import", "import package_example"],
    ["modularity export", "module package_example export kitty addition(a: int, b: int): purr a + b nap"]
]

//Code that Kis should NOT compile
// Must be of form [scenario, source_code, errorMessagePattern]
const syntaxErrors = [
    ["wrong variable declaration", "let variable = 3", /Line 1, col 1/],
    ["wrong print statement", "print(hi)", /Line 1, col 1/],
    ["wrong while statement", "while x < 3: meow(hello)", /Line 1, col 1/],
    ["wrong if statement", "incase x < 3 meow(hello) sleep", /Line 1, col 1/],
    ["wrong if with else", "if x < 3 meow(hello) orelse meow(goodbye)", /Line 1, col 6/],
    ["function declaration without type declaration", "kitty func(parameter) meow(hi) purr 0 nap", /Line 1 col 3/],
    ["different all logical operators", "set x = true and false or (!false)", /Line 1 col 5/],
    ["wrong ternary operator and too many params in print statement", "meow( x question y colon z)", /Line 1 col 2/],
    ["comments with pound symbol ", "meow(0) #comment", /Line 1 col 3/],
    ["wrong for loop", "for cat in cats: meow(cap) nap", /Line 1 col 1/],
    ["wrong modularity import", "importing package_example", /Line 1 col 1/],
    ["wrong modularity export", "module package_example mail kitty addition(a: int, b: int): purr a + b", /Line 1 col 3/]
]

describe("The parser", () => {
    for (const [scenario, source] of syntaxChecks) {
        it(`properly specifies ${scenario}`, () => {
            assert(parse(source).succeeded())
            console.log("Syntax is ok")
        })
    }
    for (const [scenario, source, errorMessagePattern] of syntaxErrors) {
        it(`does not permit ${scenario}`, () => {
            //asserting that the parse fail
            let err = parse(source)
            assert.throws(() => parse(source), Error(err.message), err.message)
        })
    }
})