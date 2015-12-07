# What is exim
 
Exim is an ECMAScript transpiler for developers who want to use the ECMAScript 2015 import/export syntax before the V8 module loader has been finalized.

# Why is this needed

The syntax for importing and exporting modules has been finalized by ECMA's TC39, but the implementation of it in the V8 compiler is still in progress (December 2015). This means that any project that wants to structure its code using require/module syntax will need to redo that work later on when the module loader is ready. This exim transpiler allows developers to get a jump start on using the new import/export syntax.

Other transpilers are available to handle the CommonJS and Asynchronous Module Definition (AMD) formats; this exim transpiler is not a replacement for those tools. The Babel transpiler is a full language transpiler that provides robust support for converting ES6 to ES5 code; this exim transpiler is not even in the same league.

Exim is limited to converting the 'import' keyword into 'require' syntax, and the 'export' keyword into 'module' syntax.

The principal advantage of using this tool over something more robust is that all other lines of code remain untouched, leaving your carefully crafted code exactly as you wrote it.

# Prerequisites

This tool uses nodeJS. It was originally developed on version v0.12, but has since been deployed on v4.1.0 and 5.0.
The only external module required is 'fs', which is part of the node core.  No other NPM module needs to be installed.  

# Usage

From the command line, execute node (using strict mode) with exim's main entry point 'rewrite.js'.  Pass three arguments:  
1. source directory  
2. destination directory  
3. a filename  

```
node --use_strict ./src/rewrite.js sourcedir destdir filename
```

The exim transpiler will recursively discover and fixup all modules starting with the given filename.

For example:

```
user@host> cd /exim
user@host> node --use_strict ./src/rewrite.js ./test/src/main.js ../es5/exim/test/src main.js  
 [TRACE]{Fixup.lineByLine} C:/neonave/exim/test/src/main.js                     --> C:/neonave/es5/exim/test/src/main.js  
 [TRACE]{Fixup.lineByLine}   C:/neonave/exim/test/src/one.class.js              --> C:/neonave/es5/exim/test/src/one.class.js  
 [TRACE]{Fixup.lineByLine}     C:/neonave/exim/test/src/sub/three.class.js      --> C:/neonave/es5/exim/test/src/sub/three.class.js  
 [TRACE]{Fixup.lineByLine}   C:/neonave/exim/test/src/two.class.js              --> C:/neonave/es5/exim/test/src/two.class.js  
```

# Sample
### Sample input

```  
import Three from './sub/three.class';  

var three = new Three();  
three.todo("hello", " world");  

export default class One {  
    constructor() {  
    }  
    }  
}
```

### Sample output

```
var Three = require('./sub/three.class.js');

var three = new Three();
three.todo("hello", " world");

module.exports = class One {
    constructor() {
    }
}
```

# Sunset policy
This tool should not be used after the real module loader in V8 has been finalized.

