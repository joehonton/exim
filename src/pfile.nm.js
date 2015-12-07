//=============================================================================
//
// File:         exim/src/pfile.nm.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2015
// License:      CC-BY-NC-ND 4.0
// Initial date: Aug 21, 2015
// Contents:     Class that holds a string that represents an entry in the
//               filesystem.
//               Optionally it may be preceded by an absolute or relative path.
//
//               Most functions are guaranteed to work with Posix-style separators only.
//
//=============================================================================

var FS = require('fs');

module.exports = class Pfile {
		
	//^ The only argument is either:
	//   a) a string representing a filename or a path;
	//	 b) a Pfile object
    constructor(path) {
    	if (path.constructor.name == 'Pfile')
    		this._copyConstructor(path);
    	else
    		this._normalConstructor(path);
    	
    	Object.seal(this);
    }
    
    _normalConstructor(path) {
    	log.expect(path, 'String');
    	this.setPath(path);
    }
    
    _copyConstructor(rhs) {
    	log.expect(rhs, 'Pfile');
    	this._filename = rhs._filename;
    }
    
    get name() {
    	return this._filename;
    }

    //^ Replace any existing path or filename with the given value
    setPath(path) {
    	log.expect(path, 'String');
    	this._filename = Pfile.posixStyle(path);
    	return this;
    }
    
    //^ Concatentate a POSIX path string to the current filename. Call it multiple times to build it up.
    //> path may be an absolute path with leading slash; a relative path, with leading ./ and ../; or a filename
    addPath(path) {
    	log.expect(path, 'String');
    	path = Pfile.posixStyle(path);
    	var len = this._filename.length;
    	if (len > 0 && this._filename.charAt(len-1) != '/')
    		this._filename += '/' + path;
    	else
    		this._filename += path;
    	
    	this.canonicalize();
    	return this;
    }
    
    //^ Concatentate the current filename on the given POSIX path string. Call it multiple times to build it up.
    //> path may be an absolute path with leading slash; a relative path, with a leading ./ or ../
    //> It makes little sense to provide a filename and extension in the argument. It is probably not what you want.
    //> If the given path contains something that looks like a filename with extension (for example, init.d), it is not treated specially.
    //> If the current filename is already absolute, this is probably not what you want
    addPathBefore(path) {
    	log.expect(path, 'String');
    	path = Pfile.posixStyle(path);
    	if (this.isAbsolute())
    		log.logic(`Attempting to add the path "${path}" before the absolute filename "${this._filename}" is probably not what you want.`);
    	var len = path.length;
    	if (len > 0 && path.charAt(len-1) != '/')
    		this._filename = path + '/' + this._filename;
    	else
    		this._filename = path + this._filename;
    	
    	this.canonicalize();
    	return this;
    }
    
    // Remove all occurances of ../ or ./ or //
    canonicalize() {
    	this._filename = this._filename.replace("/./", "/");		// before/./after --> before/after		(but keep leading dot: ./before/after)
    	this._filename = this._filename.replace("//", "/");		// before//after  --> before/after
    	var b = true;
    	while (b) {
    		b = this.removeDoubleDots();						// before/extra/../after --> before/after
    	}
    }

    //^ Remove one ../ occurance if possible
    //< returns true if an occurance was replaced
    removeDoubleDots() {
    	var parts = this._filename.split('/');
    	for (let i=1; i<parts.length-1; i++) {
    		
    		if (parts[i-1] != '..' && parts[i] == '..') {
    			parts.splice(i-1, 2);
        	    this._filename = parts.join('/');
        	    return true;
    		}
    	}
    	return false;
    }

    static getCwd() {
    	return Pfile.posixStyle(process.cwd());
    }
    
    //^ Convert the filename from a relative path to an absolute path on the filesystem
    //> relativeTo is a string representing the root path to which the current filename is relative
    //  if relativeTo is not provided by the caller, the current working directory is used
    makeAbsolute(relativeTo) {
    	if (this.isAbsolute())
    		return this;
    	
    	if (relativeTo == undefined)
    		relativeTo = Pfile.getCwd();
    	else
    		relativeTo = Pfile.posixStyle(relativeTo);

    	log.expect(relativeTo, 'String');
    	
    	if (this._filename.length == 0) {
    		this._filename = relativeTo;
    		return this;
    	}
    	
    	var tmp = new Pfile(relativeTo);
    	if (!tmp.isAbsolute()){
    		log.logic(`Attempting to make "${this._filename}" absolute by prefixing it with the non-absolute path "${relativeTo}" won't work.`);
    		return this;
    	}
    	
    	this.addPathBefore(relativeTo);
    	return this;
    }
    
    //^ get fully qualified name
    getFQN() {
    	return this._filename;
    }
    
    // return the path portion without the filename
    getPath() {
    	if (this.isDirectory())
    		return this._filename;
    	var parts = this._filename.split('/');
		return parts.splice(0, parts.length-1).join('/');
    }

    // return the filename portion without the path
    getFilename() {
    	if (this.isDirectory())
    		return "";
    	var parts = this._filename.split('/');
    	return parts[parts.length-1];
    }

    // return the filename without any extension
    getStem() {
    	var filename = this.getFilename();
    	var parts = filename.split('.');
    	if (parts.length <= 1)
    		return filename;									// no dots found, so there is no extension
    	else if (parts.length == 2 && parts[0].length == 0)
    		return filename;			    					// one dot found, as the first character, so this is a hidden file with no extension
    	else
    		return parts.splice(0, parts.length-1).join('.');
    }
    
    // return the filename extension only
    getExtension() {
    	var parts = this.getFilename().split('.');
    	if (parts.length <= 1)
    		return "";											// no dots found, so there is no extension
    	else if (parts.length == 2 && parts[0].length == 0)
    		return "";					    					// one dot found, as the first character, so this is a hidden file with no extension
    	else
    		return parts[parts.length-1];
    }
    
    // add an extension onto the filename, irrespective of whether or not the filename already has dot(s) in it
    addExtension(ext) {
    	this._filename = `${this._filename}.${ext}`;
    	return this;
    }
    
    // replace the existing extension with the given one
    replaceExtension(ext) {
    	var path = this.getPath();
    	var stem = this.getStem();
    	this._filename = `${path}/${stem}.${ext}`;
    	return this;
    }

    //^ Does this file or directory exist?
    exists() {
    	try {
    		FS.accessSync(this._filename, FS.F_OK);
    		return true;
    	} catch(e) {
    		return false;
    	}
    }
    
    //^ make the directory structure
    //< true on success, false on failure
    mkDir() {
    	if (this.exists())
    		return true;
    	
    	var path = new Pfile(this);
    	path.makeAbsolute();
    	var parts = path._filename.split('/');
    	
    	// look for Windows-style C: and remove it
    	if (parts[0].length > 1 && parts[0].charAt(1) == ':')
    		parts[0] = parts[0].substr(2);

    	var assemble = new Pfile('/');
    	for (let i=0; i<parts.length; i++) {
    		
    		// skip parts[0] if it's been reduced to an empty string, and skip any other occurrances of // or trailing /
    		if (parts[i].length > 0) {
    			assemble.addPath(parts[i]);
    			
    			// FS thows an exception if we try to mkdir when it already exists
    			if (!assemble.exists()) {
    				try {
    					FS.mkdirSync(assemble.getFQN());
    				} catch(e) {
    					return false;
    				}
    			}
    		}
    	}
    	return true;
    }
    
    //^ Is this file specified with a relative path?
    isRelative() {
    	return (!this.isAbsolute());
    }
    
    
    //^ Is this file specified with an absolute path?
    isAbsolute() {
    	
    	if (this._filename.length == 0)
    		return false;
    	
    	// look for Posix style
    	if (this._filename.charAt(0) == '/')
    		return true;
    	
    	// look for Windows-style C:
    	if (this._filename.length > 1 && this._filename.charAt(1) == ':')
    		return true;
    	
    	return false;
    }

    isDirectory() {
    	try {
    		var stats = FS.lstatSync(this._filename);
    		return stats.isDirectory();
    	} catch(e) {
    		return false;
    	}
    }
    
    isFile() {
    	try {
    		var stats = FS.lstatSync(this._filename);
    		return stats.isFile();
    	} catch(e) {
    		return false;
    	}
    }
    
    isSymbolicLink() {
    	try {
    		var stats = FS.lstatSync(this._filename);
    		return stats.isSymbolickLink();
    	} catch(e) {
    		return false;
    	}
    }
    
    isSpecialDirectory() {
    	if ( this._filename == '.' || this._filename == '..')
    		return true;
    	else 
    		return false;
    }
    
    // Convert all Windows separators to Posix-style forward solidus
    //> a string that may contain one or more '\'
    //< a string with all '\' replaced with '/'
    static posixStyle(path) {
    	log.expect(path, 'String');
    	return path.replace(/\\/g, '/');
    }
}


