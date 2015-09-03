If you have multiple classes in the same module namespace but defined in different files (or even just different `module` blocks) TypeScript's `tsc` will wrap every one of them into its own nest of IIFEs; one for each level of namespace nesting. [test/input.js](test/input.js) is a good example of that.

This post-processor merges module definitions recursively: if you have two classes in two different `module` blocks for the namespace `A.B`, it will merge them into a single body inside a nest of IIFEs.

## Usage

To process a string, use the `mergeModules` export. Alternatively the `mergeModulesInFile` export can be used to load and process a file, returning the result. Both take an optional second `boolean` argument for enabling logging.

Additionally, there's a bare-bones CLI script `bin/ts-merge` that just takes a file path as its sole argument and dumps the result to `stdout`.

## Restrictions
Merging module bodies isn't always valid and can fail for various reasons. The merger tries to avoid some of them, but others won't be caught, so merging should only be done on projects with good automated testing coverage. Examples of things that break the transform include using the same import name for different values (i.e. `import Foo = Bar.Foo` in one module body and `import Foo = Baz.Foo` in another) and having different module-internal values with the same binding name (i.e. `var MY_CONST = 1` and `var MY_CONST = 2`. Yes, there are various reasonf for not writing code like that anyway, I know.)

Additionally, the heuristics for identifying modules might well result in false-positives. The pattern to which modules are compiled is fairly distinctive, though, so I'm not sure how high the risk is here.

As a datapoint, as of today, running the merger over all ~4MB of code that the [Shumway project](http://areweflashyet.com/)'s SWF player gets compiled to eliminates well over 1000 IIFEs and didn't require any code changes at all.