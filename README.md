Xpr3s10n
========

a simple and flexible eXpression parser engine (with custom functions and variables support) for PHP, Python, Node/JS, ActionScript



**light-weight (~16kB minified, ~6kB zipped)**


**version 0.5** [Xpresion.js](https://raw.githubusercontent.com/foo123/Xpresion/master/src/js/Xpresion.js), [Xpresion.min.js](https://raw.githubusercontent.com/foo123/Xpresion/master/src/js/Xpresion.min.js)



**see also:**  

* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node/JS, PHP, Python, ActionScript
* [ModelView](https://github.com/foo123/modelview.js) a light-weight and flexible MVVM framework for JavaScript/HTML5
* [ModelView MVC jQueryUI Widgets](https://github.com/foo123/modelview-widgets) plug-n-play, state-full, full-MVC widgets for jQueryUI using modelview.js (e.g calendars, datepickers, colorpickers, tables/grids, etc..) (in progress)
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for Node/JS, PHP, Python, ActionScript
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for Node/JS, PHP, Python, ActionScript
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for Node/JS, PHP, Python, ActionScript
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL construction for PHP, Python, Node/JS, ActionScript (in progress)
* [Simulacra](https://github.com/foo123/Simulacra) a simulation, algebraic, probability and combinatorics PHP package for scientific computations
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript


###Contents

* [Features](#features)
* [Examples](#examples)
* [API](#api)
* [Performance](#performance)
* [Todo](#todo)



####Features 

**(v. 0.5+)**

Xpresion **is not an expression parser**, it does not parse expressions. It is a parser engine. 
It builds parsers, which parse (custom) expressions.

This is accomplished by configuring the Xpresion engine to fit the needed expression syntax.
Configuration is intutive, easy and flexible (see examples).

However since Xpresion is a parser engine, adding a default configuration, it can itself be a parser as well (out-of-the-box).


1. simple, intuitive, flexible, fast
1. support an adequate expression syntax out of the box (i.e numbers, strings, regexes, reserved tokens, arithmetical/logical operators, ternary operators, some advanced functions, variables)
3. highly flexible and configurable (regexes, outputs, functions, operators, aliases, etc..)
4. support (user-defined) variables, (user-defined) functions
5. define custom operators (prefix, infix, postfix, left/right association, etc..) seamlessly
6. define polymorphic operators / operator overloading seamlessly (e.g **subtraction** and **unary negation**)
7. define n-ary operators seamlessly (e.g **ternary if-then-else**, etc..)
8. define aliases of operators/functions seamlessly
9. define new custom expression syntaxes easily (e.g via configuration or via extension/override of methods)
10. implementations for Node/JS, PHP, Python (only one class per implementation)



####Examples

**(see test/test.js)**

**javascript**
```javascript
var path = require('path'), 
    Xpresion = require(path.join(__dirname, '../src/js/Xpresion.js')),
    echo = console.log
;


echo( 'Xpresion.VERSION ' + Xpresion.VERSION + "\n" );

echo(Xpresion('13').debug());
echo(Xpresion('1.32').debug());
echo(Xpresion('-0.12').debug());
echo(Xpresion('-3').debug());
echo(Xpresion('("1,2,3")+3').debug({}));
echo(Xpresion('"1,2,3"+3').debug({}));
echo(Xpresion('"1,2,3"+3+4').debug({}));
echo(Xpresion('[1,2,3]+3').debug({}));
echo(Xpresion('-3+2').debug({}));
echo(Xpresion('1-3+2').debug({}));
echo(Xpresion('1+-3').debug({}));
echo(Xpresion('+1+3').debug({}));
echo(Xpresion('2*-1').debug());
echo(Xpresion('2*(-1)').debug());
echo(Xpresion('2^-1').debug());
echo(Xpresion('2^(-1)').debug());
echo(Xpresion('2^-1^3').debug());
echo(Xpresion('-2^-1^3').debug());
echo(Xpresion('2^(-1)^3').debug());
echo(Xpresion('$v').debug());
echo(Xpresion('True').debug());
echo(Xpresion('"string"').debug());
echo(Xpresion('["a","rra","y"]').debug());
echo(Xpresion('`^regex?`i').debug());
echo(Xpresion('0 == 1').debug());
echo(Xpresion('TRUE == False').debug());
echo(Xpresion('1+2').debug());
echo(Xpresion('1+2+3').debug());
echo(Xpresion('1+2*3').debug());
echo(Xpresion('1*2+3').debug());
echo(Xpresion('1*2*3').debug());
echo(Xpresion('1+2/3').debug());
echo(Xpresion('1*2/3').debug());
echo(Xpresion('1^2').debug());
echo(Xpresion('1^2^3').debug());
echo(Xpresion('1^(2^3)').debug());
echo(Xpresion('(1^2)^3').debug());
echo(Xpresion('((1^2))^3').debug());
echo(Xpresion('`^regex?`i matches "string"').debug());
echo(Xpresion('`^regex?`i matches "string" and `^regex?`i matches "string2"').debug());
echo(Xpresion('["a","b","c"] has $v').debug());
echo(Xpresion('$v in ["a","b","c"]').debug());
echo(Xpresion('1 ? (2+3) : (3+4)').debug());

```

**output**
```text
Xpresion.VERSION 0.5

Expression: 13
Variables : []
Evaluator : 13
Expression: 1.32
Variables : []
Evaluator : 1.32
Expression: -0.12
Variables : []
Evaluator : (-0.12)
Expression: -3
Variables : []
Evaluator : (-3)
Expression: ("1,2,3")+3
Variables : []
Evaluator : ("1,2,3"+String(3))
Data      : {}
Result    : "1,2,33"
Expression: "1,2,3"+3
Variables : []
Evaluator : ("1,2,3"+String(3))
Data      : {}
Result    : "1,2,33"
Expression: "1,2,3"+3+4
Variables : []
Evaluator : (("1,2,3"+String(3))+String(4))
Data      : {}
Result    : "1,2,334"
Expression: [1,2,3]+3
Variables : []
Evaluator : Fn.ary_merge([1,2,3],3)
Data      : {}
Result    : [1,2,3,3]
Expression: -3+2
Variables : []
Evaluator : ((-3)+2)
Data      : {}
Result    : -1
Expression: 1-3+2
Variables : []
Evaluator : ((1-3)+2)
Data      : {}
Result    : 0
Expression: 1+-3
Variables : []
Evaluator : (1+(-3))
Data      : {}
Result    : -2
Expression: +1+3
Variables : []
Evaluator : (1+3)
Data      : {}
Result    : 4
Expression: 2*-1
Variables : []
Evaluator : (2*(-1))
Expression: 2*(-1)
Variables : []
Evaluator : (2*(-1))
Expression: 2^-1
Variables : []
Evaluator : Math.pow(2,(-1))
Expression: 2^(-1)
Variables : []
Evaluator : Math.pow(2,(-1))
Expression: 2^-1^3
Variables : []
Evaluator : Math.pow(2,Math.pow((-1),3))
Expression: -2^-1^3
Variables : []
Evaluator : Math.pow((-2),Math.pow((-1),3))
Expression: 2^(-1)^3
Variables : []
Evaluator : Math.pow(2,Math.pow((-1),3))
Expression: $v
Variables : [v]
Evaluator : Var["v"]
Expression: True
Variables : []
Evaluator : true
Expression: "string"
Variables : []
Evaluator : "string"
Expression: ["a","rra","y"]
Variables : []
Evaluator : ["a","rra","y"]
Expression: `^regex?`i
Variables : []
Evaluator : Cache.re_1
Expression: 0 == 1
Variables : []
Evaluator : (0==1)
Expression: TRUE == False
Variables : []
Evaluator : (true==false)
Expression: 1+2
Variables : []
Evaluator : (1+2)
Expression: 1+2+3
Variables : []
Evaluator : ((1+2)+3)
Expression: 1+2*3
Variables : []
Evaluator : (1+(2*3))
Expression: 1*2+3
Variables : []
Evaluator : ((1*2)+3)
Expression: 1*2*3
Variables : []
Evaluator : ((1*2)*3)
Expression: 1+2/3
Variables : []
Evaluator : (1+(2/3))
Expression: 1*2/3
Variables : []
Evaluator : ((1*2)/3)
Expression: 1^2
Variables : []
Evaluator : Math.pow(1,2)
Expression: 1^2^3
Variables : []
Evaluator : Math.pow(1,Math.pow(2,3))
Expression: 1^(2^3)
Variables : []
Evaluator : Math.pow(1,Math.pow(2,3))
Expression: (1^2)^3
Variables : []
Evaluator : Math.pow(Math.pow(1,2),3)
Expression: ((1^2))^3
Variables : []
Evaluator : Math.pow(Math.pow(1,2),3)
Expression: `^regex?`i matches "string"
Variables : []
Evaluator : Cache.re_1.test("string")
Expression: `^regex?`i matches "string" and `^regex?`i matches "string2"
Variables : []
Evaluator : (Cache.re_1.test("string")&&Cache.re_1.test("string2"))
Expression: ["a","b","c"] has $v
Variables : [v]
Evaluator : (-1<["a","b","c"].indexOf(Var["v"]))
Expression: $v in ["a","b","c"]
Variables : [v]
Evaluator : (-1<["a","b","c"].indexOf(Var["v"]))
Expression: 1 ? (2+3) : (3+4)
Variables : []
Evaluator : (1?(2+3):(3+4))
```

####API

```javascript

// define an operator
Xpresion.defOp({
    /*----------------------------------------------------------------------------------------
     symbol           input,    fixity,  associativity, priority, arity, output,     output_type
    ------------------------------------------------------------------------------------------*/
    '==' :Xpresion.Op('==',Xpresion.INFIX, Xpresion.LEFT, 40,        2,    Xpresion.Tpl('($0==$1)'), Xpresion.T_BOL )
});

// define an alias
Xpresion.defOp({
    'is': Xpresion.Alias('==')
});

// define a function (functional operator)
Xpresion.defFunc({
    /*-----------------------------------------------------------------------
    symbol              input,    output,          output_type,        priority
    -------------------------------------------------------------------------*/
    'len': Xpresion.Func('len', Xpresion.Tpl('Fn.len($0)'), Xpresion.T_NUM,   5  )
});

// define a runtime function (called during evaluation) which implements the 'len' function
Xpresion.defRuntimeFunc({
    'len'    :   function( v ){ 
        if ( v )
        {
            if ( v.substr || v.push ) return v.length;
            if ( Object === v.constructor ) return Object.keys(v).length;
            return 1;
        }
        return 0;
    }
});

// new Xpresion(..) will also work
var expr = Xpresion("1+2+$v");

console.log(expr.debug({'v': 3}));

// methods

// returns debug information about the expresion, plus the evaluated result if data given
expr.debug([Object data]);

// evaluates the expresion based on given data (as variables) and returns the result
// custom runtime function implementations can be passed also
// else the default .Fn of the instance will be used (usualy Xpresion.Fn)
expr.evaluate(Object data [, Object Fn=instance.Fn] );

// NOTE:
// For parsing custom expresion syntaxes,
// the best way is to extend the Xpresion class
// and override any setup methods and/or configuration needed (examples to be added)
// instead of overriding the default Xpresion configuration,
// to avoid cluttering the Xpresion namespace

```

####Performance 



####TODO

* implementations for PHP, ActionScript
* documentation, examples, live examples

