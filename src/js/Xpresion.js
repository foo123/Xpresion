/**
*
*   Xpresion
*   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node/JS, ActionScript
*   @version: 1.0.0
*
*   https://github.com/foo123/Xpresion
*
**/
!function( root, name, factory ){
"use strict";
if ( ('undefined'!==typeof Components)&&('object'===typeof Components.classes)&&('object'===typeof Components.classesByID)&&Components.utils&&('function'===typeof Components.utils['import']) ) /* XPCOM */
    (root.$deps = root.$deps||{}) && (root.EXPORTED_SYMBOLS = [name]) && (root[name] = root.$deps[name] = factory.call(root));
else if ( ('object'===typeof module)&&module.exports ) /* CommonJS */
    (module.$deps = module.$deps||{}) && (module.exports = module.$deps[name] = factory.call(root));
else if ( ('undefined'!==typeof System)&&('function'===typeof System.register)&&('function'===typeof System['import']) ) /* ES6 module */
    System.register(name,[],function($__export){$__export(name, factory.call(root));});
else if ( ('function'===typeof define)&&define.amd&&('function'===typeof require)&&('function'===typeof require.specified)&&require.specified(name) /*&& !require.defined(name)*/ ) /* AMD */
    define(name,['module'],function(module){factory.moduleUri = module.uri; return factory.call(root);});
else if ( !(name in root) ) /* Browser/WebWorker/.. */
    (root[name] = factory.call(root)||1)&&('function'===typeof(define))&&define.amd&&define(function(){return root[name];} );
}(  /* current root */          this, 
    /* module name */           "Xpresion",
    /* module factory */        function ModuleFactory__Xpresion( undef ){
"use strict";

var __version__ = "1.0.0",
    PROTO = 'prototype', HAS = 'hasOwnProperty', toString = Object[PROTO].toString,
    toJSON = JSON.stringify, Keys = Object.keys, Extend = Object.create, 
    floor = Math.floor, round = Math.round, abs = Math.abs, max = Math.max,
    NEWLINE = /\n\r|\r\n|\n|\r/g, SQUOTE = /'/g,
    EMPTY_TOKEN, BLOCKS = 'BLOCKS', OPS = 'OPERATORS', FUNCS = 'FUNCTIONS',
    default_date_locale = {
     meridian: { am:'am', pm:'pm', AM:'AM', PM:'PM' }
    ,ordinal: { ord:{1:'st',2:'nd',3:'rd'}, nth:'th' }
    ,timezone: [ 'UTC','EST','MDT' ]
    ,timezone_short: [ 'UTC','EST','MDT' ]
    ,day: [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ]
    ,day_short: [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ]
    ,month: [ 'January','February','March','April','May','June','July','August','September','October','November','December' ]
    ,month_short: [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
    },
    CHAR = 'charAt', CHARCODE = 'charCodeAt',
    trim_re = /^\s+|\s+$/g,
    trim = String[PROTO].trim
        ? function( s ){ return s.trim(); }
        : function( s ){ return s.replace(trim_re, ''); }
    __inited = false, __configured = false
;

// https://github.com/foo123/GrammarTemplate
function is_array( o )
{
    return o instanceof Array || '[object Array]' === toString.call(o);
}
function walk( obj, keys )
{
    var o = obj, l = keys.length, i = 0, k;
    while( i < l )
    {
        k = keys[i++];
        if ( o && (null != o[k]) ) o = o[k];
        else return null;
    }
    return o;
}

function GrammarTemplate( tpl, delims )
{
    var self = this;
    if ( !(self instanceof GrammarTemplate) ) return new GrammarTemplate(tpl, delims);
    self.id = null;
    self.tpl = null;
    // lazy init
    self._args = [tpl||'', delims||GrammarTemplate.defaultDelims];
    self._parsed = false;
};
GrammarTemplate.VERSION = '1.1.0';
GrammarTemplate.defaultDelims = ['<','>','[',']'/*,'?','*','!','|','{','}'*/];
GrammarTemplate.multisplit = function multisplit( tpl, delims ) {
    var IDL = delims[0], IDR = delims[1], OBL = delims[2], OBR = delims[3],
        lenIDL = IDL.length, lenIDR = IDR.length, lenOBL = OBL.length, lenOBR = OBR.length,
        ESC = '\\', OPT = '?', OPTR = '*', NEG = '!', DEF = '|', REPL = '{', REPR = '}',
        default_value = null, negative = 0, optional = 0, nested, start_i, end_i,
        argument, p, stack, c, a, b, s, l = tpl.length, i, j, jl, escaped, ch;
    
    i = 0; a = [[], null, null, 0, 0, 0, 0, null]; stack = []; s = ''; escaped = false;
    while( i < l )
    {
        ch = tpl[CHAR](i);
        if ( ESC === ch )
        {
            escaped = !escaped;
            i += 1;
        }
        
        if ( IDL === tpl.substr(i,lenIDL) )
        {
            if ( escaped )
            {
                s += IDL;
                i += lenIDL;
                escaped = false;
                continue;
            }
            
            i += lenIDL;
            if ( s.length ) a[0].push([0, s]);
            s = '';
        }
        else if ( IDR === tpl.substr(i,lenIDR) )
        {
            if ( escaped )
            {
                s += IDR;
                i += lenIDR;
                escaped = false;
                continue;
            }
            
            i += lenIDR;
            // argument
            argument = s; s = '';
            if ( -1 < (p=argument.indexOf(DEF)) )
            {
                default_value = argument.slice( p+1 );
                argument = argument.slice( 0, p );
            }
            else
            {
                default_value = null;
            }
            c = argument[CHAR](0);
            if ( OPT === c || OPTR === c )
            {
                optional = 1;
                if ( OPTR === c )
                {
                    start_i = 1;
                    end_i = -1;
                }
                else
                {
                    start_i = 0;
                    end_i = 0;
                }
                argument = argument.slice(1);
                if ( NEG === argument[CHAR](0) )
                {
                    negative = 1;
                    argument = argument.slice(1);
                }
                else
                {
                    negative = 0;
                }
            }
            else if ( REPL === c )
            {
                s = ''; j = 1; jl = argument.length;
                while ( j < jl && REPR !== argument[CHAR](j) ) s += argument[CHAR](j++);
                argument = argument.slice( j+1 );
                s = s.split(',');
                if ( s.length > 1 )
                {
                    start_i = trim(s[0]);
                    start_i = start_i.length ? parseInt(start_i,10)||0 : 0;
                    end_i = trim(s[1]);
                    end_i = end_i.length ? parseInt(end_i,10)||0 : -1;
                    optional = 1;
                }
                else
                {
                    start_i = trim(s[0]);
                    start_i = start_i.length ? parseInt(start_i,10)||0 : 0;
                    end_i = start_i;
                    optional = 0;
                }
                s = '';
                negative = 0;
            }
            else
            {
                optional = 0;
                negative = 0;
                start_i = 0;
                end_i = 0;
            }
            if ( negative && (null === default_value) ) default_value = '';
            
            nested = -1 < argument.indexOf('.') ? argument.split('.') : null;
            
            if ( optional && !a[3] )
            {
                a[1] = argument;
                a[2] = nested;
                a[3] = optional;
                a[4] = negative;
                a[5] = start_i;
                a[6] = end_i;
                // handle multiple optional arguments for same optional block
                a[7] = [[argument,negative,start_i,end_i,nested]];
            }
            else if( optional )
            {
                // handle multiple optional arguments for same optional block
                a[7].push([argument,negative,start_i,end_i,nested]);
            }
            else if ( !optional && (null === a[1]) )
            {
                a[1] = argument;
                a[2] = nested;
                a[3] = 0;
                a[4] = negative;
                a[5] = start_i;
                a[6] = end_i;
                a[7] = [[argument,negative,start_i,end_i,nested]];
            }
            a[0].push([1, argument, nested, default_value, optional, negative, start_i, end_i]);
        }
        else if ( OBL === tpl.substr(i,lenOBL) )
        {
            if ( escaped )
            {
                s += OBL;
                i += lenOBL;
                escaped = false;
                continue;
            }
            
            i += lenOBL;
            // optional block
            if ( s.length ) a[0].push([0, s]);
            s = '';
            stack.push(a);
            a = [[], null, null, 0, 0, 0, 0, null];
        }
        else if ( OBR === tpl.substr(i,lenOBR) )
        {
            if ( escaped )
            {
                s += OBR;
                i += lenOBR;
                escaped = false;
                continue;
            }
            
            i += lenOBR;
            b = a; a = stack.pop( );
            if ( s.length ) b[0].push([0, s]);
            s = '';
            a[0].push([-1, b[1], b[2], b[3], b[4], b[5], b[6], b[7], b[0]]);
        }
        else
        {
            if ( ESC === ch ) s += ch;
            else s += tpl[CHAR](i++);
        }
    }
    if ( s.length ) a[0].push([0, s]);
    return a[0];
};
GrammarTemplate[PROTO] = {
    constructor: GrammarTemplate
    
    ,id: null
    ,tpl: null
    ,_parsed: false
    ,_args: null
    
    ,dispose: function( ) {
        var self = this;
        self.id = null;
        self.tpl = null;
        self._args = null;
        self._parsed = null;
        return self;
    }
    ,parse: function( ) {
        var self = this;
        if ( false === self._parsed )
        {
            // lazy init
            self._parsed = true;
            self.tpl = GrammarTemplate.multisplit( self._args[0], self._args[1] );
            self._args = null;
        }
        return self;
    }
    ,render: function( args ) {
        var self = this;
        if ( false === self._parsed )
        {
            // lazy init
            self.parse( );
        }
        
        args = args || { };
        var tpl = self.tpl, l = tpl.length,
            p, arr, MIN = Math.min,
            i, t, tt, s, rarg = null,
            ri = 0, rs, re, out = '',
            opts_vars, render, oi, ol, opt_v, opt_arg,
            // pre-allocate stack for efficiency
            stack = new Array(200), slen = 0
        ;
        i = 0;
        while ( i < l || slen )
        {
            if ( i >= l )
            {
                p = stack[--slen];
                tpl = p[0]; i = p[1]; l = p[2];
                rarg = p[3]||null; ri = p[4]||0;
                continue;
            }
            
            t = tpl[ i ]; tt = t[ 0 ]; s = t[ 1 ];
            if ( -1 === tt )
            {
                // optional block
                opts_vars = t[ 7 ];
                if ( opts_vars && opts_vars.length )
                {
                    render = true;
                    for(oi=0,ol=opts_vars.length; oi<ol; oi++)
                    {
                        opt_v = opts_vars[oi];
                        opt_arg = opt_v[4] ? walk( args, opt_v[4] ) : args[opt_v[0]];
                        if ( (0 === opt_v[1] && null == opt_arg/*!args[HAS](opt_v[0])*/) ||
                            (1 === opt_v[1] && null != opt_arg/*args[HAS](opt_v[0])*/)
                        )
                        {
                            render = false;
                            break;
                        }
                    }
                    if ( render )
                    {
                        if ( 1 === t[ 4 ] )
                        {
                            stack[slen++] = [tpl, i+1, l, rarg, ri];
                            tpl = t[ 8 ]; i = 0; l = tpl.length;
                            rarg = null; ri = 0;
                            continue;
                        }
                        else
                        {
                            opt_arg = t[2] ? walk( args, t[2] )/*nested key*/ : args[s]/*plain key*/;
                            arr = is_array( opt_arg );
                            if ( arr && (t[5] !== t[6]) && opt_arg.length > t[ 5 ] )
                            {
                                rs = t[ 5 ];
                                re = -1 === t[ 6 ] ? opt_arg.length-1 : MIN(t[ 6 ], opt_arg.length-1);
                                if ( re >= rs )
                                {
                                    stack[slen++] = [tpl, i+1, l, rarg, ri];
                                    tpl = t[ 8 ]; i = 0; l = tpl.length;
                                    rarg = s;
                                    for(ri=re; ri>rs; ri--) stack[slen++] = [tpl, 0, l, rarg, ri];
                                    ri = rs;
                                    continue;
                                }
                            }
                            else if ( !arr && (t[5] === t[6]) )
                            {
                                stack[slen++] = [tpl, i+1, l, rarg, ri];
                                tpl = t[ 8 ]; i = 0; l = tpl.length;
                                rarg = s; ri = 0;
                                continue;
                            }
                        }
                    }
                }
            }
            else if ( 1 === tt )
            {
                // default value if missing
                opt_arg = t[2] ? walk( args, t[2] )/*nested key*/ : args[s]/*plain key*/;
                out += (null == opt_arg/*!args[HAS](s)*/) && (null !== t[ 3 ])
                    ? t[ 3 ]
                    : (is_array(opt_arg)
                    ? (s === rarg
                    ? opt_arg[t[6]===t[7]?t[6]:ri]
                    : opt_arg[t[6]])
                    : opt_arg)
                ;
            }
            else /*if ( 0 === tt )*/
            {
                out += s;
            }
            i++;
        }
        return out;
    }
};

function F( a, f )
{
    return new Function( a, f );
}
function RE( r, f )
{
    return new RegExp( r, f||'' );
}
//function DATE( d, f ){ return new Date( d ); }

function is_string( v )
{
    return (v instanceof String) || ('[object String]' === toString.call(v));
}
function starts_with( s, p, i )
{
    i = i || 0;
    return s.length-i >= p.length && p === s.substr(i, p.length);
}
function pad( s, len, ch )
{
    var sp = s.toString( ), n = len-sp.length;
    return n > 0 ? new Array(n+1).join(ch||' ')+sp : sp;
}
function time( )
{
    return floor(new Date().getTime() / 1000);
}
function date( format, timestamp )
{
    var formatted_datetime, f, i, l, jsdate,
        locale = default_date_locale
    ;
    
    // JS Date
    if ( timestamp instanceof Date ) jsdate = new Date( timestamp );
    // UNIX timestamp (auto-convert to int)
    else if ( "number" === typeof timestamp ) jsdate =  new Date(timestamp * 1000);
    // undefined
    else/*if ( null === timestamp  || undef === timestamp )*/ jsdate = new Date( );
    
    var D = { }, tzo = jsdate.getTimezoneOffset( ), atzo = abs(tzo), m = jsdate.getMonth( ), jmod10;
    // 24-Hours; 0..23
    D.G = jsdate.getHours( );
    // Day of month; 1..31
    D.j = jsdate.getDate( ); jmod10 = D.j%10;
    // Month; 1...12
    D.n = m + 1;
    // Full year; e.g. 1980...2010
    D.Y = jsdate.getFullYear( );
    // Day of week; 0[Sun]..6[Sat]
    D.w = jsdate.getDay( );
    // ISO-8601 day of week; 1[Mon]..7[Sun]
    D.N = D.w || 7;
    // Day of month w/leading 0; 01..31
    D.d = pad(D.j, 2, '0');
    // Shorthand day name; Mon...Sun
    D.D = locale.day_short[ D.w ];
    // Full day name; Monday...Sunday
    D.l = locale.day[ D.w ];
    // Ordinal suffix for day of month; st, nd, rd, th
    D.S = locale.ordinal.ord[ D.j ] ? locale.ordinal.ord[ D.j ] : (locale.ordinal.ord[ jmod10 ] ? locale.ordinal.ord[ jmod10 ] : locale.ordinal.nth);
    // Day of year; 0..365
    D.z = round((new Date(D.Y, m, D.j) - new Date(D.Y, 0, 1)) / 864e5);
    // ISO-8601 week number
    D.W = pad(1 + round((new Date(D.Y, m, D.j - D.N + 3) - new Date(D.Y, 0, 4)) / 864e5 / 7), 2, '0');
    // Full month name; January...December
    D.F = locale.month[ m ];
    // Month w/leading 0; 01...12
    D.m = pad(D.n, 2, '0');
    // Shorthand month name; Jan...Dec
    D.M = locale.month_short[ m ];
    // Days in month; 28...31
    D.t = (new Date(D.Y, m+1, 0)).getDate( );
    // Is leap year?; 0 or 1
    D.L = D.Y % 4 === 0 & D.Y % 100 !== 0 | D.Y % 400 === 0;
    // ISO-8601 year
    D.o = D.Y + (11 === m && D.W < 9 ? 1 : (0 === m && D.W > 9 ? -1 : 0));
    // Last two digits of year; 00...99
    D.y = D.Y.toString( ).slice(-2);
    // am or pm
    D.a = D.G > 11 ? locale.meridian.pm : locale.meridian.am;
    // AM or PM
    D.A = D.G > 11 ? locale.meridian.PM : locale.meridian.AM;
    // Swatch Internet time; 000..999
    D.B = pad(floor((jsdate.getUTCHours( ) * 36e2 + jsdate.getUTCMinutes( ) * 60 + jsdate.getUTCSeconds( ) + 36e2) / 86.4) % 1e3, 3, '0');
    // 12-Hours; 1..12
    D.g = (D.G % 12) || 12;
    // 12-Hours w/leading 0; 01..12
    D.h = pad(D.g, 2, '0');
    // 24-Hours w/leading 0; 00..23
    D.H = pad(D.G, 2, '0');
    // Minutes w/leading 0; 00..59
    D.i = pad(jsdate.getMinutes( ), 2, '0');
    // Seconds w/leading 0; 00..59
    D.s = pad(jsdate.getSeconds( ), 2, '0');
    // Microseconds; 000000-999000
    D.u = pad(jsdate.getMilliseconds( ) * 1000, 6, '0');
    // Timezone identifier; e.g. Atlantic/Azores, ...
    // The following works, but requires inclusion of the very large
    // timezone_abbreviations_list() function.
    /*              return that.date_default_timezone_get();
    */
    D.e = '';
    // DST observed?; 0 or 1
    D.I = ((new Date(D.Y, 0) - Date.UTC(D.Y, 0)) !== (new Date(D.Y, 6) - Date.UTC(D.Y, 6))) ? 1 : 0;
    // Difference to GMT in hour format; e.g. +0200
    D.O = (tzo > 0 ? "-" : "+") + pad(floor(atzo / 60) * 100 + atzo % 60, 4, '0');
    // Difference to GMT w/colon; e.g. +02:00
    D.P = (D.O.substr(0, 3) + ":" + D.O.substr(3, 2));
    // Timezone abbreviation; e.g. EST, MDT, ...
    D.T = 'UTC';
    // Timezone offset in seconds (-43200...50400)
    D.Z = -tzo * 60;
    // Seconds since UNIX epoch
    D.U = jsdate / 1000 | 0;
    // ISO-8601 date. 'Y-m-d\\TH:i:sP'
    D.c = [ D.Y,'-',D.m,'-',D.d,'\\',D.T,D.H,':',D.i,':',D.s,D.P ].join('');
    // RFC 2822 'D, d M Y H:i:s O'
    D.r = [ D.D,', ',D.d,' ',D.M,' ',D.Y,' ',D.H,':',D.i,':',D.s,' ',D.O ].join('');
        
    formatted_datetime = '';
    for (i=0,l=format.length; i<l; i++)
    {
        f = format.charAt( i );
        formatted_datetime += D[HAS](f) ? D[ f ] : f;
    }
    return formatted_datetime;
}
function range( a, start, end, step )
{
    var al = a.length, b, bl, j, i, tmp;
    if ( arguments.length < 4 )
    {
        step = 1;
        if ( arguments.length < 3 )
        {
            end = al;
            if ( arguments.length < 2 )
            {
                start = 0;
            }
        }
    }
    step = step || 1; start = start || 0; if ( 0 > end ) end += al;
    if ( 0 > start || end < start || end > al ) return [];
    if ( end === start ) return start < al ? [a[start]] : [];
    bl = floor((end-start)/abs(step)); b = new Array(bl);
    if ( 0 > step )
    {
        for (i=end-1,j=0; i>=0; i+=step,j++) b[j] = a[i];
    }
    else
    {
        for (i=start,j=0; i<end; i+=step,j++) b[j] = a[i];
    }
    return b;
}
function dummy( /*Var, Fn, Cache*/ )
{
    return null;
}
function evaluator_factory(evaluator_str,Fn,Cache)
{
    var evaluator = F('Fn,Cache', [
     'return function evaluator(Var){'
    ,'    "use strict";'
    ,'    return ' + evaluator_str + ';'
    ,'};'
    ].join("\n"))(Fn,Cache);
    return evaluator;
}

/*function trace( stack )
{
    var out = [], i, l=stack.length;
    for (i=0; i<l; i++) out.push(stack[i].toString());
    return out.join(",\n");
}*/

function Xpresion( expr )
{
    var self = this;
    if ( !(self instanceof Xpresion) ) return new Xpresion( expr );
    self.source = expr || '';
    self.setup( );
    Xpresion.parse( self );
}
Xpresion.VERSION = __version__;

// STATIC
var
 COMMA       = Xpresion.COMMA      =   ','
,LPAREN      = Xpresion.LPAREN     =   '('
,RPAREN      = Xpresion.RPAREN     =   ')'

,NONE        = Xpresion.NONE       =   0
,DEFAULT     = Xpresion.DEFAULT    =   1
,LEFT        = Xpresion.LEFT       =  -2
,RIGHT       = Xpresion.RIGHT      =   2
,PREFIX      = Xpresion.PREFIX     =   2
,INFIX       = Xpresion.INFIX      =   4
,POSTFIX     = Xpresion.POSTFIX    =   8

,T_DUM       = Xpresion.T_DUM      =   0
,T_DFT       = Xpresion.T_DFT      =   1
,T_IDE       = Xpresion.T_IDE      =   16
,T_VAR       = Xpresion.T_VAR      =   17
,T_LIT       = Xpresion.T_LIT      =   32
,T_NUM       = Xpresion.T_NUM      =   33
,T_STR       = Xpresion.T_STR      =   34
,T_REX       = Xpresion.T_REX      =   35
,T_BOL       = Xpresion.T_BOL      =   36
,T_DTM       = Xpresion.T_DTM      =   37
,T_ARY       = Xpresion.T_ARY      =   38
,T_OP        = Xpresion.T_OP       =   128
,T_N_OP      = Xpresion.T_N_OP     =   129
,T_POLY_OP   = Xpresion.T_POLY_OP  =   130
,T_FUN       = Xpresion.T_FUN      =   131
,T_EMPTY     = Xpresion.T_EMPTY    =   1024
;

Xpresion.Tpl = Xpresion.GrammarTemplate = GrammarTemplate;

function Alias( alias )
{
    if ( !(this instanceof Alias) ) return new Alias(alias);
    this.alias = alias;
}
Xpresion.Alias = Alias;
Alias.get_entry = function( entries, id ) {
    if ( id && entries && entries[HAS](id) )
    {
        // walk/bypass aliases, if any
        var entry = entries[ id ];
        while ( (entry instanceof Alias) && entries[HAS](entry.alias) ) 
        {
            id = entry.alias;
            // circular reference
            if (entry === entries[ id ]) return false;
            entry = entries[ id ];
        }
        return entry;
    }
    return false;
};

function Node(type, arity, node, children, pos)
{
    var self = this;
    if ( !(self instanceof Node) ) return new Node(type, arity, node, children, pos);
    self.type = type;
    self.arity = arity;
    self.node = node;
    self.children = children || null;
    self.pos = pos || 0;
}
Xpresion.Node = Node;
Node[PROTO] = {
    constructor: Node
    ,type: null
    ,arity: null
    ,node: null
    ,children: null
    ,pos: null
    ,op_parts: null
    ,op_def: null
    ,op_index: null
    ,op_next: function( op, pos, op_queue, token_queue ) {
        var self = this, num_args = 0,
            is_next = (0 === self.op_parts.indexOf( op.input ));
        if ( is_next )
        {
            if ( 0 === self.op_def[0][0] )
            {
                num_args = Op.match_args(self.op_def[0][2], pos-1, op_queue, token_queue );
                if ( false === num_args )
                {
                    is_next = false;
                }
                else
                {
                    self.arity = num_args;
                    self.op_def.shift( );
                }
            }
        }
        if ( is_next ) 
        {
            self.op_def.shift( );
            self.op_parts.shift( );
        }
        return is_next;
    }
    ,op_complete: function( ) {
        return !this.op_parts.length;
    }
    ,dispose: function( ) {
        var self = this, 
            c = self.children, l, i;
        if (c && (l=c.length))
        {
            for (i=0; i<l; i++) c[i] && c[i].dispose();
        }
        self.type = null;
        self.arity = null;
        self.pos = null;
        self.node = null;
        self.op_parts = null;
        self.op_def = null;
        self.op_index = null;
        c = self.children = null;
        return self;
    }
    /*,toString: function( ) {
        var out = [], n = this.node,
            ch = this.children ? this.children : [], 
            i, l = ch.length,
            tab = arguments.length && arguments[0].substr ? arguments[0] : "",
            tab_tab = tab+"  "
        ;
        for (i=0; i<l; i++) out.push(ch[i].toString(tab_tab));
        return tab + [
        "Node("+n.type+","+n.arity+"): " + (n.parts ? n.parts.join(' ') : n.input),
        "Childs: [",
        tab + out.join("\n" + tab),
        "]"
        ].join("\n"+tab) + "\n";
    }*/
};
// depth-first traversal
Node.DFT = function DFT( root, action, andDispose ) {
    /*
        one can also implement a symbolic solver here, 
        also known as "unification" in symbolic computation and rewrite systems
        by manipulating the tree to produce 'x' on one side 
        and the reverse operators/tokens on the other side
        i.e by transposing the top op on other side of the '=' op and using the 'associated inverse operator'
        in stack order (i.e most top op is transposed first etc.. until only the branch with 'x' stays on one side)
        (easy when only one unknown in one state, more difficult for many unknowns 
        or one unknown in different states, e.g x and x^2 etc..)
    */
    andDispose = false !== andDispose;
    action = action || Xpresion.render;
    var node, op, arity, o, stack = [ root ], output = [ ];
    while ( stack.length )
    {
        node = stack[ 0 ];
        if ( node.children && node.children.length ) 
        {
            stack = node.children.concat( stack );
            node.children = null;
        }
        else
        {
            stack.shift( );
            op = node.node;
            arity = op.arity;
            if ( (T_OP & op.type) && 0 === arity ) arity = 1; // have already padded with empty token
            else if ( arity > output.length && op.arity_min <= op.arity ) arity = op.arity_min;
            o = action(op, arity ? output.splice(output.length-arity, arity) : [])
            output.push( o );
            if ( andDispose ) node.dispose( );
        }
    }
    stack = null;
    return output[ 0 ];
};

Xpresion.reduce = function( token_queue, op_queue, nop_queue, current_op, pos, err ) {
    var entry, op, n, opc, fixity, nop = null, nop_index = 0, validation, arity;
    /*
        n-ary operatots (eg ternary) or composite operators
        as operators with multi-parts
        which use their own stack or equivalently
        lock their place on the OP_STACK
        until all the parts of the operator are
        unified and collapsed
        
        Equivalently n-ary ops are like ops which relate NOT to
        args but to other ops
        
        In this way the BRA_KET special op handling 
        can be made into an n-ary op with uniform handling
    */
    // TODO: maybe do some optimisation here when 2 operators can be combined into 1, etc..
    // e.g not is => isnot
    
    if ( current_op )
    {
        opc = current_op;
        
        // polymorphic operator
        // get the current operator morph, based on current context
        (T_POLY_OP === opc.type) && (opc = opc.morph([pos,token_queue,op_queue]));
        
        // n-ary/multi-part operator, initial part
        // push to nop_queue/op_queue
        if ( T_N_OP === opc.type )
        {
            validation = opc.validate(pos, op_queue, token_queue);
            if ( false === validation[0] )
            {
                // operator is not valid in current state
                err.err = true;
                err.msg = validation[1];
                return false;
            }
            n = opc.node(null, pos, op_queue, token_queue);
            n.arity = validation[0];
            nop_queue.unshift( n );
            op_queue.unshift( n );
        }
        else
        {
            if ( nop_queue.length )
            {
                nop = nop_queue[0];
                nop_index = nop.op_index;
            }
            
            // n-ary/multi-part operator, further parts
            // combine one-by-one, until n-ary operator is complete
            if ( nop && nop.op_next(opc, pos, op_queue, token_queue) )
            {
                while ( op_queue.length > nop_index )
                {
                    entry = op_queue.shift( ); op = entry.node;
                    arity = op.arity;
                    if ( (T_OP & op.type) && 0 === arity ) arity = 1; // have already padded with empty token
                    else if ( arity > token_queue.length && op.arity_min <= op.arity ) arity = op.arity_min;
                    n = op.node(arity ? token_queue.splice(token_queue.length-arity, arity) : [], entry.pos);
                    token_queue.push( n );
                }
                
                if ( nop.op_complete( ) ) 
                {
                    nop_queue.shift( );
                    op_queue.shift( );
                    opc = nop.node;
                    nop.dispose( );
                    nop_index = nop_queue.length ? nop_queue[0].op_index : 0;
                }
                else
                {
                    return;
                }
            }
            else
            {
                validation = opc.validate(pos, op_queue, token_queue);
                if ( false === validation[0] )
                {
                    // operator is not valid in current state
                    err.err = true;
                    err.msg = validation[1];
                    return false;
                }
            }
            
            fixity = opc.fixity;
            if ( POSTFIX === fixity )
            {
                // postfix assumed to be already in correct order, 
                // no re-structuring needed
                if ( (arity = opc.arity) > token_queue.length && opc.arity_min <= token_queue.length ) arity = opc.arity_min;
                n = opc.node(arity ? token_queue.splice(token_queue.length-arity, arity) : [], pos);
                token_queue.push( n );
            }
            else if ( PREFIX === fixity )
            {
                // prefix assumed to be already in reverse correct order, 
                // just push to op queue for later re-ordering
                op_queue.unshift( Node(opc.otype, opc.arity, opc, null, pos) );
                if ( (/*T_FUN*/T_OP & opc.type) && (0 === opc.arity) ) 
                {
                    token_queue.push(EMPTY_TOKEN.node(null, pos+1));
                }
            }
            else/* if ( INFIX === fixity )*/
            {
                while ( op_queue.length > nop_index )
                {
                    entry = op_queue.shift( ); op = entry.node;
                    
                    if ( (op.priority < opc.priority || 
                        (op.priority === opc.priority && 
                        (op.associativity < opc.associativity || 
                        (op.associativity === opc.associativity && 
                        op.associativity < 0))))
                    )
                    {
                        arity = op.arity;
                        if ( (T_OP & op.type) && 0 === arity ) arity = 1; // have already padded with empty token
                        else if ( arity > token_queue.length && op.arity_min <= op.arity ) arity = op.arity_min;
                        n = op.node(arity ? token_queue.splice(token_queue.length-arity, arity) : [], entry.pos);
                        token_queue.push( n );
                    }
                    else
                    {
                        op_queue.unshift( entry );
                        break;
                    }
                }
                op_queue.unshift( Node(opc.otype, opc.arity, opc, null, pos) );
            }
        }
    }
    else
    {
        while ( op_queue.length )
        {
            entry = op_queue.shift( ); op = entry.node; 
            arity = op.arity;
            if ( (T_OP & op.type) && 0 === arity ) arity = 1; // have already padded with empty token
            else if ( arity > token_queue.length && op.arity_min <= op.arity ) arity = op.arity_min;
            n = op.node(arity ? token_queue.splice(token_queue.length-arity, arity) : [], entry.pos);
            token_queue.push( n );
        }
    }
};

Xpresion.parse_block = function( s, start, end, escaped, postfix ) {
    if ( !starts_with( s, start, s.pos ) ) return false;
    var block, pos, p, ch, esc, rest=false;
    escaped = false !== escaped;
    s.pos += start.length;
    block = start;
    pos = s.indexOf( end, s.pos );
    while ( pos > -1 )
    {
        if ( !escaped )
        {
            block += s.slice(s.pos, pos+end.length);
            s.pos = pos+end.length;
            break;
        }
        else
        {
            p = pos-1; esc = false;
            while ( p >= s.pos && '\\' === (ch=s.charAt(p)) )
            {
                esc = !esc;
                p--;
            }
            if ( !esc )
            {
                block += s.slice(s.pos, pos+end.length);
                s.pos = pos+end.length;
                break;
           }
           else
           {
               pos = s.indexOf( end, s.pos+pos+end.length );
           }
        }
    }
    if ( -1 === pos )
    {
        block += s.slice( s.pos );
        s.pos = s.length;
    }
    if ( postfix && s.pos < s.length && (rest=s.slice( s.pos ).match( postfix )) ) rest = rest[1] || rest[0];
    return [block, rest];
};

Xpresion.parse = function( xpr ) {
    var expr, l
        
        ,e, ch, v, pos
        ,m, t, AST, OPS, NOPS, t_index
        
        ,reduce = Xpresion.reduce
        ,get_entry = Alias.get_entry
        ,parse_block = Xpresion.parse_block
        
        ,RE = xpr.RE, BLOCK = xpr[BLOCKS], block
        ,t_var_is_also_ident = !RE[HAS]('t_var')
        ,evaluator, parsed
        ,err = 0, errpos, errmsg, errors = {err: false, msg: ''}
    ;
    
    expr = new String(xpr.source);
    l = expr.length; expr.pos = 0;
    xpr._cnt = 0;
    xpr._symbol_table = { };
    xpr._cache = { };
    xpr.variables = { };
    AST = [ ]; OPS = [ ]; NOPS = [ ]; 
    t_index = 0;
    err = 0;
    while ( expr.pos < l )
    {
        pos = expr.pos;
        ch = expr.charAt( pos );
        
        // use customized (escaped) delimited blocks here
        // TODO: add a "date" block as well with #..#
        if ( block = get_entry(BLOCK, ch) ) // string or regex or date ('"`#)
        {
            v = parse_block( expr, block.block[0], block.block[1], block.escaped, block.postfix );
            if ( false !== v )
            {
                t = xpr.t_block( v[0], block.type, v[1] );
                if ( false !== t )
                {
                    t_index += 1;
                    AST.push( t.node(null, t_index) );
                    continue;
                }
                else
                {
                    expr.pos = pos;
                }
            }
        }
        
        e = expr.slice( pos );
        
        if ( m = e.match( RE.t_spc ) ) // space
        {
            expr.pos += m[ 1 ].length;
            continue;
        }

        if ( m = e.match( RE.t_num ) ) // number
        {
            t = xpr.t_liter( m[ 2 ], T_NUM );
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                expr.pos += m[ 1 ].length;
                continue;
            }
        }
        
        if ( m = e.match( RE.t_ident ) ) // ident, reserved, function, operator, etc..
        {
            t = xpr.t_liter( m[ 2 ], T_IDE ); // reserved keyword
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                expr.pos += m[ 1 ].length;
                continue;
            }
            t = xpr.t_op( m[ 2 ] ); // (literal) operator
            if ( false !== t )
            {
                t_index+=1;
                reduce( AST, OPS, NOPS, t, t_index, errors );
                if ( errors.err )
                {
                    err = 1;
                    errmsg = errors.msg;
                    break;
                }
                expr.pos += m[ 1 ].length;
                continue;
            }
            if ( t_var_is_also_ident )
            {
                t = xpr.t_var( m[ 2 ] ); // variables are also same identifiers
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    expr.pos += m[ 1 ].length;
                    continue;
                }
            }
        }
        
        if ( m = e.match( RE.t_special ) ) // special symbols..
        {
            v = m[ 1 ]; t = false;
            while ( v.length > 0 ) // try to match maximum length op/func
            {
                t = xpr.t_op( v ); // function, (non-literal) operator
                if ( false !== t ) break;
                v = v.slice( 0, -1 );
            }
            if ( false !== t )
            {
                t_index+=1;
                reduce( AST, OPS, NOPS, t, t_index, errors );
                if ( errors.err )
                {
                    err = 1;
                    errmsg = errors.msg;
                    break;
                }
                expr.pos += v.length;
                continue;
            }
        }
        
        if ( !t_var_is_also_ident && (m = e.match( RE.t_var )) ) // variables
        {
            t = xpr.t_var( m[ 2 ] );
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                expr.pos += m[ 1 ].length;
                continue;
            }
        }
        
        if ( m = e.match( RE.t_nonspc ) ) // other non-space tokens/symbols..
        {
            t = xpr.t_liter( m[ 2 ], T_LIT ); // reserved keyword
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                expr.pos += m[ 1 ].length;
                continue;
            }
            t = xpr.t_op( m[ 2 ] ); // function, other (non-literal) operator
            if ( false !== t )
            {
                t_index+=1;
                reduce( AST, OPS, NOPS, t, t_index, errors );
                if ( errors.err )
                {
                    err = 1;
                    errmsg = errors.msg;
                    break;
                }
                expr.pos += m[ 1 ].length;
                continue;
            }
            t = xpr.t_tok( m[ 2 ] );
            t_index+=1;
            AST.push( t.node(null, t_index) ); // pass-through ..
            expr.pos += m[ 1 ].length;
            //continue;
        }
    }
    
    parsed = '';
    
    if ( !err )
    {
        reduce( AST, OPS, NOPS );
        
        if ( (1 !== AST.length) || (OPS.length > 0) )
        {
            err = 1;
            errmsg = 'Parse Error, Mismatched Parentheses or Operators';
            //console.log(AST);
        }
    }
    
    parsed = AST[0];
    NOPS = null; OPS = null; AST = null;
    xpr._symbol_table = null;
    
    if ( !err )
    {
        try {
            
            evaluator = xpr.compile( parsed );
        
        } catch( e ) {
            
            err = 1;
            errmsg = 'Compilation Error, ' + e.message + ' at "' + parsed + '"';
        }
    }
    
    if ( err )
    {
        evaluator = null;
        xpr.variables = [ ];
        xpr._cnt = 0;
        xpr._cache = { };
        xpr._evaluator_str = '';
        xpr._evaluator = xpr.dummy_evaluator;
        console.error( 'Xpresion Error: ' + errmsg + ' at "' + expr + '"');
    }
    else
    {
        // make array
        xpr.variables = Keys( xpr.variables );
        xpr._evaluator_str = evaluator[0];
        xpr._evaluator = evaluator[1];
    }
    
    return xpr; 
};
    
Xpresion.render = function( tok, args ) { 
    return tok.render( args ); 
    //return Tok.render(tok, args);
};

/*Xpresion.evaluate = function( tok, args ) { 
    return tok.evaluate( args ); 
};*/

Xpresion.defRE = function( obj, RE ) {
    if ( 'object' === typeof obj )
    {
        RE = RE || Xpresion.RE;
        for (var k in obj)
        {
            if ( obj[HAS](k) ) RE[ k ] = obj[ k ];
        }
    }
    return RE;
};

Xpresion.defBlock = function( obj, BLOCK ) {
    if ( 'object' === typeof obj )
    {
        BLOCK = BLOCK || Xpresion[BLOCKS];
        for (var k in obj)
        {
            if ( obj[HAS](k) ) BLOCK[ k ] = obj[ k ];
        }
    }
    return BLOCK;
};

Xpresion.defReserved = function( obj, Reserved ) {
    if ( 'object' === typeof obj )
    {
        Reserved = Reserved || Xpresion.Reserved;
        for (var k in obj)
        {
            if ( obj[HAS](k) ) Reserved[ k ] = obj[ k ];
        }
    }
    return Reserved;
};

Xpresion.defOp = function( obj, OPERATORS ) {
    if ( 'object' === typeof obj )
    {
        OPERATORS = OPERATORS || Xpresion[OPS];
        var k, op;
        for (k in obj)
        {
            if ( !obj[HAS](k) || !obj[ k ] ) continue;
            op = obj[ k ];
            
            if ( op instanceof Alias || op instanceof Op )
            {
                OPERATORS[ k ] = op;
                continue;
            }
            
            if ( op.polymorphic )
            {
            }
            else
            {
                OPERATORS[ k ] = new Op(
                    // input, output,  fixity,   associativity,   priority, /*arity,*/ otype, ofixity
                    op.input,
                    op.output,
                    op.fixity,
                    op.associativity,
                    op.priority,
                    op.otype,
                    op.ofixity
                );
            }
        }
    }
    return OPERATORS;
};

Xpresion.defFunc = function( obj, FUNCTIONS ) {
    if ( 'object' === typeof obj )
    {
        FUNCTIONS = FUNCTIONS || Xpresion[FUNCS];
        var k, op;
        for (k in obj)
        {
            if ( !obj[HAS](k) || !obj[ k ] ) continue;
            op = obj[ k ];
            
            if ( op instanceof Alias || op instanceof Func )
            {
                FUNCTIONS[ k ] = op;
                continue;
            }
            
            FUNCTIONS[ k ] = new Func(
                // input, output, otype, priority, arity, associativity, fixity
                op.input,
                op.output,
                op.otype,
                op.priority,
                op.arity,
                op.associativity,
                op.fixity
            );
        }
    }
    return FUNCTIONS;
};

Xpresion.defRuntimeFunc = function( obj, Fn ) {
    if ( 'object' === typeof obj )
    {
        Fn = Fn || Xpresion.Fn;
        for (var k in obj)
        {
            if ( obj[HAS](k) ) Fn[ k ] = obj[ k ];
        }
    }
    return Fn;
};

function Tok( type, input, output, value )
{
    var self = this;
    if ( !(self instanceof Tok) ) return new Tok( type, input, output, value );
    self.type = type;
    self.input = input;
    self.output = output;
    self.value = value || null;
    self.priority = 1000;
    self.parity = 0;
    self.arity = 0;
    self.arity_min = 0;
    self.arity_max = 0;
    self.associativity = DEFAULT;
    self.fixity = INFIX;
    self.parenthesize = false;
    self.revert = false;
}
Xpresion.Tok = Tok;
Tok.render = function( t, args ) { return (t instanceof Tok) ? t.render(args) : String(t); };
Tok[PROTO] = {
    constructor: Tok
    
    ,type: null
    ,input: null
    ,output: null
    ,value: null
    ,priority: 1000
    ,parity: 0
    ,arity: 0
    ,arity_min: 0
    ,arity_max: 0
    ,associativity: DEFAULT
    ,fixity: INFIX
    ,parenthesize: false
    ,revert: false
    
    ,dispose: function( ) {
        var self = this;
        self.type = null;
        self.input = null;
        self.output = null;
        self.value = null;
        self.priority = null;
        self.parity = null;
        self.arity = null;
        self.arity_min = null;
        self.arity_max = null;
        self.associativity = null;
        self.fixity = null;
        self.parenthesize = null;
        self.revert = null;
        return self;
    }
    ,setType: function( type ) {
        this.type = type;
        return this;
    }
    ,setParenthesize: function( bool ) {
        this.parenthesize = !!bool;
        return this;
    }
    ,setReverse: function( bool ) {
        this.revert = !!bool;
        return this;
    }
    ,render: function( args ) {
        var self = this,
            token = self.output, 
            p = self.parenthesize,
            lparen = p ? Xpresion.LPAREN : '',
            rparen = p ? Xpresion.RPAREN : '',
            out
        ;
        if (!args) args = [];
        args.unshift(self.input);
        if ( token instanceof GrammarTemplate ) out = token.render( args );
        else                                    out = String(token);
        return lparen + out + rparen;
    }
    ,evaluate: function( args ) {
        // todo
        return null;
    }
    ,node: function( args, pos ) {
        return Node(this.type, this.arity, this, !!args ? args : null, pos)
    }
    ,toString: function( ) {
        return String(this.output);
    }
};
EMPTY_TOKEN = Xpresion.EMPTY_TOKEN = Tok(T_EMPTY, '', '');

function Op( input, output, fixity, associativity, priority, /*arity,*/ otype, ofixity )
{
    var self = this;
    if ( !(self instanceof Op) ) 
        return new Op(input, output, fixity, associativity, priority, /*arity,*/ otype, ofixity);
    
    input = input || ''; output = output || '';
    var opdef = Op.parse_definition( input );
    self.type = opdef[0];
    self.opdef = opdef[1];
    self.parts = opdef[2];
    
    if ( output && !(output instanceof GrammarTemplate) ) output = new GrammarTemplate(output);
    
    Tok.call(self, self.type, self.parts[0], output);
    
    self.fixity = null != fixity ? fixity : PREFIX;
    self.associativity = null != associativity ? associativity : DEFAULT;
    self.priority = null != priority ? priority : 1000;
    self.arity = opdef[3];
    self.arity_min = opdef[4];
    self.arity_max = opdef[5];
    //self.arity = arity || 0;
    self.otype = null != otype ? otype : T_DFT;
    self.ofixity = null != ofixity ? ofixity : self.fixity;
    self.parenthesize = false;
    self.revert = false;
    self.morphes = null;
}
Xpresion.Op = Op;
Op.Condition = function( f ) {
    return ['function'===typeof f[0] 
    ? f[0] 
    : Tpl.compile(Tpl.multisplit(f[0],{'${POSITION}':0,'${TOKENS}':1,'${OPERATORS}':2,'${TOKEN}':3,'${OPERATOR}':4,'${OPERATOR_PRECEDING}':5,'${DEDUCED_TYPE}':6,'Xpresion':7}), true),
    f[1]
    ];
};
Op.parse_definition = function( op_def ) {
    var parts = [], op = [], num_args,
        arity = 0, arity_min = 0, arity_max = 0, type, i;
    if ( is_string(op_def) )
    {
        // assume infix, arity = 2;
        op_def = [1,op_def,1];
    }
    else
    {
        op_def = [].concat(op_def);
    }
    for (i=0; i<op_def.length; i++)
    {
        if ( is_string( op_def[i] ) )
        {
            parts.push(op_def[i]);
            op.push([1, i, op_def[i]]);
        }
        else
        {
            op.push([0, i, op_def[i]]);
            num_args = abs(op_def[i]);
            arity += num_args;
            arity_max += num_args;
            arity_min += op_def[i];
        }
    }
    if ( 1 === parts.length && 1 === op.length )
    {
        op = [[0, 0, 1], [1, 1, parts[0]], [0, 2, 1]];
        arity_min = arity_max = arity = 2; type = T_OP;
    }
    else
    {
        type = parts.length > 1 ? T_N_OP : T_OP;
    }
    return [type, op, parts, arity, max(0, arity_min), arity_max];
};
Op.match_args = function( expected_args, args_pos, op_queue, token_queue ) {
    var tl = token_queue.length,
        //ol = op_queue.length,
        t = tl-1, /*o = 0,*/ num_args = 0,
        num_expected_args = abs(expected_args),
        /*p1,*/ p2, INF = -10
    ;
    while (num_args < num_expected_args || t >= 0 /*|| o < ol*/ )
    {
        //p1 = o < ol ? op_queue[o].pos : INF;
        p2 = t >= 0 ? token_queue[t].pos : INF;
        /*if ( args_pos === p1 ) 
        {
            num_args++;
            args_pos--;
            o++;
        }
        else*/ if ( args_pos === p2 ) 
        {
            num_args++;
            args_pos--;
            t--;
        }
        else break;
    }
    return num_args >= num_expected_args ? num_expected_args : (expected_args <= 0 ? 0 : false);
};
Op[PROTO] = Extend( Tok[PROTO] );
Op[PROTO].otype = null;
Op[PROTO].ofixity = null;
Op[PROTO].opdef = null;
Op[PROTO].parts = null;
Op[PROTO].morphes = null;
Op[PROTO].dispose = function( ) {
    var self = this;
    self.otype = null;
    self.ofixity = null;
    self.opdef = null;
    self.parts = null;
    self.morphes = null;
    Tok[PROTO].dispose.call(self);
    return self;
};
Op[PROTO].Polymorphic = function(morphes) {
    var self = this;
    self.type = T_POLY_OP;
    self.morphes = (morphes || [ ]).map( Op.Condition );
    return self;
};
Op[PROTO].morph = function( args ) {
    var morphes = this.morphes, l = morphes.length, i = 0, 
        op, minop = morphes[0][1], found = false;
    
    if (args.length < 8)
    {
        args.push(args[1].length ? args[1][args[1].length-1] : false);
        args.push(args[2].length ? args[2][0] : false);
        args.push(args[4] ? (args[4].pos+1===args[0]) : false);
        args.push(args[4] ? args[4].type : (args[3] ? args[3].type : 0));
        args.push(Xpresion);
    }
    
    while ( i < l )
    {
        op = morphes[i++];
        if ( true === Boolean(op[0]( args )) ) 
        {
            op = op[1];
            found = true;
            break;
        }
        if ( op[1].priority >= minop.priority ) minop = op[1];
    }
    // try to return minimum priority operator, if none matched
    if ( !found ) op = minop;
    // nested polymorphic op, if any
    while ( T_POLY_OP === op.type ) op = op.morph( args );
    return op;
};
Op[PROTO].render = function( args ) {
    if (!args || !args.length) args = ['',''];
    var self = this, i,
        output_type = self.otype,
        op = self.output, 
        p = self.parenthesize,
        lparen = p ? Xpresion.LPAREN : '', 
        rparen = p ? Xpresion.RPAREN : '',
        comma = Xpresion.COMMA,
        out_fixity = self.ofixity, 
        numargs = args.length, out
    ;
    //if ( (T_DUM === output_type) && numargs ) 
    //    output_type = args[ 0 ].type;
    
    //args = args.map( Tok.render );
    
    if ( op instanceof GrammarTemplate )
        out = lparen + op.render( args ) + rparen;
    else if ( INFIX === out_fixity )
        out = lparen + args.join(op) + rparen;
    else if ( POSTFIX === out_fixity )
        out = lparen + args.join(comma) + rparen + op;
    else/* if ( PREFIX === out_fixity )*/
        out = op + lparen + args.join(comma) + rparen;
    return Tok(output_type, out, out);
};
Op[PROTO].validate = function( pos, op_queue, token_queue ) {
    var self = this, opdef = self.opdef, 
        msg = '', num_args = 0;
    if ( 0 === opdef[0][0] ) // expecting argument(s)
    {
        num_args = Op.match_args(opdef[0][2], pos-1, op_queue, token_queue );
        if ( false === num_args )
            msg = 'Operator "' + self.input + '" expecting ' + opdef[0][2] + ' prior argument(s)';
    }
    return [num_args, msg];
};
Op[PROTO].node = function( args, pos ) {
    args = args || [];
    var self = this, otype = self.otype, n;
    if ( self.revert ) args.reverse( );
    if ( (T_DUM === otype) && args.length ) otype = args[ 0 ].type;
    else if ( args.length ) args[0].type = otype;
    n = new Node(otype, self.arity, self, args, pos);
    if ( (T_N_OP === self.type) && (arguments.length > 2) )
    {
        n.op_parts = self.parts.slice(1);
        n.op_def = self.opdef.slice(0 === self.opdef[0][0] ? 2 : 1);
        n.op_index = arguments[2].length+1;
    }
    return n;
};

function Func( input, output, otype, priority, arity, associativity, fixity )
{
    var self = this;
    if ( !(self instanceof Func) ) return new Func(input, output, otype, priority, arity, associativity, fixity);
    Op.call(self, is_string(input) ? [input, null!=arity?arity:1] : input, output, PREFIX, null!=associativity?associativity:RIGHT, null!=priority?priority:1, /*1,*/ otype, null!=fixity?fixity:PREFIX);
    self.type = T_FUN;
}
Xpresion.Func = Func;
Func[PROTO] = Extend( Op[PROTO] );

// Methods
Xpresion[PROTO] = {
    constructor: Xpresion
    
    ,source: null
    ,variables: null
    
    ,RE: null
    ,Reserved: null
    ,BLOCKS: null
    ,OPERATORS: null
    ,FUNCTIONS: null
    ,Fn: null
    
    ,_cnt: 0
    ,_cache: null
    ,_symbol_table: null
    ,_evaluator_str: null
    ,_evaluator: null
    ,dummy_evaluator: null
    
    ,dispose: function( ) {
        var self = this;
        self.RE = null;
        self.Reserved = null;
        self[BLOCKS] = null;
        self[OPS] = null;
        self[FUNCS] = null;
        self.Fn = null;
        self.dummy_evaluator = null;
        
        self.source = null;
        self.variables = null;
        
        self._cnt = null;
        self._symbol_table = null;
        self._cache = null;
        self._evaluator_str = null;
        self._evaluator = null;
        
        return self;
    }
    
    ,setup: function( ) {
        var self = this;
        self.RE = Xpresion.RE;
        self.Reserved = Xpresion.Reserved;
        self[BLOCKS] = Xpresion[BLOCKS];
        self[OPS] = Xpresion[OPS];
        self[FUNCS] = Xpresion[FUNCS];
        self.Fn = Xpresion.Fn;
        self.dummy_evaluator = dummy;
        return self;
    }
    
    ,compile: function( AST ) {
        // depth-first traversal and rendering of Abstract Syntax Tree (AST)
        var evaluator_str = Node.DFT( AST, Xpresion.render, true );
        return [evaluator_str, evaluator_factory(evaluator_str,this.Fn,this._cache)];
    }
    
    ,evaluator: function( evaluator ) {
        if ( arguments.length )
        {
            if ( evaluator && evaluator.call ) this._evaluator = evaluator;
            return this;
        }
        return this._evaluator;
    }
    
    ,evaluate: function( data ) {
        if ( 1 > arguments.length ) data = {};
        return this._evaluator( data );
    }
    
    ,debug: function( data ) {
        var self = this;
        var out = [
            'Expression: ' + self.source,
            'Variables : [' + self.variables.join(',') + ']',
            'Evaluator : ' + self._evaluator_str
        ];
        if ( arguments.length )
        {
            out.push('Data      : ' + toJSON(data, null, 4));
            out.push('Result    : ' + toJSON(self.evaluate(data)));
        }
        return out.join("\n");
    }
    
    ,toString: function( ) {
        return '[Xpresion source]: ' + this.source + '';
    }
    
    ,t_liter: function( token, type ) { 
        if ( T_NUM === type ) return Tok(T_NUM, token, token); 
        return Alias.get_entry(this.Reserved, token.toLowerCase( ));
    }
    
    ,t_block: function( token, type, postfix ) { 
        if ( T_STR === type )
        {
            return Tok(T_STR, token, token); 
        }
        else if ( T_REX === type )
        {
            postfix = postfix || '';
            var sid = 're_'+token+postfix, id, rs;
            if ( this._symbol_table[HAS](sid) ) 
            {
                id = this._symbol_table[sid];
            }
            else
            {
                id = 're_' + (++this._cnt);
                rs = token.slice(1,-1);//.replace(/\\/g, '\\\\')
                this._cache[ id ] = RE(rs, postfix);
                this._symbol_table[sid] = id;
            }
            return Tok(T_REX, token, 'Cache.'+id+'');
        }
        /*else if ( T_DTM === type )
        {
            rest = (rest || '').slice(1,-1);
            var sid = 'dt_'+token+rest, id, rs;
            if ( this._symbol_table[HAS](sid) ) 
            {
                id = this._symbol_table[sid];
            }
            else
            {
                id = 'dt_' + (++this._cnt);
                rs = token.slice(1,-1);
                this._cache[ id ] = DATE(rs, rest);
                this._symbol_table[sid] = id;
            }
            return Tok(T_DTM, token, 'Cache.'+id+'');
        }*/
        return false;
    }
    
    ,t_var: function( token ) {
        if ( !this.variables[HAS]( token ) ) this.variables[ token ] = token;
        return Tok(T_VAR, token, 'Var["' + token.split('.').join('"]["') + '"]');
    }
    
    ,t_op: function( token ) { 
        var op = false;
        op = Alias.get_entry(this[FUNCS], token);
        if ( false === op ) op = Alias.get_entry(this[OPS], token);
        return op;
    }
    
    ,t_tok: function( token ) { return Tok(T_DFT, token, token); }
};

Xpresion.init = function( andConfigure ) {
if ( __inited ) return;
Xpresion[OPS] = {};
Xpresion[FUNCS] = {};
Xpresion.Fn = {};
Xpresion.RE = {};
Xpresion[BLOCKS] = {};
Xpresion.Reserved = {};
Xpresion.defRuntimeFunc({
 'INF'          : Infinity
,'NAN'          : NaN
,'clamp'        : function( v, m, M ) { 
                    if ( m > M ) return v > m ? m : (v < M ? M : v); 
                    else return v > M ? M : (v < m ? m : v); 
                }
,'len'          : function( v ) { 
                    if ( v )
                    {
                        if ( v.substr || v.push ) return v.length;
                        if ( Object === v.constructor ) return Keys(v).length;
                        return 1;
                    }
                    return 0;
                }
,'sum'          : function( ) {
                    var args = arguments, i, l, s = 0;
                    if (args[0] && Array === args[0].constructor ) args = args[0];
                    l = args.length;
                    if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; }
                    return s;
                }
,'avg'          : function( ) {
                    var args = arguments, i, l, s = 0;
                    if (args[0] && Array === args[0].constructor ) args = args[0];
                    l = args.length;
                    if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; s = s/l;}
                    return s;
                }
,'range'        : range
,'ary_range'    : range
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
                    return [ ].concat( a1, a2 );
                }
,'match'        : function( str, regex ) {
                    return regex.test( str );
                }
,'contains'     : function( o, i ) {
                    return o.substr||o.pop ? -1 < o.indexOf( i ) : o[HAS]( i );
                }
,'time'         : time
,'date'         : date
});
__inited = true;
if ( true === andConfigure ) Xpresion.defaultConfiguration( );
};

Xpresion.defaultConfiguration = function( ) {
if ( __configured ) return;

Xpresion.defOp({
// e.g https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
            // bra-kets as n-ary operators
 '('    :   { input         : '(<$.0|>)',
              output        : '<$.0|()>',
              fixity        : Xpresion.POSTFIX,
              associativity : Xpresion.RIGHT,
              priority      : 0,
              otype         : Xpresion.T_DUM }
,')'    :   { input         : '<$.0|>)' }
,'['    :   Op().Polymorphic([
            // array range
            ["${TOKEN} && !${OPERATOR_PRECEDING}", Op(
            [1,'[',1,':',1,':',-1,']'] ,INFIX ,RIGHT   ,100       ,'Fn.range($0,$1|(0),$2|(undefined),$3|(1))' ,T_ARY 
            )]
            // literal array
            ,["!${TOKEN} || ${OPERATOR_PRECEDING}", Op(
            ['[',-1,']']     ,POSTFIX    ,RIGHT          ,2          ,'[$0|()]'     ,T_ARY 
            )]
            ])
,']'    :   { input         : '<$.0|>\\]' }
,','    :   { input         : '<$.0>,<$.1>',
              output        : '<$.0>,<$.1>',
              fixity        : Xpresion.INFIX,
              associativity : Xpresion.LEFT,
              priority      : 3,
              otype         : Xpresion.T_DFT }
            // n-ary (ternary) if-then-else operator
,'?'    :   { input         : '<$.0>?<$.1>:<$.2>',
              output        : '(<$.0>?<$.1>:<$.2>)',
              fixity        : Xpresion.INFIX,
              associativity : Xpresion.RIGHT,
              priority      : 100,
              otype         : Xpresion.T_BOL } 
,':'    :   { input         : '<$.0|>:<$.1|>',
              output        : '<$.0|>:<$.1|>' }

,'!'    :   { input         : '!<$.0>',
              output        : '!<$.0>',
              fixity        : Xpresion.PREFIX,
              associativity : Xpresion.RIGHT,
              priority      : 10,
              otype         : Xpresion.T_BOL }
,'~'    :   { input         : '~<$.0>',
              output        : '~<$.0>',
              fixity        : Xpresion.PREFIX,
              associativity : Xpresion.RIGHT,
              priority      : 10,
              otype         : Xpresion.T_NUM }
,'^'    :   { input         : '<$.0>^<$.1>',
              output        : 'Math.pow(<$.0>,<$.1>)',
              fixity        : Xpresion.INFIX,
              associativity : Xpresion.RIGHT,
              priority      : 11,
              otype         : Xpresion.T_NUM }
,'*'    :   { input         : '<$.0>*<$.1>',
              output        : '(<$.0>*<$.1>)',
              fixity        : Xpresion.INFIX,
              associativity : Xpresion.LEFT,
              priority      : 20,
              otype         : Xpresion.T_NUM } 
,'/'    :   { input         : '<$.0>/<$.1>',
              output        : '(<$.0>/<$.1>)',
              fixity        : Xpresion.INFIX,
              associativity : Xpresion.LEFT,
              priority      : 20,
              otype         : Xpresion.T_NUM }
,'%'    :   Op(
            [1,'%',1]       ,INFIX      ,LEFT           ,20         ,'($0%$1)'  ,T_NUM 
            )
            // addition/concatenation/unary plus as polymorphic operators
,'+'    :   Op().Polymorphic([
            // array concatenation
            ["${TOKEN} && !${OPERATOR_PRECEDING} && ${DEDUCED_TYPE}===Xpresion.T_ARY", Op(
            [1,'+',1]       ,INFIX      ,LEFT           ,25         ,'Fn.ary_merge($0,$1)'  ,T_ARY 
            )]
            // string concatenation
            ,["${TOKEN} && !${OPERATOR_PRECEDING} && ${DEDUCED_TYPE}===Xpresion.T_STR", Op(
            [1,'+',1]       ,INFIX      ,LEFT           ,25         ,'($0+String($1))'  ,T_STR 
            )]
            // numeric addition
            ,["${TOKEN} && !${OPERATOR_PRECEDING}", Op(
            [1,'+',1]       ,INFIX      ,LEFT           ,25         ,'($0+$1)'  ,T_NUM 
            )]
            // unary plus
            ,["!${TOKEN} || ${OPERATOR_PRECEDING}", Op(
            ['+',1]         ,PREFIX     ,RIGHT          ,4          ,'$0'       ,T_NUM 
            )]
            ])
,'-'    :   Op().Polymorphic([
            // numeric subtraction
            ["${TOKEN} && !${OPERATOR_PRECEDING}", Op(
            [1,'-',1]       ,INFIX      ,LEFT           ,25         ,'($0-$1)'  ,T_NUM 
            )]
            // unary negation
            ,["!${TOKEN} || ${OPERATOR_PRECEDING}", Op(
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
 'min'      : {input:'min'    ,output:'Math.min($0)'     ,otype:T_NUM  }
,'max'      : {input:'max'    ,output:'Math.max($0)'     ,otype:T_NUM  }
,'pow'      : {input:'pow'    ,output:'Math.pow($0)'     ,otype:T_NUM  }
,'sqrt'     : {input:'sqrt'   ,output:'Math.sqrt($0)'    ,otype:T_NUM  }
,'len'      : {input:'len'    ,output:'Fn.len($0)'       ,otype:T_NUM  }
,'int'      : {input:'int'    ,output:'parseInt($0)'     ,otype:T_NUM  }
,'str'      : {input:'str'    ,output:'String($0)'       ,otype:T_STR  }
,'clamp'    : {input:'clamp'  ,output:'Fn.clamp($0)'     ,otype:T_NUM  }
,'sum'      : {input:'sum'    ,output:'Fn.sum($0)'       ,otype:T_NUM  }
,'avg'      : {input:'avg'    ,output:'Fn.avg($0)'       ,otype:T_NUM  }
,'time'     : {input:'time'   ,output:'Fn.time()'        ,otype:T_NUM          ,priority:1                      ,arity:0  }
,'date'     : {input:'date'   ,output:'Fn.date($0)'      ,otype:T_STR  }
/*---------------------------------------
                aliases
 ----------------------------------------*/
 // ...
});

Xpresion.defRE({
/*-----------------------------------------------
token                re
-------------------------------------------------*/
 't_spc'        :  /^((\s+))/
,'t_nonspc'     :  /^((\S+))/
,'t_special'    :  /^(([*.\-+\\\/\^\$\(\)\[\]|?<:>&~%!#@=_,;{}]+))/
,'t_num'        :  /^((\d+(\.\d+)?))/
,'t_ident'      :  /^(([a-zA-Z_][a-zA-Z0-9_]*))\b/
,'t_var'        :  /^(\$([a-zA-Z0-9_][a-zA-Z0-9_.]*))\b/
});

Xpresion.defBlock({
 '\''       : {
            block: ['\'', '\''],
            escaped: true,
            type: T_STR,
            postfix: false
            }
,'"'        : {
            block: ['"', '"'],
            escaped: true,
            type: T_STR, 
            postfix: false
            }
,'`'        : {
            block: ['`', '`'],
            escaped: true,
            type: T_REX, 
            postfix: /^i/
            }
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

__configured = true;
};

// init it
Xpresion.init( );
// export it
return Xpresion;
});
