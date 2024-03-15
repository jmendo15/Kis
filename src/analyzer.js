  // Building the program representation will be done together with semantic
  // analysis and error checking. In Ohm, we do this with a semantics object
  // that has an operation for each relevant rule in the grammar. Since the
  // purpose of analysis is to build the program representation, we will name
  // the operations "rep" for "representation". Most of the rules are straight-
  // forward except for those dealing with function and type declarations,
  // since types and functions need to be dealt with in two steps to allow
  // recursion.
  const builder = match.matcher.grammar.createSemantics().addOperation("rep", {
    Program(statements) {
      return core.program(statements.children.map(s => s.rep()))
    },

    Assignment(modifier, id, _eq, exp){
        const initializer = exp.rep()
        const readOnly = modifier.sourceString === "set"
        const variable = core.variable(id.sourceString, readOnly, initializer.type)
        mustNotAlreadyBeDeclared(id.sourceString, {at:id})
        context.add(id.sourceString, variable)
        return core.variableDeclaration(variable, initializer)
    },

    StructDecl(_type, id, struct) {
        const structName = id.sourceString;
        const structDefinition = struct.rep(); 
        // Validate or process the structure name. For example, ensure it doesn't already exist.
        ensureUniqueStructName(structName, { at: id });
        return core.defineStruct(structName, structDefinition);
    },
    

    Struct(_left, id, _colon, type, _right){
        return core.struct(id.sourceString, type.rep())
    },

    FuncDecl(_func, id, parameters, block){
        const func = core.func(id.sourceString)
        mustNotAlreadyBeDeclared(id.sourceString, { at: id })
        context.add(id.sourceString, func)
  
        // Parameters are part of the child context
        context = context.newChildContext({ inLoop: false, function: func })
        const params = parameters.rep()
  
        // Now that the parameters are known, we compute the function's type.
        // This is fine; we did not need the type to analyze the parameters,
        // but we do need to set it before analyzing the body.
        const paramTypes = params.map(param => param.type)
        const returnType = type.children?.[0]?.rep() ?? VOID
        func.type = core.functionType(paramTypes, returnType)
  
        // Analyze body while still in child context
        const body = block.rep()
  
        // Go back up to the outer context before returning
        context = context.parent
        return core.functionDeclaration(func, params, body)
      },

      Params(_open, paramList, _close) {
        // Returns a list of variable nodes
        return paramList.asIteration().children.map(p => p.rep())
      },

      Param(id, _colon, _id){
        const param = core.variable(id.sourceString, false, type.rep())
        mustNotAlreadyBeDeclared(param.name, { at: id })
        context.add(param.name, param)
        return param
      },

      Type_optional(baseType, _questionMark) {
        return core.optionalType(baseType.rep())
      },
  
      Type_array(_left, baseType, _right) {
        return core.arrayType(baseType.rep())
      },
  
      Type_function(_left, types, _right, _arrow, type) {
        const paramTypes = types.asIteration().children.map(t => t.rep())
        const returnType = type.rep()
        return core.functionType(paramTypes, returnType)
      },

      //confirm isInt and isString are working
      Type_isInt(_typeCheck, _left, id, _right) {
        // "isInt" "(" id ")"   
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
        const entity = context.lookup(id.sourceString)
        mustHaveBeenFound(entity, id.sourceString, { at: id })
        mustBeAType(entity, { at: id })
        return entity
      },

      PrintStmt(_print, _left, exp, _right) {
        return core.printStatement(exp.rep())
      },

      Block(_colon, statements, _end){
        return statements.children.map(s => s.rep())
      },

      IfStmt_long(_if, exp, _colon, statements, _else, elseBranch) {
        const test = exp.rep();
        mustHaveBooleanType(test, { at: exp });
        context = context.newChildContext();
        
        // Process the 'if' block statements
        const consequent = statements.children.map(s => s.rep());
        context = context.parent;
        
        // Determine the nature of the 'else' branch and process accordingly
        context = context.newChildContext();
        const alternate = elseBranch.rep();
        context = context.parent;
        
        return core.longIfStatement(test, consequent, alternate);
      },
      

      IfStmt_short(_if, exp, block) {
        const test = exp.rep()
        mustHaveBooleanType(test, { at: exp })
        context = context.newChildContext()
        const consequent = block.rep()
        context = context.parent
        return core.shortIfStatement(test, consequent)
      },

      WhileStmt(_while, exp, block) {
        const test = exp.rep()
        mustHaveBooleanType(test, { at: exp })
        context = context.newChildContext({ inLoop: true })
        const body = block.rep()
        context = context.parent
        return core.whileStatement(test, body)
      },

      ForStmt(_for, id, _in, exp, block){
        const collection = exp.rep()
        mustHaveAnArrayType(collection, { at: exp })
        const iterator = core.variable(id.sourceString, true, collection.type.baseType)
        context = context.newChildContext({ inLoop: true })
        context.add(iterator.name, iterator)
        const body = block.rep()
        context = context.parent
        return core.forStatement(iterator, collection, body)
      },

      ImportStmt(_import, id){
        const moduleName = id.sourceString;
        const module = context.lookupModule(moduleName);
        if (!module) {
            throw new Error(`Module '${moduleName}' not found.`);
          }
        context.importModule(module);
      },

      // BuiltInFunctions

      // AddOrConcat

      CompareStrings(identifier, _equals, _openQuote, stringContent, _closeQuote) {
        // Retrieve the variable's name from the identifier part of the grammar.
        const variableName = identifier.sourceString;
        // Look up the variable in the current context to get its type and value.
        const variable = context.lookup(variableName);
        if (!variable) {
          throw new Error(`Variable '${variableName}' not found.`);
        }
        // Optionally, check if the variable is of a type that can be compared to a string.
        // This step depends on the capabilities and rules of your programming language.
        if (!isTypeCompatibleWithString(variable.type)) {
          throw new Error(`Incompatible types for comparison: ${variable.type} cannot be compared to a string.`);
        }
        // Extract the string literal value. Since the string content is matched as a sequence
        // of any characters except the closing quote, we join them together.
        // This simplifies handling of the (~"\"" any)* part of the grammar.
        const stringParts = stringContent.children.map(part => {
            if (part.sourceString === '\\\"') {
              return '\"'; // Unescaping a double quote
            } else {
              return part.sourceString;
            }
          });
          const stringValue = stringParts.join('');
          
        return core.createStringComparisonExpression(variable, stringValue);
      },

      IncrementStmt_pounce(exp, operator){
        const variable = exp.rep()
        mustHaveIntegerType(variable, { at: exp })
        return operator.sourceString === "++"
          ? core.increment(variable)
          : core.decrement(variable)
      },

      paramList(firstIdentifier, _comma, secondIdentifier) {
        const paramName1 = firstIdentifier.rep();
        const paramName2 = secondIdentifier.rep();
        return [paramName1, paramName2];
      },
      
      identifier(letterOrDigit, restOfIdentifier) {
        const firstCharacter = letterOrDigit.sourceString;
        // Then, process the rest of the identifier, which can be a mix of letters and digits.
        // Since 'restOfIdentifier' is a sequence of characters, we join them together to form a complete string.
        const remainingCharacters = restOfIdentifier.children.map(char => char.sourceString).join('');
        // Combine the first character with the rest of the identifier to get the full identifier's name.
        const fullName = firstCharacter + remainingCharacters;
        // Return the full identifier name.
        return fullName;
      },

      ReturnStmt(returnKeyword, exp){
        mustBeInAFunction({ at: returnKeyword })
        mustReturnSomething(context.function, { at: returnKeyword })
        const returnExpression = exp.rep()
        mustBeReturnable(returnExpression, { from: context.function }, { at: exp })
        return core.returnStatement(returnExpression)
      },

      StringLiteral(_openQuote, _chars, _closeQuote) {
        return this.sourceString
      },

      Exp_unary(unaryOp, exp) {
        const [op, operand] = [unaryOp.sourceString, exp.rep()]
        let type;
      
        switch(op) {
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

      Exp1_binary(exp, _ops, exps) {
        let left = exp.rep()
        mustHaveBooleanType(left, { at: exp })
        for (let e of exps.children) {
          let right = e.rep()
          mustHaveBooleanType(right, { at: e })
          left = core.binary("||", left, right, BOOLEAN)
        }
        return left
      },
    })

      // Exp1_addOrConcat() 
      // Handle addOrConcat in the core.js
