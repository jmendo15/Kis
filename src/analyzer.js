import * as core from "./core.js";

class Context {
  constructor({ parent = null, locals = new Map(), inLoop = false, currentFunction = null } = {}) {
    this.parent = parent;
    this.locals = locals;
    this.inLoop = inLoop;
    this.currentFunction = currentFunction;
  }

  add(name, entity) {
    this.locals.set(name, entity);
  }

  lookup(name) {
    let context = this;
    while (context !== null) {
      if (context.locals.has(name)) {
        return context.locals.get(name);
      }
      context = context.parent;
    }
    return undefined;
  }

  newChildContext(options = {}) {
    return new Context({ ...options, parent: this });
  }

  static root() {
    return new Context({ locals: new Map(Object.entries(core.standardLibrary)) });
  }
}

function analyze(node) {
  const context = Context.root();
  return analyzeNode(node, context);
}

function analyzeNode(node, context) {
  switch (node.type) {
    case 'Program':
      node.body = node.body.map(statement => analyzeNode(statement, context));
      break;
    case 'VariableDeclaration':
      context.add(node.identifier, { type: 'Variable', dataType: node.expression.dataType });
      node.expression = analyzeNode(node.expression, context);
      break;
    case 'Assignment':
      const variable = context.lookup(node.identifier);
      if (!variable) throw new Error(`Variable '${node.identifier}' not declared`);
      node.expression = analyzeNode(node.expression, context);
      break;
    case 'BinaryExpression':
      node.left = analyzeNode(node.left, context);
      node.right = analyzeNode(node.right, context);
      break;
    case 'PrintStatement':
      node.expression = analyzeNode(node.expression, context);
      break;
    case 'IfStatement':
      node.condition = analyzeNode(node.condition, context);
      context = context.newChildContext();
      node.consequent = node.consequent.map(statement => analyzeNode(statement, context));
      if (node.alternate) {
        context = context.newChildContext();
        node.alternate = node.alternate.map(statement => analyzeNode(statement, context));
      }
      break;
    case 'WhileStatement':
      node.condition = analyzeNode(node.condition, context);
      context = context.newChildContext({ inLoop: true });
      node.body = node.body.map(statement => analyzeNode(statement, context));
      break;
    case 'ForStatement':
      context.add(node.variable, { type: 'Variable', dataType: node.collection.itemType });
      node.collection = analyzeNode(node.collection, context);
      context = context.newChildContext({ inLoop: true });
      node.body = node.body.map(statement => analyzeNode(statement, context));
      break;
    case 'FunctionDeclaration':
      context.add(node.name, { type: 'Function', params: node.params, returnType: node.returnType });
      context = context.newChildContext({ currentFunction: node });
      node.body = node.body.map(statement => analyzeNode(statement, context));
      break;
    case 'ReturnStatement':
      if (!context.currentFunction) throw new Error("Return can only appear in a function");
      node.expression = analyzeNode(node.expression, context);
      break;
    default:
      throw new Error(`Unrecognized node type: ${node.type}`);
  }
  return node;
}

export default analyze;
