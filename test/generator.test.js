import assert from "node:assert/strict"
import parse from "../src/parser.js"
import analyze from "../src/analyzer.js"
import optimize from "../src/optimizer.js"
import generate from "../src/generator.js"

function dedent(s) {
    return `${s}`.replace(/(?<=\n)\s+/g, "").trim()
}

// Two Example Fixtures:
// {
//     name: "small",
//         source: `
//       let x = 3 * 7;
//       x++;
//       x--;
//       let y = true;
//       y = 5 ** -x / -100 > - x || false;
//       print((y && y) || false || (x*2) != 5);
//     `,
//     expected: dedent`
//       let x_1 = 21;
//       x_1++;
//       x_1--;
//       let y_2 = true;
//       y_2 = (((5 ** -(x_1)) / -(100)) > -(x_1));
//       console.log(((y_2 && y_2) || ((x_1 * 2) !== 5)));
//     `,
//   },
// {
//     name: "if",
//         source: `
//       let x = 0;
//       if (x == 0) { print("1"); }
//       if (x == 0) { print(1); } else { print(2); }
//       if (x == 0) { print(1); } else if (x == 2) { print(3); }
//       if (x == 0) { print(1); } else if (x == 2) { print(3); } else { print(4); }
//     `,
//     expected: dedent`
//       let x_1 = 0;
//       if ((x_1 === 0)) {
//         console.log("1");
//       }
//       if ((x_1 === 0)) {
//         console.log(1);
//       } else {
//         console.log(2);
//       }
//       if ((x_1 === 0)) {
//         console.log(1);
//       } else
//         if ((x_1 === 2)) {
//           console.log(3);
//         }
//       if ((x_1 === 0)) {
//         console.log(1);
//       } else
//         if ((x_1 === 2)) {
//           console.log(3);
//         } else {
//           console.log(4);
//         }
//     `,
//     },

const fixtures = [
    {
        name: "small",
        source: ``,
        expected: dedent``
    },
    {
        name: "if",
        source: ``,
        expected: dedent``
    },
    {
        name: "while",
        source: ``,
        expected: dedent``
    },
    {
        name: "for",
        source: ``,
        expected: dedent``
    },
    {
        name: "functions",
        source: ``,
        expected: dedent``
    },
    {
        name: "structs",
        source: ``,
        expected: dedent``
    },
    {
        name: "while",
        source: ``,
        expected: dedent``
    },
    {
        name: "modules",
        source: ``,
        expected: dedent``
    },
    {
        name: "addOrConcat",
        source: ``,
        expected: dedent``
    },
]

describe("The code generator", () => {
    for (const fixture of fixtures) {
        it(`produces expected js output for the ${fixture.name} program`, () => {
            const actual = generate(optimize(analyze(parse(fixture.source))))
            assert.deepEqual(actual, fixture.expected)
        })
    }
})