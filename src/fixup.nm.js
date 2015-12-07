//=============================================================================
//
// File:         exim/src/fixup.nm.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2015
// License:      CC-BY-NC-ND 4.0
// Initial date: Sep 20, 2015
// Contents:     Convert ES2015 import and export keyword syntax
//               to ES5 require and module syntax
//
//=============================================================================

var FS = require('fs');
var Pfile = require('./pfile.nm.js');

module.exports = class Fixup {
	
    constructor(sourcePath, fixupPath) {
    	this.sourcePath = new Pfile(sourcePath).makeAbsolute();
    	this.fixupPath = new Pfile(fixupPath).makeAbsolute();
    	this.visited = [];			// an array of FQN filename that have been visited
    	this.initialize();
    	Object.seal(this);
    }
    
    // create the working directory where fixed-up code will be written
    initialize() {
    	if (!this.sourcePath.exists())
    		log.invalidHalt('No such source dir ' + this.sourcePath.name);
    	this.fixupPath.mkDir();
	}
    
    //^ bootstrap
    //> relativeFilename, a relative filename ./file.js or ../file.js or ./path/to/file.js or ../../path/to/file.js
    execute(relativeFilename) {
    	this.recursiveFixup(relativeFilename, this.sourcePath.getPath(), this.fixupPath.getPath(), 0);
    }
    
    //^ Recursively fixup all imports found in the given file
    //> relativeFilename, a relative filename ./file.js or ../file.js or ./path/to/file.js or ../../path/to/file.js
    //> pathIn to relativeFilename
    //> pathOut to relativeFilename
    //> recursion depth
	recursiveFixup(relativeFilename, pathIn, pathOut, depth) {
    	var pfileIn = new Pfile(pathIn).addPath(relativeFilename);
    	var pfileOut = new Pfile(pathOut).addPath(relativeFilename);
    	
    	if (!pfileIn.exists() )
    		log.invalidHalt('Source file not found ' + pfileIn.getFQN());
    	
    	var thisPathIn = pfileIn.getPath();
    	var thisPathOut = pfileOut.getPath();
    	var filenameOnly = pfileIn.getFilename();
    	
    	this.lineByLine(pfileIn.getFQN(), pfileOut.getFQN(), filenameOnly, thisPathIn, thisPathOut, depth);
	}

    //^ convert all import and export syntax in the given codeblock
	//> fqnIn is the fully qualified name to read from
	//> fqnOut is the fully qualified name to write to
	//> filenameOnly is NOT a relative filename, but simply the filename with extension
    //> pathIn to relativeFilename
    //> pathOut to relativeFilename
	//> recursion depth
	lineByLine(fqnIn, fqnOut, filenameOnly, pathIn, pathOut, depth) {

		// trace
		var pad = "                                                 ".substr(0,depth*2);
		var s = this.leftJustify(`${pad}${fqnIn}`, 75);
		log.trace(`${s} --> ${fqnOut}`);
		
    	var jsIn = FS.readFileSync(fqnIn, 'utf8')
		var buffer = [];
		var lines = jsIn.split("\n");
	
		for (let line of lines) {
			
			line = this.convertImport(line, filenameOnly, pathIn, pathOut, depth);
			line = this.convertExport(line);
			buffer.push(line);
		}

		var jsOut = buffer.join("\n");

		// make output directory
    	var dir = new Pfile(new Pfile(fqnOut).getPath())
    	dir.mkDir();

		// write
		FS.writeFileSync(fqnOut, jsOut);
	}

    //> A string containing ES2015 import syntax
    //< A string containing ES5 require syntax
	// Convert from: import ToolBox from "../../path/to/tool-box.class";
	// Convert to:   var ToolBox = require('./tool-box.class.js');
	//
	//> a single line of JavaScript code
	//> filenameOnly is NOT a relative filename, but simply the filename with extension
    //> pathIn to filenameOnly
    //> pathOut to filenameOnly
	//> recursion depth
	convertImport(line, filenameOnly, pathIn, pathOut, depth) {
		
		// using this as the test line										// "import ToolBox from '../../joezone/src/tool-box.class';		// comment"
		
		// strip off any trailing c++ style comment
		var lineWithoutComment = line.split('//')[0];						// "import ToolBox from '../../joezone/src/tool-box.class';		"
		lineWithoutComment = lineWithoutComment.trim();						// import ToolBox from '../../joezone/src/tool-box.class';
		
		var regex = /import\s+(.*?)\s+from\s+(.*)/;
		var match = regex.exec(lineWithoutComment);
		if (match == null)
			return line;
	
		var varname  = match[1];											// ToolBox
		var fileCapture = match[2];											// '../../joezone/src/tool-box.class';
		
		// remove any trailing semicolon
		if (fileCapture.charAt(fileCapture.length-1) == ';')
			fileCapture = fileCapture.substr(0, fileCapture.length-1);		// '../../joezone/src/tool-box.class'
		
		// remove possible surrounding quotes
		var char0 = fileCapture.charAt(0);
		var charN = fileCapture.charAt(fileCapture.length-1);
		if (char0 == charN && (char0 == '"' || char0 == "'"))
			fileCapture = fileCapture.substr(1, fileCapture.length-2);		// ../../joezone/src/tool-box.class
	
		var bSystemImport = (fileCapture == 'fs' || fileCapture == 'crypto');
		if (bSystemImport) {
			// patch the sourceline
			var filename = new Pfile(fileCapture).getFilename();			// fs
			var lineOut = `var ${varname} = require('${filename}');`;
			return lineOut;
		}
		else { 
			// append ".js"
			if (fileCapture.search('.js') != fileCapture.length - 3)		// ../../joezone/src/tool-box.class.js
				fileCapture += '.js';
			
			var captureIn = new Pfile(pathIn).addPath(fileCapture);
			var captureOut = new Pfile(pathOut).addPath(fileCapture);
			var nextPathIn = captureIn.getPath();
			var nextPathOut = captureOut.getPath();
			var nextFilenameOnly = captureIn.getFilename();
			
			if (this.visited.indexOf(captureIn.getFQN()) == -1) {
				// since this filename hasn't been visited yet, add it to the list of visited files and recurse
				this.visited.push(captureIn.getFQN());

				// if the file does indeed exist, recurse into it
				if (captureIn.exists())
					this.recursiveFixup(nextFilenameOnly, nextPathIn, nextPathOut, depth+1);
				else
					log.invalid(`Import not found '${captureIn.name}' while parsing ${filenameOnly}`);
			}
			
			var lineOut = `var ${varname} = require('${fileCapture}');`;
			return lineOut;
		}
	}

    //> A string containing ES2015 export syntax
    //< A string containing ES5 module.exports syntax
	//Convert from: export default class ToolBox {
	//Convert to:   module.exports = class ToolBox {
	convertExport(line) {
		return line.replace('export default', 'module.exports =');
	}

    //^ Left justify the given string, padding with spaces.
    //> sIn is the string to pad
    //> fixedLen is the desired length
    //> clip anything longer than the fixed length
    leftJustify(sIn, fixedLen, clip) {
    	if (clip == undefined) clip = true;

    	log.expect(sIn, 'String');
    	log.expect(fixedLen, 'Number');
    	log.expect(clip, 'Boolean');
    	
    	if (clip == true)
    		sIn = sIn.substr(0, fixedLen);
    	
    	if (sIn.length >= fixedLen)
    		return sIn;
    	else
    		return sIn + "                                                       ".substr(0, fixedLen - sIn.length);		// s/b " ".repeat(...)
    }
}
