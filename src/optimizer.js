// The optimizer module exports a single function, optimize(node), to perform
// machine-independent optimizations on the analyzed semantic representation.
import * as core from "./core.js"

export default function optimize(node) {
    return optimizers?.[node.kind]?.(node) ?? node
}

const optimizers = {
    Program(p) {
        p.statements = p.statements.flatMap(optmize)
        return p
    },
    VariableDeclaration(d) {
        d.variable = optimize(d.variable)
        d.initializer = optimize(d.initializer)
        return d
    },
    TypeDeclaration(d) {
        d.type = optimize(d.type)
        return d
    },
    FunctionDeclaration(d) {
        d.fun = optimize(d.fun)
        if (d.body) d.body = d.body.flatMap(optimize)
        return d
    },
    Increment(s){
        s.variable = optimize(s.variable)
        return s
    },
    Decrement(s){
        s.variable = optimize(s.variable)
        return s
    },
    Assignment(s) {
        s.source = optimize(s.source)
        s.target = optimize(s.target)
        if (s.source === s.target) {
            return []
        }
        return s
    },
    BreakStatement(s) {
        return s
    },
    ReturnStatement(s) {
        s.expression = optimize(s.expression)
        return s
    },
    ShortReturnStatement(s) {
        return s
    },
    IfStatement(s) {
        s.test = optimize(s.test)
        s.consequent = s.consequent.flatMap(optimize)
        if (s.alternate?.kind?.endsWith?.("IfStatement")) {
          s.alternate = optimize(s.alternate)
        } else {
          s.alternate = s.alternate.flatMap(optimize)
        }
        if (s.test.constructor === Boolean) {
          return s.test ? s.consequent : s.alternate
        }
        return s
      },
      ShortIfStatement(s) {
        s.test = optimize(s.test)
        s.consequent = s.consequent.flatMap(optimize)
        if (s.test.constructor === Boolean) {
          return s.test ? s.consequent : []
        }
        return s
      }, 
      WhileStatement(s) {
        s.test = optimize(s.test)
        if (s.test === false) {
          // while false is a no-op
          return []
        }
        s.body = s.body.flatMap(optimize)
        return s
      },
      ForStatement(s) {
        s.iterator = optimize(s.iterator)
        s.collection = optimize(s.collection)
        s.body = s.body.flatMap(optimize)
        if (s.collection?.kind === "EmptyArray") {
          return []
        }
        return s
      },
      Conditional(e) {
        e.test = optimize(e.test)
        e.consequent = optimize(e.consequent)
        e.alternate = optimize(e.alternate)
        if (e.test.constructor === Boolean) {
            return e.test ? e.consequent : e.alternate
        }
        return e
      }
}