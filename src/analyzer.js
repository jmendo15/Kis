import * as core from "./core.js";
const INT = core.intType;
const FLOAT = core.floatType;
const STRING = core.stringType;
const BOOLEAN = core.boolType;
const ANY = core.anyType;
const VOID = core.voidType;

class Context {
  // Like most statically-scoped languages, Carlos contexts will contain a
  // map for their locally declared identifiers and a reference to the parent
  // context. The parent of the global context is null. In addition, the
  // context records whether analysis is current within a loop (so we can
  // properly check break statements), and reference to the current function
  // (so we can properly check return statements).
  constructor({
    parent = null,
    locals = new Map(),
    inLoop = false,
    function: f = null,
  }) {
    Object.assign(this, { parent, locals, inLoop, function: f });
  }
  add(name, entity) {
    this.locals.set(name, entity);
  }
  lookup(name) {
    return this.locals.get(name) || this.parent?.lookup(name);
  }
  static root() {
    return new Context({
      locals: new Map(Object.entries(core.standardLibrary)),
    });
  }
  newChildContext(props) {
    return new Context({ ...this, ...props, parent: this, locals: new Map() });
  }
}

export default function analyze(match) {
  let context = Context.root();

  function must(condition, message, errorLocation) {
    if (!condition) {
      const prefix = errorLocation.at.source.getLineAndColumnMessage();
      throw new Error(`${prefix}${message}`);
    }
  }

  function mustNotAlreadyBeDeclared(name, at) {
    must(!context.lookup(name), `Identifier ${name} already declared`, at);
  }

  function mustHaveBeenFound(entity, name, at) {
    must(entity, `Identifier ${name} not declared`, at);
  }
  function mustHaveBooleanType(e, at) {
    must(e.type === BOOLEAN, "Expected a boolean", at);
  }
  function determineCommonType(types) {
    if (types.every((type) => type === types[0])) {
      return types[0];
    } else {
      throw new Error("Array elements must have the same type");
    }
  }

  function mustBeInLoop(at) {
    must(context.inLoop, "Break can only appear in a loop", at);
  }
  function mustAllHaveSameType(expressions, at) {
    // Used to check the elements of an array expression, and the two
    // arms of a conditional expression, among other scenarios.
    must(
      expressions
        .slice(1)
        .every((e) => equivalent(e.type, expressions[0].type)),
      "Not all elements have the same type",
      at
    );
  }
  function mustHaveAnArrayType(expression, at) {
    const isArray = expression.type.category === "Array";
    must(isArray, "Expected an array type", at);
  }

  function mustHaveIntegerType(e, at) {
    must(e.type === INT, "Expected an integer", at);
  }

  function mustBeInAFunction(at) {
    must(context.function, "Return can only appear in a function", at);
  }
  function mustBeAssignable(e, { toType: type }, at) {
    const message = `Cannot assign a ${typeDescription(
      e.type
    )} to a ${typeDescription(type)}`;
    must(assignable(e.type, type), message, at);
  }

  function mustReturnSomething(f, at) {
    must(
      f.type.returnType !== VOID,
      "Cannot return a value from this function",
      at
    );
  }

  // Building the program representation will be done together with semantic
  // analysis and error checking. In Ohm, we do this with a semantics object
  // that has an operation for each relevant rule in the grammar. Since the
  // purpose of analysis is to build the program representation, we will name
  // the operations "rep" for "representation". Most of the rules are straight-
  // forward except for those dealing with function and type declarations,
  // since types and functions need to be dealt with in two steps to allow
  // recursion.
  const builder = match.matcher.grammar.createSemantics().addOperation("rep", {
    Kis_script(statements) {
      return core.script(statements.children.map((s) => s.rep()));
    },

    Kis_module(_module, id, exports, _nap) {
      // exports will be a list of fundecls
      const moduleName = id.sourceString;
      const moduleExports = exports.children.map((e) => e.rep());
      return core.module(moduleName, moduleExports);
    },

    Export(_export, funDecl) {
      return funDecl.rep();
    },

    VarDecl(_set, id, _eq, exp) {
      const initializer = exp.rep();
      const variable = core.variable(id.sourceString, initializer.type);
      mustNotAlreadyBeDeclared(id.sourceString, { at: id });
      context.add(id.sourceString, variable);
      return core.variableDeclaration(variable, initializer);
    },

    Assignment(_set, id, _eq, exp) {
      const target = context.lookup(id.sourceString);
      mustHaveBeenFound(target, id.sourceString, { at: id });
      const source = exp.rep();
      // TODO mustBeAssignable(target, initializer, { at: id });
      return core.assignment(target, source);
    },

    StructDecl(_house, id, _open, fields, _close) {
      const structName = id.sourceString;
      const body = fields.children.map((f) => f.rep());
      function ensureUniqueStructName(structName, context, location) {
        if (context.has(structName)) {
          throw new Error(
            `Struct name "${structName}" is already declared at ${location.at.line}:${location.at.column}.`
          );
        }
      }
      ensureUniqueStructName(structName, context, { at: id.location });
      const type = core.structType(structName, body);
      context.add(structName, type);
      return core.typeDeclaration(type);
    },

    FuncDecl(_kitty, id, parameters, block) {
      const funcName = id.sourceString;
      mustNotAlreadyBeDeclared(funcName, context, { at: id.location });
      const func = core.fun(funcName);
      context.add(funcName, func);

      // Parameters are part of the child context
      context = context.newChildContext({
        inLoop: false,
        function: func,
      });
      console.log("PARAMETERS ARE", parameters.sourceString);
      const params = parameters.rep();
      // const paramTypes = params.map((param) => param.type);
      // const returnType = type.children?.[0]?.rep() ?? VOID;
      // func.type = core.functionType(paramTypes, returnType);

      // Analyze body while still in child context
      const body = block.rep();
      context = context.parent;
      // Go back up to the outer context before returning
      return core.functionDeclaration(func, params, body);
    },

    Params(_open, paramList, _close) {
      // Returns a list of variable nodes
      console.log("PARAMLIST IS", paramList.sourceString);
      return paramList.asIteration().children.map((p) => p.rep());
    },

    Param(id, _colon, type) {
      const param = core.variable(id.sourceString, false, type.rep());
      mustNotAlreadyBeDeclared(param.name, { at: id });
      context.add(param.name, param);
      return param;
    },

    Type_optional(baseType, _questionMark) {
      return core.optionalType(baseType.rep());
    },

    Type_array(_left, baseType, _right) {
      return core.arrayType(baseType.rep());
    },

    Type_function(_left, types, _right, _arrow, type) {
      const paramTypes = types.asIteration().children.map((t) => t.rep());
      const returnType = type.rep();
      return core.functionType(paramTypes, returnType);
    },

    Type_isInt(_typeCheck, _left, id, _right) {
      const variableType = context.lookup(id.sourceString);
      mustHaveBeenFound(variableType, id.sourceString, { at: id });
      const isInt = core.isIntType(variableType); // Assuming isIntType is a function that checks if type is integer
      mustBeAType(isInt, { at: id });
      return isInt;
    },

    Type_isString(_typeCheck, _left, id, _right) {
      const variableType = context.lookup(id.sourceString);
      mustHaveBeenFound(variableType, id.sourceString, { at: id });
      const isString = core.isStringType(variableType); // Assuming isStringType is a function that checks if type is string
      mustBeAType(isString, { at: id });
      return isString;
    },

    Type_id(id) {
      const entity = context.lookup(id.sourceString);
      mustHaveBeenFound(entity, id.sourceString, { at: id });
      mustBeAType(entity, { at: id });
      return entity;
    },

    PrintStmt(_meow, _left, exp, _right) {
      return core.printStatement(exp.rep());
    },

    Block(_colon, statements, _end) {
      return statements.children.map((s) => s.rep());
    },

    IfStmt_long(_if, exp, _colon, statements, _else, elseBranch) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();

      // Process the 'if' block statements
      const consequent = statements.children.map((s) => s.rep());
      context = context.parent;

      // Determine the nature of the 'else' branch and process accordingly
      context = context.newChildContext();
      const alternate = elseBranch.rep();
      context = context.parent;

      return core.longIfStatement(test, consequent, alternate);
    },

    IfStmt_short(_if, exp, block) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext();
      const consequent = block.rep();
      context = context.parent;
      return core.shortIfStatement(test, consequent);
    },

    WhileStmt(_while, exp, block) {
      const test = exp.rep();
      mustHaveBooleanType(test, { at: exp });
      context = context.newChildContext({ inLoop: true });
      const body = block.rep();
      context = context.parent;
      return core.whileStatement(test, body);
    },

    ForStmt(_for, id, _in, exp, block) {
      const collection = exp.rep();
      mustHaveAnArrayType(collection, { at: exp });
      const iterator = core.variable(
        id.sourceString,
        true,
        collection.type.elementType
      );
      context = context.newChildContext({ inLoop: true });
      context.add(iterator.name, iterator);
      const body = block.rep();
      context = context.parent;
      return core.forStatement(iterator, collection, body);
    },
    break(_break) {
      return core.breakStatement;
    },
    ImportStmt(_import, id) {
      const moduleName = id.sourceString;
      const module = context.lookupModule(moduleName);
      if (!module) {
        throw new Error(`Module '${moduleName}' not found.`);
      }
      context.importModule(module);
    },

    // CompareStrings(
    //   identifier,
    //   _equals,
    //   _openQuote,
    //   stringContent,
    //   _closeQuote
    // ) {
    //   // Retrieve the variable's name from the identifier part of the grammar.
    //   const variableName = identifier.sourceString;
    //   // Look up the variable in the current context to get its type and value.
    //   const variable = context.lookup(variableName);
    //   if (!variable) {
    //     throw new Error(`Variable '${variableName}' not found.`);
    //   }
    //   if (!isTypeCompatibleWithString(variable.type)) {
    //     throw new Error(
    //       `Incompatible types for comparison: ${variable.type} cannot be compared to a string.`
    //     );
    //   }
    //   // Extract the string literal value. Since the string content is matched as a sequence
    //   // of any characters except the closing quote, we join them together.
    //   const stringParts = stringContent.children.map((part) => {
    //     if (part.sourceString === '\\"') {
    //       return '"'; // Unescaping a double quote
    //     } else {
    //       return part.sourceString;
    //     }
    //   });
    //   const stringValue = stringParts.join("");
    //   return core.createStringComparisonExpression(variable, stringValue);
    // },

    IncrementStmt_pounce(_pounce, exp, operator) {
      const variable = exp.rep();
      mustHaveIntegerType(variable, { at: exp });
      return operator.sourceString === "++"
        ? core.increment(variable)
        : core.decrement(variable);
    },

    ReturnStatement(returnKeyword, exp) {
      mustBeInAFunction({ at: returnKeyword });
      // mustReturnSomething(context.function, { at: returnKeyword });
      const returnExpression = exp.rep();
      // mustBeReturnable(
      //   returnExpression,
      //   { from: context.function },
      //   { at: exp }
      // );
      return core.returnStatement(returnExpression);
    },

    stringLiteral(_openQuote, _chars, _closeQuote) {
      return this.sourceString;
    },

    Exp_unary(unaryOp, exp) {
      const [op, operand] = [unaryOp.sourceString, exp.rep()];
      let type;

      switch (op) {
        case "-":
          mustHaveNumericType(operand, { at: exp });
          type = operand.type;
          break;
        case "!":
          mustHaveBooleanType(operand, { at: exp });
          type = "Boolean";
          break;
        default:
          throw new Error(`Unsupported unary operator: ${op}`);
      }

      return core.unary(op, operand, type);
    },

    Exp_ternary(conditionExp, _questionMark, trueExp, _colon, falseExp) {
      const condition = conditionExp.rep();
      mustHaveBooleanType(condition, { at: conditionExp });

      const trueBranch = trueExp.rep();
      const falseBranch = falseExp.rep();

      // Ensure the true and false branches return the same type
      if (trueBranch.type !== falseBranch.type) {
        throw new Error("Mismatched types in ternary branches.");
      }

      // Assuming the ternary operation itself doesn't change the type of its branches
      return core.ternary(condition, trueBranch, falseBranch, trueBranch.type);
    },

    Exp_unary(op, exp) {
      return core.unary(op.sourceString, exp.rep());
    },

    Exp_ternary(exp1, _questionMark, exp2, _colon, exp3) {
      return core.conditional(exp1.rep(), exp2.rep(), exp3.rep());
    },

    Exp1_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep(), BOOLEAN);
    },

    Exp2_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep(), BOOLEAN);
    },

    Exp3_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep(), BOOLEAN);
    },

    Exp4_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep(), INT);
    },

    Exp5_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep());
    },

    Exp6_binary(exp1, op, exp2) {
      return core.binary(op.sourceString, exp1.rep(), exp2.rep());
    },

    Exp7_id(id) {
      const entity = context.lookup(id.sourceString);
      mustHaveBeenFound(entity, id.sourceString, { at: id });
      mustHaveBeenFound(entity, { at: id });
      return entity;
    },

    Exp7_call(id, _open, args, _close) {},

    Exp7_parens(_open, exp, _clone) {
      return exp.rep();
    },
    ArrayElements(elements) {
      return elements.asIteration().children.map((element) => element.rep());
    },

    Exp(expression) {
      return expression.rep();
    },
    // Exp7_array(_openBracket, elements, _closeBracket) {
    //   return {
    //     type: "ArrayExpression",
    //     elements: elements.rep(), // Ensure that 'elements' correctly calls the ArrayElements semantic action
    //   };
    // },
    Exp7_array(_openBracket, elements, _closeBracket) {
      const elementReps = elements.asIteration().children.map((e) => e.rep());
      const elementType = determineCommonType(elementReps.map((e) => e.type));
      return {
        type: { category: "Array", elementType: elementType },
        elements: elementReps,
      };
    },

    true(_) {
      return true;
    },

    false(_) {
      return false;
    },

    id(_firstChar, _restChars) {
      return this.sourceString;
    },

    num(_whole, _point, _fraction, _e, _sign, _exponent) {
      // Carlos floats will be represented as plain JS numbers
      return Number(this.sourceString);
    },

    // Exp7_arrayexp(_open, args, _close) {
    //   const elements = args.asIteration().children.map((e) => e.rep());
    //   mustAllHaveSameType(elements, { at: args });
    //   return core.arrayExpression(elements);
    // },
  });
  return builder(match).rep();
}
