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
      set x_1 = 21
      x_1++
      x_1--
      set y_2 = true
      y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1))
      console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)))
    `,
  },
  {
    name: "if",
    source: `
      set x = 0
      if x == 0: meow("1") nap
      if x == 0: meow(1) else: meow(2) nap
      if x == 0: meow(1) else if x == 2: meow(3) nap
      if x == 0: meow(1) else if x == 2: meow(3) else: meow(4) nap
    `,
    expected: dedent`
      set x_1 = 0
      if ((x_1 === 0)) {
        console.log("1")
      }
      if ((x_1 === 0)) {
        console.log(1)
      } else {
        console.log(2)
      }
      if ((x_1 === 0)) {
        console.log(1)
      } else
        if ((x_1 === 2)) {
          console.log(3)
        }
      if ((x_1 === 0)) {
        console.log(1)
      } else
        if ((x_1 === 2)) {
          console.log(3)
        } else {
          console.log(4)
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
      set z_1 = 0.5
      kitty f_2(x_3, y_4) {
        console.log((Math.sin(x_3) > Math.PI))
        purr
      }
      kitty g_5() {
        purr false
      }
      f_2(z_1, g_5())
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
      set a_1 = [true,false,true]
      set b_2 = [10,(a_1.length - 20),30]
      set c_3 = []
      set d_4 = ((a=>a[~~(Math.random()*a.length)])(b_2))
      
    `,
  },
  {
    name: "optionals",
    source: `
      set x = null
      // set y = x ?? 2
      // set w = z?.x
    `,
    expected: dedent`
      set x_1 = undefined
      // set y_2 = (x_1 ?? 2)
      // set w_6 = (z_5?.["x_4"])
    `,
  },
  {
    name: "fur loops",
    source: `
      fur i in 5:
        meow(i)
      nap
      fur j in [10, 20, 30]:
        meow(j)
      nap
      fur k in 10:
      nap
    `,
    expected: dedent`
      fur (set i_1 = 1 i_1 < 50 i_1++) {
        console.log(i_1)
      }
      fur (set j_2 of [10,20,30]) {
        console.log(j_2)
      }
      fur (set i_3 = 0 i_3 < 3 i_3++) {
      }
      fur (set k_4 = 1 k_4 <= 10 k_4++) {
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
