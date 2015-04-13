Xpr3s10n
========

a simple, fast and flexible eXpression parser engine (with custom functions and variables support) for PHP, Python, Node/JS, ActionScript



**light-weight (~20kB minified, ~8kB zipped)**


**version 0.6.1** [Xpresion.js](https://raw.githubusercontent.com/foo123/Xpresion/master/src/js/Xpresion.js), [Xpresion.min.js](https://raw.githubusercontent.com/foo123/Xpresion/master/src/js/Xpresion.min.js)



**see also:**  

* [Contemplate](https://github.com/foo123/Contemplate) a light-weight template engine for Node/JS, PHP, Python, ActionScript
* [ModelView](https://github.com/foo123/modelview.js) a light-weight and flexible MVVM framework for JavaScript/HTML5
* [ModelView MVC jQueryUI Widgets](https://github.com/foo123/modelview-widgets) plug-n-play, state-full, full-MVC widgets for jQueryUI using modelview.js (e.g calendars, datepickers, colorpickers, tables/grids, etc..) (in progress)
* [Dromeo](https://github.com/foo123/Dromeo) a flexible, agnostic router for Node/JS, PHP, Python, ActionScript
* [PublishSubscribe](https://github.com/foo123/PublishSubscribe) a simple and flexible publish-subscribe pattern implementation for Node/JS, PHP, Python, ActionScript
* [Regex Analyzer/Composer](https://github.com/foo123/RegexAnalyzer) Regular Expression Analyzer and Composer for Node/JS, PHP, Python, ActionScript
* [Dialect](https://github.com/foo123/Dialect) a simple cross-platform SQL construction for PHP, Python, Node/JS, ActionScript (in progress)
* [Abacus](https://github.com/foo123/Abacus) a fast combinatorics and computation library for Node/JS, PHP, Python, ActionScript
* [Simulacra](https://github.com/foo123/Simulacra) a simulation, algebraic, probability and combinatorics PHP package for scientific computations
* [Asynchronous](https://github.com/foo123/asynchronous.js) a simple manager for async, linearised, parallelised, interleaved and sequential tasks for JavaScript


###Contents

* [Features](#features)
* [Examples](#examples)
* [Live Examples](#live-examples)
* [API](#api)
* [Performance](#performance)
* [Todo](#todo)


[![Xpresion Live](https://github.com/foo123/Xpresion/raw/master/xpresion.png)](https://foo123.github.io/examples/xpresion)


####Features 

**(v. 0.5+)**

Xpresion **is not an expression parser**, it does not parse expressions. It is a parser engine. 
It builds parsers, which parse (custom) expressions. Effectively it is a small [rewrite system](http://en.wikipedia.org/wiki/Abstract_rewriting_system)

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


**If you use Xpresion in your application and you want to share it, feel free to submit an example link**


####Live Examples

* [Interactive Example](https://foo123.github.io/examples/xpresion)

####Examples

**(see test/test.js)**

**javascript**
```javascript
var path = require('path'), 
    Xpresion = require(path.join(__dirname, '../src/js/Xpresion.js')),
    echo = console.log
;

Xpresion.defaultConfiguration();

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
echo(Xpresion('TRUE is False').debug());
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
echo(Xpresion('$v in ["a","b","c"]').debug());
echo(Xpresion('1 ? : (1+2) (3+4)').debug());
echo(Xpresion('1 ? sum(1,2) : (3+4)').debug());
echo(Xpresion('1 ? 1+2 : (3+4)').debug());
echo(Xpresion('1 ? (2+3) : 2 ? (3+4) : (4+5)').debug());
echo(Xpresion('date("Y-m-d H:i:s")').debug({}));
echo(Xpresion('time()').debug({}));
echo(Xpresion('date("Y-m-d H:i:s", time())').debug());
echo(Xpresion('pow(1,pow(2,3))').debug());
echo(Xpresion('pow(pow(2,3),4)').debug());
echo(Xpresion('pow(pow(1,2),pow(2,3))').debug());
```

**output**
```text
Xpresion.VERSION 0.6.1

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
Expression: TRUE is False
Variables : []
Evaluator : (true===false)
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
Expression: $v in ["a","b","c"]
Variables : [v]
Evaluator : Fn.contains(["a","b","c"],Var["v"])
Expression: 1 ? : (1+2) (3+4)
Variables : []
Evaluator : 
Expression: 1 ? sum(1,2) : (3+4)
Variables : []
Evaluator : (1?Fn.sum(1,2):(3+4))
Expression: 1 ? 1+2 : (3+4)
Variables : []
Evaluator : (1?(1+2):(3+4))
Expression: 1 ? (2+3) : 2 ? (3+4) : (4+5)
Variables : []
Evaluator : (1?(2+3):(2?(3+4):(4+5)))
Expression: date("Y-m-d H:i:s")
Variables : []
Evaluator : Fn.date("Y-m-d H:i:s")
Data      : {}
Result    : "2015-04-13 23:15:09"
Expression: time()
Variables : []
Evaluator : Fn.time()
Data      : {}
Result    : 1428956109
Expression: date("Y-m-d H:i:s", time())
Variables : []
Evaluator : Fn.date("Y-m-d H:i:s",Fn.time())
Expression: pow(1,pow(2,3))
Variables : []
Evaluator : Math.pow(1,Math.pow(2,3))
Expression: pow(pow(2,3),4)
Variables : []
Evaluator : Math.pow(Math.pow(2,3),4)
Expression: pow(pow(1,2),pow(2,3))
Variables : []
Evaluator : Math.pow(Math.pow(1,2),Math.pow(2,3))
```

####API

```javascript

// define an operator
Xpresion.defOp({
    /*----------------------------------------------------------------------------------------
     symbol           input,    fixity,  associativity, priority, output,     output_type
    ------------------------------------------------------------------------------------------*/
    '===' :Xpresion.Op([1,'===',1],Xpresion.INFIX, Xpresion.LEFT, 40, '($0===$1)', Xpresion.T_BOL )
});

// define an alias
Xpresion.defOp({
    'is': Xpresion.Alias('===')
});

// define a function (functional operator)
Xpresion.defFunc({
    /*-----------------------------------------------------------------------------------
    symbol              input,    output,          output_type,        priority(default 1)
    -------------------------------------------------------------------------------------*/
    'len': Xpresion.Func('len',  'Fn.len($0)',     Xpresion.T_NUM  )
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
expr.evaluate(Object data );

// get or set the evaluator for current Xpresion instance
expr.evaluator([Function evaluator]);

// NOTE:
// For parsing custom expresion syntaxes,
// the best way is to extend the Xpresion class
// and override any setup methods and/or configuration needed (examples to be added)
// instead of overriding the default Xpresion configuration,
// to avoid cluttering the Xpresion namespace

```

**default out-of-the-box Xpresion parser configuration**

```javascript
// default out-of-the-box Xpresion parser configuration
//

Xpresion.defRE({
/*-----------------------------------------------
token                re
-------------------------------------------------*/
 't_spc'        :  /^(\s+)/
,'t_nonspc'     :  /^(\S+)/
,'t_special'    :  /^([*.\-+\\\/\^\$\(\)\[\]|?<:>&~%!#@=_,;{}]+)/
,'t_num'        :  /^(\d+(\.\d+)?)/
,'t_ident'      :  /^([a-zA-Z_][a-zA-Z0-9_]*)\b/
,'t_var'        :  /^\$([a-zA-Z0-9_][a-zA-Z0-9_.]*)\b/
});

Xpresion.defOp({
// e.g https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
/*------------------------------------------------------------------------------------------------
 symbol     input           ,fixity     ,associativity  ,priority   ,output     ,output_type
--------------------------------------------------------------------------------------------------*/
            // bra-kets as n-ary operators
            // negative number of arguments, indicate optional arguments (experimental)
 '('    :   Op(
            ['(',-1,')']    ,POSTFIX    ,RIGHT          ,0          ,'$0'       ,T_DUM 
            )
,')'    :   Op([-1,')'])
,'['    :   Op(
            ['[',1,']']     ,POSTFIX    ,RIGHT          ,2          ,'[$0]'     ,T_ARY 
            )
,']'    :   Op([-1,']'])
,','    :   Op(
            [1,',',1]       ,INFIX      ,LEFT           ,3          ,'$0,$1'    ,T_DFT 
            )
            // n-ary (ternary) if-then-else operator
,'?'    :   Op(
            [1,'?',1,':',1] ,INFIX      ,RIGHT          ,100        ,'($0?$1:$2)'   ,T_BOL 
            )
,':'    :   Op([1,':',1])

,'!'    :   Op(
            ['!',1]         ,PREFIX     ,RIGHT          ,10         ,'!$0'      ,T_BOL 
            )
,'~'    :   Op(
            ['~',1]         ,PREFIX     ,RIGHT          ,10         ,'~$0'      ,T_NUM 
            )
,'^'    :   Op(
            [1,'^',1]       ,INFIX      ,RIGHT          ,11         ,'Math.pow($0,$1)'  ,T_NUM 
            )
,'*'    :   Op(
            [1,'*',1]       ,INFIX      ,LEFT           ,20         ,'($0*$1)'  ,T_NUM 
            ) 
,'/'    :   Op(
            [1,'/',1]       ,INFIX      ,LEFT           ,20         ,'($0/$1)'  ,T_NUM 
            )
,'%'    :   Op(
            [1,'%',1]       ,INFIX      ,LEFT           ,20         ,'($0%$1)'  ,T_NUM 
            )
            // addition/concatenation/unary plus as polymorphic operators
,'+'    :   Op().Polymorphic([
            // array concatenation
            ["${TOK} && !${PREV_IS_OP} && (${DEDUCED_TYPE}===Xpresion.T_ARY)", Op(
            [1,'+',1]       ,INFIX      ,LEFT           ,25         ,'Fn.ary_merge($0,$1)'  ,T_ARY 
            )]
            // string concatenation
            ,["${TOK} && !${PREV_IS_OP} && (${DEDUCED_TYPE}===Xpresion.T_STR)", Op(
            [1,'+',1]       ,INFIX      ,LEFT           ,25         ,'($0+String($1))'  ,T_STR 
            )]
            // numeric addition
            ,["${TOK} && !${PREV_IS_OP}", Op(
            [1,'+',1]       ,INFIX      ,LEFT           ,25         ,'($0+$1)'  ,T_NUM 
            )]
            // unary plus
            ,["!${TOK} || ${PREV_IS_OP}", Op(
            ['+',1]         ,PREFIX     ,RIGHT          ,4          ,'$0'       ,T_NUM 
            )]
            ])
,'-'    :   Op().Polymorphic([
            // numeric subtraction
            ["${TOK} && !${PREV_IS_OP}", Op(
            [1,'-',1]       ,INFIX      ,LEFT           ,25         ,'($0-$1)'  ,T_NUM 
            )]
            // unary negation
            ,["!${TOK} || ${PREV_IS_OP}", Op(
            ['-',1]         ,PREFIX     ,RIGHT          ,4          ,'(-$0)'        ,T_NUM 
            )]
            ])
,'>>'   :   Op(
            [1,'>>',1]      ,INFIX      ,LEFT           ,30         ,'($0>>$1)'     ,T_NUM 
            )
,'<<'   :   Op(
            [1,'<<',1]      ,INFIX      ,LEFT           ,30         ,'($0<<$1)'     ,T_NUM 
            )
,'>'    :   Op(
            [1,'>',1]       ,INFIX      ,LEFT           ,35         ,'($0>$1)'      ,T_BOL 
            )
,'<'    :   Op(
            [1,'<',1]       ,INFIX      ,LEFT           ,35         ,'($0<$1)'      ,T_BOL 
            )
,'>='   :   Op(
            [1,'>=',1]      ,INFIX      ,LEFT           ,35         ,'($0>=$1)'     ,T_BOL 
            )
,'<='   :   Op(
            [1,'<=',1]      ,INFIX      ,LEFT           ,35         ,'($0<=$1)'     ,T_BOL 
            )
,'=='   :   Op().Polymorphic([
            // array equivalence
            ["${DEDUCED_TYPE}===Xpresion.T_ARY", Op(
            [1,'==',1]      ,INFIX      ,LEFT           ,40         ,'Fn.ary_eq($0,$1)' ,T_BOL 
            )]
            // default equivalence
            ,["true", Op(
            [1,'==',1]      ,INFIX      ,LEFT           ,40         ,'($0==$1)'     ,T_BOL 
            )]
            ])
,'!='   :   Op(
            [1,'!=',1]      ,INFIX      ,LEFT           ,40         ,'($0!=$1)'     ,T_BOL 
            )
,'is'   :   Op(
            [1,'is',1]      ,INFIX      ,LEFT           ,40         ,'($0===$1)'    ,T_BOL 
            )
,'matches': Op(
            [1,'matches',1] ,INFIX      ,NONE           ,40         ,'$0.test($1)'  ,T_BOL 
            )
,'in'   :   Op(
            [1,'in',1]      ,INFIX      ,NONE           ,40         ,'Fn.contains($1,$0)'  ,T_BOL 
            )
,'&'    :   Op(
            [1,'&',1]       ,INFIX      ,LEFT           ,45         ,'($0&$1)'      ,T_NUM 
            )
,'|'    :   Op(
            [1,'|',1]       ,INFIX      ,LEFT           ,46         ,'($0|$1)'      ,T_NUM 
            )
,'&&'   :   Op(
            [1,'&&',1]      ,INFIX      ,LEFT           ,47         ,'($0&&$1)'     ,T_BOL 
            )
,'||'   :   Op(
            [1,'||',1]      ,INFIX      ,LEFT           ,48         ,'($0||$1)'     ,T_BOL 
            )
/*------------------------------------------
                aliases
 -------------------------------------------*/
,'or'    :  Alias( '||' )
,'and'   :  Alias( '&&' )
,'not'   :  Alias( '!' )
});

Xpresion.defFunc({
/*-------------------------------------------------------------------------------------------------------
symbol              input   ,output             ,output_type    ,priority(default 1)    ,arity(default 1)
---------------------------------------------------------------------------------------------------------*/
 'min'      : Func('min'    ,'Math.min($0)'     ,T_NUM  )
,'max'      : Func('max'    ,'Math.max($0)'     ,T_NUM  )
,'pow'      : Func('pow'    ,'Math.pow($0)'     ,T_NUM  )
,'sqrt'     : Func('sqrt'   ,'Math.sqrt($0)'    ,T_NUM  )
,'len'      : Func('len'    ,'Fn.len($0)'       ,T_NUM  )
,'int'      : Func('int'    ,'parseInt($0)'     ,T_NUM  )
,'str'      : Func('str'    ,'String($0)'       ,T_STR  )
,'clamp'    : Func('clamp'  ,'Fn.clamp($0)'     ,T_NUM  )
,'sum'      : Func('sum'    ,'Fn.sum($0)'       ,T_NUM  )
,'avg'      : Func('avg'    ,'Fn.avg($0)'       ,T_NUM  )
,'time'     : Func('time'   ,'Fn.time()'        ,T_NUM          ,1                      ,0  )
,'date'     : Func('date'   ,'Fn.date($0)'      ,T_STR  )
/*---------------------------------------
                aliases
 ----------------------------------------*/
 // ...
});

Xpresion.defReserved({
 'null'     : Tok(T_IDE, 'null', 'null')
,'false'    : Tok(T_BOL, 'false', 'false')
,'true'     : Tok(T_BOL, 'true', 'true')
,'infinity' : Tok(T_NUM, 'Infinity', 'Fn.INF')
,'nan'      : Tok(T_NUM, 'NaN', 'Fn.NAN')
// aliases
,'none'     : Alias('null')
,'inf'      : Alias('infinity')
});
```

####Performance 

expression parsing algorithm can be seen as a variation and generalisation of [Shunting-Yard algorithm](http://en.wikipedia.org/wiki/Shunting-yard_algorithm), 
running in linear-time ( O(n) ) in the input sequence


####TODO

* add full support for optional arguments in operators/functions (in progress, experimental)
* add full support for (xml-like) tags in expressions (experimental)
* implementations for ActionScript, C/C++
* performance tests
* documentation, examples, live examples

