#! /usr/bin/env node

import parse from "./parser.js"
import * as fs from "node:fs/promises"

const help = `Kis compiler for homework 2, not enough arguments given.
            Must be of the form: node src/Kis.js examples/(filename).purr`

async function HW2Function(filename) {
    try {
        const buffer = await fs.readFile(filename)
        const match = parse(buffer.toString())
        console.log("Syntax is ok")
    } catch (e) {
        console.log(e.message)
    }
}

if (process.argv.length !== 3) {
    console.log(help)
} else {
    HW2Function(process.argv[2])
}