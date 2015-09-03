merger = require('./ts-module-merger');

exports.run = function() {
	console.log(merger.mergeModulesInFile(process.argv[2]));
}