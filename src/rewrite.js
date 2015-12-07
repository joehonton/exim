//=============================================================================
//
// File:         exim/src/rewrite.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2015
// License:      CC-BY-NC-ND 4.0
// Initial date: Sep 20, 2015
// Contents:     Main routine for recursively converting from real ES6 import/export 
//               syntax back to ES5 require/module.exports syntax compatible with nodejs
//
// Usage:        node ./path/to/rewrite.js /path/to/sourcedir /path/to/destdir filename"
//
//=============================================================================

var Log = require('./log.nm.js');
var Fixup = require('./fixup.nm.js');
global.log = new Log();

if (process.argv.length < 4)
	log.invalidHalt("usage: node ./path/to/rewrite.js sourcedir destdir filename");
var sourcedir = process.argv[2];
var destdir = process.argv[3];
var filename = process.argv[4];

var fx = new Fixup(sourcedir, destdir);
fx.execute(filename);
