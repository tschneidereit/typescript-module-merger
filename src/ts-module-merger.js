var esprima = require('esprima');
var codegen = require('escodegen');
var fs = require('fs');

module.exports.mergeModulesInFile = mergeModulesInFile;
module.exports.mergeModules = mergeModules;

var verbose;

function log() {
  if (!verbose) {
    return;
  }
  console.log.apply(console, arguments);
}

function mergeModulesInFile(path, verboseLogging) {
  verbose = !!verboseLogging;
  log("Optimizing file", path);
  var data = fs.readFileSync(path);
  return mergeModules(data, verboseLogging);
}

function mergeModules(data, verboseLogging) {
  verbose = !!verboseLogging;
  var ast = esprima.parse(data, { raw: true, tokens: true, range: true, comment: true });
  ast = codegen.attachComments(ast, ast.comments, ast.tokens);
  log("Merged " + optimizeModules(ast.body, 0, 0) + " module bodies.");
  return codegen.generate(ast, {comment: true});
}

function tabs(nesting) {
  return '                                   '.substr(0, nesting * 2);
}

function optimizeModules(nodes, nesting, mergeCount) {
  var moduleName = null;
  var bodies = [];
  log(tabs(nesting) + "Optimizing " + nodes.length);
  for (var i = 0; i < nodes.length - 1; i++) {
    // tsc compiles modules to the pattern
    // var ModuleName;
    // (function (ModuleName) {[body]})(ModuleName || (ModuleName = {}));
    // Detecting this pattern consist of detecting the var declaration ...
    var name = getModuleName(nodes[i]);
    // ... and the IIFE with the module name as its parameter and the var as its argument.
    var module = getModuleDeclaration(name, nodes[i + 1]);
    if (!name || !module) {
      // Not a module declaration, merge all currently collected bodies for the last module name,
      // if any.
      // This is required because any other expression might rely on the module definitions before
      // it, and following module definitions might rely on whatever that expression did.
      if (bodies.length) {
        mergeCount = mergeBodies(moduleName, bodies, nodes, nesting, mergeCount);
        i -= bodies.length * 2 - 2;
        moduleName = null;
        bodies = [];
      }
      continue;
    }
    // Module definition with a new name. Merge all bodies for the previous name, if any, and
    // start a new list.
    if (name !== moduleName) {
      if (bodies.length) {
        mergeCount = mergeBodies(moduleName, bodies, nodes, nesting, mergeCount);
        i -= bodies.length * 2 - 2;
      }
      moduleName = name;
      bodies = [];
      log(tabs(nesting) + "Module " + moduleName + ' found at ' + i);
    }
    bodies.push({name: nodes[i], body: module});
    i++;
  }
  // Last step: merge all bodies for the last encountered module name, if any.
  if (bodies && bodies.length)
    mergeCount = mergeBodies(moduleName, bodies, nodes, nesting, mergeCount);
  return mergeCount;
}

function mergeBodies(name, bodies, parentNodeList, nesting, mergeCount) {
  mergeCount += bodies.length - 1;
  var result = bodies[0].body;
  log(tabs(nesting) + 'Merging ' + name + ': ' + bodies.length + ' / ' + parentNodeList.length);
  // Merging module bodies entails appending all the contained expressions to the list of
  // expressions of the first body, and then removing the original definition.
  for (var i = 1; i < bodies.length; i++) {
    var entry = bodies[i];
    result.push.apply(result, entry.body);
    parentNodeList.splice(parentNodeList.indexOf(entry.name), 2);
  }
  // After all bodies have been merged, recurse into the newly-unified module body to merge all
  // child module definitions.
  return optimizeModules(result, nesting + 1, mergeCount);
}

function getModuleName(node) {
    if (node.type !== 'VariableDeclaration' || node.declarations.length !== 1)
      return null;
    var declaration = node.declarations[0];
    if (declaration.type !== 'VariableDeclarator' || declaration.init !== null)
      return null;
    return declaration.id.name;
}

function getModuleDeclaration(name, node) {
  if (node.type !== 'ExpressionStatement')
    return null;
  var expression = node.expression;
  if (expression.type !== 'CallExpression')
    return null;
  var callee = expression.callee;
  if (callee.type !== 'FunctionExpression' || callee.id !== null ||
      callee.params.length !== 1 || callee.params[0].name !== name)
  {
    return null;
  }
  var args = expression.arguments;
  if (args.length !== 1 || args[0].type !== 'LogicalExpression' && args[0].type !== 'AssignmentExpression' ||
      args[0].left.name.indexOf(name) === -1)
  {
    return null;
  }
  return callee.body.body;
}
