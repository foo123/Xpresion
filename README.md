Xpr3s10n
========

A simple, fast and flexible **eXpression Parser Engine** (with custom functions and variables support) for `PHP`, `Python`, `Node.js` and `Browser`


![Xpresion](/xpresion.jpg)

**light-weight (~29kB minified, ~10kB zipped)**


**version 1.0.1** [Xpresion.js](https://raw.githubusercontent.com/foo123/Xpresion/master/src/js/Xpresion.js), [Xpresion.min.js](https://raw.githubusercontent.com/foo123/Xpresion/master/src/js/Xpresion.min.js)



**see also:**  

* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node.js / Browser / XPCOM Javascript, PHP, Python
* [HtmlWidget](https://github.com/foo123/HtmlWidget) html widgets used as (template) plugins and/or standalone for Node.js / Browser / XPCOM Javascript, PHP, Python (can be used as plugins for Contemplate engine as well)
* [Tao](https://github.com/foo123/Tao.js) A simple, tiny, isomorphic, precise and fast template engine for handling both string and live dom based templates
* [ModelView](https://github.com/foo123/modelview.js) a light-weight and flexible MVVM framework for JavaScript/HTML5
* [ModelView MVC jQueryUI Widgets](https://github.com/foo123/modelview-widgets) plug-n-play, state-full, full-MVC widgets for jQueryUI using modelview.js (e.g calendars, datepickers, colorpickers, tables/grids, etc..) (in progress)
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for Node.js / Browser / XPCOM Javascript, PHP, Python
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for Node.js / Browser / XPCOM Javascript, PHP, Python
* [StringTemplate](https://github.com/foo123/StringTemplate) simple and flexible string templates for Node.js / Browser / XPCOM Javascript, PHP, Python
* [GrammarTemplate](https://github.com/foo123/GrammarTemplate) versatile and intuitive grammar-based templating for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL construction for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Abacus](https://github.com/foo123/Abacus) a fast combinatorics and computation library for Node.js / Browser / XPCOM Javascript, PHP, Python
* [Simulacra](https://github.com/foo123/Simulacra) a simulation, algebraic, probability and combinatorics PHP package for scientific computations
* [RT](https://github.com/foo123/RT) client-side real-time communication for Node.js / Browser / XPCOM Javascript with support for Poll / BOSH / WebSockets
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript


### Contents

* [Features](#features)
* [Examples](#examples)
* [Live Examples](#live-examples)
* [API](#api)
* [Platform Support](#platform-support)
* [Performance](#performance)
* [Todo](#todo)
* [Etymology of *"expression"*](https://en.wiktionary.org/wiki/expression) a latinised form of [*"έκφραση"* (etymology)](https://en.wiktionary.org/wiki/%CE%AD%CE%BA%CF%86%CF%81%CE%B1%CF%83%CE%B7), compare [etymology of *"phrase"*](https://en.wiktionary.org/wiki/phrase) (for an example of phonetic / linguistic equivalent transformations during historic evolution see [Grimm's law](https://en.wikipedia.org/wiki/Grimm's_law))





[![Xpresion Live](https://github.com/foo123/Xpresion/raw/master/xpresion.png)](https://foo123.github.io/examples/xpresion)


#### Features 

**(v. 1.0.0+)**

`Xpresion` **is not an expression parser**, it does not parse expressions. It is a **parser engine**. 
It builds parsers, which parse (custom) expressions. Effectively it is a small [rewrite system](http://en.wikipedia.org/wiki/Abstract_rewriting_system)

This is accomplished by configuring the `Xpresion` engine to fit the needed expression syntax.
Configuration is intutive, easy and flexible (see examples).

However, since `Xpresion` is a parser engine, adding a default configuration, it can itself be a parser as well (out-of-the-box).

**NOTE:** `Xpresion` (v.1.0.0+) uses [Grammar Templates](https://github.com/foo123/GrammarTemplate) for operator output. This is more flexible than simply using [String Templates](https://github.com/foo123/StringTemplate) as previously, since it supports blocks of optional code, default values, optional placeholders and many other things. Only make sure to escape (with `\` character) all `"<"`,`">"`,`"["`,`"]"` literal characters inside the output you define for operators and functions (see default configuration example below)

**Features:**

1. simple, intuitive, flexible, fast
1. support an adequate expression syntax out of the box (i.e numbers, strings, regexes, reserved tokens, arithmetical/logical operators, ternary operators, some advanced functions, variables)
3. highly flexible and configurable (regexes, outputs, functions, operators, aliases, runtime functions, etc..)
4. support (user-defined) variables, (user-defined) functions
5. define custom operators (prefix, infix, postfix, left/right association, etc..) seamlessly
6. define polymorphic operators / operator overloading seamlessly (e.g **subtraction** and **unary negation**)
7. define n-ary operators seamlessly (e.g **ternary if-then-else**, etc..)
8. define aliases of operators/functions seamlessly
9. define new custom expression syntaxes easily (e.g via another `configuration` or by extending `defaultConfiguration` )
10. implementations for `Node.js` and `Browser`, `PHP`, `Python` (only one class per implementation)


**If you use `Xpresion` in your application and you want to share it, feel free to submit an example link**


#### Live Examples

* [Interactive Playground Example](https://foo123.github.io/examples/xpresion)

#### Examples

**(see test/test.js)**

**javascript**
```javascript
var echo = console.log, 
    Xpresion = require(__dirname+'/../src/js/Xpresion.js')
;

function test_expr(expr, evaluate)
{
    evaluate = evaluate || false;
    echo('==========================================');
    var xpr = null;
    try {
        // uses defaultConfiguration by default
        xpr = Xpresion(expr);
    } catch (err ) {
        xpr = null;
        echo(err.toString());
    }
    if ( xpr )
    {
        var debug = evaluate ? xpr.debug(evaluate instanceof Object ? evaluate : {}) : xpr.debug();
        echo(debug);
    }
}

echo( 'Xpresion.VERSION ' + Xpresion.VERSION + "\n" );

test_expr('13');
test_expr('1.32');
test_expr('-0.12');
test_expr('-3');
test_expr('("1,2,3")+3',true);
test_expr('"1,2,3"+3',true);
test_expr('"1,2,3"+3+4',true);
test_expr('[1,2,3]+3',true);
test_expr('-3+2',true);
test_expr('1-3+2',true);
test_expr('1+-3',true);
test_expr('+1+3',true);
test_expr('2*-1');
test_expr('2*(-1)');
test_expr('2^-1');
test_expr('2^(-1)');
test_expr('2^-1^3');
test_expr('-2^-1^3');
test_expr('2^(-1)^3');
test_expr('sqrt(2)', true);
test_expr('$v');
test_expr('$v.key.0.key', {'v':{'key':[{'key':'correct'},'foo']}});
test_expr('True');
test_expr('"string"');
test_expr('["a","rra","y"]');
test_expr('`^regex?`i');
test_expr('0 == 1');
test_expr('TRUE == False');
test_expr('TRUE is False');
test_expr('1+2');
test_expr('1+2+3');
test_expr('1+2*3');
test_expr('1*2+3');
test_expr('1*2*3');
test_expr('1+2/3');
test_expr('1*2/3');
test_expr('1^2');
test_expr('1^2^3');
test_expr('1^(2^3)');
test_expr('(1^2)^3');
test_expr('((1^2))^3');
test_expr('`^regex?`i matches "string"');
test_expr('`^regex?`i matches "string" and `^regex?`i matches "string2"');
test_expr('$v in ["a","b","c"]');
test_expr('1 ? : (1+2) (3+4)');
test_expr('1 ? sum(1,2) : (3+4)');
test_expr('1 ? 1+2 : (3+4)');
test_expr('1 ? (2+3) : 2 ? (3+4) : (4+5)');
test_expr('date("Y-m-d H:i:s")', true);
test_expr('time()', true);
test_expr('date("Y-m-d H:i:s", time())');
test_expr('pow(1,pow(2,3))');
test_expr('pow(pow(2,3),4)');
test_expr('pow(pow(1,2),pow(2,3))');
```

**output**
```text
Xpresion.VERSION 1.0.0

==========================================
Expression: 13
Variables : []
Evaluator : 13
==========================================
Expression: 1.32
Variables : []
Evaluator : 1.32
==========================================
Expression: -0.12
Variables : []
Evaluator : (-0.12)
==========================================
Expression: -3
Variables : []
Evaluator : (-3)
==========================================
Expression: ("1,2,3")+3
Variables : []
Evaluator : ("1,2,3"+String(3))
Data      : {}
Result    : "1,2,33"
==========================================
Expression: "1,2,3"+3
Variables : []
Evaluator : ("1,2,3"+String(3))
Data      : {}
Result    : "1,2,33"
==========================================
Expression: "1,2,3"+3+4
Variables : []
Evaluator : (("1,2,3"+String(3))+String(4))
Data      : {}
Result    : "1,2,334"
==========================================
Expression: [1,2,3]+3
Variables : []
Evaluator : Fn.ary_merge([1,2,3],3)
Data      : {}
Result    : [1,2,3,3]
==========================================
Expression: -3+2
Variables : []
Evaluator : ((-3)+2)
Data      : {}
Result    : -1
==========================================
Expression: 1-3+2
Variables : []
Evaluator : ((1-3)+2)
Data      : {}
Result    : 0
==========================================
Expression: 1+-3
Variables : []
Evaluator : (1+(-3))
Data      : {}
Result    : -2
==========================================
Expression: +1+3
Variables : []
Evaluator : (1+3)
Data      : {}
Result    : 4
==========================================
Expression: 2*-1
Variables : []
Evaluator : (2*(-1))
==========================================
Expression: 2*(-1)
Variables : []
Evaluator : (2*(-1))
==========================================
Expression: 2^-1
Variables : []
Evaluator : Math.pow(2,(-1))
==========================================
Expression: 2^(-1)
Variables : []
Evaluator : Math.pow(2,(-1))
==========================================
Expression: 2^-1^3
Variables : []
Evaluator : Math.pow(2,Math.pow((-1),3))
==========================================
Expression: -2^-1^3
Variables : []
Evaluator : Math.pow((-2),Math.pow((-1),3))
==========================================
Expression: 2^(-1)^3
Variables : []
Evaluator : Math.pow(2,Math.pow((-1),3))
==========================================
Expression: sqrt(2)
Variables : []
Evaluator : Math.sqrt(2)
Data      : {}
Result    : 1.4142135623730951
==========================================
Expression: $v
Variables : [v]
Evaluator : Var["v"]
==========================================
Expression: $v.key.0.key
Variables : [v]
Evaluator : Xpresion.GET(Var["v"],["key","0","key"])
Data      : {
    "v": {
        "key": [
            {
                "key": "correct"
            },
            "foo"
        ]
    }
}
Result    : "correct"
==========================================
Expression: True
Variables : []
Evaluator : true
==========================================
Expression: "string"
Variables : []
Evaluator : "string"
==========================================
Expression: ["a","rra","y"]
Variables : []
Evaluator : ["a","rra","y"]
==========================================
Expression: `^regex?`i
Variables : []
Evaluator : Cache.re_1
==========================================
Expression: 0 == 1
Variables : []
Evaluator : (0==1)
==========================================
Expression: TRUE == False
Variables : []
Evaluator : (true==false)
==========================================
Expression: TRUE is False
Variables : []
Evaluator : (true===false)
==========================================
Expression: 1+2
Variables : []
Evaluator : (1+2)
==========================================
Expression: 1+2+3
Variables : []
Evaluator : ((1+2)+3)
==========================================
Expression: 1+2*3
Variables : []
Evaluator : (1+(2*3))
==========================================
Expression: 1*2+3
Variables : []
Evaluator : ((1*2)+3)
==========================================
Expression: 1*2*3
Variables : []
Evaluator : ((1*2)*3)
==========================================
Expression: 1+2/3
Variables : []
Evaluator : (1+(2/3))
==========================================
Expression: 1*2/3
Variables : []
Evaluator : ((1*2)/3)
==========================================
Expression: 1^2
Variables : []
Evaluator : Math.pow(1,2)
==========================================
Expression: 1^2^3
Variables : []
Evaluator : Math.pow(1,Math.pow(2,3))
==========================================
Expression: 1^(2^3)
Variables : []
Evaluator : Math.pow(1,Math.pow(2,3))
==========================================
Expression: (1^2)^3
Variables : []
Evaluator : Math.pow(Math.pow(1,2),3)
==========================================
Expression: ((1^2))^3
Variables : []
Evaluator : Math.pow(Math.pow(1,2),3)
==========================================
Expression: `^regex?`i matches "string"
Variables : []
Evaluator : Fn.match("string",Cache.re_1)
==========================================
Expression: `^regex?`i matches "string" and `^regex?`i matches "string2"
Variables : []
Evaluator : (Fn.match("string",Cache.re_1)&&Fn.match("string2",Cache.re_1))
==========================================
Expression: $v in ["a","b","c"]
Variables : [v]
Evaluator : Fn.contains(["a","b","c"],Var["v"])
==========================================
Error: Xpresion Error: Operator ":" expecting 1 prior argument(s) at "1 ? : (1+2) (3+4)"
==========================================
Expression: 1 ? sum(1,2) : (3+4)
Variables : []
Evaluator : (1?Fn.sum(1,2):(3+4))
==========================================
Expression: 1 ? 1+2 : (3+4)
Variables : []
Evaluator : (1?(1+2):(3+4))
==========================================
Expression: 1 ? (2+3) : 2 ? (3+4) : (4+5)
Variables : []
Evaluator : (1?(2+3):(2?(3+4):(4+5)))
==========================================
Expression: date("Y-m-d H:i:s")
Variables : []
Evaluator : Fn.date("Y-m-d H:i:s")
Data      : {}
Result    : "2019-03-19 13:00:31"
==========================================
Expression: time()
Variables : []
Evaluator : Fn.time()
Data      : {}
Result    : 1552993231
==========================================
Expression: date("Y-m-d H:i:s", time())
Variables : []
Evaluator : Fn.date("Y-m-d H:i:s",Fn.time())
==========================================
Expression: pow(1,pow(2,3))
Variables : []
Evaluator : Math.pow(1,Math.pow(2,3))
==========================================
Expression: pow(pow(2,3),4)
Variables : []
Evaluator : Math.pow(Math.pow(2,3),4)
==========================================
Expression: pow(pow(1,2),pow(2,3))
Variables : []
Evaluator : Math.pow(Math.pow(1,2),Math.pow(2,3))
```

#### API

```javascript

// define a new configuration
var conf = Xpresion.Configuration();
// or extend default configuration
var conf = Xpresion.defaultConfiguration();

// define an operator
conf.defOp({
    '===' :{
             'input'        : [1,'===',1]           // input
            ,'output'       : '(<$.0>===<$.1>)'     // output (GrammarTemplate)
            ,'otype'        : Xpresion.T_BOL        // output type BOOLEAN, default = Xpresion.T_MIX = mixed
            ,'fixity'       : Xpresion.INFIX        // operator fixity`
            ,'associativity': Xpresion.LEFT         // operator associativity
            ,'priority'     : 40                    // operator priority
        }
});

// define an alias
conf.defOp({
    'is': Xpresion.Alias('===')
});

// define a function (functional operator)
conf.defFunc({
    'len': {
             'input'    : 'len',
            ,'output'   : 'Fn.len(<$.0>)' // <$.0> matches all arguments passed not only one, separated by comma
            ,'otype'    : Xpresion.T_NUM
        }
});

// define a runtime function (called during evaluation) which implements the 'len' function
conf.defRuntimeFunc({
    'len'    :   function( v ) { 
                    if ( null==v ) return 0;
                    if ( v instanceof String || v instanceof Array ) return v.length;
                    if ( v instanceof Object ) return Object.keys(v).length;
                    return 1;
                }
});

// new Xpresion(..) will also work
var expr = Xpresion( "1+2+$v" [, conf=Xpresion.defaultConfiguration()] );

// !note! will trow an error if parsing the expression fails, so better to catch it and handle it

try {
    expr = Xpresion( "1+2+$v", conf );
} catch(e) {
    console.log(e.toString());
}


console.log(expr.debug({'v': 3}));

// class methods==============================

// get or set the Xpresion.defaultConfiguration()
var defaultConf = Xpresion.defaultConfiguration();
Xpresion.defaultConfiguration(newConf);

// methods====================================

// returns debug information about the expresion, plus the evaluated result if data given
expr.debug([Object data]);

// evaluates the expresion based on given data (as variables) and returns the result
expr.evaluate(Object data );

// properties=================================

expr.variables; // array of variable names referenced in the expression
expr.evaluatorString; // evaluator function as string
expr.evaluator; // actual function that evaluates the expression

```

**default Xpresion Configuration**

```javascript
// default out-of-the-box Xpresion parser configuration
// e.g https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence

Xpresion.defaultConfiguration(Configuration({
// regular expressions for tokens
// ===============================
're' : {
 't_spc'        :  /^(\s+)/
,'t_nonspc'     :  /^(\S+)/
,'t_special'    :  /^([*.\\\-+\/\^\$\(\)\[\]|?<:>&~%!#@=_,;{}]+)/
,'t_num'        :  /^(\d+(\.\d+)?)/
,'t_ident'      :  /^([a-zA-Z_][a-zA-Z0-9_]*)\b/
,'t_var'        :  /^\$([a-zA-Z0-9_][a-zA-Z0-9_.]*)\b/
}

// block-type tokens (eg strings and regexes)
// ==========================================
,'blocks' : {
 '\'': {
    'type': T_STR,
    'parse': Xpresion.parse_delimited_block
 }
,'"': Alias('\'')
,'`': {
    'type': T_REX,
    'parse': Xpresion.parse_delimited_block,
    'rest': parse_re_flags
}
}

// reserved keywords and literals
// ===============================
,'reserved' : {
 'null'     : Tok(T_IDE, 'null', 'null')
,'false'    : Tok(T_BOL, 'false', 'false')
,'true'     : Tok(T_BOL, 'true', 'true')
,'infinity' : Tok(T_NUM, 'Infinity', 'Infinity')
,'nan'      : Tok(T_NUM, 'NaN', 'NaN')
// aliases
,'none'     : Alias('null')
,'inf'      : Alias('infinity')
}

// operators
// ==========
,'operators' : {
// bra-kets as n-ary operators
// negative number of arguments, indicate optional arguments (experimental)
 '('    :   {
                'input'         : ['(',-1,')']
                ,'output'       : '<$.0>'
                ,'otype'        : T_DUM
                ,'fixity'       : POSTFIX
                ,'associativity': RIGHT
                ,'priority'     : 0
            }
,')'    :   {'input':[-1,')']}
,'['    :   {
                'input'         : ['[',-1,']']
                ,'output'       : '\\[<$.0>\\]'
                ,'otype'        : T_ARY
                ,'fixity'       : POSTFIX
                ,'associativity': RIGHT
                ,'priority'     : 2
            }
,']'    :   {'input':[-1,']']}
,','    :   {
                'input'         : [1,',',1]
                ,'output'       : '<$.0>,<$.1>'
                ,'otype'        : T_DFT
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 103
            }
// n-ary (ternary) if-then-else operator
,'?'    :   {
                'input'         : [1,'?',1,':',1]
                ,'output'       : '(<$.0>?<$.1>:<$.2>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': RIGHT
                ,'priority'     : 100
            }
,':'    :   {'input':[1,':',1]}

,'!'    :   {
                'input'         : ['!',1]
                ,'output'       : '!<$.0>'
                ,'otype'        : T_BOL
                ,'fixity'       : PREFIX
                ,'associativity': RIGHT
                ,'priority'     : 10
            }
,'~'    :   {
                'input'         : ['~',1]
                ,'output'       : '~<$.0>'
                ,'otype'        : T_NUM
                ,'fixity'       : PREFIX
                ,'associativity': RIGHT
                ,'priority'     : 10
            }
,'^'    :   {
                'input'         : [1,'^',1]
                ,'output'       : 'Math.pow(<$.0>,<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': RIGHT
                ,'priority'     : 11
            }
,'*'    :   {
                'input'         : [1,'*',1]
                ,'output'       : '(<$.0>*<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 20
            }
,'/'    :   {
                'input'         : [1,'/',1]
                ,'output'       : '(<$.0>/<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 20
            }
,'%'    :   {
                'input'         : [1,'%',1]
                ,'output'       : '(<$.0>%<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 20
            }
// addition/concatenation/unary plus as polymorphic operators
,'+'    :   {'polymorphic':[
            // array concatenation
            [
            function(curr,Xpresion){return curr.TOK && (!curr.PREV_IS_OP) && (curr.DEDUCED_TYPE===Xpresion.T_ARY);},
            {
                'input'         : [1,'+',1]
                ,'output'       : 'Fn.ary_merge(<$.0>,<$.1>)'
                ,'otype'        : T_ARY
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 25
            }
            ]
            // string concatenation
            ,[
            function(curr,Xpresion){return curr.TOK && (!curr.PREV_IS_OP) && (curr.DEDUCED_TYPE===Xpresion.T_STR);},
            {
                'input'         : [1,'+',1]
                ,'output'       : '(<$.0>+String(<$.1>))'
                ,'otype'        : T_STR
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 25
            }
            ]
            // numeric addition
            ,[
            function(curr,Xpresion){return curr.TOK && !curr.PREV_IS_OP;},
            {
                'input'         : [1,'+',1]
                ,'output'       : '(<$.0>+<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 25
            }
            ]
            // unary plus
            ,[
            function(curr,Xpresion){return (!curr.TOK) || curr.PREV_IS_OP;},
            {
                'input'         : ['+',1]
                ,'output'       : '<$.0>'
                ,'otype'        : T_NUM
                ,'fixity'       : PREFIX
                ,'associativity': RIGHT
                ,'priority'     : 4
            }
            ]
            ]}
,'-'    :   {'polymorphic':[
            // numeric subtraction
            [
            function(curr,Xpresion){return curr.TOK && !curr.PREV_IS_OP;},
            {
                'input'         : [1,'-',1]
                ,'output'       : '(<$.0>-<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 25
            }
            ]
            // unary negation
            ,[
            function(curr,Xpresion){return (!curr.TOK) || curr.PREV_IS_OP;},
            {
                'input'         : ['-',1]
                ,'output'       : '(-<$.0>)'
                ,'otype'        : T_NUM
                ,'fixity'       : PREFIX
                ,'associativity': RIGHT
                ,'priority'     : 4
            }
            ]
            ]}
,'>>'   :   {
                'input'         : [1,'>>',1]
                ,'output'       : '(<$.0>\\>\\><$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 30
            }
,'<<'   :   {
                'input'         : [1,'<<',1]
                ,'output'       : '(<$.0>\\<\\<<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 30
            }
,'>'    :   {
                'input'         : [1,'>',1]
                ,'output'       : '(<$.0>\\><$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 35
            }
,'<'    :   {
                'input'         : [1,'<',1]
                ,'output'       : '(<$.0>\\<<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 35
            }
,'>='   :   {
                'input'         : [1,'>=',1]
                ,'output'       : '(<$.0>\\>=<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 35
            }
,'<='   :   {
                'input'         : [1,'<=',1]
                ,'output'       : '(<$.0>\\<=<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 35
            }
,'=='   :   {'polymorphic':[
            // array equivalence
            [
            function(curr,Xpresion){return curr.DEDUCED_TYPE===Xpresion.T_ARY;},
            {
                'input'         : [1,'==',1]
                ,'output'       : 'Fn.ary_eq(<$.0>,<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 40
            }
            ]
            // default equivalence
            ,[
            function(curr,Xpresion){return true;},
            {
                'input'         : [1,'==',1]
                ,'output'       : '(<$.0>==<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 40
            }
            ]
            ]}
,'!='   :   {
                'input'         : [1,'!=',1]
                ,'output'       : '(<$.0>!=<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 40
            }
,'is'   :   {
                'input'         : [1,'is',1]
                ,'output'       : '(<$.0>===<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 40
            }
,'matches': {
                'input'         : [1,'matches',1]
                ,'output'       : 'Fn.match(<$.1>,<$.0>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': NONE
                ,'priority'     : 40
            }
,'in'   :   {
                'input'         : [1,'in',1]
                ,'output'       : 'Fn.contains(<$.1>,<$.0>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': NONE
                ,'priority'     : 40
            }
,'&'    :   {
                'input'         : [1,'&',1]
                ,'output'       : '(<$.0>&<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 45
            }
,'|'    :   {
                'input'         : [1,'|',1]
                ,'output'       : '(<$.0>|<$.1>)'
                ,'otype'        : T_NUM
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 46
            }
,'&&'   :   {
                'input'         : [1,'&&',1]
                ,'output'       : '(<$.0>&&<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 47
            }
,'||'   :   {
                'input'         : [1,'||',1]
                ,'output'       : '(<$.0>||<$.1>)'
                ,'otype'        : T_BOL
                ,'fixity'       : INFIX
                ,'associativity': LEFT
                ,'priority'     : 48
            }
//------------------------------------------
//                aliases
//-------------------------------------------
,'or'    :  Alias( '||' )
,'and'   :  Alias( '&&' )
,'not'   :  Alias( '!' )
}

// functional operators
// ====================
,'functions' : {
 'min'      : {
                'input'     : 'min'
                ,'output'   : 'Math.min(<$.0>)'
                ,'otype'    : T_NUM
            }
,'max'      : {
                'input'     : 'max'
                ,'output'   : 'Math.max(<$.0>)'
                ,'otype'    : T_NUM
            }
,'pow'      : {
                'input'     : 'pow'
                ,'output'   : 'Math.pow(<$.0>)'
                ,'otype'    : T_NUM
            }
,'sqrt'     : {
                'input'     : 'sqrt'
                ,'output'   : 'Math.sqrt(<$.0>)'
                ,'otype'    : T_NUM
            }
,'len'      : {
                'input'     : 'len'
                ,'output'   : 'Fn.len(<$.0>)'
                ,'otype'    : T_NUM
            }
,'int'      : {
                'input'     : 'int'
                ,'output'   : 'parseInt(<$.0>)'
                ,'otype'    : T_NUM
            }
,'float'    : {
                'input'     : 'float'
                ,'output'   : 'parseFloat(<$.0>)'
                ,'otype'    : T_NUM
            }
,'str'      : {
                'input'     : 'str'
                ,'output'   : 'String(<$.0>)'
                ,'otype'    : T_STR
            }
,'array'    : {
                'input'     : 'array'
                ,'output'   : 'Fn.ary(<$.0>)'
                ,'otype'    : T_ARY
            }
,'clamp'    : {
                'input'     : 'clamp'
                ,'output'   : 'Fn.clamp(<$.0>)'
                ,'otype'    : T_NUM
            }
,'sum'      : {
                'input'     : 'sum'
                ,'output'   : 'Fn.sum(<$.0>)'
                ,'otype'    : T_NUM
            }
,'avg'      : {
                'input'     : 'avg'
                ,'output'   : 'Fn.avg(<$.0>)'
                ,'otype'    : T_NUM
            }
,'time'     : {
                'input'     : 'avg'
                ,'output'   : 'Fn.time()'
                ,'otype'    : T_NUM
                ,'arity'    : 0
            }
,'date'     : {
                'input'     : 'date'
                ,'output'   : 'Fn.date(<$.0>)'
                ,'otype'    : T_STR
            }
//---------------------------------------
//                aliases
//----------------------------------------
 // ...
}

// runtime (implementation) functions
// ==================================
,'runtime' : {
'clamp'        : function( v, m, M ) {
                    if ( m > M ) return v > m ? m : (v < M ? M : v);
                    else return v > M ? M : (v < m ? m : v);
                }
,'len'          : function( v ) {
                    if ( v )
                    {
                        if ( is_array(v) || is_string(v) ) return v.length;
                        if ( is_object(v) ) return Keys(v).length;
                        return 1;
                    }
                    return 0;
                }
,'sum'          : function( ) {
                    var args = arguments, i, l, s = 0;
                    if (args[0] && is_array(args[0]) ) args = args[0];
                    l = args.length;
                    if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; }
                    return s;
                }
,'avg'          : function( ) {
                    var args = arguments, i, l, s = 0;
                    if (args[0] && is_array(args[0]) ) args = args[0];
                    l = args.length;
                    if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; s = s/l;}
                    return s;
                }
,'ary'          : function( x ) {
                    return is_array(x) ? x : [x];
                }
,'ary_eq'       : function( a1, a2 ) {
                    var l = a1.length, i;
                    if ( l===a2.length )
                    {
                        for (i=0; i<l; i++)
                            if ( a1[i]!=a2[i] ) return false;
                    }
                    else return false;
                    return true;
                }
,'ary_merge'    : function(a1, a2) {
                    return [ ].concat( a1 ).concat( a2 );
                }
,'match'        : function( str, regex ) {
                    return regex.test( str );
                }
,'contains'     : function( o, i ) {
                    return is_array(o) || is_string(o) ? -1 < o.indexOf( i ) : hasOwnProperty.call(o, i);
                }
,'time'         : time
,'date'         : date
}
}));
```

#### Platform Support

* `PHP` **5.3.0+**
* `Python` **2.x or 3.x**
* `Node` **0.8+**
* `Browser` **all**


#### Performance 

expression parsing algorithm can be seen as a **variation and generalisation** of [Shunting-Yard algorithm](http://en.wikipedia.org/wiki/Shunting-yard_algorithm), 
running in linear-time ( `O(n)` ) in the input sequence


#### TODO

* use [Grammar Template](https://github.com/foo123/GrammarTemplate) for more powerful and flexible rewrite output [DONE]
* add full support for optional arguments in `operators`/`functions`  [ALMOST DONE]
* add support for (`xml`-like) `tags` in `expressions`
* performance/unit tests [DONE PARTIALLY]

