/**
*
*   Xpresion
*   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node/JS, ActionScript
*   @version: 0.6.1
*
*   https://github.com/foo123/Xpresion
*
**/
!function( root, name, factory ) {
    "use strict";
    
    //
    // export the module, umd-style (no other dependencies)
    var isCommonJS = ("object" === typeof(module)) && module.exports, 
        isAMD = ("function" === typeof(define)) && define.amd, m;
    
    // CommonJS, node, etc..
    if ( isCommonJS ) 
        module.exports = (module.$deps = module.$deps || {})[ name ] = module.$deps[ name ] || (factory.call( root, {NODE:module} ) || 1);
    
    // AMD, requireJS, etc..
    else if ( isAMD && ("function" === typeof(require)) && ("function" === typeof(require.specified)) && require.specified(name) ) 
        define( name, ['require', 'exports', 'module'], function( require, exports, module ){ return factory.call( root, {AMD:module} ); } );
    
    // browser, web worker, etc.. + AMD, other loaders
    else if ( !(name in root) ) 
        (root[ name ] = (m=factory.call( root, {} ) || 1)) && isAMD && define( name, [], function( ){ return m; } );


}(  /* current root */          this, 
    /* module name */           "Xpresion",
    /* module factory */        function( exports, undef ) {
    
    "use strict";
    
    var __version__ = "0.6.1",
    
        PROTO = 'prototype', HAS = 'hasOwnProperty', toString = Object[PROTO].toString,
        toJSON = JSON.stringify, Keys = Object.keys, Extend = Object.create, 
        Abs = Math.abs, Max = Math.max,
        
        F = function( a, f ){ return new Function( a, f ); },
        RE = function( r, f ){ return new RegExp( r, f||'' ); },
        //DATE = function( d, f ){ return new Date( d ); },
        
        NEWLINE = /\n\r|\r\n|\n|\r/g, SQUOTE = /'/g,
        
        dummy = function( /*Var, Fn, Cache*/ ){ return null; },
        
        evaluator_factory = function(evaluator_str,Fn,Cache) {
            var evaluator = F('Fn,Cache', [
            'return function evaluator(Var){',
            '    "use strict";', 
            '    return ' + evaluator_str + ';',
            '};'
            ].join("\n"))(Fn,Cache);
            return evaluator;
        },
        
        is_string = function( v ) {
            return (v instanceof String) || ('[object String]' === toString.call(v));
        },
        
        // pad_()
        pad_ = function( str, len, chr, leftJustify ) {
            chr = chr || ' ';
            var str1 = str.toString(), strlen = str1.length,
                padding = (strlen >= len) ? '' : new Array(1 + len - strlen >>> 0).join(chr);
            return leftJustify ? str + padding : padding + str;
        },
        
        formatChr = /\\?([a-z])/gi,
            
        date_formater = {
        // Day
        d: function( jsdate, locale ) { // Day of month w/leading 0; 01..31
            return pad_(jsdate.getDate(), 2, '0');
        },
        D: function( jsdate, locale ) { // Shorthand day name; Mon...Sun
            return locale.days_abr[ jsdate.getDay() ];
        },
        j: function( jsdate, locale ) { // Day of month; 1..31
            return jsdate.getDate();
        },
        l: function( jsdate, locale ) { // Full day name; Monday...Sunday
            return locale.days[ jsdate.getDay() ];
        },
        N: function( jsdate, locale ) { // ISO-8601 day of week; 1[Mon]..7[Sun]
            return jsdate.getDay() || 7;
        },
        S: function( jsdate, locale ) { // Ordinal suffix for day of month; st, nd, rd, th
            var j = jsdate.getDate();
            return j < 4 || j > 20 && (locale.ordinal[j % 10 - 1] || locale.ordinal[3]);
        },
        w: function( jsdate, locale ) { // Day of week; 0[Sun]..6[Sat]
            return jsdate.getDay();
        },
        z: function( jsdate, locale ) { // Day of year; 0..365
            var a = new Date(date_formater.Y(jsdate, locale), jsdate.getMonth(), jsdate.getDate()),
            b = new Date(date_formater.Y(jsdate, locale), 0, 1);
            return round((a - b) / 864e5);
        },

        // Week
        W: function( jsdate, locale ) { // ISO-8601 week number
            var a = new Date(date_formater.Y(jsdate, locale), jsdate.getMonth(), jsdate.getDate() - date_formater.N(jsdate, locale) + 3),
            b = new Date(a.getFullYear(), 0, 4);
            return pad_(1 + round((a - b) / 864e5 / 7), 2, '0');
        },

        // Month
        F: function( jsdate, locale ) { // Full month name; January...December
            return locale.months[/*6 +*/ jsdate.getMonth()];
        },
        m: function( jsdate, locale ) { // Month w/leading 0; 01...12
            return pad_(jsdate.getMonth()+1, 2, '0');
        },
        M: function( jsdate, locale ) { // Shorthand month name; Jan...Dec
            return locale.months_abr[/*6 +*/ jsdate.getMonth()];
        },
        n: function( jsdate, locale ) { // Month; 1...12
            return jsdate.getMonth() + 1;
        },
        t: function( jsdate, locale ) { // Days in month; 28...31
            return (new Date(date_formater.Y(jsdate, locale), jsdate.getMonth()+1, 0)).getDate();
        },

        // Year
        L: function( jsdate, locale ) { // Is leap year?; 0 or 1
            var j = date_formater.Y(jsdate, locale);
            return j % 4 === 0 & j % 100 !== 0 | j % 400 === 0;
        },
        o: function( jsdate, locale ) { // ISO-8601 year
            var n = jsdate.getMonth()+1,
            W = date_formater.W(jsdate, locale),
            Y = date_formater.Y(jsdate, locale);
            return Y + (n === 12 && W < 9 ? 1 : n === 1 && W > 9 ? -1 : 0);
        },
        Y: function( jsdate, locale ) { // Full year; e.g. 1980...2010
            return jsdate.getFullYear();
        },
        y: function( jsdate, locale ) { // Last two digits of year; 00...99
            return date_formater.Y(jsdate, locale).toString().slice(-2);
        },

        // Time
        a: function( jsdate, locale ) { // am or pm
            return jsdate.getHours() > 11 ? locale.meridian.pm : locale.meridian.am;
        },
        A: function( jsdate, locale ) { // AM or PM
            return date_formater.a(jsdate, locale).toUpperCase();
        },
        B: function( jsdate, locale ) { // Swatch Internet time; 000..999
            var H = jsdate.getUTCHours() * 36e2,
            // Hours
            i = jsdate.getUTCMinutes() * 60,
            // Minutes
            s = jsdate.getUTCSeconds(); // Seconds
            return pad_(floor((H + i + s + 36e2) / 86.4) % 1e3, 3, '0');
        },
        g: function( jsdate, locale ) { // 12-Hours; 1..12
            return date_formater.G(jsdate, locale) % 12 || 12;
        },
        G: function( jsdate, locale ) { // 24-Hours; 0..23
            return jsdate.getHours();
        },
        h: function( jsdate, locale ) { // 12-Hours w/leading 0; 01..12
            return pad_(date_formater.g(jsdate, locale), 2, '0');
        },
        H: function( jsdate, locale ) { // 24-Hours w/leading 0; 00..23
            return pad_(date_formater.G(jsdate, locale), 2, '0');
        },
        i: function( jsdate, locale ) { // Minutes w/leading 0; 00..59
            return pad_(jsdate.getMinutes(), 2, '0');
        },
        s: function( jsdate, locale ) { // Seconds w/leading 0; 00..59
            return pad_(jsdate.getSeconds(), 2, '0');
        },
        u: function( jsdate, locale ) { // Microseconds; 000000-999000
            return pad_(jsdate.getMilliseconds() * 1000, 6, '0');
        },

        // Timezone
        e: function( jsdate, locale ) { // Timezone identifier; e.g. Atlantic/Azores, ...
            // The following works, but requires inclusion of the very large
            // timezone_abbreviations_list() function.
            /*              return that.date_default_timezone_get();
            */
            throw 'Not supported (see source code of date() for timezone on how to add support)';
        },
        I: function( jsdate, locale ) { // DST observed?; 0 or 1
            // Compares Jan 1 minus Jan 1 UTC to Jul 1 minus Jul 1 UTC.
            // If they are not equal, then DST is observed.
            var a = new Date(date_formater.Y(jsdate, locale), 0),
            // Jan 1
            c = Date.UTC(date_formater.Y(jsdate, locale), 0),
            // Jan 1 UTC
            b = new Date(date_formater.Y(jsdate, locale), 6),
            // Jul 1
            d = Date.UTC(date_formater.Y(jsdate, locale), 6); // Jul 1 UTC
            return ((a - c) !== (b - d)) ? 1 : 0;
        },
        O: function( jsdate, locale ) { // Difference to GMT in hour format; e.g. +0200
            var tzo = jsdate.getTimezoneOffset(),
            a = abs(tzo);
            return (tzo > 0 ? "-" : "+") + pad_(floor(a / 60) * 100 + a % 60, 4, '0');
        },
        P: function( jsdate, locale ) { // Difference to GMT w/colon; e.g. +02:00
            var O = date_formater.O(jsdate, locale);
            return (O.substr(0, 3) + ":" + O.substr(3, 2));
        },
        T: function( jsdate, locale ) { // Timezone abbreviation; e.g. EST, MDT, ...
            return 'UTC';
        },
        Z: function( jsdate, locale ) { // Timezone offset in seconds (-43200...50400)
            return -jsdate.getTimezoneOffset() * 60;
        },

        // Full Date/Time
        c: function( jsdate, locale, formatChrCb ) { // ISO-8601 date.
            return 'Y-m-d\\TH:i:sP'.replace(formatChr, formatChrCb);
        },
        r: function( jsdate, locale, formatChrCb ) { // RFC 2822
            return 'D, d M Y H:i:s O'.replace(formatChr, formatChrCb);
        },
        U: function( jsdate, locale ) { // Seconds since UNIX epoch
            return jsdate / 1000 | 0;
        }
        },
        
        locale_date = {
            days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
            days_abbr: ["Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat"], 
            months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
            months_abbr: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
            meridian: {
                'pm': 'pm', 
                'am': 'am' 
            },
            ordinal: [
                '1st', 
                '2nd', 
                '3rd', 
                'nth'
            ]
        },
        
        //date_words = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December", "Sun", "Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
        
        getFormatChrCb = function( date_formater, locale, jsdate ) {
            return function formatChrCb(t, s) {return date_formater[HAS](t)?date_formater[t]( jsdate, locale, formatChrCb ):s;};
        },
        
        time = function( ) { return Math.floor(new Date().getTime() / 1000); },
        
        date = function( format, /*locale,*/ timestamp ) {
            var jsdate = (timestamp === undefined ? new Date() : // Not provided
                (timestamp instanceof Date) ? new Date(timestamp) : // JS Date()
                new Date(timestamp * 1000) // UNIX timestamp (auto-convert to int)
            );
            return format.replace( formatChr, getFormatChrCb( date_formater, locale_date, jsdate ) );
        },
        
        Tpl, Node, Alias, Tok, Op, Func, Xpresion, EMPTY_TOKEN,
        BLOCKS = 'BLOCKS', OPS = 'OPERATORS', FUNCS = 'FUNCTIONS',
        __inited = false, __configured = false
    ;
    
    /*function trace( stack )
    {
        var out = [], i, l=stack.length;
        for (i=0; i<l; i++) out.push(stack[i].toString());
        return out.join(",\n");
    }*/
    
    Xpresion = function Xpresion( expr ) {
        var self = this;
        if ( !(self instanceof Xpresion) ) return new Xpresion( expr );
        self.source = expr || '';
        self.setup( );
        Xpresion.parse( self );
    };
    
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
    
    Xpresion.Tpl = Tpl = function Tpl( tpl, replacements, compiled ) {
        var self = this;
        if ( !(self instanceof Tpl) ) return new Tpl(tpl, replacements, compiled);
        self.id = null;
        self._renderer = null;
        self.tpl = replacements instanceof RegExp 
            ? Tpl.multisplit_re(tpl||'', replacements) 
            : Tpl.multisplit( tpl||'', replacements||Tpl.defaultArgs );
        if ( true === compiled ) self._renderer = Tpl.compile( self.tpl );
        self.fixRenderer( );
    };
    Tpl.defaultArgs = {'$-5':-5,'$-4':-4,'$-3':-3,'$-2':-2,'$-1':-1,'$0':0,'$1':1,'$2':2,'$3':3,'$4':4,'$5':5};
    Tpl.multisplit = function multisplit( tpl, reps, as_array ) {
        var r, sr, s, i, j, a, b, c, al, bl;
        as_array = !!as_array;
        a = [ [1, tpl] ];
        for ( r in reps )
        {
            if ( reps.hasOwnProperty( r ) )
            {
                c = [ ]; sr = as_array ? reps[ r ] : r; s = [0, reps[ r ]];
                for (i=0,al=a.length; i<al; i++)
                {
                    if ( 1 === a[ i ][ 0 ] )
                    {
                        b = a[ i ][ 1 ].split( sr ); bl = b.length;
                        c.push( [1, b[0]] );
                        if ( bl > 1 )
                        {
                            for (j=0; j<bl-1; j++)
                            {
                                c.push( s );
                                c.push( [1, b[j+1]] );
                            }
                        }
                    }
                    else
                    {
                        c.push( a[ i ] );
                    }
                }
                a = c;
            }
        }
        return a;
    };
    Tpl.multisplit_re = function multisplit_re( tpl, re ) {
        var a = [ ], i = 0, m;
        while ( m = re.exec( tpl ) )
        {
            a.push([1, tpl.slice(i, re.lastIndex - m[0].length)]);
            a.push([0, m[1] ? m[1] : m[0]]);
            i = re.lastIndex;
        }
        a.push([1, tpl.slice(i)]);
        return a;
    };
    Tpl.arg = function( key, argslen ) { 
        var i, k, kn, kl, givenArgsLen, out = 'args';
        
        if ( arguments.length && null != key )
        {
            if ( key.substr ) 
                key = key.length ? key.split('.') : [];
            else 
                key = [key];
            kl = key.length;
            givenArgsLen = !!(argslen && argslen.substr);
            
            for (i=0; i<kl; i++)
            {
                k = key[ i ]; kn = +k;
                if ( !isNaN(kn) ) 
                {
                    if ( kn < 0 ) k = givenArgsLen ? (argslen+(-kn)) : (out+'.length-'+(-kn));
                    out += '[' + k + ']';
                }
                else
                {
                    out += '["' + k + '"]';
                }
            }
        }
        return out; 
    };
    Tpl.compile = function( tpl, raw ) {
        var l = tpl.length, 
            i, notIsSub, s, out;
        
        if ( true === raw )
        {
            out = '"use strict"; return (';
            for (i=0; i<l; i++)
            {
                notIsSub = tpl[ i ][ 0 ]; s = tpl[ i ][ 1 ];
                out += notIsSub ? s : Tpl.arg(s);
            }
            out += ');';
        }
        else
        {
            out = '"use strict"; var argslen=args.length; return (';
            for (i=0; i<l; i++)
            {
                notIsSub = tpl[ i ][ 0 ]; s = tpl[ i ][ 1 ];
                if ( notIsSub ) out += "'" + s.replace(SQUOTE, "\\'").replace(NEWLINE, "' + \"\\n\" + '") + "'";
                else out += " + String(" + Tpl.arg(s,"argslen") + ") + ";
            }
            out += ');';
        }
        return F('args', out);
    };
    Tpl[PROTO] = {
        constructor: Tpl
        
        ,id: null
        ,tpl: null
        ,_renderer: null
        
        ,dispose: function( ) {
            this.id = null;
            this.tpl = null;
            this._renderer = null;
            return this;
        }
        ,fixRenderer: function( ) {
            if ( 'function' === typeof this._renderer )
                this.render = this._renderer;
            else
                this.render = this.constructor[PROTO].render;
            return this;
        }
        ,render: function( args ) {
            args = args || [ ];
            //if ( this._renderer ) return this._renderer( args );
            var tpl = this.tpl, l = tpl.length, 
                argslen = args.length, 
                i, notIsSub, s, out = ''
            ;
            for (i=0; i<l; i++)
            {
                notIsSub = tpl[ i ][ 0 ]; s = tpl[ i ][ 1 ];
                out += (notIsSub ? s : (!s.substr && s < 0 ? args[ argslen+s ] : args[ s ]));
            }
            return out;
        }
    };
    
    Xpresion.Alias = Alias = function Alias( alias ) {
        if ( !(this instanceof Alias) ) return new Alias(alias);
        this.alias = alias;
    };
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

    Xpresion.Node = Node = function Node(type, arity, node, children, pos) {
        var self = this;
        if ( !(self instanceof Node) ) return new Node(type, arity, node, children, pos);
        self.type = type;
        self.arity = arity;
        self.node = node;
        self.children = children || null;
        self.pos = pos || 0;
    };
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
    
    Xpresion.parse_delimited_block = function(s, i, l, delim, is_escaped) {
        var p = delim, esc = false, ch = '';
        is_escaped = false !== is_escaped;
        i += 1;
        while ( i < l )
        {
            ch = s.charAt(i++); p += ch;
            if ( delim === ch && !esc ) break;
            esc = is_escaped ? (!esc && ('\\' === ch)) : false;
        }
        return p;
    };
    
    Xpresion.parse = function( xpr ) {
        var expr, l
            
            ,e, ch, v
            ,i, m, t, AST, OPS, NOPS, t_index
            
            ,reduce = Xpresion.reduce
            ,get_entry = Alias.get_entry
            
            ,RE = xpr.RE, BLOCK = xpr[BLOCKS], block, block_rest
            ,t_var_is_also_ident = !RE[HAS]('t_var')
            ,evaluator
            ,err = 0, errpos, errmsg, errors = {err: false, msg: ''}
        ;
        
        expr = xpr.source;
        l = expr.length;
        xpr._cnt = 0;
        xpr._symbol_table = { };
        xpr._cache = { };
        xpr.variables = { };
        AST = [ ]; OPS = [ ]; NOPS = [ ]; 
        t_index = 0; i = 0;
        err = 0;
        while ( i < l )
        {
            ch = expr.charAt( i );
            
            // use customized (escaped) delimited blocks here
            // TODO: add a "date" block as well with #..#
            if ( block = get_entry(BLOCK, ch) ) // string or regex or date ('"`#)
            {
                v = block.parse(expr, i, l, ch);
                if ( false !== v )
                {
                    i += v.length;
                    if ( block[HAS]('rest') )
                    {
                        block_rest = block.rest(expr, i, l) || '';
                    }
                    else
                    {
                        block_rest = '';
                    }
                    i += block_rest.length;
                    
                    t = xpr.t_block( v, block.type, block_rest );
                    if ( false !== t )
                    {
                        t_index+=1;
                        AST.push( t.node(null, t_index) );
                        continue;
                    }
                }
            }
            
            e = expr.slice( i );
            
            if ( m = e.match( RE.t_spc ) ) // space
            {
                i += m[ 0 ].length;
                continue;
            }

            if ( m = e.match( RE.t_num ) ) // number
            {
                t = xpr.t_liter( m[ 1 ], T_NUM );
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    i += m[ 0 ].length;
                    continue;
                }
            }
            
            if ( m = e.match( RE.t_ident ) ) // ident, reserved, function, operator, etc..
            {
                t = xpr.t_liter( m[ 1 ], T_IDE ); // reserved keyword
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    i += m[ 0 ].length;
                    continue;
                }
                t = xpr.t_op( m[ 1 ] ); // (literal) operator
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
                    t = xpr.t_var( m[ 1 ] ); // variables are also same identifiers
                    if ( false !== t )
                    {
                        t_index+=1;
                        AST.push( t.node(null, t_index) );
                        i += m[ 0 ].length;
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
                    i += v.length;
                    continue;
                }
            }
            
            if ( !t_var_is_also_ident && (m = e.match( RE.t_var )) ) // variables
            {
                t = xpr.t_var( m[ 1 ] );
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    i += m[ 0 ].length;
                    continue;
                }
            }
            
            if ( m = e.match( RE.t_nonspc ) ) // other non-space tokens/symbols..
            {
                t = xpr.t_liter( m[ 1 ], T_LIT ); // reserved keyword
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    i += m[ 0 ].length;
                    continue;
                }
                t = xpr.t_op( m[ 1 ] ); // function, other (non-literal) operator
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
                t = xpr.t_tok( m[ 1 ] );
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
                
                //console.log(AST);
            }
        }
        
        if ( !err )
        {
            
            try {
                
                evaluator = xpr.compile( AST[0] );
            
            } catch( e ) {
                
                err = 1;
                errmsg = 'Compilation Error, ' + e.message + '';
            }
        }
        
        NOPS = null; OPS = null; AST = null;
        xpr._symbol_table = null;
        
        if ( err )
        {
            evaluator = null;
            xpr.variables = [ ];
            xpr._cnt = 0;
            xpr._cache = { };
            xpr._evaluator_str = '';
            xpr._evaluator = xpr.dummy_evaluator;
            console.error( 'Xpresion Error: ' + errmsg + ' at ' + expr );
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
            for (var k in obj)
            {
                if ( obj[HAS](k) ) OPERATORS[ k ] = obj[ k ];
            }
        }
        return OPERATORS;
    };
    
    Xpresion.defFunc = function( obj, FUNCTIONS ) {
        if ( 'object' === typeof obj )
        {
            FUNCTIONS = FUNCTIONS || Xpresion[FUNCS];
            for (var k in obj)
            {
                if ( obj[HAS](k) ) FUNCTIONS[ k ] = obj[ k ];
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

    Xpresion.Tok = Tok = function Tok( type, input, output, value ) {
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
    };
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
            if ( token instanceof Tpl )             out = token.render( args );
            else                                    out = token;
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
    
    Xpresion.Op = Op = function Op( input, fixity, associativity, priority, /*arity,*/ output, otype, ofixity ) {
        var self = this;
        if ( !(self instanceof Op) ) 
            return new Op(input, fixity, associativity, priority, /*arity,*/ output, otype, ofixity);
        
        input = input || ''; output = output || '';
        var opdef = Op.parse_definition( input );
        self.type = opdef[0];
        self.opdef = opdef[1];
        self.parts = opdef[2];
        
        if ( output && !(output instanceof Tpl) ) output = Tpl(output);
        
        Tok.call(self, self.type, self.parts[0], output);
        
        self.fixity = fixity || PREFIX;
        self.associativity = associativity || DEFAULT;
        self.priority = priority || 1000;
        self.arity = opdef[3];
        self.arity_min = opdef[4];
        self.arity_max = opdef[5];
        //self.arity = arity || 0;
        self.otype = undef !== otype ? otype : T_DFT;
        self.ofixity = undef !== ofixity ? ofixity : self.fixity;
        self.parenthesize = false;
        self.revert = false;
        self.morphes = null;
    };
    Op.Condition = function( f ) {
        return ['function'===typeof f[0] 
        ? f[0] 
        : Tpl.compile(Tpl.multisplit(f[0],{'${POS}':0,'${TOKS}':1,'${OPS}':2,'${TOK}':3,'${OP}':4,'${PREV_IS_OP}':5,'${DEDUCED_TYPE}':6,'Xpresion':7}), true),
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
                num_args = Abs(op_def[i]);
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
        return [type, op, parts, arity, Max(0, arity_min), arity_max];
    };
    Op.match_args = function( expected_args, args_pos, op_queue, token_queue ) {
        var tl = token_queue.length,
            //ol = op_queue.length,
            t = tl-1, /*o = 0,*/ num_args = 0,
            num_expected_args = Abs(expected_args),
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
        Tok[PROTO].dispose.call(self);
        self.otype = null;
        self.ofixity = null;
        self.opdef = null;
        self.parts = null;
        self.morphes = null;
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
        
        if ( op instanceof Tpl )
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
    
    Xpresion.Func = Func = function Func( input, output, otype, priority, arity, associativity, fixity ) {
        var self = this;
        if ( !(self instanceof Func) ) return new Func(input, output, otype, priority, arity, associativity, fixity);
        Op.call(self, is_string(input) ? [input, undef!==arity?arity:1] : input, PREFIX, associativity||RIGHT, priority||1, /*1,*/ output, otype, fixity||PREFIX);
        self.type = T_FUN;
    };
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
        
        ,t_block: function( token, type, rest ) { 
            if ( T_STR === type )
            {
                return Tok(T_STR, token, token); 
            }
            else if ( T_REX === type )
            {
                rest = rest || '';
                var sid = 're_'+token+rest, id, rs;
                if ( this._symbol_table[HAS](sid) ) 
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
         'INF'      : Infinity
        ,'NAN'      : NaN
        ,'clamp'    :   function( v, m, M ){ 
            if ( m > M ) return v > m ? m : (v < M ? M : v); 
            else return v > M ? M : (v < m ? m : v); 
        }
        ,'len'    :   function( v ){ 
            if ( v )
            {
                if ( v.substr || v.push ) return v.length;
                if ( Object === v.constructor ) return Keys(v).length;
                return 1;
            }
            return 0;
        }
        ,'sum'      :   function( ){
            var args = arguments, i, l, s = 0;
            if (args[0] && Array === args[0].constructor ) args = args[0];
            l = args.length;
            if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; }
            return s;
        }
        ,'avg'      :   function( ){
            var args = arguments, i, l, s = 0;
            if (args[0] && Array === args[0].constructor ) args = args[0];
            l = args.length;
            if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; s = s/l;}
            return s;
        }
        ,'ary_eq'   :   function(a1, a2){
            var l = a1.length, i;
            if ( l===a2.length )
            {
                for (i=0; i<l; i++) 
                    if ( a1[i]!=a2[i] ) return false;
            }
            else return false;
            return true;
        }
        ,'ary_merge'   :   function(a1, a2){return [].concat(a1,a2);}
        ,'match'  :   function( str, regex ){ return regex.test( str ); }
        ,'contains':  function( o, i ){return (o.substr||o.pop) ? (-1 < o.indexOf(i)) : o.hasOwnProperty(i);}
        ,'time':  time
        ,'date':  date
        });
        __inited = true;
        if ( true === andConfigure ) Xpresion.defaultConfiguration( );
    };
    
    Xpresion.defaultConfiguration = function( ) {
    if ( __configured ) return;
    
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
    
    // function implementations (can also be overriden per instance/evaluation call)
    /*Xpresion.defRuntimeFunc({
     'clamp'    :   function( v, m, M ){ 
        if ( m > M ) return v > m ? m : (v < M ? M : v); 
        else return v > M ? M : (v < m ? m : v); 
    }
    ,'len'    :   function( v ){ 
        if ( v )
        {
            if ( v.substr || v.push ) return v.length;
            if ( Object === v.constructor ) return Keys(v).length;
            return 1;
        }
        return 0;
    }
    ,'sum'      :   function( ){
        var args = arguments, i, l, s = 0;
        if (args[0] && Array === args[0].constructor ) args = args[0];
        l = args.length;
        if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; }
        return s;
    }
    ,'avg'      :   function( ){
        var args = arguments, i, l, s = 0;
        if (args[0] && Array === args[0].constructor ) args = args[0];
        l = args.length;
        if ( l > 0 ) { for(i=0; i<l; i++) s += args[i]; s = s/l;}
        return s;
    }
    ,'ary_eq'   :   function(a1, a2){
        var l = a1.length, i;
        if ( l===a2.length )
        {
            for (i=0; i<l; i++) 
                if ( a1[i]!=a2[i] ) return false;
        }
        else return false;
        return true;
    }
    ,'ary_merge'   :   function(a1, a2){
        return [].concat(a1,a2);
    }
    ,'match'  :   function( str, regex ){ return regex.test( str ); }
    ,'contains':  function( list, item ){ return -1 < list.indexOf( item ); }
    });*/
    
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
    
    Xpresion.defBlock({
     '\'': {
        type: T_STR, 
        parse: Xpresion.parse_delimited_block
    }
    ,'"': Alias('\'')
    ,'`': {
        type: T_REX, 
        parse: Xpresion.parse_delimited_block,
        rest: function(s,i,l){
            var rest = '', ch, 
            has_i=false, has_g=false, 
            seq = 0, i2 = i+seq,
            not_done = true;
            while ( i2 < l && not_done )
            {
                ch = s.charAt( i2++ ); seq+=1;
                if ( 'i' === ch && !has_i ) 
                {
                    rest += 'i';
                    has_i = true;
                }
                if ( 'g' === ch && !has_g ) 
                {
                    rest += 'g';
                    has_g = true;
                }
                if ( seq >= 2 || (!has_i && !has_g) )
                {
                    not_done = false;
                }
            }
            return rest;
        }
    }
    /*,'#': {
    type: T_DTM, 
    parse: Xpresion.parse_delimited_block,
    rest: function(s,i,l){
    var rest = '"Y-m-d"', ch = i < l ? s.charAt( i ) : '';
    if ( '"' === ch || "'" === ch ) 
    rest = Xpresion.parse_delimited_block(s,i,l,ch,true);
    return rest;
    }
    }*/
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
    Xpresion.init();
    // export it
    return Xpresion;
});
