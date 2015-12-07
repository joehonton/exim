export default class Three {
	
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

    //^ Send message to stderr
    stderr(tag, message, args) {
    	process.stderr.write(`333 ${tag} ${message}${args}\n`);
    }
}    
