/**
*
*   Xpresion
*   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node.js and Browser
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
}(  /* current root */          'undefined' !== typeof self ? self : this,
    /* module name */           "Xpresion",
    /* module factory */        function ModuleFactory__Xpresion( undef ){
"use strict";

var __version__ = "1.0.0",
    PROTO = 'prototype', hasOwnProperty = Object[PROTO].hasOwnProperty, toString = Object[PROTO].toString,
    toJSON = JSON.stringify, Keys = Object.keys, Extend = Object.create,
    floor = Math.floor, round = Math.round, abs = Math.abs, max = Math.max,
    NEWLINE = /\n\r|\r\n|\n|\r/g, SQUOTE = /'/g,
    EMPTY_TOKEN,
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
        : function( s ){ return s.replace(trim_re, ''); },
    __inited = false, __configured = false, TPL_ID = 0
;

// https://github.com/foo123/GrammarTemplate
function HAS( o, x )
{
    return o && hasOwnProperty.call(o, x) ? 1 : 0;
}
function pad( s, n, z, pad_right )
{
    var ps = String(s);
    z = z || '0';
    if ( pad_right ) while ( ps.length < n ) ps += z;
    else while ( ps.length < n ) ps = z + ps;
    return ps;
}
function guid( )
{
    guid.GUID += 1;
    return pad(new Date().getTime().toString(16),12)+'--'+pad(guid.GUID.toString(16),4);
}
guid.GUID = 0;
function is_array( x )
{
    return (x instanceof Array) || ('[object Array]' === toString.call(x));
}
/*function is_string( x )
{
    return (x instanceof String) || ('[object String]' === toString.call(x));
}*/
function compute_alignment( s, i, l )
{
    var alignment = '', c;
    while ( i < l )
    {
        c = s[CHAR](i);
        if ( (" " === c) || ("\r" === c) || ("\t" === c) || ("\v" === c) || ("\0" === c) )
        {
            alignment += c;
            i += 1;
        }
        else
        {
            break;
        }
    }
    return alignment;
}
function align( s, alignment )
{
    var aligned, c, i, l = s.length;
    if ( l && alignment.length )
    {
        aligned = '';
        for(i=0; i<l; i++)
        {
            c = s[CHAR](i);
            aligned += c;
            if ( "\n" === c ) aligned += alignment;
        }
    }
    else
    {
        aligned = s;
    }
    return aligned;
}
function walk( obj, keys, keys_alt, obj_alt )
{
    var o, l, i, k, found = 0;
    if ( keys )
    {
        o = obj;
        l = keys.length;
        i = 0;
        found = 1;
        while( i < l )
        {
            k = keys[i++];
            if ( (null != o) && (null != o[k]) )
            {
                o = o[k];
            }
            else
            {
                found = 0;
                break;
            }
        }
    }
    if ( !found && keys_alt )
    {
        o = obj;
        l = keys_alt.length;
        i = 0;
        found = 1;
        while( i < l )
        {
            k = keys_alt[i++];
            if ( (null != o) && (null != o[k]) )
            {
                o = o[k];
            }
            else
            {
                found = 0;
                break;
            }
        }
    }
    if ( !found && (null != obj_alt) && (obj_alt !== obj) )
    {
        if ( keys )
        {
            o = obj_alt;
            l = keys.length;
            i = 0;
            found = 1;
            while( i < l )
            {
                k = keys[i++];
                if ( (null != o) && (null != o[k]) )
                {
                    o = o[k];
                }
                else
                {
                    found = 0;
                    break;
                }
            }
        }
        if ( !found && keys_alt )
        {
            o = obj_alt;
            l = keys_alt.length;
            i = 0;
            found = 1;
            while( i < l )
            {
                k = keys_alt[i++];
                if ( (null != o) && (null != o[k]) )
                {
                    o = o[k];
                }
                else
                {
                    found = 0;
                    break;
                }
            }
        }
    }
    return found ? o : null;
}
function StackEntry( stack, value )
{
    this.prev = stack || null;
    this.value = value || null;
}
function TplEntry( node, tpl )
{
    if ( tpl ) tpl.next = this;
    this.node = node || null;
    this.prev = tpl || null;
    this.next = null;
}

function multisplit( tpl, delims, postop )
{
    var IDL = delims[0], IDR = delims[1],
        OBL = delims[2], OBR = delims[3],
        lenIDL = IDL.length, lenIDR = IDR.length,
        lenOBL = OBL.length, lenOBR = OBR.length,
        ESC = '\\', OPT = '?', OPTR = '*', NEG = '!', DEF = '|', COMMENT = '#',
        TPL = ':=', REPL = '{', REPR = '}', DOT = '.', REF = ':', ALGN = '@', //NOTALGN = '&',
        COMMENT_CLOSE = COMMENT+OBR,
        default_value = null, negative = 0, optional = 0,
        nested, aligned = 0, localised = 0, start_i, end_i, template,
        argument, p, stack, c, a, b, s, l = tpl.length, i, j, jl,
        subtpl, arg_tpl, cur_tpl, start_tpl, cur_arg, opt_args,
        roottpl, block, cur_block, prev_arg, prev_opt_args,
        delim1 = [IDL, lenIDL, IDR, lenIDR], delim2 = [OBL, lenOBL, OBR, lenOBR],
        delim_order = [null,0,null,0,null,0,null,0], delim;

    postop = true === postop;
    a = new TplEntry({type: 0, val: '', algn: ''});
    cur_arg = {
        type    : 1,
        name    : null,
        key     : null,
        stpl    : null,
        dval    : null,
        opt     : 0,
        neg     : 0,
        algn    : 0,
        loc     : 0,
        start   : 0,
        end     : 0
    };
    roottpl = a; block = null;
    opt_args = null; subtpl = {}; cur_tpl = null; arg_tpl = {}; start_tpl = null;

    // hard-coded merge-sort for arbitrary delims parsing based on str len
    if ( delim1[1] < delim1[3] )
    {
        s = delim1[0]; delim1[2] = delim1[0]; delim1[0] = s;
        i = delim1[1]; delim1[3] = delim1[1]; delim1[1] = i;
    }
    if ( delim2[1] < delim2[3] )
    {
        s = delim2[0]; delim2[2] = delim2[0]; delim2[0] = s;
        i = delim2[1]; delim2[3] = delim2[1]; delim2[1] = i;
    }
    start_i = 0; end_i = 0; i = 0;
    while ( (4 > start_i) && (4 > end_i) )
    {
        if ( delim1[start_i+1] < delim2[end_i+1] )
        {
            delim_order[i] = delim2[end_i];
            delim_order[i+1] = delim2[end_i+1];
            end_i += 2;
        }
        else
        {
            delim_order[i] = delim1[start_i];
            delim_order[i+1] = delim1[start_i+1];
            start_i += 2;
        }
        i += 2;
    }
    while ( 4 > start_i )
    {
        delim_order[i] = delim1[start_i];
        delim_order[i+1] = delim1[start_i+1];
        start_i += 2; i += 2;
    }
    while ( 4 > end_i )
    {
        delim_order[i] = delim2[end_i];
        delim_order[i+1] = delim2[end_i+1];
        end_i += 2; i += 2;
    }

    stack = null; s = '';

    i = 0;
    while( i < l )
    {
        c = tpl[CHAR](i);
        if ( ESC === c )
        {
            s += i+1 < l ? tpl[CHAR](i+1) : '';
            i += 2;
            continue;
        }

        delim = null;
        if ( delim_order[0] === tpl.substr(i,delim_order[1]) )
            delim = delim_order[0];
        else if ( delim_order[2] === tpl.substr(i,delim_order[3]) )
            delim = delim_order[2];
        else if ( delim_order[4] === tpl.substr(i,delim_order[5]) )
            delim = delim_order[4];
        else if ( delim_order[6] === tpl.substr(i,delim_order[7]) )
            delim = delim_order[6];

        if ( IDL === delim )
        {
            i += lenIDL;

            if ( s.length )
            {
                if ( 0 === a.node.type ) a.node.val += s;
                else a = new TplEntry({type: 0, val: s, algn: ''}, a);
            }
            s = '';
        }
        else if ( IDR === delim )
        {
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
            if ( postop )
            {
                c = i < l ? tpl[CHAR](i) : '';
            }
            else
            {
                c = argument[CHAR](0);
            }
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
                if ( postop )
                {
                    i += 1;
                    if ( (i < l) && (NEG === tpl[CHAR](i)) )
                    {
                        negative = 1;
                        i += 1;
                    }
                    else
                    {
                        negative = 0;
                    }
                }
                else
                {
                    if ( NEG === argument[CHAR](1) )
                    {
                        negative = 1;
                        argument = argument.slice(2);
                    }
                    else
                    {
                        negative = 0;
                        argument = argument.slice(1);
                    }
                }
            }
            else if ( REPL === c )
            {
                if ( postop )
                {
                    s = ''; j = i+1; jl = l;
                    while ( (j < jl) && (REPR !== tpl[CHAR](j)) ) s += tpl[CHAR](j++);
                    i = j+1;
                }
                else
                {
                    s = ''; j = 1; jl = argument.length;
                    while ( (j < jl) && (REPR !== argument[CHAR](j)) ) s += argument[CHAR](j++);
                    argument = argument.slice( j+1 );
                }
                s = s.split(',');
                if ( s.length > 1 )
                {
                    start_i = trim(s[0]);
                    start_i = start_i.length ? (+start_i)|0 /*parseInt(start_i,10)||0*/ : 0;
                    end_i = trim(s[1]);
                    end_i = end_i.length ? (+end_i)|0 /*parseInt(end_i,10)||0*/ : -1;
                    optional = 1;
                }
                else
                {
                    start_i = trim(s[0]);
                    start_i = start_i.length ? (+start_i)|0 /*parseInt(start_i,10)||0*/ : 0;
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

            c = argument[CHAR](0);
            if ( ALGN === c )
            {
                aligned = 1;
                argument = argument.slice(1);
            }
            else
            {
                aligned = 0;
            }

            c = argument[CHAR](0);
            if ( DOT === c )
            {
                localised = 1;
                argument = argument.slice(1);
            }
            else
            {
                localised = 0;
            }

            template = -1 < argument.indexOf(REF) ? argument.split(REF) : [argument,null];
            argument = template[0]; template = template[1];
            nested = -1 < argument.indexOf(DOT) ? argument.split(DOT) : null;

            if ( cur_tpl && !HAS(arg_tpl,cur_tpl) ) arg_tpl[cur_tpl] = {};

            if ( TPL+OBL === tpl.substr(i,2+lenOBL) )
            {
                // template definition
                i += 2;
                template = template&&template.length ? template : 'grtpl--'+guid( );
                start_tpl = template;
                if ( cur_tpl && argument.length)
                    arg_tpl[cur_tpl][argument] = template;
            }

            if ( !argument.length ) continue; // template definition only

            if ( (null==template) && cur_tpl && HAS(arg_tpl,cur_tpl) && HAS(arg_tpl[cur_tpl],argument) )
                template = arg_tpl[cur_tpl][argument];

            if ( optional && !cur_arg.opt )
            {
                cur_arg.name = argument;
                cur_arg.key = nested;
                cur_arg.stpl = template;
                cur_arg.dval = default_value;
                cur_arg.opt = optional;
                cur_arg.neg = negative;
                cur_arg.algn = aligned;
                cur_arg.loc = localised;
                cur_arg.start = start_i;
                cur_arg.end = end_i;
                // handle multiple optional arguments for same optional block
                opt_args = new StackEntry(null, [argument,nested,negative,start_i,end_i,optional,localised]);
            }
            else if ( optional )
            {
                // handle multiple optional arguments for same optional block
                if ( (start_i !== end_i) && (cur_arg.start === cur_arg.end) )
                {
                    // set as main arg a loop arg, if exists
                    cur_arg.name = argument;
                    cur_arg.key = nested;
                    cur_arg.stpl = template;
                    cur_arg.dval = default_value;
                    cur_arg.opt = optional;
                    cur_arg.neg = negative;
                    cur_arg.algn = aligned;
                    cur_arg.loc = localised;
                    cur_arg.start = start_i;
                    cur_arg.end = end_i;
                }
                opt_args = new StackEntry(opt_args, [argument,nested,negative,start_i,end_i,optional,localised]);
            }
            else if ( !optional && (null === cur_arg.name) )
            {
                cur_arg.name = argument;
                cur_arg.key = nested;
                cur_arg.stpl = template;
                cur_arg.dval = default_value;
                cur_arg.opt = 0;
                cur_arg.neg = negative;
                cur_arg.algn = aligned;
                cur_arg.loc = localised;
                cur_arg.start = start_i;
                cur_arg.end = end_i;
                // handle multiple optional arguments for same optional block
                opt_args = new StackEntry(null, [argument,nested,negative,start_i,end_i,0,localised]);
            }
            if ( 0 === a.node.type ) a.node.algn = compute_alignment(a.node.val, 0, a.node.val.length);
            a = new TplEntry({
                type    : 1,
                name    : argument,
                key     : nested,
                stpl    : template,
                dval    : default_value,
                opt     : optional,
                algn    : aligned,
                loc     : localised,
                start   : start_i,
                end     : end_i
            }, a);
        }
        else if ( OBL === delim )
        {
            i += lenOBL;

            if ( s.length )
            {
                if ( 0 === a.node.type ) a.node.val += s;
                else a = new TplEntry({type: 0, val: s, algn: ''}, a);
            }
            s = '';

            // comment
            if ( COMMENT === tpl[CHAR](i) )
            {
                j = i+1; jl = l;
                while ( (j < jl) && (COMMENT_CLOSE !== tpl.substr(j,lenOBR+1)) ) s += tpl[CHAR](j++);
                i = j+lenOBR+1;
                if ( 0 === a.node.type ) a.node.algn = compute_alignment(a.node.val, 0, a.node.val.length);
                a = new TplEntry({type: -100, val: s}, a);
                s = '';
                continue;
            }

            // optional block
            stack = new StackEntry(stack, [a, block, cur_arg, opt_args, cur_tpl, start_tpl]);
            if ( start_tpl ) cur_tpl = start_tpl;
            start_tpl = null;
            cur_arg = {
                type    : 1,
                name    : null,
                key     : null,
                stpl    : null,
                dval    : null,
                opt     : 0,
                neg     : 0,
                algn    : 0,
                loc     : 0,
                start   : 0,
                end     : 0
            };
            opt_args = null;
            a = new TplEntry({type: 0, val: '', algn: ''});
            block = a;
        }
        else if ( OBR === delim )
        {
            i += lenOBR;

            b = a;
            cur_block = block;
            prev_arg = cur_arg;
            prev_opt_args = opt_args;
            if ( stack )
            {
                a = stack.value[0];
                block = stack.value[1];
                cur_arg = stack.value[2];
                opt_args = stack.value[3];
                cur_tpl = stack.value[4];
                start_tpl = stack.value[5];
                stack = stack.prev;
            }
            else
            {
                a = null;
            }
            if ( s.length )
            {
                if ( 0 === b.node.type ) b.node.val += s;
                else b = new TplEntry({type: 0, val: s, algn: ''}, b);
            }
            s = '';
            if ( start_tpl )
            {
                subtpl[start_tpl] = new TplEntry({
                    type    : 2,
                    name    : prev_arg.name,
                    key     : prev_arg.key,
                    loc     : prev_arg.loc,
                    algn    : prev_arg.algn,
                    start   : prev_arg.start,
                    end     : prev_arg.end,
                    opt_args: null/*opt_args*/,
                    tpl     : cur_block
                });
                start_tpl = null;
            }
            else
            {
                if ( 0 === a.node.type ) a.node.algn = compute_alignment(a.node.val, 0, a.node.val.length);
                a = new TplEntry({
                    type    : -1,
                    name    : prev_arg.name,
                    key     : prev_arg.key,
                    loc     : prev_arg.loc,
                    algn    : prev_arg.algn,
                    start   : prev_arg.start,
                    end     : prev_arg.end,
                    opt_args: prev_opt_args,
                    tpl     : cur_block
                }, a);
            }
        }
        else
        {
            c = tpl[CHAR](i++);
            if ( "\n" === c )
            {
                // note line changes to handle alignments
                if ( s.length )
                {
                    if ( 0 === a.node.type ) a.node.val += s;
                    else a = new TplEntry({type: 0, val: s, algn: ''}, a);
                }
                s = '';
                if ( 0 === a.node.type ) a.node.algn = compute_alignment(a.node.val, 0, a.node.val.length);
                a = new TplEntry({type: 100, val: "\n"}, a);
            }
            else
            {
                s += c;
            }
        }
    }
    if ( s.length )
    {
        if ( 0 === a.node.type ) a.node.val += s;
        else a = new TplEntry({type: 0, val: s, algn: ''}, a);
    }
    if ( 0 === a.node.type ) a.node.algn = compute_alignment(a.node.val, 0, a.node.val.length);
    return [roottpl, subtpl];
}

function optional_block( args, block, SUB, FN, index, alignment, orig_args )
{
    var opt_vars, opt_v, opt_arg, arr, rs, re, ri, len, block_arg = null, out = '';

    if ( -1 === block.type )
    {
        // optional block, check if optional variables can be rendered
        opt_vars = block.opt_args;
        // if no optional arguments, render block by default
        if ( opt_vars && opt_vars.value[5] )
        {
            while( opt_vars )
            {
                opt_v = opt_vars.value;
                opt_arg = walk( args, opt_v[1], [String(opt_v[0])], opt_v[6] ? null : orig_args );
                if ( (null === block_arg) && (block.name === opt_v[0]) ) block_arg = opt_arg;

                if ( (0 === opt_v[2] && null == opt_arg) ||
                    (1 === opt_v[2] && null != opt_arg)
                )
                    return '';
                opt_vars = opt_vars.prev;
            }
        }
    }
    else
    {
        block_arg = walk( args, block.key, [String(block.name)], block.loc ? null : orig_args );
    }

    arr = is_array( block_arg ); len = arr ? block_arg.length : -1;
    //if ( !block.algn ) alignment = '';
    if ( arr && (len > block.start) )
    {
        for(rs=block.start,re=(-1===block.end?len-1:Math.min(block.end,len-1)),ri=rs; ri<=re; ri++)
            out += main( args, block.tpl, SUB, FN, ri, alignment, orig_args );
    }
    else if ( !arr && (block.start === block.end) )
    {
        out = main( args, block.tpl, SUB, FN, null, alignment, orig_args );
    }
    return out;
}
function non_terminal( args, symbol, SUB, FN, index, alignment, orig_args )
{
    var opt_arg, tpl_args, tpl, out = '', fn;
    if ( symbol.stpl && (
        HAS(SUB,symbol.stpl) ||
        HAS(GrammarTemplate.subGlobal,symbol.stpl) ||
        HAS(FN,symbol.stpl) || HAS(FN,'*') ||
        HAS(GrammarTemplate.fnGlobal,symbol.stpl) ||
        HAS(GrammarTemplate.fnGlobal,'*')
    ) )
    {
        // using custom function or sub-template
        opt_arg = walk( args, symbol.key, [String(symbol.name)], symbol.loc ? null : orig_args );

        if ( HAS(SUB,symbol.stpl) || HAS(GrammarTemplate.subGlobal,symbol.stpl) )
        {
            // sub-template
            if ( (null != index) && ((0 !== index) || (symbol.start !== symbol.end) || !symbol.opt) && is_array(opt_arg) )
            {
                opt_arg = index < opt_arg.length ? opt_arg[ index ] : null;
            }

            if ( (null == opt_arg) && (null !== symbol.dval) )
            {
                // default value if missing
                out = symbol.dval;
            }
            else
            {
                // try to associate sub-template parameters to actual input arguments
                tpl = HAS(SUB,symbol.stpl) ? SUB[symbol.stpl].node : GrammarTemplate.subGlobal[symbol.stpl].node;
                tpl_args = {};
                if ( null != opt_arg )
                {
                    /*if ( HAS(opt_arg,tpl.name) && !HAS(opt_arg,symbol.name) ) tpl_args = opt_arg;
                    else tpl_args[tpl.name] = opt_arg;*/
                    if ( is_array(opt_arg) ) tpl_args[tpl.name] = opt_arg;
                    else tpl_args = opt_arg;
                }
                out = optional_block( tpl_args, tpl, SUB, FN, null, symbol.algn ? alignment : '', null == orig_args ? args : orig_args );
                //if ( symbol.algn ) out = align(out, alignment);
            }
        }
        else //if ( fn )
        {
            // custom function
            fn = null;
            if      ( HAS(FN,symbol.stpl) )                         fn = FN[symbol.stpl];
            else if ( HAS(FN,'*') )                                 fn = FN['*'];
            else if ( HAS(GrammarTemplate.fnGlobal,symbol.stpl) )   fn = GrammarTemplate.fnGlobal[symbol.stpl];
            else if ( GrammarTemplate.fnGlobal['*'] )               fn = GrammarTemplate.fnGlobal['*'];

            if ( is_array(opt_arg) )
            {
                index = null != index ? index : symbol.start;
                opt_arg = index < opt_arg.length ? opt_arg[ index ] : null;
            }

            if ( "function" === typeof fn )
            {
                var fn_arg = {
                    //value               : opt_arg,
                    symbol              : symbol,
                    index               : index,
                    currentArguments    : args,
                    originalArguments   : orig_args,
                    alignment           : alignment
                };
                opt_arg = fn( opt_arg, fn_arg );
            }
            else
            {
                opt_arg = String(fn);
            }

            out = (null == opt_arg) && (null !== symbol.dval) ? symbol.dval : String(opt_arg);
            if ( symbol.algn ) out = align(out, alignment);
        }
    }
    else if ( symbol.opt && (null !== symbol.dval) )
    {
        // boolean optional argument
        out = symbol.dval;
    }
    else
    {
        // plain symbol argument
        opt_arg = walk( args, symbol.key, [String(symbol.name)], symbol.loc ? null : orig_args );

        // default value if missing
        if ( is_array(opt_arg) )
        {
            index = null != index ? index : symbol.start;
            opt_arg = index < opt_arg.length ? opt_arg[ index ] : null;
        }
        out = (null == opt_arg) && (null !== symbol.dval) ? symbol.dval : String(opt_arg);
        if ( symbol.algn ) out = align(out, alignment);
    }
    return out;
}
function main( args, tpl, SUB, FN, index, alignment, orig_args )
{
    alignment = alignment || '';
    var tt, current_alignment = alignment, out = '';
    while ( tpl )
    {
        tt = tpl.node.type;
        if ( -1 === tt ) /* optional code-block */
        {
            out += optional_block( args, tpl.node, SUB, FN, index, tpl.node.algn ? current_alignment : alignment, orig_args );
        }
        else if ( 1 === tt ) /* non-terminal */
        {
            out += non_terminal( args, tpl.node, SUB, FN, index, tpl.node.algn ? current_alignment : alignment, orig_args );
        }
        else if ( 0 === tt ) /* terminal */
        {
            current_alignment += tpl.node.algn;
            out += tpl.node.val;
        }
        else if ( 100 === tt ) /* new line */
        {
            current_alignment = alignment;
            out += "\n" + alignment;
        }
        /*else if ( -100 === tt ) /* comment * /
        {
            /* pass * /
        }*/
        tpl = tpl.next;
    }
    return out;
}


function GrammarTemplate( tpl, delims, postop )
{
    var self = this;
    if ( !(self instanceof GrammarTemplate) ) return new GrammarTemplate(tpl, delims, postop);
    self.id = null;
    self.tpl = null;
    self.fn = {};
    // lazy init
    self._args = [tpl||'', delims||GrammarTemplate.defaultDelimiters, postop||false];
};
GrammarTemplate.VERSION = '3.0.0';
GrammarTemplate.defaultDelimiters = ['<','>','[',']'];
GrammarTemplate.fnGlobal = {};
GrammarTemplate.subGlobal = {};
GrammarTemplate.guid = guid;
GrammarTemplate.multisplit = multisplit;
GrammarTemplate.align = align;
GrammarTemplate.main = main;
GrammarTemplate[PROTO] = {
    constructor: GrammarTemplate

    ,id: null
    ,tpl: null
    ,fn: null
    ,_args: null

    ,dispose: function( ) {
        var self = this;
        self.id = null;
        self.tpl = null;
        self.fn = null;
        self._args = null;
        return self;
    }
    ,parse: function( ) {
        var self = this;
        if ( (null === self.tpl) && (null !== self._args) )
        {
            // lazy init
            self.tpl = GrammarTemplate.multisplit( self._args[0], self._args[1], self._args[2] );
            self._args = null;
        }
        return self;
    }
    ,render: function( args ) {
        var self = this;
        // lazy init
        if ( null === self.tpl ) self.parse( );
        return GrammarTemplate.main( null==args ? {} : args, self.tpl[0], self.tpl[1], self.fn );
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
function is_object( v )
{
    return /*(v instanceof Object) ||*/ ('[object Object]' === toString.call(v));
}
function starts_with( s, p, i )
{
    i = i || 0;
    return s.length-i >= p.length && p === s.substr(i, p.length);
}
function pad_( s, len, ch )
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
    if ( !arguments.length ) return '';
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
    D.d = pad_(D.j, 2, '0');
    // Shorthand day name; Mon...Sun
    D.D = locale.day_short[ D.w ];
    // Full day name; Monday...Sunday
    D.l = locale.day[ D.w ];
    // Ordinal suffix for day of month; st, nd, rd, th
    D.S = locale.ordinal.ord[ D.j ] ? locale.ordinal.ord[ D.j ] : (locale.ordinal.ord[ jmod10 ] ? locale.ordinal.ord[ jmod10 ] : locale.ordinal.nth);
    // Day of year; 0..365
    D.z = round((new Date(D.Y, m, D.j) - new Date(D.Y, 0, 1)) / 864e5);
    // ISO-8601 week number
    D.W = pad_(1 + round((new Date(D.Y, m, D.j - D.N + 3) - new Date(D.Y, 0, 4)) / 864e5 / 7), 2, '0');
    // Full month name; January...December
    D.F = locale.month[ m ];
    // Month w/leading 0; 01...12
    D.m = pad_(D.n, 2, '0');
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
    D.B = pad_(floor((jsdate.getUTCHours( ) * 36e2 + jsdate.getUTCMinutes( ) * 60 + jsdate.getUTCSeconds( ) + 36e2) / 86.4) % 1e3, 3, '0');
    // 12-Hours; 1..12
    D.g = (D.G % 12) || 12;
    // 12-Hours w/leading 0; 01..12
    D.h = pad_(D.g, 2, '0');
    // 24-Hours w/leading 0; 00..23
    D.H = pad_(D.G, 2, '0');
    // Minutes w/leading 0; 00..59
    D.i = pad_(jsdate.getMinutes( ), 2, '0');
    // Seconds w/leading 0; 00..59
    D.s = pad_(jsdate.getSeconds( ), 2, '0');
    // Microseconds; 000000-999000
    D.u = pad_(jsdate.getMilliseconds( ) * 1000, 6, '0');
    // Timezone identifier; e.g. Atlantic/Azores, ...
    // The following works, but requires inclusion of the very large
    // timezone_abbreviations_list() function.
    /*              return that.date_default_timezone_get();
    */
    D.e = '';
    // DST observed?; 0 or 1
    D.I = ((new Date(D.Y, 0) - Date.UTC(D.Y, 0)) !== (new Date(D.Y, 6) - Date.UTC(D.Y, 6))) ? 1 : 0;
    // Difference to GMT in hour format; e.g. +0200
    D.O = (tzo > 0 ? "-" : "+") + pad_(floor(atzo / 60) * 100 + atzo % 60, 4, '0');
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
        formatted_datetime += hasOwnProperty.call(D,f) ? D[ f ] : f;
    }
    return formatted_datetime;
}
function dummy( /*Var, Fn, Cache*/ )
{
    return null;
}
function evaluator_factory(evaluator_str,Fn,Cache)
{
    var evaluator = F('Fn,Cache,Xpresion', [
     'return function evaluator(Var){'
    ,'    "use strict";'
    ,'    return ' + evaluator_str + ';'
    ,'};'
    ].join("\n"))(Fn,Cache,Xpresion);
    return evaluator;
}

function parse_re_flags(s,i,l)
{
    var flags = '',
        has_i = false,
        has_g = false,
        has_m = false,
        seq = 0,
        i2 = i+seq,
        not_done = true,
        ch
    ;
    while (i2 < l && not_done)
    {
        ch = s.charAt(i2++);
        seq += 1;
        if ('i' == ch && !has_i)
        {
            flags += 'i';
            has_i = true;
        }

        if ('m' == ch && !has_m)
        {
            flags += 'm';
            has_m = true;
        }

        if ('g' == ch && !has_g)
        {
            flags += 'g';
            has_g = true;
        }

        if (seq >= 3 || (!has_i && !has_g && !has_m))
        {
            not_done = false;
        }
    }
    return flags;
}

function Configuration( conf )
{
    var self = this;

    if ( !(self instanceof Configuration) )
        return new Configuration(conf);

    self.RE = {};
    self.BLOCKS = {};
    self.RESERVED = {};
    self.OPERATORS = {};
    self.FUNCTIONS = {};
    self.FN = {
         'INF'          : Infinity
        ,'NAN'          : NaN
    };

    if ( "object" === typeof conf )
    {
        if ( conf.re )
            self.defRE( conf.re );
        if ( conf.blocks )
            self.defBlock( conf.blocks );
        if ( conf.reserved )
            self.defReserved( conf.reserved );
        if ( conf.operators )
            self.defOp( conf.operators );
        if ( conf.functions )
            self.defFunc( conf.functions );
        if ( conf.runtime )
            self.defRuntimeFunc( conf.runtime );
    }
}
Configuration[PROTO] = {
    constructor: Configuration,

    RE: null,
    BLOCKS: null,
    RESERVED: null,
    OPERATORS: null,
    FUNCTIONS: null,
    FN: null,

    dispose: function( ) {
        var self = this;

        self.RE = null;
        self.BLOCKS = null;
        self.RESERVED = null;
        self.OPERATORS = null;
        self.FUNCTIONS = null;
        self.FN = null;

        return self;
    },

    defRE: function( obj ) {
        if ( 'object' === typeof obj )
        {
            for (var k in obj)
            {
                if ( hasOwnProperty.call(obj,k) )
                    this.RE[ k ] = obj[ k ];
            }
        }
        return this;
    },
    defBlock: function( obj ) {
        if ( 'object' === typeof obj )
        {
            for (var k in obj)
            {
                if ( hasOwnProperty.call(obj,k) )
                    this.BLOCKS[ k ] = obj[ k ];
            }
        }
        return this;
    },
    defReserved: function( obj ) {
        if ( 'object' === typeof obj )
        {
            for (var k in obj)
            {
                if ( hasOwnProperty.call(obj,k) )
                    this.RESERVED[ k ] = obj[ k ];
            }
        }
        return this;
    },
    defOp: function( obj ) {
        if ( 'object' === typeof obj )
        {
            var k, op;
            for (k in obj)
            {
                if ( !hasOwnProperty.call(obj,k) || !obj[ k ] ) continue;

                op = obj[ k ];

                if ( op instanceof Alias || op instanceof Op )
                {
                    this.OPERATORS[ k ] = op;
                    continue;
                }

                if ( op.polymorphic )
                {
                    this.OPERATORS[ k ] = Op().Polymorphic(op.polymorphic.map(function(entry){
                        var func, op;
                        if ( is_object(entry) )
                        {
                            func = entry['check'];
                            op = entry['op'];
                        }
                        else
                        {
                            func = entry[0];
                            op = entry[1];
                        }
                        op = op instanceof Op ? op : new Op(
                            op.input,
                            op.output,
                            op.otype,
                            op.fixity,
                            op.associativity,
                            op.priority,
                            op.ofixity
                        );
                        return [func, op];
                    }));
                }
                else
                {
                    this.OPERATORS[ k ] = new Op(
                        op.input,
                        op.output,
                        op.otype,
                        op.fixity,
                        op.associativity,
                        op.priority,
                        op.ofixity
                    );
                }
            }
        }
        return this;
    },
    defFunc: function( obj ) {
        if ( 'object' === typeof obj )
        {
            var k, op;
            for (k in obj)
            {
                if ( !hasOwnProperty.call(obj,k) || !obj[ k ] ) continue;

                op = obj[ k ];

                if ( op instanceof Alias || op instanceof Func )
                {
                    this.FUNCTIONS[ k ] = op;
                    continue;
                }

                this.FUNCTIONS[ k ] = new Func(
                    op.input,
                    op.output,
                    op.otype,
                    op.priority,
                    op.arity,
                    op.associativity,
                    op.ofixity
                );
            }
        }
        return this;
    },
    defRuntimeFunc: function( obj ) {
        if ( 'object' === typeof obj )
        {
            for (var k in obj)
            {
                if ( hasOwnProperty.call(obj,k) )
                    this.FN[ k ] = obj[ k ];
            }
        }
        return this;
    }
};

function Xpresion( expr, conf )
{
    var self = this;
    if ( !(self instanceof Xpresion) ) return new Xpresion( expr, conf );
    if ( (!conf) || !(conf instanceof Configuration) )
        conf = Xpresion.defaultConfiguration();
    self.source = String(null==expr ? '' : expr);
    self.dummy_evaluator = dummy;
    Xpresion.parse( self, conf );
}
Xpresion.VERSION = __version__;

Xpresion.Configuration = Configuration;

Xpresion.CONF = null;
Xpresion.defaultConfiguration = function(conf) {
    if ( arguments.length )
    {
        Xpresion.CONF = conf;
    }
    return Xpresion.CONF;
};

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
,T_MIX       = Xpresion.T_MIX      =   1
,T_DFT       = Xpresion.T_DFT      =   T_MIX
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

Xpresion.Tpl = GrammarTemplate;

function Alias( alias )
{
    if ( !(this instanceof Alias) ) return new Alias(alias);
    this.alias = alias;
}
Xpresion.Alias = Alias;
Alias.get_entry = function( entries, id ) {
    if ( id && entries && hasOwnProperty.call(entries,id) )
    {
        // walk/bypass aliases, if any
        var entry = entries[ id ];
        while ( (entry instanceof Alias) && hasOwnProperty.call(entries,entry.alias) )
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
    ,toString: function( ) {
        var out = [], n = this.node,
            ch = this.children ? this.children : [],
            i, l = ch.length,
            tab = /*arguments.length && arguments[0].substr ? arguments[0] :*/ "",
            tab_tab = tab+"  "
        ;
        for (i=0; i<l; i++) out.push(ch[i].toString(/*tab_tab*/));
        return tab + [
        "Node("+n.type+","+n.arity+"): " + (n.parts ? n.parts.join(' ') : n.input),
        "Childs: [",
        tab + out.join("\n" + tab),
        "]"
        ].join("\n"+tab) + "\n";
    }
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
                arity = opc.arity;
                if ( arity > token_queue.length && opc.arity_min <= token_queue.length ) arity = opc.arity_min;
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

Xpresion.parse_delimited_block = function parse_delimited_block(s, i, l, delim, is_escaped) {
    if ( 5 > arguments.length ) is_escaped = true;
    var p = delim, esc = false, ch = '';
    is_escaped = (false !== is_escaped);
    i += 1;
    while (i < l)
    {
        ch = s.charAt(i++);
        p += ch;
        if (delim === ch && !esc) break;
        esc = is_escaped ? (!esc && ('\\' === ch)) : false;
    }
    return p;
};

Xpresion.parse = function( xpr, conf ) {
    var expr, l

        ,e, ch, v, i
        ,m, t, AST, OPS, NOPS, t_index

        ,reduce = Xpresion.reduce
        ,get_entry = Alias.get_entry

        ,block
        ,t_var_is_also_ident = !hasOwnProperty.call(conf.RE,'t_var')
        ,evaluator, block_rest
        ,err = 0, errpos, errmsg, errors = {err: false, msg: ''}
    ;

    expr = String(xpr.source);
    l = expr.length; i = 0;
    xpr._cnt = 0;
    xpr._symbol_table = { };
    xpr._cache = { };
    xpr.variables = { };
    AST = [ ]; OPS = [ ]; NOPS = [ ];
    t_index = 0;
    err = 0;
    while ( i < l )
    {
        ch = expr.charAt( i );

        // use customized (escaped) delimited blocks here
        // TODO: add a "date" block as well with #..#
        if ( block = get_entry(conf.BLOCKS, ch) ) // string or regex or date ('"`#)
        {
            v = block.parse(expr, i, l, ch);
            if ( false !== v )
            {
                i += v.length;
                if ('function' === typeof block.rest)
                {
                    block_rest = block.rest(expr, i, l);
                    if (!block_rest) block_rest = '';
                }
                else
                {
                    block_rest = '';
                }

                i += block_rest.length;

                t = xpr.t_block( conf, v, block.type, block_rest );
                if ( false !== t )
                {
                    t_index += 1;
                    AST.push( t.node(null, t_index) );
                    continue;
                }
            }
        }

        e = expr.slice( i );

        if ( m = e.match( conf.RE.t_spc ) ) // space
        {
            i += m[ 0 ].length;
            continue;
        }

        if ( m = e.match( conf.RE.t_num ) ) // number
        {
            t = xpr.t_liter( conf, m[ 1 ], T_NUM );
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                i += m[ 0 ].length;
                continue;
            }
        }

        if ( m = e.match( conf.RE.t_ident ) ) // ident, reserved, function, operator, etc..
        {
            t = xpr.t_liter( conf, m[ 1 ], T_IDE ); // reserved keyword
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                i += m[ 0 ].length;
                continue;
            }
            t = xpr.t_op( conf, m[ 1 ] ); // (literal) operator
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
                i += m[ 0 ].length;
                continue;
            }
            if ( t_var_is_also_ident )
            {
                t = xpr.t_var( conf, m[ 1 ] ); // variables are also same identifiers
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    i += m[ 0 ].length;
                    continue;
                }
            }
        }

        if ( m = e.match( conf.RE.t_special ) ) // special symbols..
        {
            v = m[ 1 ]; t = false;
            while ( v.length > 0 ) // try to match maximum length op/func
            {
                t = xpr.t_op( conf, v ); // function, (non-literal) operator
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
                i += v.length;
                continue;
            }
        }

        if ( !t_var_is_also_ident && (m = e.match( conf.RE.t_var )) ) // variables
        {
            t = xpr.t_var( conf, m[ 1 ] );
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                i += m[ 0 ].length;
                continue;
            }
        }

        if ( m = e.match( conf.RE.t_nonspc ) ) // other non-space tokens/symbols..
        {
            t = xpr.t_liter( conf, m[ 1 ], T_LIT ); // reserved keyword
            if ( false !== t )
            {
                t_index+=1;
                AST.push( t.node(null, t_index) );
                i += m[ 0 ].length;
                continue;
            }
            t = xpr.t_op( conf, m[ 1 ] ); // function, other (non-literal) operator
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
                i += m[ 0 ].length;
                continue;
            }
            t = xpr.t_tok( conf, m[ 1 ] );
            t_index+=1;
            AST.push( t.node(null, t_index) ); // pass-through ..
            i += m[ 0 ].length;
            //continue;
        }
    }

    if ( !err )
    {
        reduce( AST, OPS, NOPS );

        if ( (1 !== AST.length) || (OPS.length > 0) )
        {
            err = 1;
            errmsg = 'Parse Error, Mismatched Parentheses or Operators';
        }
    }

    if ( !err )
    {
        try {

            evaluator = xpr.compile( AST[0], conf );

        } catch( e ) {

            err = 1;
            errmsg = 'Compilation Error, ' + e.toString() + '';
        }
    }

    NOPS = null;
    OPS = null;
    AST = null;
    xpr._symbol_table = null;

    if ( err )
    {
        evaluator = null;
        xpr.variables = [ ];
        xpr._cnt = 0;
        xpr._cache = { };
        xpr.evaluatorString = '';
        xpr.evaluator = xpr.dummy_evaluator;
        throw new Error( 'Xpresion Error: ' + errmsg + ' at "' + expr + '"');
    }
    else
    {
        // make array
        xpr.variables = Keys( xpr.variables );
        xpr.evaluatorString = evaluator[0];
        xpr.evaluator = evaluator[1];
    }

    return xpr;
};

Xpresion.render = function( tok, args ) {
    return tok.render( args );
    //return Tok.render(tok, args);
};

Xpresion.GET = function( obj, keys ) {
    if ( !keys || !keys.length ) return obj;
    var i = 0, l = keys.length, o = obj, k;
    while( i < l )
    {
        k = keys[i++];
        if ( !o )
        {
            break;
        }
        if ( null != o[k] )
        {
            o = o[k];
        }
        else
        {
            break;
        }
    }
    return i===l ? o : null;
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
Tok.render = function( t, args ) { return (t instanceof Tok) ? t.render(args||[]) : String(t); };
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
        if ( token instanceof GrammarTemplate ) out = token.render( {'$':args} );
        else                                    out = String(token);
        return lparen + out + rparen;
    }
    ,node: function( args, pos ) {
        return Node(this.type, this.arity, this, !!args ? args : null, pos||0)
    }
    ,toString: function( ) {
        return String(this.output);
    }
};
EMPTY_TOKEN = Xpresion.EMPTY_TOKEN = Tok(T_EMPTY, '', '');

function Op( input, output, otype, fixity, associativity, priority, /*arity,*/ ofixity )
{
    var self = this;
    if ( !(self instanceof Op) )
        return new Op(input, output, otype, fixity, associativity, priority, /*arity,*/ ofixity);

    input = null==input ? '' : input;
    output = null==output ? '' : output;
    var opdef = Op.parse_definition( input );
    self.type = opdef[0];
    self.opdef = opdef[1];
    self.parts = opdef[2];

    if ( !(output instanceof GrammarTemplate) ) output = new GrammarTemplate(String(output));

    Tok.call(self, self.type, self.parts[0], output);

    self.fixity = null != fixity ? fixity : PREFIX;
    self.associativity = null != associativity ? associativity : DEFAULT;
    self.priority = null != priority ? priority : 1000;
    self.arity = opdef[3];
    self.arity_min = opdef[4];
    self.arity_max = opdef[5];
    //self.arity = arity || 0;
    self.otype = null != otype ? otype : T_MIX;
    self.ofixity = null != ofixity ? ofixity : self.fixity;
    self.parenthesize = false;
    self.revert = false;
    self.morphes = null;
}
Xpresion.Op = Op;
Op.Condition = function( f ) {
    if ( is_string(f[0]) )
    {
        try {
            f[0] = F('curr,Xpresion', 'return '+f[0]+';');
        } catch(ex) {
            f[0] = null;
        }
    }
    return [
        'function'===typeof f[0] ? f[0] : null,
        f[1]
    ];
};
Op.parse_definition = function( op_def ) {
    var parts = [], op = [], num_args,
        arity = 0, arity_min = 0, arity_max = 0, type, i, l;
    if ( is_string(op_def) )
    {
        // assume infix, arity = 2;
        op_def = [1,op_def,1];
    }
    else
    {
        op_def = [].concat(op_def);
    }
    for (i=0,l=op_def.length; i<l; i++)
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
        t = tl-1, num_args = 0,
        num_expected_args = abs(expected_args),
        p2, INF = -10
    ;
    while (num_args < num_expected_args || t >= 0 /*|| o < ol*/ )
    {
        p2 = t >= 0 ? token_queue[t].pos : INF;
        if ( args_pos === p2 )
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
        op, minop = morphes[0][1], found = false, matched, nargs;

    // [pos,token_queue,op_queue]
    if (args.length < 7)
    {
        args.push(args[1].length ? args[1][args[1].length-1] : false);
        args.push(args[2].length ? args[2][0] : false);
        args.push(args[4] ? (args[4].pos+1===args[0]) : false);
        args.push(args[4] ? args[4].type : (args[3] ? args[3].type : 0));
        //args.push(Xpresion);
    }
    // array('${POS}'=>0,'${TOKS}'=>1,'${OPS}'=>2,'${TOK}'=>3,'${OP}'=>4,'${PREV_IS_OP}'=>5,'${DEDUCED_TYPE}'=>6)
    nargs = {
        POS: args[0],
        TOKS: args[1],
        OPS: args[2],
        TOK: args[3],
        OP: args[4],
        PREV_IS_OP: args[5],
        DEDUCED_TYPE: args[6]
    };

    while ( i < l )
    {
        op = morphes[i++];
        matched = Boolean(op[0]( nargs, Xpresion ));
        if ( true === matched )
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
        out = lparen + op.render( {'$':args} ) + rparen;
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
Op[PROTO].node = function( args, pos, op_queue, token_queue ) {
    args = args || [];
    pos = pos || 0;
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

function Func( input, output, otype, priority, arity, associativity, ofixity )
{
    var self = this;
    if ( !(self instanceof Func) ) return new Func(input, output, otype, priority, arity, associativity, ofixity);
    input = null==input ? '' : input;
    output = null==output ? '' : output;
    Op.call(self,
        is_string(input) ? [input, null!=arity ? arity : 1] : input,
        output,
        null!=otype ? otype : T_MIX,
        PREFIX,
        null!=associativity ? associativity : RIGHT,
        null!=priority ? priority : 1,
        null!=ofixity ? ofixity : PREFIX
    );
    self.type = T_FUN;
}
Xpresion.Func = Func;
Func[PROTO] = Extend( Op[PROTO] );

// Methods
Xpresion[PROTO] = {
    constructor: Xpresion

    ,source: null
    ,variables: null
    ,evaluatorString: null
    ,evaluator: null

    ,_cnt: 0
    ,_cache: null
    ,_symbol_table: null
    ,dummy_evaluator: null

    ,dispose: function( ) {
        var self = this;
        self.dummy_evaluator = null;

        self.source = null;
        self.variables = null;
        self.evaluatorString = null;
        self.evaluator = null;

        self._cnt = null;
        self._symbol_table = null;
        self._cache = null;

        return self;
    }

    ,compile: function( AST, conf ) {
        // depth-first traversal and rendering of Abstract Syntax Tree (AST)
        var evaluator_str = Node.DFT( AST, Xpresion.render, true );
        return [evaluator_str, evaluator_factory(evaluator_str,conf.FN,this._cache)];
    }

    ,evaluate: function( data ) {
        if ( 1 > arguments.length ) data = {};
        return 'function' === typeof this.evaluator ? this.evaluator( data ) : null;
    }

    ,debug: function( data ) {
        var self = this;
        var out = [
            'Expression: ' + self.source,
            'Variables : [' + self.variables.join(',') + ']',
            'Evaluator : ' + self.evaluatorString
        ];
        if ( arguments.length )
        {
            out.push('Data      : ' + toJSON(data, null, 4));
            out.push('Result    : ' + toJSON(self.evaluate(data)));
        }
        return out.join("\n");
    }

    ,toString: function( ) {
        return '[Xpresion source]: ' + String(this.source) + '';
    }

    ,t_liter: function( conf, token, type ) {
        if ( T_NUM === type ) return Tok(T_NUM, token, token);
        return Alias.get_entry(conf.RESERVED, token.toLowerCase( ));
    }

    ,t_block: function( conf, token, type, rest ) {
        rest = rest || '';
        if ( T_STR === type )
        {
            return Tok(T_STR, token, token);
        }
        else if ( T_REX === type )
        {
            var sid = 're_'+token+rest, id, rs;
            if ( hasOwnProperty.call(this._symbol_table,sid) )
            {
                id = this._symbol_table[sid];
            }
            else
            {
                id = 're_' + (++this._cnt);
                rs = token.slice(1,-1);//.replace(/\\/g, '\\\\')
                this._cache[ id ] = RE(rs, rest);
                this._symbol_table[sid] = id;
            }
            return Tok(T_REX, token, 'Cache.'+id+'');
        }
        return false;
    }

    ,t_var: function( conf, token ) {
        var parts = token.split('.'), main = parts[0], keys;
        if ( !hasOwnProperty.call(this.variables, main ) ) this.variables[ main ] = main;
        if ( 1 < parts.length )
        {
            keys = '["' + parts.slice(1).join('","') + '"]';
            return Tok(T_VAR, main, 'Xpresion.GET(Var["' + main + '"],'+keys+')');
        }
        else
        {
            return Tok(T_VAR, main, 'Var["' + main + '"]');
        }
        //return Tok(T_VAR, token, 'Var["' + token.split('.').join('"]["') + '"]');
    }

    ,t_op: function( conf, token ) {
        var op = false;
        op = Alias.get_entry(conf.FUNCTIONS, token);
        if ( false === op ) op = Alias.get_entry(conf.OPERATORS, token);
        return op;
    }

    ,t_tok: function( conf, token ) { return Tok(T_MIX, token, token); }
};

Xpresion.init = function( ) {
    if ( __inited ) return;

    __inited = true;

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
                    ,'priority'     : 3
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
    ,'str'      : {
                    'input'     : 'str'
                    ,'output'   : 'String(<$.0>)'
                    ,'otype'    : T_STR
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
};

// init it
Xpresion.init( );

// export it
return Xpresion;
});
