// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("verilog", function(config, parserConfig) {

  var indentUnit = config.indentUnit,
      statementIndentUnit = parserConfig.statementIndentUnit || indentUnit,
      dontAlignCalls = parserConfig.dontAlignCalls,
      noIndentKeywords = parserConfig.noIndentKeywords || [],
      multiLineStrings = parserConfig.multiLineStrings,
      vxModeIsOn      = parserConfig.vxModeIsOn || false, // vx- verilog extension
      vxHooks      = parserConfig.vxHooks || {};

  function words(str) {
    var obj = {}, words = str.split(" ");
    for (var i = 0; i < words.length; ++i) obj[words[i]] = true;
    return obj;
  }

  /**
   * Keywords from IEEE 1800-2012
   */
  var keywords = words(
    "accept_on alias always always_comb always_ff always_latch and assert assign assume automatic before begin bind " +
    "bins binsof bit break buf bufif0 bufif1 byte case casex casez cell chandle checker class clocking cmos config " +
    "const constraint context continue cover covergroup coverpoint cross deassign default defparam design disable " +
    "dist do edge else end endcase endchecker endclass endclocking endconfig endfunction endgenerate endgroup " +
    "endinterface endmodule endpackage endprimitive endprogram endproperty endspecify endsequence endtable endtask " +
    "enum event eventually expect export extends extern final first_match for force foreach forever fork forkjoin " +
    "function generate genvar global highz0 highz1 if iff ifnone ignore_bins illegal_bins implements implies import " +
    "incdir include initial inout input inside instance int integer interconnect interface intersect join join_any " +
    "join_none large let liblist library local localparam logic longint macromodule matches medium modport module " +
    "nand negedge nettype new nexttime nmos nor noshowcancelled not notif0 notif1 null or output package packed " +
    "parameter pmos posedge primitive priority program property protected pull0 pull1 pulldown pullup " +
    "pulsestyle_ondetect pulsestyle_onevent pure rand randc randcase randsequence rcmos real realtime ref reg " +
    "reject_on release repeat restrict return rnmos rpmos rtran rtranif0 rtranif1 s_always s_eventually s_nexttime " +
    "s_until s_until_with scalared sequence shortint shortreal showcancelled signed small soft solve specify " +
    "specparam static string strong strong0 strong1 struct super supply0 supply1 sync_accept_on sync_reject_on " +
    "table tagged task this throughout time timeprecision timeunit tran tranif0 tranif1 tri tri0 tri1 triand trior " +
    "trireg type typedef union unique unique0 unsigned until until_with untyped use uwire var vectored virtual void " +
    "wait wait_order wand weak weak0 weak1 while wildcard wire with within wor xnor xor");

  /** Operators from IEEE 1800-2012
     unary_operator ::=
       + | - | ! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
     binary_operator ::=
       + | - | * | / | % | == | != | === | !== | ==? | !=? | && | || | **
       | < | <= | > | >= | & | | | ^ | ^~ | ~^ | >> | << | >>> | <<<
       | -> | <->
     inc_or_dec_operator ::= ++ | --
     unary_module_path_operator ::=
       ! | ~ | & | ~& | | | ~| | ^ | ~^ | ^~
     binary_module_path_operator ::=
       == | != | && | || | & | | | ^ | ^~ | ~^
  */
  var isOperatorChar = /[\+\-\*\/!~&|^%=?:]/;
  var isBracketChar = /[\[\]{}()]/;

  var unsignedNumber = /\d[0-9_]*/;
  var decimalLiteral = /\d*\s*'s?d\s*\d[0-9_]*/i;
  var binaryLiteral = /\d*\s*'s?b\s*[xz01][xz01_]*/i;
  var octLiteral = /\d*\s*'s?o\s*[xz0-7][xz0-7_]*/i;
  var hexLiteral = /\d*\s*'s?h\s*[0-9a-fxz?][0-9a-fxz?_]*/i;
  var realLiteral = /(\d[\d_]*(\.\d[\d_]*)?E-?[\d_]+)|(\d[\d_]*\.\d[\d_]*)/i;

  var closingBracketOrWord = /^((\w+)|[)}\]])/;
  var closingBracket = /[)}\]]/;

  var curPunc;
  var curKeyword;

  // Block openings which are closed by a matching keyword in the form of ("end" + keyword)
  // E.g. "task" => "endtask"
  var blockKeywords = words(
    "case checker class clocking config function generate interface module package" +
    "primitive program property specify sequence table task"
  );
  // Opening/closing pairs
  var openClose = {};
  for (var keyword in blockKeywords) {
    openClose[keyword] = "end" + keyword;
  }
  openClose["begin"] = "end";
  openClose["casex"] = "endcase";
  openClose["casez"] = "endcase";
  openClose["do"   ] = "while";
  openClose["fork" ] = "join;join_any;join_none";
  openClose["covergroup"] = "endgroup";

  for (var i in noIndentKeywords) {
    var keyword = noIndentKeywords[i];
    if (openClose[keyword]) {
      openClose[keyword] = undefined;
    }
  }

  // Keywords which open statements that are ended with a semi-colon
  var statementKeywords = words("always always_comb always_ff always_latch assert assign assume else export for foreach forever if import initial repeat while");

  function tokenBase(stream, state) {
    var ch = stream.peek();
    if (vxHooks[ch]) {
      var rslt = {};
      rslt = vxHooks[ch](stream, state, parserConfig);
      if (rslt.style != false) {return rslt.style;}
    }
    if (vxHooks["tokBase1"]) {
      var rslt = {};
      rslt = vxHooks["tokBase1"](stream, state, parserConfig);
      if (rslt.style != false) {return rslt.style;}
    }
    if (/[,;:\.]/.test(ch)) {
      curPunc = stream.next();
      return null;
    }
    if (isBracketChar.test(ch)) {
      curPunc = stream.next();
      return "bracket";
    }
    // Macros (tick-defines)
    if (ch == '`') {
      stream.next();
      if (stream.eatWhile(/[\w\$_]/)) {
        return "def";
      } else {
        return null;
      }
    }
    // System calls
    if (ch == '$') {
      stream.next();
      if (stream.eatWhile(/[\w\$_]/)) {
        return "meta";
      } else {
        return null;
      }
    }
    // Time literals
    if (ch == '#') {
      stream.next();
      stream.eatWhile(/[\d_.]/);
      return "def";
    }
    // Strings
    if (ch == '"') {
      stream.next();
      state.tokenize = tokenString(ch);
      return state.tokenize(stream, state);
    }
    // Comments
    if (ch == "/") {
      stream.next();
      if (stream.eat("*")) {
        state.tokenize = tokenComment;
        return tokenComment(stream, state);
      }
      if (stream.eat("/")) {
        stream.skipToEnd();
        return "comment";
      }
      stream.backUp(1);
    }

    // Numeric literals
    if (stream.match(realLiteral) ||
        stream.match(decimalLiteral) ||
        stream.match(binaryLiteral) ||
        stream.match(octLiteral) ||
        stream.match(hexLiteral) ||
        stream.match(unsignedNumber) ||
        stream.match(realLiteral)) {
      return "number";
    }

    // Operators
    if (stream.eatWhile(isOperatorChar)) {
      return "meta";
    }

    // Keywords / plain variables
    if (stream.eatWhile(/[\w\$_]/)) {
      var cur = stream.current();
      if (keywords[cur]) {
        if (openClose[cur]) {
          curPunc = "newblock";
        }
        if (statementKeywords[cur]) {
          curPunc = "newstatement";
        }
        curKeyword = cur;
        return "keyword";
      }
      return "variable";
    }

    stream.next();
    return null;
  }

  function tokenString(quote) {
    return function(stream, state) {
      var escaped = false, next, end = false;
      while ((next = stream.next()) != null) {
        if (next == quote && !escaped) {end = true; break;}
        escaped = !escaped && next == "\\";
      }
      if (end || !(escaped || multiLineStrings))
        state.tokenize = tokenBase;
      return "string";
    };
  }

  function tokenComment(stream, state) {
    var maybeEnd = false, ch;
    while (ch = stream.next()) {
      if (ch == "/" && maybeEnd) {
        state.tokenize = tokenBase;
        break;
      }
      maybeEnd = (ch == "*");
    }
    return "comment";
  }

  function Context(indented, column, type, align, prev) {
    this.indented = indented;
    this.column = column;
    this.type = type;
    this.align = align;
    this.prev = prev;
  }
  function pushContext(state, col, type) {
    var indent = state.indented;
    var c = new Context(indent, col, type, null, state.context);
    return state.context = c;
  }
  function popContext(state) {
    var t = state.context.type;
    if (t == ")" || t == "]" || t == "}") {
      state.indented = state.context.indented;
    }
    return state.context = state.context.prev;
  }

  function isClosing(text, contextClosing) {
    if (text == contextClosing) {
      return true;
    } else {
      // contextClosing may be mulitple keywords separated by ;
      var closingKeywords = contextClosing.split(";");
      for (var i in closingKeywords) {
        if (text == closingKeywords[i]) {
          return true;
        }
      }
      return false;
    }
  }

  function buildElectricInputRegEx() {
    // Reindentation should occur on any bracket char: {}()[]
    // or on a match of any of the block closing keywords, at
    // the end of a line
    var allClosings = [];
    for (var i in openClose) {
      if (openClose[i]) {
        var closings = openClose[i].split(";");
        for (var j in closings) {
          allClosings.push(closings[j]);
        }
      }
    }
    var re = new RegExp("[{}()\\[\\]]|(" + allClosings.join("|") + ")$");
    return re;
  }

  // Interface
  return {

    // Regex to force current line to reindent
    electricInput: buildElectricInputRegEx(),

    startState: function(basecolumn) {
      return {
        tokenize: null,
        context: new Context((basecolumn || 0) - indentUnit, 0, "top", false),
        indented: 0,
        startOfLine: true,
        vxCodeActive: vxModeIsOn,
        vxIndentRq: null
      };
    },

    token: function(stream, state) {
      var ctx = state.context;
      if (stream.sol()) {
        if (ctx.align == null) ctx.align = false;
        state.indented = stream.indentation();
        state.startOfLine = true;
      }
      if (vxHooks["tok1"]) {vxHooks["tok1"](stream, state, parserConfig);}
      if (stream.eatSpace()) return null;
      curPunc = null;
      curKeyword = null;
      var style = (state.tokenize || tokenBase)(stream, state);
      if (style == "comment" || style == "meta" || style == "variable") return style;
      if (ctx.align == null) ctx.align = true;

      if (curPunc == ctx.type) {
        popContext(state);
      }
      else if ((curPunc == ";" && ctx.type == "statement") ||
               (ctx.type && isClosing(curKeyword, ctx.type))) {
        ctx = popContext(state);
        while (ctx && ctx.type == "statement") ctx = popContext(state);
      }
      else if (curPunc == "{") { pushContext(state, stream.column(), "}"); }
      else if (curPunc == "[") { pushContext(state, stream.column(), "]"); }
      else if (curPunc == "(") { pushContext(state, stream.column(), ")"); }
      else if (ctx && ctx.type == "endcase" && curPunc == ":") { pushContext(state, stream.column(), "statement"); }
      else if (curPunc == "newstatement") {
        pushContext(state, stream.column(), "statement");
      } else if (curPunc == "newblock") {
        if (curKeyword == "function" && ctx && (ctx.type == "statement" || ctx.type == "endgroup")) {
          // The 'function' keyword can appear in some other contexts where it actually does not
          // indicate a function (import/export DPI and covergroup definitions).
          // Do nothing in this case
        } else if (curKeyword == "task" && ctx && ctx.type == "statement") {
          // Same thing for task
        } else {
          var close = openClose[curKeyword];
          pushContext(state, stream.column(), close);
        }
      }

      state.startOfLine = false;
      return style;
    },

    indent: function(state, textAfter) {
      if (state.tokenize != tokenBase && state.tokenize != null) return CodeMirror.Pass;
      if (vxHooks["vxIndent1"]) {
        var vxIndentVal = vxHooks["vxIndent1"](state);
        if (state.vxCodeActive && vxIndentVal >= 0) {return vxIndentVal;};
      }
      var ctx = state.context, firstChar = textAfter && textAfter.charAt(0);
      if (ctx.type == "statement" && firstChar == "}") ctx = ctx.prev;
      var closing = false;
      var possibleClosing = textAfter.match(closingBracketOrWord);
      if (possibleClosing) {
        closing = isClosing(possibleClosing[0], ctx.type);
      }
      if (ctx.type == "statement") return ctx.indented + (firstChar == "{" ? 0 : statementIndentUnit);
      else if (closingBracket.test(ctx.type) && ctx.align && !dontAlignCalls) return ctx.column + (closing ? 0 : 1);
      else if (ctx.type == ")" && !closing) return ctx.indented + statementIndentUnit;
      else return ctx.indented + (closing ? 0 : indentUnit);
    },

    blockCommentStart: "/*",
    blockCommentEnd: "*/",
    lineComment: "//"
  };
});

  CodeMirror.defineMIME("text/x-verilog", {
    name: "verilog"
  });

  CodeMirror.defineMIME("text/x-systemverilog", {
    name: "verilog"
  });

  CodeMirror.defineMIME("text/x-svx", {
    name: "verilog",
    vxModeIsOn: true,
    vxHooks: {
        "\\": function(stream, state, thisMode) {
               var codeRegion = "", vxIndent = 0, style = false;
               var curPunc  = stream.string;
               if ((0 == stream.pos) && (/\\SV/.test(stream.string))) {
                 curPunc = (/\\SVX_version/.test(stream.string))
                   ? "\\SVX_version" : stream.string;
                 stream.skipToEnd();
                 if (curPunc=="\\SV" && state.vxCodeActive) {codeRegion = "2v";};
                 if (/\\SVX/.test(curPunc) && !state.vxCodeActive) {codeRegion ="2vx";};
                 if (curPunc=="\\SVX_version" && state.vxCodeActive) {codeRegion = "2vx";};
                 style=(thisMode.svxkeywords.propertyIsEnumerable(curPunc))
                   ? thisMode.svxkeywords[curPunc] : "builtin";
                 thisMode.svxCurCtlFlowChar  = thisMode.svxPrevPrevCtlFlowChar
                   = thisMode.svxPrevCtlFlowChar = "";
                 if (codeRegion == "2vx") {
                   thisMode.svxCurCtlFlowChar  = "\\";
                   vxIndent=thisMode.vxHooks["svxGenIndent"](stream, state, thisMode);
                 }
                 if ("2v"  == codeRegion)  {state.vxCodeActive=false;}
                 if ("2vx" == codeRegion)  {state.vxCodeActive=true;}
                 state.vxIndentRq = vxIndent;
               }
               return {style:style, codeRegion:codeRegion,vxIndent:vxIndent};
        },
        "tokBase1": function(stream, state, thisMode) {
               var codeRegion = "", vxIndent = 0, style = false;
               var ch = stream.peek(), curPunc=stream.current();
               var vxCurCtlFlowCharValueAtStart = thisMode.svxCurCtlFlowChar;
               if (state.vxCodeActive==true) {
                 switch (true) {
                   case /[\[\]{}\(\);\:]/.test(ch):
                     // bypass nesting and 1 char punc
                     style = "meta";
                     stream.next();
                     break;
                   case ch == "/":
                     stream.next();
                     if (stream.eat("/")) {
                       stream.skipToEnd();
                       style =  "comment";
                       thisMode.svxCurCtlFlowChar  = "S";
                     } else
                       stream.backUp(1);
                     break;
                   case /@/.test(ch):
                     // pipeline stage
                     style = thisMode.svxchScopePrefixs[ch];
                     thisMode.svxCurCtlFlowChar  = "@";
                     stream.next();
                     stream.eatWhile(/[\w\$_]/);
                     break;
                   case /\b[mM]4+?/.test(curPunc):
                     // m4 pre proc
                     style = thisMode.svxkeywords[curPunc];
                     thisMode.svxCurCtlFlowChar  = "m4";
                     /* if (style=="def") */ stream.skipTo("(");
                     break;
                   case ch == "!" && stream.pos==0:
                     // v stmt in svx region
                     // thisMode.svxCurCtlFlowChar  = "S"; // bozo want to indent next tok
                     style = "comment";
                     stream.next();
                     break;
                   case thisMode.svxisOperatorChar.test(ch):
                     // operators
                     stream.eatWhile(thisMode.svxisOperatorChar);
                     style = "operator";
                     break;
                   case ch == "#":
                     // phy hier
                     thisMode.svxCurCtlFlowChar  = (thisMode.svxCurCtlFlowChar=="")
                       ? ch : thisMode.svxCurCtlFlowChar;
                     stream.next();
                     stream.eatWhile(/[+-]\d/);
                     style = "tag";
                     break;
                   case thisMode.svxkpScopePrefixs.propertyIsEnumerable(ch):
                     // special SVX operators
                     style = thisMode.svxkpScopePrefixs[ch];
                     thisMode.svxCurCtlFlowChar  = (thisMode.svxCurCtlFlowChar=="")
                       ? "S" : thisMode.svxCurCtlFlowChar;  // stmt
                     stream.next();
                     stream.match(/[a-zA-Z_0-9]+/);
                     break;
                   case thisMode.svxchScopePrefixs.propertyIsEnumerable(ch):
                     // special SVX operators
                     style = thisMode.svxchScopePrefixs[ch];
                     thisMode.svxCurCtlFlowChar  = (thisMode.svxCurCtlFlowChar=="")
                       ? ch : thisMode.svxCurCtlFlowChar;
                     stream.next();
                     stream.match(/[a-zA-Z_0-9]+/);
                     break;
                 }
                 if (thisMode.svxCurCtlFlowChar != vxCurCtlFlowCharValueAtStart) { // flow change
                   vxIndent=thisMode.vxHooks["svxGenIndent"](stream, state, thisMode);
                   state.vxIndentRq = vxIndent;
                 }
               }
               return {style:style, codeRegion:codeRegion,vxIndent:vxIndent};
        },
        "tok1": function(stream, state, thisMode) {
               if (state.vxCodeActive==true && stream.sol() && thisMode.svxCurCtlFlowChar != "") {
                 thisMode.svxPrevPrevCtlFlowChar = thisMode.svxPrevCtlFlowChar;
                 thisMode.svxPrevCtlFlowChar = thisMode.svxCurCtlFlowChar;
                 thisMode.svxCurCtlFlowChar  = "";
               }
        },
        "svxGenIndent": function(stream, _state, thisMode) {
               var rtnIndent = -1, indentUnitRq=0, curIndent=stream.indentation();
               switch (thisMode.svxCurCtlFlowChar) {
                   case "\\":
                     curIndent = 0;
                     break;
                   case "|":
                     if (thisMode.svxPrevPrevCtlFlowChar=="@") {
                       indentUnitRq=-2; //-2 new pipe rq after cur pipe
                       break;
                     }
                     if (thisMode.svxchScopePrefixs.propertyIsEnumerable(thisMode.svxPrevCtlFlowChar))
                       indentUnitRq=1; // +1 new scope
                     break;
                   case "m4":
                    if (thisMode.svxPrevPrevCtlFlowChar=="@") {
                       indentUnitRq=-2; //-2 new inst rq after  pipe
                       break;
                     }
                     if (thisMode.svxchScopePrefixs.propertyIsEnumerable(thisMode.svxPrevCtlFlowChar))
                       indentUnitRq=1; // +1 new scope
                     break;
                   case "@":
                     if (thisMode.svxPrevCtlFlowChar=="S") {
                       indentUnitRq=-1; // new pipe stage after stmts
                     }
                     if (thisMode.svxPrevCtlFlowChar=="|") {
                       indentUnitRq=1; // 1st pipe stage
                     }
                     break;
                   case "S":
                     if (thisMode.svxPrevCtlFlowChar=="@") {
                       indentUnitRq=1; // flow in pipe stage
                     }
                     if (thisMode.svxchScopePrefixs.propertyIsEnumerable(thisMode.svxPrevCtlFlowChar))
                       indentUnitRq=1; // +1 new scope
                     break;
               }
               var statementIndentUnit = thisMode.svxindentUnit;
               rtnIndent = curIndent + (indentUnitRq*statementIndentUnit);
               return( (rtnIndent>=0) ?rtnIndent :curIndent );
        },
        "vxIndent1": function(state) {
              return(state.vxIndentRq);
        }
    },
    svxPrevPrevCtlFlowChar: "",
    svxPrevCtlFlowChar: "",
    svxCurCtlFlowChar:  "",
    svxindentUnit: 2,
    svxkeywords: {
        "\\SVX":"keyword", "\\SV":"keyword", "m4":"def", "M4":"def", "\\SVX_version":"keyword"},
    svxkpScopePrefixs: {
        "**":"variable-2", "*":"variable-2", "$$":"variable", "$":"variable",
        "^^":"attribute", "^":"attribute"},
    svxchScopePrefixs: {
        ">":"property", "->":"property", "-":"hr", "|":"link", "?$":"qualifier", "?*":"qualifier",
        "@-":"variable-3", "@":"variable-3", "?":"qualifier"},
    svxisOperatorChar:  /[\[\]=:]/
  });
});


