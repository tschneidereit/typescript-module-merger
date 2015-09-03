merger = require('../src/ts-module-merger.js');
assert = require('assert');

var result = merger.mergeModulesInFile("test/input.js");
eval(result);
console.log(result);