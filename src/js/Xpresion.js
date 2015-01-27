/**
*
*   Xpresion
*   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node/JS, ActionScript
*   @version: 0.5
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
    
    var __version__ = "0.5",
    
        PROTO = 'prototype', HAS = 'hasOwnProperty', 
        toJSON = JSON.stringify, Keys = Object.keys, Extend = Object.create,
        
        F = function( a, f ){ return new Function( a, f ); },
        RE = function( r, f ){ return new RegExp( r, f||'' ); },
        //DATE = function( d, f ){ return new Date( d ); },
        
        NEWLINE = /\n\r|\r\n|\n|\r/g, SQUOTE = /'/g,
        
        dummy = function( /*Var, Fn, Cache*/ ){ return null; },
        
        Tpl, Node, Alias, Tok, Op, Func, Xpresion,
        BLOCKS = 'BLOCKS', OPS = 'OPERATORS', FUNCS = 'FUNCTIONS',
        __inited = false
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
    ;
    
    Xpresion.Tpl = Tpl = function Tpl( tpl, replacements, compiled ) {
        var self = this;
        if ( !(self instanceof Tpl) ) return new Tpl(tpl, replacements, compiled);
        self.id = null;
        self._renderer = null;
        self.tpl = Tpl.multisplit( tpl||'', replacements||Tpl.defaultArgs );
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
                entry = entries[ id ];
            }
            return entry;
        }
        return false;
    };

    Xpresion.Node = Node = function Node(type, node, children, pos) {
        var self = this;
        if ( !(self instanceof Node) ) return new Node(type, node, children, pos);
        self.type = type;
        self.node = node;
        self.children = children || null;
        self.pos = pos || 0;
    };
    Node[PROTO] = {
        constructor: Node
        ,type: null
        ,node: null
        ,children: null
        ,pos: null
        ,op_parts: null
        ,op_index: null
        ,op_next: function( op ) {
            var self = this,
                is_next = (0 === self.op_parts.indexOf( op.input ));
            if ( is_next ) self.op_parts.shift( );
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
            self.pos = null;
            self.node = null;
            self.op_parts = null;
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
            "Node("+n.type+"): " + (n.parts ? n.parts.join(' ') : n.input),
            "Childs: [",
            tab + out.join("\n" + tab),
            "]"
            ].join("\n"+tab) + "\n";
        }
    };
    // depth-first traversal
    Node.DFT = function DFT( root, action, andDispose ) {
        /*
            one can also implement a symbolic solver here
            by manipulating the tree to produce 'x' on one side 
            and the reverse operators/tokens on the other side
            i.e by transposing the top op on other side of the '=' op and using the 'associated inverse operator'
            in stack order (i.e most top op is transposed first etc.. until only the branch with 'x' stays on one side)
            (easy when only one unknown in one state, more difficult for many unknowns 
            or one unknown in different states, e.g x and x^2 etc..)
        */
        andDispose = false !== andDispose;
        action = action || Xpresion.render;
        var node, op, o, stack = [ root ], output = [ ];
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
               o = action(op, op.arity ? output.splice(output.length-op.arity, op.arity) : [])
               output.push( o );
               if ( andDispose ) node.dispose( );
            }
        }
        stack = null;
        return output[ 0 ];
    };
    
    Xpresion.reduce = function( token_queue, op_queue, nop_queue, current_op, pos ) {
        var entry, op, n, opc, fixity, nop = null, nop_index = 0;
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
                n = opc.node(null, pos, op_queue.length+1);
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
                if ( nop && nop.op_next( opc ) )
                {
                    while ( op_queue.length > nop_index )
                    {
                        entry = op_queue.shift( ); op = entry.node;
                        n = op.node(token_queue.splice(token_queue.length-op.arity, op.arity), entry.pos);
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
                
                fixity = opc.fixity;
                if ( POSTFIX === fixity )
                {
                    // postfix assumed to be already in correct order, 
                    // no re-structuring needed
                    n = opc.node(token_queue.splice(token_queue.length-opc.arity, opc.arity), pos);
                    token_queue.push( n );
                }
                else if ( PREFIX === fixity )
                {
                    // prefix assumed to be already in reverse correct order, 
                    // just push to op queue for later re-ordering
                    op_queue.unshift( Node(opc.otype, opc, null, pos) );
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
                            n = op.node(token_queue.splice(token_queue.length-op.arity, op.arity), entry.pos);
                            token_queue.push( n );
                        }
                        else
                        {
                            op_queue.unshift( entry );
                            break;
                        }
                    }
                    op_queue.unshift( Node(opc.otype, opc, null, pos) );
                }
            }
        }
        else
        {
            while ( op_queue.length )
            {
                entry = op_queue.shift( ); op = entry.node;
                n = op.node(token_queue.splice(token_queue.length-op.arity, op.arity), entry.pos);
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
        var self = xpr, expr, l
            
            ,e, ch, v
            ,i, m, t, AST, OPS, NOPS, t_index
            
            ,reduce = Xpresion.reduce
            ,get_entry = Alias.get_entry
            
            ,RE = self.RE, BLOCK = self[BLOCKS], block, block_rest
            ,t_var_is_also_ident = !RE[HAS]('t_var')
            ,evaluator
            ,err = 0, errpos, errmsg
        ;
        
        expr = self.source;
        l = expr.length;
        self._cnt = 0;
        self._symbol_table = { };
        self._cache = { };
        self.variables = { };
        AST = [ ]; OPS = [ ]; NOPS = [ ]; 
        t_index = 0; i = 0;
        
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
                    
                    t = self.t_block( v, block.type, block_rest );
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
                t = self.t_liter( m[ 1 ], T_NUM );
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
                t = self.t_liter( m[ 1 ], T_IDE ); // reserved keyword
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    i += m[ 0 ].length;
                    continue;
                }
                t = self.t_op( m[ 1 ] ); // (literal) operator
                if ( false !== t )
                {
                    t_index+=1;
                    reduce( AST, OPS, NOPS, t, t_index );
                    i += m[ 0 ].length;
                    continue;
                }
                if ( t_var_is_also_ident )
                {
                    t = self.t_var( m[ 1 ] ); // variables are also same identifiers
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
                    t = self.t_op( v ); // function, (non-literal) operator
                    if ( false !== t ) break;
                    v = v.slice( 0, -1 );
                }
                if ( false !== t )
                {
                    t_index+=1;
                    reduce( AST, OPS, NOPS, t, t_index );
                    i += v.length;
                    continue;
                }
            }
            
            if ( !t_var_is_also_ident && (m = e.match( RE.t_var )) ) // variables
            {
                t = self.t_var( m[ 1 ] );
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
                t = self.t_liter( m[ 1 ], T_LIT ); // reserved keyword
                if ( false !== t )
                {
                    t_index+=1;
                    AST.push( t.node(null, t_index) );
                    i += m[ 0 ].length;
                    continue;
                }
                t = self.t_op( m[ 1 ] ); // function, other (non-literal) operator
                if ( false !== t )
                {
                    t_index+=1;
                    reduce( AST, OPS, NOPS, t, t_index );
                    i += m[ 0 ].length;
                    continue;
                }
                t = self.t_tok( m[ 1 ] );
                t_index+=1;
                AST.push( t.node(null, t_index) ); // pass-through ..
                i += m[ 0 ].length;
                //continue;
            }
        }
        
        err = 0;
        reduce( AST, OPS, NOPS );
        
        if ( (1 !== AST.length) || (OPS.length > 0) )
        {
            err = 1;
            errmsg = 'Parse Error, Mismatched Parentheses or Operators';
        }
        
        if ( !err )
        {
            
            try {
                
                evaluator = self.compile( AST[0] );
            
            } catch( e ) {
                
                err = 1;
                errmsg = 'Compilation Error, ' + e.message + '';
            }
        }
        
        NOPS = null; OPS = null; AST = null;
        self._symbol_table = null;
        
        if ( err )
        {
            evaluator = null;
            self.variables = [ ];
            self._cnt = 0;
            self._cache = { };
            self._evaluator_str = '';
            self._evaluator = self.dummy_evaluator;
            console.error( 'Xpresion Error: ' + errmsg + ' at ' + expr );
        }
        else
        {
            // make array
            self.variables = Keys( self.variables );
            self._evaluator_str = evaluator[0];
            self._evaluator = evaluator[1];
        }
        
        return self; 
    };
        
    Xpresion.render = function( tok, args ) { 
        return tok.render( args ); 
    };
    
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
        self.associativity = DEFAULT;
        self.fixity = INFIX;
        self.parenthesize = false;
        self.revert = false;
    };
    Tok.render = function( t ) { return (t instanceof Tok) ? t.render() : String(t); };
    Tok[PROTO] = {
        constructor: Tok
        
        ,type: null
        ,input: null
        ,output: null
        ,value: null
        ,priority: 1000
        ,parity: 0
        ,arity: 0
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
        ,node: function( args, pos ) {
            return Node(this.type, this, !!args ? args : null, pos)
        }
        ,toString: function( ) {
            return String(this.output);
        }
    };
    
    Xpresion.Op = Op = function Op( input, fixity, associativity, priority, arity, output, otype, ofixity ) {
        var self = this;
        if ( !(self instanceof Op) ) 
            return new Op(input, fixity, associativity, priority, arity, output, otype, ofixity);
        
        input = input || '';
        self.parts = [].concat( input );
        
        // n-ary/multi-part operator
        if (input && input.push && input.pop) self.type = T_N_OP;
        // default operator
        else self.type = T_OP;
        
        Tok.call(self, self.type, self.parts[0], output);
        
        self.fixity = fixity || PREFIX;
        self.associativity = associativity || DEFAULT;
        self.priority = priority || 1000;
        self.arity = arity || 0;
        self.otype = otype;
        self.ofixity = undef !== ofixity ? ofixity : self.fixity;
        self.parenthesize = false;
        self.revert = false;
        self.morphes = null;
    };
    Op.Condition = function( f ) {
        return ['function'===typeof f[0] 
                ? f[0] 
                : Tpl.compile(Tpl.multisplit(f[0],{'${POS}':0,'${TOKS}':1,'${OPS}':2,'${TOK}':3,'${OP}':4,'${PREV_IS_OP}':5,'${DEDUCED_TYPE}':6,'${XPRESION}':7}), true),
                f[1]];
    };
    Op[PROTO] = Extend( Tok[PROTO] );
    Op[PROTO].otype = null;
    Op[PROTO].ofixity = null;
    Op[PROTO].parts = null;
    Op[PROTO].morphes = null;
    Op[PROTO].dispose = function( ) {
        var self = this;
        Tok[PROTO].dispose.call(self);
        self.otype = null;
        self.ofixity = null;
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
    Op[PROTO].node = function( args, pos ) {
        args = args || [];
        var self = this, otype = self.otype, n;
        if ( self.revert ) args.reverse( );
        if ( (T_DUM === otype) && args.length ) otype = args[ 0 ].type;
        else if ( args.length ) args[0].type = otype;
        n = Node(otype, self, args, pos);
        if ( (T_N_OP === self.type) && (arguments.length > 2) )
        {
            n.op_parts = self.parts.slice(1);
            n.op_index = arguments[2];
        }
        return n;
    };
    
    Xpresion.Func = Func = function Func( input, output, otype, priority, associativity, fixity ) {
        var self = this;
        if ( !(self instanceof Func) ) return new Func(input, output, otype, priority, associativity, fixity);
        Op.call(self, input, PREFIX, associativity || RIGHT, priority, 1, output, otype, fixity||PREFIX);
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
            return [evaluator_str, F('Var,Fn,Cache', '"use strict"; return ' + evaluator_str + ';')];
        }
        
        ,evaluator: function( evaluator ) {
            if ( arguments.length )
            {
                if ( evaluator && evaluator.call ) this._evaluator = evaluator;
                return this;
            }
            return this._evaluator;
        }
        
        ,evaluate: function( data, Fn ) {
            if ( 1 > arguments.length ) data = {};
            if ( 2 > arguments.length ) Fn = this.Fn;
            return this._evaluator( data, Fn, this._cache );
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
    
    Xpresion.init = function( ) {
    if ( __inited ) return;
    
    Xpresion[OPS] = {
    // e.g https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
    /*----------------------------------------------------------------------------------------
     symbol           input,    fixity,  associativity, priority, arity, output,     output_type
    ------------------------------------------------------------------------------------------*/
                  // bra-kets as n-ary operators
     '('    :     Op(['(',')'], POSTFIX, RIGHT,          1,        1,    Tpl('$0'),   T_DUM )
    ,')'    :     Op(')')
    
    ,'['    :     Op(['[',']'], POSTFIX, RIGHT,          2,        1,    Tpl('[$0]'), T_ARY )
    ,']'    :     Op(']')
    
    ,','    :     Op(',',       INFIX,   LEFT,           3,        2,    Tpl('$0,$1'), T_DFT )
                  // n-ary (ternary) if-then-else operator
    ,'?'    :     Op(['?',':'], INFIX,   LEFT,         100,        3,    Tpl('($0?$1:$2)'), T_BOL )
    ,':'    :     Op(':')
    
    ,'!'    :     Op('!',       PREFIX,  RIGHT,         10,        1,    Tpl('!$0'), T_BOL )
    ,'~'    :     Op('~',       PREFIX,  RIGHT,         10,        1,    Tpl('~$0'), T_NUM )
    
    ,'^'    :     Op('^',       INFIX,   RIGHT,         11,        2,    Tpl('Math.pow($0,$1)'), T_NUM, PREFIX )
    ,'*'    :     Op('*',       INFIX,   LEFT,          20,        2,    Tpl('($0*$1)'), T_NUM ) 
    ,'/'    :     Op('/',       INFIX,   LEFT,          20,        2,    Tpl('($0/$1)'), T_NUM )
    ,'%'    :     Op('&',       INFIX,   LEFT,          20,        2,    Tpl('($0%$1)'), T_NUM )
                  // addition/concatenation/unary plus as polymorphic operators
    ,'+'    :     Op().Polymorphic([
                  // array concatenation
                  ["${TOK} && !${PREV_IS_OP} && (${DEDUCED_TYPE}===${XPRESION}.T_ARY)",
                  Op('+',       INFIX,   LEFT,          25,        2,    Tpl('Fn.ary_merge($0,$1)'), T_ARY )]
                  // string concatenation
                  ,["${TOK} && !${PREV_IS_OP} && (${DEDUCED_TYPE}===${XPRESION}.T_STR)",
                  Op('+',       INFIX,   LEFT,          25,        2,    Tpl('($0+String($1))'), T_STR )]
                  // numeric addition
                  ,["${TOK} && !${PREV_IS_OP}",
                  Op('+',       INFIX,   LEFT,          25,        2,    Tpl('($0+$1)'),  T_NUM )]
                  // unary plus
                  ,["!${TOK} || ${PREV_IS_OP}",
                  Op('+',       PREFIX,  RIGHT,          4,        1,    Tpl('$0'),  T_NUM )]
                  ])
    
    ,'-'    :     Op().Polymorphic([
                  // numeric subtraction
                  ["${TOK} && !${PREV_IS_OP}",
                  Op('-',       INFIX,   LEFT,          25,        2,    Tpl('($0-$1)'), T_NUM )]
                  // unary negation
                  ,["!${TOK} || ${PREV_IS_OP}",
                  Op('-',       PREFIX,  RIGHT,          4,        1,    Tpl('(-$0)'),  T_NUM )]
                  ])
    
    ,'>>'   :     Op('>>',      INFIX,   LEFT,          30,        2,    Tpl('($0>>$1)'), T_NUM )
    ,'<<'   :     Op('<<',      INFIX,   LEFT,          30,        2,    Tpl('($0<<$1)'), T_NUM )
    
    ,'>'    :     Op('>',       INFIX,   LEFT,          35,        2,    Tpl('($0>$1)'),  T_BOL )
    ,'<'    :     Op('<',       INFIX,   LEFT,          35,        2,    Tpl('($0<$1)'),  T_BOL )
    ,'>='   :     Op('>=',      INFIX,   LEFT,          35,        2,    Tpl('($0>=$1)'), T_BOL )
    ,'<='   :     Op('<=',      INFIX,   LEFT,          35,        2,    Tpl('($0<=$1)'), T_BOL )
    
    ,'=='   :     Op().Polymorphic([
                  // array equivalence
                  ["${DEDUCED_TYPE}===${XPRESION}.T_ARY",
                  Op('==',      INFIX,   LEFT,          40,        2,    Tpl('Fn.ary_eq($0,$1)'), T_BOL )]
                  // default equivalence
                  ,["true",
                  Op('==',      INFIX,   LEFT,          40,        2,    Tpl('($0==$1)'), T_BOL )]
                  ])
    
    ,'!='   :     Op('!=',      INFIX,   LEFT,          40,        2,    Tpl('($0!=$1)'), T_BOL )
    
    ,'matches' :  Op('matches', INFIX,   NONE,          40,        2,    Tpl('$0.test($1)'), T_BOL )
    ,'in'   :     Op('in',      INFIX,   NONE,          40,        2,    Tpl('(-1<$1.indexOf($0))'), T_BOL )
    ,'has'     :  Op('has',     INFIX,   NONE,          40,        2,    Tpl('(-1<$0.indexOf($1))'), T_BOL )
    
    ,'&'    :     Op('&',       INFIX,   LEFT,          45,        2,    Tpl('($0&$1)'),  T_NUM )
    ,'|'    :     Op('|',       INFIX,   LEFT,          46,        2,    Tpl('($0|$1)'),  T_NUM )
    
    ,'&&'   :     Op('&&',      INFIX,   LEFT,          47,        2,    Tpl('($0&&$1)'), T_BOL )
    ,'||'   :     Op('||',      INFIX,   LEFT,          48,        2,    Tpl('($0||$1)'), T_BOL )
     
    /*------------------------------------------
                    aliases
     -------------------------------------------*/
    ,'or'    :    Alias( '||' )
    ,'and'   :    Alias( '&&' )
    ,'not'   :    Alias( '!' )
    };
    
    Xpresion[FUNCS] = {
    /*-----------------------------------------------------------------------
    symbol              input,    output,          output_type,priority
    -------------------------------------------------------------------------*/
     'min'      : Func('min',   Tpl('Math.min($0)'),  T_NUM,   5  )
    ,'max'      : Func('max',   Tpl('Math.max($0)'),  T_NUM,   5  )
    ,'pow'      : Func('pow',   Tpl('Math.pow($0)'),  T_NUM,   5  )
    ,'sqrt'     : Func('sqrt',  Tpl('Math.sqrt($0)'), T_NUM,   5  )
    ,'len'      : Func('len',   Tpl('Fn.len($0)'),    T_NUM,   5  )
    ,'int'      : Func('int',   Tpl('parseInt($0)'),  T_NUM,   5  )
    ,'str'      : Func('str',   Tpl('String($0)'),  T_STR,   5  )
    //,'iif'      : Func('iif',   Tpl('Fn.iif($0)'),    T_BOL,   5  )
    ,'clamp'    : Func('clamp', Tpl('Fn.clamp($0)'),  T_NUM,   5  )
    ,'sum'      : Func('sum',   Tpl('Fn.sum($0)'),    T_NUM,   5  )
    ,'avg'      : Func('avg',   Tpl('Fn.avg($0)'),    T_NUM,   5  )
    /*---------------------------------------
                    aliases
     ----------------------------------------*/
     // ...
    };
    
    // function implementations (can also be overriden per instance/evaluation call)
    Xpresion.Fn = {
     /*'toint'    :   function( v, base ){ return parseInt( v, base || 10 ); }
    ,'tostr'    :   function( v ){ return String(v) }*/
    /*,'iif'      :   function( cond, if_branch, else_branch ){ 
        return !!cond ? if_branch : else_branch; 
    }*/
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
    };
    
    Xpresion.RE = {
    /*-----------------------------------------------
    token                re
    -------------------------------------------------*/
     't_spc'        :  /^(\s+)/
    ,'t_nonspc'     :  /^(\S+)/
    ,'t_special'    :  /^([*.\-+\\\/\^\$\(\)\[\]|?<:>&~%!#@=_,;{}]+)/
    ,'t_num'        :  /^(\d+(\.\d+)?)/
    ,'t_ident'      :  /^([a-zA-Z_][a-zA-Z0-9_]*)\b/
    ,'t_var'        :  /^\$([a-zA-Z0-9_][a-zA-Z0-9_.]*)\b/
    };
    
    Xpresion[BLOCKS] = {
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
    };
    
    Xpresion.Reserved = {
     'null'     : Tok(T_IDE, 'null', 'null')
    ,'false'    : Tok(T_BOL, 'false', 'false')
    ,'true'     : Tok(T_BOL, 'true', 'true')
    ,'infinity' : Tok(T_NUM, 'Infinity', 'Infinity')
    ,'nan'      : Tok(T_NUM, 'NaN', 'NaN')
    // aliases
    ,'none'     : Alias('null')
    ,'inf'      : Alias('inf')
    };
    
    __inited = true;
    };
    
    // init it
    Xpresion.init();
    // export it
    return Xpresion;
});
