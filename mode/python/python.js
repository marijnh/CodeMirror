CodeMirror.defineMode("python", function(conf) {
    var ERRORCLASS = 'py-error';
    
    function wordRegexp(words) {
        return new RegExp("^((" + words.join(")|(") + "))\\b");
    }
    
    var singleOperators = new RegExp("^[\\+\\-\\*/%&|\\^~<>!]");
    var singleDelimiters = new RegExp('^[\\(\\)\\[\\]\\{\\}@,:`=;\\.]');
    var doubleOperators = new RegExp("^((==)|(!=)|(<=)|(>=)|(<>)|(<<)|(>>)|(//)|(\\*\\*))");
    var doubleDelimiters = new RegExp("^((\\+=)|(\\-=)|(\\*=)|(%=)|(/=)|(&=)|(\\|=)|(\\^=))");
    var tripleDelimiters = new RegExp("^((//=)|(>>=)|(<<=)|(\\*\\*=))");
    var identifiers = new RegExp("^[_A-Za-z][_A-Za-z0-9]*");

    var wordOperators = wordRegexp(['and', 'or', 'not', 'is', 'in']);
    var commonkeywords = ['as', 'assert', 'break', 'class', 'continue',
                          'def', 'del', 'elif', 'else', 'except', 'finally',
                          'for', 'from', 'global', 'if', 'import',
                          'lambda', 'pass', 'raise', 'return',
                          'try', 'while', 'with', 'yield'];
    var commontypes = ['bool', 'classmethod', 'complex', 'dict', 'enumerate',
                       'float', 'frozenset', 'int', 'list', 'object',
                       'property', 'reversed', 'set', 'slice', 'staticmethod',
                       'str', 'super', 'tuple', 'type'];
    var py2 = {'types': ['basestring', 'buffer', 'file', 'long', 'unicode',
                         'xrange'],
               'keywords': ['exec', 'print']};
    var py3 = {'types': ['bytearray', 'bytes', 'filter', 'map', 'memoryview',
                         'open', 'range', 'zip'],
               'keywords': ['nonlocal']};

    if (!!conf.mode.version && parseInt(conf.mode.version, 10) === 3) {
        commonkeywords = commonkeywords.concat(py3.keywords);
        commontypes = commontypes.concat(py3.types);
        var stringPrefixes = new RegExp("^(([rb]|(br))?('{3}|\"{3}|['\"]))", "i");
    } else {
        commonkeywords = commonkeywords.concat(py2.keywords);
        commontypes = commontypes.concat(py2.types);
        var stringPrefixes = new RegExp("^(([rub]|(ur)|(br))?('{3}|\"{3}|['\"]))", "i");
    }
    var keywords = wordRegexp(commonkeywords);
    var types = wordRegexp(commontypes);

    // tokenizers
    function tokenBase(stream, state) {
        // Handle scope changes
        if (stream.sol()) {
            var scopeOffset = state.scopes[0].offset;
            if (stream.eatSpace()) {
                var lineOffset = stream.indentation();
                if (lineOffset > scopeOffset) {
                    return 'py-indent';
                } else if (lineOffset < scopeOffset) {
                    return 'py-dedent';
                }
                return 'whitespace';
            } else {
                if (scopeOffset > 0) {
                    dedent(stream, state);
                }
            }
        }
        if (stream.eatSpace()) {
            return 'py-space';
        }
        
        var ch = stream.peek();
        
        // Handle Comments
        if (ch === '#') {
            stream.skipToEnd();
            return 'py-comment';
        }
        
        // Handle Number Literals
        if (stream.match(/^[0-9\.]/, false)) {
            var floatLiteral = false;
            // Floats
            if (stream.match(/^\d*\.\d+(e[\+\-]?\d+)?/i)) { floatLiteral = true; }
            if (stream.match(/^\d+\.\d*/)) { floatLiteral = true; }
            if (stream.match(/^\.\d+/)) { floatLiteral = true; }
            if (floatLiteral) {
                // Float literals may be "imaginary"
                stream.eat(/J/i);
                return 'py-literal';
            }
            // Integers
            var intLiteral = false;
            // Hex
            if (stream.match(/^0x[0-9a-f]+/i)) { intLiteral = true; }
            // Binary
            if (stream.match(/^0b[01]+/i)) { intLiteral = true; }
            // Octal
            if (stream.match(/^0o[0-7]+/i)) { intLiteral = true; }
            // Decimal
            if (stream.match(/^[1-9]\d*(e[\+\-]?\d+)?/)) {
                // Decimal literals may be "imaginary"
                stream.eat(/J/i);
                // TODO - Can you have imaginary longs?
                intLiteral = true;
            }
            if (intLiteral) {
                // Integer literals may be "long"
                stream.eat(/L/i);
                return 'py-literal';
            }
        }
        
        // Handle Strings
        if (stream.match(stringPrefixes)) {
            state.tokenize = tokenStringFactory(stream.current());
            return state.tokenize(stream, state);
        }
        
        // Handle operators and Delimiters
        if (stream.match(tripleDelimiters) || stream.match(doubleDelimiters)) {
            return 'py-delimiter';
        }
        if (stream.match(doubleOperators)
            || stream.match(singleOperators)
            || stream.match(wordOperators)) {
            return 'py-operator';
        }
        if (stream.match(singleDelimiters)) {
            return 'py-delimiter';
        }
        
        if (stream.match(types)) {
            return 'py-type';
        }
        
        if (stream.match(keywords)) {
            return 'py-keyword';
        }
        
        if (stream.match(identifiers)) {
            return 'py-identifier';
        }
        
        // Handle non-detected items
        stream.next();
        return ERRORCLASS;
    }
    
    function tokenStringFactory(delimiter) {
        while ('rub'.indexOf(delimiter[0].toLowerCase()) >= 0) {
            delimiter = delimiter.substr(1);
        }
        var delim_re = new RegExp(delimiter);
        var singleline = delimiter.length == 1;
        var OUTCLASS = 'py-string';
        
        return function tokenString(stream, state) {
            while (!stream.eol()) {
                stream.eatWhile(/[^'"\\]/);
                if (stream.eat('\\')) {
                    stream.next();
                    if (singleline && stream.eol()) {
                        return OUTCLASS;
                    }
                } else if (stream.match(delim_re)) {
                    state.tokenize = tokenBase;
                    return OUTCLASS;
                } else {
                    stream.eat(/['"]/);
                }
            }
            if (singleline) {
                if (conf.mode.singleLineStringErrors) {
                    OUTCLASS = ERRORCLASS
                } else {
                    state.tokenize = tokenBase;
                }
            }
            return OUTCLASS;
        };
    }
    
    function indent(stream, state, type) {
        type = type || 'py';
        var indentUnit = 0;
        if (type === 'py') {
            for (var i = 0; i < state.scopes.length; ++i) {
                if (state.scopes[i].type === 'py') {
                    indentUnit = state.scopes[i].offset + conf.indentUnit;
                    break;
                }
            }
        } else {
            indentUnit = stream.column() + stream.current().length;
        }
        state.scopes.unshift({
            offset: indentUnit,
            type: type
        });
    }
    
    function raw_dedent(state) {
        if (state.scopes.length > 1) {
            state.scopes.shift();
        }
    }
    
    function dedent(stream, state) {
        if (state.scopes[0].type === 'py') {
            var _indent = stream.indentation();
            var _indent_index = -1;
            for (var i = 0; i < state.scopes.length; ++i) {
                if (_indent === state.scopes[i].offset) {
                    _indent_index = i;
                    break;
                }
            }
            if (_indent_index === -1) {
                return true;
            }
            while (state.scopes[0].offset !== _indent) {
                state.scopes.shift();
            }
            return false
        } else {
            raw_dedent(state);
            return false;
        }
    }

    function tokenLexer(stream, state) {
        var style = state.tokenize(stream, state);
        var current = stream.current();

        // Handle '.' connected identifiers
        if (current === '.') {
            style = state.tokenize(stream, state);
            current = stream.current();
            if (style === 'py-identifier') {
                return 'py-identifier';
            } else {
                return ERRORCLASS;
            }
        }
        
        // Handle decorators
        if (current === '@') {
            style = state.tokenize(stream, state);
            current = stream.current();
            if (style === 'py-identifier'
                || current === '@staticmethod'
                || current === '@classmethod') {
                return 'py-decorator';
            } else {
                return ERRORCLASS;
            }
        }
        
        // Handle scope changes.
        if (current === 'pass' || current === 'return') {
            state.dedent += 1;
        }
        if ((current === ':' && !state.lambda && state.scopes[0].type == 'py')
            || style === 'py-indent') {
            indent(stream, state);
        }
        var delimiter_index = '[({'.indexOf(current);
        if (delimiter_index !== -1) {
            indent(stream, state, '])}'.slice(delimiter_index, delimiter_index+1));
        }
        if (style === 'py-dedent') {
            if (dedent(stream, state)) {
                return ERRORCLASS;
            }
        }
        delimiter_index = '])}'.indexOf(current);
        if (delimiter_index !== -1) {
            if (dedent(stream, state)) {
                return ERRORCLASS;
            }
        }
        if (state.dedent > 0 && stream.eol() && state.scopes[0].type == 'py') {
            raw_dedent(state);
            state.dedent -= 1;
        }
        
        return style;
    }

    var external = {
        startState: function(basecolumn) {
            return {
              tokenize: tokenBase,
              scopes: [{offset:basecolumn || 0, type:'py'}],
              lastToken: null,
              lambda: false,
              dedent: 0
          };
        },
        
        token: function(stream, state) {
            var style = tokenLexer(stream, state);
            
            state.lastToken = {style:style, content: stream.current()};
            
            if (stream.eol() && stream.lambda) {
                state.lambda = false;
            }
            
            return style;
        },
        
        indent: function(state, textAfter) {
            if (state.tokenize != tokenBase) {
                return 0;
            }
            
            return state.scopes[0].offset;
        }
        
    };
    return external;
});

CodeMirror.defineMIME("text/x-python", "python");
