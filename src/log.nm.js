//=============================================================================
//
// File:         exim/src/log.nm.js
// Language:     ECMAScript 2015
// Copyright:    Joe Honton © 2015
// License:      CC-BY-NC-ND 4.0
// Initial date: Sep 13, 2015
// Contents:     Logging using "todo | trace |normal | abnormal | invalid | security | expect | logic | hopeless"
//
//=============================================================================

module.exports =  class Log {
	
    constructor() {    	
    	this.tag = {
			todo:      "    [TODO]",
			trace:     "   [TRACE]",
			normal:    "  [NORMAL]",
			abnormal:  "[ABNORMAL]",
			invalid:   " [INVALID]",
			security:  "[SECURITY]",
			expect:    "[*EXPECT*]",
			logic:     "   [LOGIC]",
			hopeless:  "[HOPELESS]",
			exit:      "[    EXIT]"
    	};
    	Object.seal(this);
    }
    
    //^ Write a note to the log
    todo(message, args) {
    	this.stderr(this.tag.todo, message, args);
    }
    
    //^ Write a breadcrumb to the log
    trace(message, args) {
    	this.stderr(this.tag.trace, message, args);
    }

    //^ Write a normal notice into the log
    normal(message, args) {
    	this.stderr(this.tag.normal, message, args);
    }
    
    //^ Write an entry when something eventful and unexpected happens, but which may be recoverable
    abnormal(message, args) {
    	this.stderr(this.tag.abnormal, message, args);
    }

    //^ Write an entry when something eventful and unexpected happens, then terminate
    abnormalHalt(message, args) {
    	this.stderr(this.tag.abnormal, message, args);
    	this.exit(303,"HALT");
    }

    //^ Write an entry when data does not conform to rules, then proceed with fallback value
    invalid(message, args) {
    	this.stderr(this.tag.invalid, message, args);
    }

    //^ Write an entry when data does not conform to rules, then terminate
    invalidHalt(message, args) {
    	this.stderr(this.tag.invalid, message, args);
    	this.exit(505,"HALT");
    }

    //^ Write an entry when a security breach may have occured, then silently proceed
    security(message, args) {
    	this.stderr(this.tag.security, message, args);
    }
    
    //^ Write an entry when a security breach may have occured, then terminate
    securityHalt(message, args) {
    	this.stderr(this.tag.security, message, args);
    	this.exit(707,"HALT");
    }

    //^ Check to make sure the given argument is of the expected type, and write an entry when it's not
    //> obj is the object to check
    //> type is a string containing a prototype.name to validate against
    //< true if the expectation was met, false if not
    expect(obj, type, message, args) {
    	if (obj === undefined) {
    		if (type == 'undefined')
    			return true;
   			else {
   				this.stderr(this.tag.expect, `Expected type '${type}', but got 'undefined' ${message}`, args);
   				return false;
   			}
    	}
    	if (obj === null) {
    		if (type == 'null')
    			return true;
    		else {
    			this.stderr(this.tag.expect, `Expected type '${type}', but got 'null' ${message}`, args);
    			return false;
    		}
    	}
    		
    	if (obj.constructor.name != type) {
    		this.stderr(this.tag.expect, `Expected type '${type}', but got type '${obj.constructor.name}' ${message}`, args);
    		return false;
    	}
    	return true;
    }

    //^ Write an entry when a logically impossible condition occurs, then proceed with fallback value
    logic(message, args) {
    	this.stderr(this.tag.logic, message, args);
    }

    //^ Write an entry when a logically impossible condition occurs, then terminate
    logicHalt(message, args) {
    	this.stderr(this.tag.logic, message, args);
    	this.exit(808,"HALT");
    }
    
    //^ Write an entry when recovery is impossible or unwise, then terminate
    hopelessHalt(message, args) {
    	this.stderr(this.tag.hopeless, message, args);
    	this.exit(909,"HALT");
    }
    
    //^ Exit the process with the given return code
    exit(rc, message) {
    	this.expect(rc, 'Number');
    	this.expect(message, 'String');
    	this.stderr(this.tag.exit, rc, ` ${message}\n`);
    	process.exit(0);
    }

    //^ Take a snapshot of the stack and return the zero-indexed item from it
    getStack(depth) {
    	// create an Error object, but don't throw it
    	var stackTraceLine = (new Error).stack.split("\n")[depth];
    	
    	// extract the function name from the backtrace (assuming the backtrace pattern adopted by "node")
    	var regex1 = /at (.*) ?\(/g;
    	var matches = regex1.exec(stackTraceLine);
    	var desiredOutput = '';
    	if (matches.length > 1)
    		desiredOutput += matches[1].trim();
    	desiredOutput = this.rightAlign(desiredOutput);
    	return `{${desiredOutput}}`;

    }
    
    //^ Right align the given string to fit within a fixed 30 character column
    rightAlign(s) {
    	var columnLen = 30;
    	var stringLen = s.length;
    	if (stringLen > columnLen)
    		return s.substr(0,columnLen-3) + '...';
    	else
    		return Array(columnLen+1 - stringLen).join(' ') + s;
    }
    
    //^ Send message to stderr
    stderr(tag, message, args) {
    	if (message == undefined)
    		message = '';
    	if (args == undefined)
    		args = '';
    	process.stderr.write(`${tag}${this.getStack(4)} ${message}${args}\n`);
    }
}
