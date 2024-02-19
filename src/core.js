//Core.js creates classes for syntax to prepare for static analysis
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

export class Variable {
    consturctor(name) {
        Object.assign(this, { name })
    }
}

export class Function {
    constructor(name, params, body) {
        Object.assign(this, { name, params, body })
    }
}

export class BuiltInFunctions {
    constructor(names, parameterCount) {
        Object.assign(this, { names, parameterCount })
    }
}

export class BinaryExpression {
    constructor(operator, left, right) {
        Object.assign(this, { operator, left, right })
    }
}

export class UnaryExpression {
    constructor(operator, left, right) {
        Object.assign(this, { operator, left, right })
    }
}
