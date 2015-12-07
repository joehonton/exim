import Three from './sub/three.class';

var three = new Three();
three.todo("hello", " world");

export default class One {
	
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
    	process.stderr.write(`111 ${tag} ${message}${args}\n`);
    }
}    
