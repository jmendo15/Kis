import assert from "node:assert/strict";
import parse from "../src/parser.js";
import analyze from "../src/analyzer.js";
import optimize from "../src/optimizer.js";
import generate from "../src/generator.js";

function dedent(s) {
  return `${s}`.replace(/(?<=\n)\s+/g, "").trim();
}

const fixtures = [
  {
    name: "small",
    source: `
      set x = 3 * 7
      pounce x++
      pounce x--
      set y = true
      reset y = 5 ** (-x) / ((-100) > (-x)) || false
      meow((y && y) || false || (x*2) != 5)
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / (-100 > -(x_1))) || false);
      console.log((((y_2 && y_2) || false) || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "if",
    source: `
      set x = 0
      if x == 0:
        meow("X is zero")
      nap
    `,
    expected: dedent`
      let x_1 = 0;\nif ((x_1 === 0)) {\nconsole.log("X is zero");\n}
    `,
  },
  {
    name: "whisker",
    source: `
      set x = 0
      whisker x < 5:
        set y = 0
        whisker y < 5:
          meow(x * y)
          reset y = y + 1
          break
        nap
        reset x = x + 1
      nap
    `,
    expected: dedent`
      let x_1 = 0;
      while ((x_1 < 5)) {
        let y_2 = 0;
        while ((y_2 < 5)) {
          console.log((x_1 * y_2));
          y_2 = (y_2 + 1);
          break;
        }
        x_1 = (x_1 + 1);
      }
    `,
  },
  {
    name: "kitty",
    source: `
      set z = 0.5
      kitty f(x: float, y: boolean):        
        meow(x > 2)
        purr 1
      nap
      kitty g():
        purr false
      nap
      meow(f(z, g()))
    `,
    expected: dedent`
      let z_1 = 0.5;
      function f_2(x_3, y_4) {
        console.log((x_3 > 2));
        return 1;
      }
      function g_5() {
        return false;
      }
      console.log(f_2(z_1, g_5()));
    `,
  },
  {
    name: "arrays",
    source: `
      set a = [true, false, true]
      set b = [10, 3 - 20, 30]
      set c = [1]
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,-17,30];
      let c_3 = [1];
    `,
  },
  {
    name: "ternary",
    source: `
      set y = 5
      set x = (y > 10) ? y : 10
    `,
    expected: dedent`
      let y_1 = 5;
      let x_2 = (((y_1 > 10)) ? (y_1) : (10));
    `,
  },
  {
    name: "fur loops",
    source: `
      fur i in [5, 10]:
        meow(i)
      nap
      fur j in [10, 20, 30]:
        meow(j)
      nap
      fur k in [10, 15]:
      nap
    `,
    expected: dedent`
      for (let i_1 of [5,10]) {
        console.log(i_1);
      }
      for (let j_2 of [10,20,30]) {
        console.log(j_2);
      }
      for (let k_3 of [10,15]) {
      }
    `,
  },
];

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output for the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(actual, fixture.expected);
    });
  }
});
