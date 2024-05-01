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
      reset y = 5 ** (-x) / (-100) > (-x) || false
      meow((y && y) || false || (x*2) != 5)
    `,
    expected: dedent`
      let x_1 = 21;
      x_1++;
      x_1--;
      let y_2 = true;
      y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1));
      console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)));
    `,
  },
  {
    name: "if",
    source: `
      set x = 0
      if x == 0: meow("1") nap
      if x == 0: meow(1) else: meow(2) nap
    `,
    expected: dedent`
      let x_1 = 0;
      if ((x_1 === 0)) {
        console.log("1");
      }
      if ((x_1 === 0)) {
        console.log(1);
      } else {
        console.log(2);
      }
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
        meow(sin(x) > π)
        purr null
      nap
      kitty g():
        purr false
      nap
      purr f(z, g())
    `,
    expected: dedent`
      let z_1 = 0.5;
      function f_2(x_3, y_4) {
        console.log((Math.sin(x_3) > Math.PI));
        return
      }
      function g_5() {
        return false;
      }
      f_2(z_1, g_5());
    `,
  },
  {
    name: "arrays",
    source: `
      set a = [true, false, true]
      set b = [10, getLength(a) - 20, 30]
      set c = []
      set d = random(b)
      
    `,
    expected: dedent`
      let a_1 = [true,false,true];
      let b_2 = [10,(a_1.length - 20),30];
      let c_3 = [];
      let d_4 = ((a=>a[~~(Math.random()*a.length)])(b_2));
      
    `,
  },
  {
    name: "ternary",
    source: `
      set y = 5
      set x = (y > 10) ? y : 10
    `,
    expected: dedent`
      let y_2 = 5;
      let x_1 = (y_2 10) ? y_2 : 10;
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
      for (let i_3 of [10,15]) {
      }
    `,
  },
];

describe("The code generator", () => {
  for (const fixture of fixtures) {
    it(`produces expected js output fur the ${fixture.name} program`, () => {
      const actual = generate(optimize(analyze(parse(fixture.source))));
      assert.deepEqual(actual, fixture.expected);
    });
  }
});
