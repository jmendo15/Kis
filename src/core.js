import { alt } from "joi"

export class Kis {
    constructor(Stmts) {
        this.Stmts = Stmts
    }
}

export class Assignment {
    constructor(target, source) {
        Object.assign(this, { target, source })
    }
}

export class PrintStmt {
    constructor(argument) {
        this.argment = argument
    }
}

export class IfStmt {
    constructor(test, consequent, alternate) {
        Object.assign(this, { test, consequent, alternate })
    }
}

export class WhileStmt {
    constructor() {

    }

}

export class BreakStmt {
    constructor() {

    }
}