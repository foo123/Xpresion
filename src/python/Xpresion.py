# -*- coding: UTF-8 -*-
##
#
#   Xpresion
#   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node/JS, ActionScript
#   @version: 0.5.1
#
#   https://github.com/foo123/Xpresion
#
##
import re, math, pprint 

# static
CNT = 0

def createFunction( args, sourceCode, additional_symbols=dict() ):
    # http://code.activestate.com/recipes/550804-create-a-restricted-python-function-from-a-string/
    
    global CNT
    CNT += 1
    funcName = 'xpresion_dyna_func_' + str(CNT)
    
    # The list of symbols that are included by default in the generated
    # function's environment
    SAFE_SYMBOLS = [
        "list", "dict", "enumerate", "tuple", "set", "long", "float", "object",
        "bool", "callable", "True", "False", "dir",
        "frozenset", "getattr", "hasattr", "abs", "cmp", "complex",
        "divmod", "id", "pow", "round", "slice", "vars",
        "hash", "hex", "int", "isinstance", "issubclass", "len",
        "map", "filter", "max", "min", "oct", "chr", "ord", "range",
        "reduce", "repr", "str", "type", "zip", "xrange", "None",
        "Exception", "KeyboardInterrupt"
    ]
    
    # Also add the standard exceptions
    __bi = __builtins__
    if type(__bi) is not dict:
        __bi = __bi.__dict__
    for k in __bi:
        if k.endswith("Error") or k.endswith("Warning"):
            SAFE_SYMBOLS.append(k)
    del __bi
    
    # Include the sourcecode as the code of a function funcName:
    s = "def " + funcName + "(%s):\n" % args
    s += sourceCode # this should be already properly padded

    # Byte-compilation (optional)
    byteCode = compile(s, "<string>", 'exec')  

    # Setup the local and global dictionaries of the execution
    # environment for __TheFunction__
    bis   = dict() # builtins
    globs = dict()
    locs  = dict()

    # Setup a standard-compatible python environment
    bis["locals"]  = lambda: locs
    bis["globals"] = lambda: globs
    globs["__builtins__"] = bis
    globs["__name__"] = "SUBENV"
    globs["__doc__"] = sourceCode

    # Determine how the __builtins__ dictionary should be accessed
    if type(__builtins__) is dict:
        bi_dict = __builtins__
    else:
        bi_dict = __builtins__.__dict__

    # Include the safe symbols
    for k in SAFE_SYMBOLS:
        
        # try from current locals
        try:
          locs[k] = locals()[k]
          continue
        except KeyError:
          pass
        
        # Try from globals
        try:
          globs[k] = globals()[k]
          continue
        except KeyError:
          pass
        
        # Try from builtins
        try:
          bis[k] = bi_dict[k]
        except KeyError:
          # Symbol not available anywhere: silently ignored
          pass

    # Include the symbols added by the caller, in the globals dictionary
    globs.update(additional_symbols)

    # Finally execute the Function statement:
    eval(byteCode, globs, locs)
    
    # As a result, the function is defined as the item funcName
    # in the locals dictionary
    fct = locs[funcName]
    # Attach the function to the globals so that it can be recursive
    del locs[funcName]
    globs[funcName] = fct
    
    # Attach the actual source code to the docstring
    fct.__doc__ = sourceCode
    
    # return the compiled function object
    return fct


def array_splice(arr, index, offset):
    l = len(arr)
    if l > 0:
        if index < 0: index += l
        index = min(index, l)
        #if offset < 0: offset = -offset
        index2 = index+offset
        if index2 < 0: index2 += l
        index2 = min(index2, l)
        ret = arr[index:index2]
        del arr[index:index2]
        return ret
    return []

#def trace( stack ):
#    out = []
#    for i in stack: out.append(i.__str__())
#    return (",\n").join(out)
    
def dummy( Var, Fn, Cache ):
    return None

def parse_re_flags(s,i,l):
    flags = ''
    has_i = False
    has_g = False
    seq = 0
    i2 = i+seq
    not_done = True
    while i2 < l and not_done:
        ch = s[i2] 
        i2 += 1
        seq += 1
        if 'i' == ch and not has_i:
            flags += 'i'
            has_i = True
        
        if 'g' == ch and not has_g:
            flags += 'g'
            has_g = True
        
        if seq >= 2 or (not has_i and not has_g):
            not_done = False
    return flags
            
NEWLINE = re.compile(r'\n\r|\r\n|\n|\r') 
SQUOTE = re.compile(r"'")

# STATIC
COMMA       =   ','
LPAREN      =   '('
RPAREN      =   ')'

NONE        =   0
DEFAULT     =   1
LEFT        =  -2
RIGHT       =   2
PREFIX      =   2
INFIX       =   4
POSTFIX     =   8

T_DUM       =   0
T_DFT       =   1
T_IDE       =   16
T_VAR       =   17
T_LIT       =   32
T_NUM       =   33
T_STR       =   34
T_REX       =   35
T_BOL       =   36
T_DTM       =   37
T_ARY       =   38
T_OP        =   128
T_N_OP      =   129
T_POLY_OP   =   130
T_FUN       =   131

class Tpl:
    
    def multisplit(tpl, reps, as_array=False):
        a = [ [1, tpl] ]
        reps = enumerate(reps) if as_array else reps.items()
        for r,s in reps:
        
            c = [ ] 
            sr = s if as_array else r
            s = [0, s]
            for ai in a:
            
                if 1 == ai[ 0 ]:
                
                    b = ai[ 1 ].split( sr )
                    bl = len(b)
                    c.append( [1, b[0]] )
                    if bl > 1:
                        for bj in b[1:]:
                        
                            c.append( s )
                            c.append( [1, bj] )
                        
                else:
                
                    c.append( ai )
                
            
            a = c
        return a

    def arg(key=None, argslen=None):
        out = 'args'
        
        if None != key:
        
            if isinstance(key,str):
                key = key.split('.') if len(key) else []
            else: 
                key = [key]
            #givenArgsLen = bool(None !=argslen and isinstance(argslen,str))
            
            for k in key:
                kn = int(k,10) if isinstance(k,str) else k
                if not math.isnan(kn):
                    if kn < 0: k = '-'+str(-kn)
                    else: k = str(k)
                    out += '[' + k + ']';
                
                else:
                    out += '["' + str(k) + '"]';
                
        return out

    def compile(tpl, raw=False):
        global NEWLINE
        global SQUOTE
        
        if True == raw:
        
            out = 'return ('
            for tpli in tpl:
            
                notIsSub = tpli[ 0 ] 
                s = tpli[ 1 ]
                out += s if notIsSub else Tpl.arg(s)
            
            out += ')'
            
        else:
        
            out = 'return ('
            for tpli in tpl:
            
                notIsSub = tpli[ 0 ]
                s = tpli[ 1 ]
                if notIsSub: out += "'" + re.sub(NEWLINE, "' + \"\\n\" + '", re.sub(SQUOTE, "\\'", s)) + "'"
                else: out += " + str(" + Tpl.arg(s,"argslen") + ") + "
            
            out += ')'
        
        return createFunction('args', "    " + out)

    
    defaultArgs = {'$-5':-5,'$-4':-4,'$-3':-3,'$-2':-2,'$-1':-1,'$0':0,'$1':1,'$2':2,'$3':3,'$4':4,'$5':5}
    
    def __init__(self, tpl='', replacements=None, compiled=False):
        self.id = None
        self.tpl = None
        self._renderer = None
        
        self.tpl = Tpl.multisplit( tpl, Tpl.defaultArgs if not replacements else replacements )
        if True == compiled: self._renderer = Tpl.compile( self.tpl )

    def __del__(self):
        self.dispose()
        
    def dispose(self):
        self.id = None
        self.tpl = None
        self._renderer = None
        return self
    
    def render(self, args=None):
        if None == args: args = [ ]
        
        if self._renderer: return self._renderer( args )
        
        out = ''
        
        for tpli in self.tpl:
        
            notIsSub = tpli[ 0 ] 
            s = tpli[ 1 ]
            out += s if notIsSub else str(args[ s ])
        
        return out
    


class Node:
    # depth-first traversal
    def DFT(root, action=None, andDispose=False):
        #
        #    one can also implement a symbolic solver here
        #    by manipulating the tree to produce 'x' on one side 
        #    and the reverse operators/tokens on the other side
        #    i.e by transposing the top op on other side of the '=' op and using the 'associated inverse operator'
        #    in stack order (i.e most top op is transposed first etc.. until only the branch with 'x' stays on one side)
        #    (easy when only one unknown in one state, more difficult for many unknowns 
        #    or one unknown in different states, e.g x and x^2 etc..)
        #
        andDispose = (False != andDispose)
        if not action: action = Xpresion.render
        stack = [ root ]
        output = [ ]
        
        while len(stack):
            node = stack[ 0 ]
            if node.children and len(node.children):
                stack = node.children + stack
                node.children = None

            else:
                stack.pop(0)
                op = node.node
                o = action(op, array_splice(output, -op.arity, op.arity))
                output.append( o )
                if andDispose: node.dispose( )


        stack = None
        return output[ 0 ]
    
    def __init__(self, type, node, children=None, pos=0):
        self.type = type
        self.node = node
        self.children = children
        self.pos = pos
        self.op_parts = None
        self.op_index = None
    
    def __del__(self):
        self.dispose()
        
    def dispose(self):
        c = self.children
        if c and len(c):
            for ci in c: 
                if ci: ci.dispose( )
        
        self.type = None
        self.pos = None
        self.node = None
        self.op_parts = None
        self.op_index = None
        self.children = None
        return self
    
    
    def op_next(self, op):
        next_index = -1
        try:
            next_index = self.op_parts.index( op.input )
        except:
            next_index = -1
        is_next = (0 == next_index)
        if is_next: self.op_parts.pop(0)
        return is_next
    
    def op_complete(self):
        return 0 == len(self.op_parts)
    
    def __str__(self, tab=""):
        out = []
        n = self.node
        c = self.children if self.children else [] 
        tab_tab = tab+"  "
        
        for ci in c: out.append(ci.__str__(tab_tab))
        if hasattr(n, 'parts') and n.parts: parts = " ".join(n.parts)
        else: parts = n.input
        return tab + ("\n"+tab).join([
        "Node("+str(n.type)+"): " + str(parts),
        "Childs: [",
        tab +("\n" + tab).join(out),
        "]"
        ]) + "\n"
    


class Alias:
    
    def get_entry(entries, id):
        if id and entries and (id in entries):
            # walk/bypass aliases, if any
            entry = entries[ id ]
            while isinstance(entry, Alias) and (entry.alias in entries):
                id = entry.alias
                # circular reference
                if entry == entries[ id ]: return False
                entry = entries[ id ]
            return entry
        return False
        
    
    def __init__(self, alias):
        self.alias = str(alias)

    def __del__(self):
        self.alias = None
        

class Tok:
    
    def render(t): 
        if isinstance(t, Tok): return t.render()
        return str(t)
    
    def __init__(self, type, input, output, value=None):
        self.type = type
        self.input = input
        self.output = output
        self.value = value
        self.priority = 1000
        self.parity = 0
        self.arity = 0
        self.associativity = DEFAULT
        self.fixity = INFIX
        self.parenthesize = False
        self.revert = False
    
    def __del__(self):
        self.dispose()
        
    def dispose(self):
        self.type = None
        self.input = None
        self.output = None
        self.value = None
        self.priority = None
        self.parity = None
        self.arity = None
        self.associativity = None
        self.fixity = None
        self.parenthesize = None
        self.revert = None
        return self
    
    def setType(self, type):
        self.type = type
        return self
    
    def setParenthesize(self, bol):
        self.parenthesize = bool(bol)
        return self
    
    def setReverse(self, bol):
        self.revert = bool(bol)
        return self
    
    def render(self, args=None):
        token = self.output
        p = self.parenthesize
        lparen = Xpresion.LPAREN if p else ''
        rparen = Xpresion.RPAREN if p else ''
        if None==args: args=[]
        args.insert(0, self.input)
        
        if isinstance(token,Tpl):             out = str(token.render( args ))
        else:                                 out = str(token)
        return lparen + out + rparen
    
    def node(self, args=None, pos=0):
        return Node(self.type, self, args if args else None, pos)
    
    def __str__(self):
        return str(self.output)
    

class Op(Tok):

    def Condition(f):
        return [
            f[0] if callable(f[0]) else Tpl.compile(Tpl.multisplit(f[0],{'${POS}':0,'${TOKS}':1,'${OPS}':2,'${TOK}':3,'${OP}':4,'${PREV_IS_OP}':5,'${DEDUCED_TYPE}':6,'Xpresion':7}), True)
            ,f[1]
        ]
    
    def __init__(self, input='', fixity=None, associativity=None, priority=1000, arity=0, output='', otype=None, ofixity=None):
        # n-ary/multi-part operator
        if isinstance(input,(list,tuple)): 
            self.parts = list(input)
            self.type = T_N_OP
        else:
            self.parts = [input]
            self.type = T_OP
        
        if not isinstance(output, Tpl): output = Tpl(output)
        
        super(Op, self).__init__(self.type, self.parts[0], output)
        
        self.fixity = fixity if None!=fixity else PREFIX
        self.associativity = associativity if None!=associativity else DEFAULT
        self.priority = priority
        self.arity = arity
        self.otype = otype if None!=otype else T_DFT
        self.ofixity = ofixity if None!=ofixity else self.fixity
        self.parenthesize = False
        self.revert = False
        self.morphes = None
    
    def __del__(self):
        self.dispose()
        
    def dispose(self):
        super(Op, self).dispose()
        self.otype = None
        self.ofixity = None
        self.parts = None
        self.morphes = None
        return self
    
    def Polymorphic(self, morphes=None):
        self.type = T_POLY_OP
        self.morphes = list(map(Op.Condition, morphes if morphes else [ ]))
        return self
    
    def morph(self, args):
        morphes = self.morphes
        l = len(morphes)
        i = 0
        minop = morphes[0][1]
        found = False
        
        if len(args) < 8:
            args.append(args[1][-1] if len(args[1]) else False)
            args.append(args[2][0] if len(args[2]) else False)
            args.append((args[4].pos+1==args[0]) if args[4] else False)
            args.append(args[4].type if args[4] else (args[3].type if args[3] else 0))
            args.append(Xpresion)
        
        while i < l:
            op = morphes[i]
            i += 1
            if True == bool(op[0]( args )):
                op = op[1]
                found = True
                break
            if op[1].priority >= minop.priority: minop = op[1]
        
        # try to return minimum priority operator, if none matched
        if not found: op = minop
        # nested polymorphic op, if any
        while T_POLY_OP == op.type: op = op.morph( args )
        return op
    
    def render(self, args=None):
        output_type = self.otype
        op = self.output
        p = self.parenthesize
        lparen = Xpresion.LPAREN if p else ''
        rparen = Xpresion.RPAREN if p else ''
        comma = Xpresion.COMMA
        out_fixity = self.ofixity
        if None==args or not len(args): args=['','']
        numargs = len(args)
        
        #if (T_DUM == output_type) and numargs:
        #    output_type = args[ 0 ].type
        
        #args = list(map(Tok.render, args))
        
        if isinstance(op, Tpl):
            out = lparen + str(op.render( args )) + rparen
        elif INFIX == out_fixity:
            out = lparen + str(op).join(args) + rparen
        elif POSTFIX == out_fixity:
            out = lparen + comma.join(args) + rparen + str(op)
        else: # if PREFIX == out_fixity:
            out = str(op) + lparen + comma.join(args) + rparen
        return Tok(output_type, out, out)
    
    def node(self, args=None, pos=0, op_index=0):
        otype = self.otype
        if None==args: args = []
        if self.revert: args = args[::-1]
        if (T_DUM == otype) and len(args): otype = args[ 0 ].type
        elif len(args): args[0].type = otype
        n = Node(otype, self, args, pos)
        if T_N_OP == self.type:
            n.op_parts = self.parts[1:]
            n.op_index = op_index
        return n

class Func(Op):
    
    def __init__(self, input='', output='', otype=None, priority=5, associativity=None, fixity=None):
        super(Func, self).__init__(input, PREFIX, associativity if None!= associativity else RIGHT, priority, 1, output, otype, fixity if None!=fixity else PREFIX)
        self.type = T_FUN
    
    def __del__(self):
        self.dispose()
        

class Fn:
    INF = float("inf")
    NAN = float("nan")
    
    # function implementations (can also be overriden per instance/evaluation call)
    def pow(base, exponent):
        return base ** exponent
        
    #def toint(v, base=10):
    #    return int(v, base)
    #
    #def tostr(v):
    #    return str(v)

    #def iif(cond, if_branch, else_branch=False):
    #    return if_branch if bool(cond) else else_branch
    
    def clamp(v, m, M):
        if m > M: return m if v > m else (M if v < M else v)
        else: return M if v > M else (m if v < m else v)

    def len(v):
        if v:
            if isinstance(v,(str,list,tuple,dict)): return len(v)
            return 1
        return 0

    def sum(*args):
        s = 0
        values = args
        if len(values) and isinstance(values[0],(list,tuple)): values = values[0]
        for v in values: s += v
        return s

    def avg(*args):
        s = 0
        values = args
        if len(values) and isinstance(values[0],(list,tuple)): values = values[0]
        l = len(values)
        for v in values: s += v
        return s/l if l > 0 else s

    def ary_merge(a1, a2):
        if not isinstance(a1,(list,tuple)): a1 = [a1]
        if not isinstance(a2,(list,tuple)): a2 = [a2]
        return a1 + a2

    def ary_eq(a1, a2):
        l = len(a1) 
        if l==len(a2):
            for i in range(l):
                if a1[i]!=a2[i]: return False
        else: return False
        return True

    def match(s, regex): 
        return bool(re.search(regex, s ))

    def contains(l, item): 
        return bool(item in l)


class Xpresion:
    """
    Xpresion for Python,
    https://github.com/foo123/Xpresion
    """
    
    VERSION = "0.5.1"
    
    COMMA       = COMMA
    LPAREN      = LPAREN
    RPAREN      = RPAREN

    NONE        = NONE
    DEFAULT     = DEFAULT
    LEFT        = LEFT     
    RIGHT       = RIGHT    
    PREFIX      = PREFIX   
    INFIX       = INFIX    
    POSTFIX     = POSTFIX  

    T_DUM       = T_DUM    
    T_DFT       = T_DFT    
    T_IDE       = T_IDE    
    T_VAR       = T_VAR    
    T_LIT       = T_LIT    
    T_NUM       = T_NUM    
    T_STR       = T_STR    
    T_REX       = T_REX    
    T_BOL       = T_BOL    
    T_DTM       = T_DTM    
    T_ARY       = T_ARY    
    T_OP        = T_OP     
    T_N_OP      = T_N_OP   
    T_POLY_OP   = T_POLY_OP
    T_FUN       = T_FUN    
    
    _inited = False
    _configured = False
    
    Tpl = Tpl
    Node = Node
    Alias = Alias
    Tok = Tok
    Op = Op
    Func = Func
        
    def reduce(token_queue, op_queue, nop_queue, current_op=None, pos=0):
        nop = None 
        nop_index = 0
        #
        #    n-ary operatots (eg ternary) or composite operators
        #    as operators with multi-parts
        #    which use their own stack or equivalently
        #    lock their place on the OP_STACK
        #    until all the parts of the operator are
        #    unified and collapsed
        #    
        #    Equivalently n-ary ops are like ops which relate NOT to
        #    args but to other ops
        #    
        #    In this way the BRA_KET special op handling 
        #    can be made into an n-ary op with uniform handling
        #
        # TODO: maybe do some optimisation here when 2 operators can be combined into 1, etc..
        # e.g not is => isnot
        
        if current_op:
        
            opc = current_op
            
            # polymorphic operator
            # get the current operator morph, based on current context
            if T_POLY_OP == opc.type: 
                opc = opc.morph([pos,token_queue,op_queue])
            
            # n-ary/multi-part operator, initial part
            # push to nop_queue/op_queue
            if T_N_OP == opc.type:
                n = opc.node(None, pos, len(op_queue)+1)
                nop_queue.insert( 0, n )
                op_queue.insert( 0, n )
            
            else:
                if len(nop_queue):
                    nop = nop_queue[0]
                    nop_index = nop.op_index
                
                # n-ary/multi-part operator, further parts
                # combine one-by-one, until n-ary operator is complete
                if nop and nop.op_next( opc ):
                
                    while len(op_queue) > nop_index:
                        entry = op_queue.pop(0) 
                        op = entry.node
                        n = op.node(array_splice(token_queue, -op.arity, op.arity), entry.pos)
                        token_queue.append( n )
                    
                    
                    if nop.op_complete( ):
                        nop_queue.pop(0)
                        op_queue.pop(0)
                        opc = nop.node
                        nop.dispose( )
                        nop_index = nop_queue[0].op_index if len(nop_queue) else 0
                    else:
                        return
                
                
                fixity = opc.fixity
                if POSTFIX == fixity:
                    # postfix assumed to be already in correct order, 
                    # no re-structuring needed
                    n = opc.node(array_splice(token_queue, -opc.arity, opc.arity), pos)
                    token_queue.append( n )
                
                elif PREFIX == fixity:
                    # prefix assumed to be already in reverse correct order, 
                    # just push to op queue for later re-ordering
                    op_queue.insert( 0, Node(opc.otype, opc, None, pos) )
                
                else: # if INFIX == fixity:
                    while len(op_queue) > nop_index:
                    
                        entry = op_queue.pop(0)
                        op = entry.node
                        
                        if (op.priority < opc.priority) or (op.priority == opc.priority and (op.associativity < opc.associativity or (op.associativity == opc.associativity and op.associativity < 0))):
                        
                        
                            n = op.node(array_splice(token_queue, -op.arity, op.arity), entry.pos)
                            token_queue.append( n )
                        
                        else:
                            op_queue.insert( 0, entry )
                            break
                        
                    op_queue.insert( 0, Node(opc.otype, opc, None, pos) )
                
        else:
            while len(op_queue):
                entry = op_queue.pop(0) 
                op = entry.node
                n = op.node(array_splice(token_queue, -op.arity, op.arity), entry.pos)
                token_queue.append( n )
            

    def parse_delimited_block(s, i, l, delim, is_escaped=True):
        p = delim
        esc = False
        ch = ''
        is_escaped = bool(False != is_escaped)
        i += 1
        while i < l:
            ch = s[i] 
            i += 1
            p += ch
            if delim == ch and not esc: break
            esc = ((not esc) and ('\\' == ch)) if is_escaped else False
        return p
    
    def parse(xpr):
        get_entry = Alias.get_entry
        reduce = Xpresion.reduce
        RE = xpr.RE
        BLOCK = xpr.BLOCKS
        t_var_is_also_ident = 't_var' not in RE
        
        err = 0
        
        expr = xpr.source
        l = len(expr)
        xpr._cnt = 0
        xpr._symbol_table = { }
        xpr._cache = { }
        xpr.variables = { }
        AST = [ ] 
        OPS = [ ]
        NOPS = [ ]
        t_index = 0
        i = 0
        
        while i < l:
        
            ch = expr[ i ]
            
            # use customized (escaped) delimited blocks here
            # TODO: add a "date" block as well with #..#
            block = get_entry(BLOCK, ch)
            if block: # string or regex or date ('"`#)
            
                v = block['parse'](expr, i, l, ch)
                if False != v:
                
                    i += len(v)
                    if 'rest' in block:
                    
                        block_rest = block['rest'](expr, i, l)
                        if not block_rest: block_rest = ''
                    
                    else:
                    
                        block_rest = ''
                    
                    i += len(block_rest)
                    
                    t = xpr.t_block( v, block['type'], block_rest )
                    if False != t:
                    
                        t_index+=1
                        AST.append( t.node(None, t_index) )
                        continue
                    
                
            
            
            e = expr[ i: ]
            
            m = RE['t_spc'].match(e)
            if m: # space
            
                i += len(m.group( 0 ))
                continue
            

            m = RE['t_num'].match(e)
            if m: # number
            
                t = xpr.t_liter( m.group( 1 ), T_NUM )
                if False != t:
                
                    t_index+=1
                    AST.append( t.node(None, t_index) )
                    i += len(m.group( 0 ))
                    continue
                
            
            
            m = RE['t_ident'].match(e)
            if m: # ident, reserved, function, operator, etc..
            
                t = xpr.t_liter( m.group( 1 ), T_IDE ) # reserved keyword
                if False != t:
                
                    t_index+=1
                    AST.append( t.node(None, t_index) )
                    i += len(m.group( 0 ))
                    continue
                
                t = xpr.t_op( m.group( 1 ) ) # (literal) operator
                if False != t:
                
                    t_index+=1
                    reduce( AST, OPS, NOPS, t, t_index )
                    i += len(m.group( 0 ))
                    continue
                
                if t_var_is_also_ident:
                
                    t = xpr.t_var( m.group( 1 ) ) # variables are also same identifiers
                    if False != t:
                    
                        t_index+=1
                        AST.append( t.node(None, t_index) )
                        i += len(m.group( 0 ))
                        continue
                    
                
            
            m = RE['t_special'].match(e)
            if m: # special symbols..
            
                v = m.group( 1 ) 
                t = False
                while len(v) > 0: # try to match maximum length op/func
                
                    t = xpr.t_op( v ) # function, (non-literal) operator
                    if False != t: break
                    v = v[0:-1]
                
                if False != t:
                
                    t_index+=1
                    reduce( AST, OPS, NOPS, t, t_index )
                    i += len(v)
                    continue
                
            
            
            if not t_var_is_also_ident:
                m = RE['t_var'].match(e)
                if m: # variables
                
                    t = xpr.t_var( m.group( 1 ) )
                    if False != t:
                    
                        t_index+=1
                        AST.append( t.node(None, t_index) )
                        i += len(m.group( 0 ))
                        continue
                    
                
            
            m = RE['t_nonspc'].match(e)
            if m: # other non-space tokens/symbols..
            
                t = xpr.t_liter( m.group( 1 ), T_LIT ) # reserved keyword
                if False != t:
                
                    t_index+=1
                    AST.append( t.node(None, t_index) )
                    i += len(m.group( 0 ))
                    continue
                
                t = xpr.t_op( m.group( 1 ) ) # function, other (non-literal) operator
                if False != t:
                
                    t_index+=1
                    reduce( AST, OPS, NOPS, t, t_index )
                    i += len(m.group( 0 ))
                    continue
                
                t = xpr.t_tok( m.group( 1 ) )
                t_index+=1
                AST.append( t.node(None, t_index) ) # pass-through ..
                i += len(m.group( 0 ))
                #continue
            
        
        
        err = 0
        reduce( AST, OPS, NOPS )
        
        if (1 != len(AST)) or (len(OPS) > 0):
            err = 1
            errmsg = 'Parse Error, Mismatched Parentheses or Operators'
        
        if not err:
            
            try:
                
                evaluator = xpr.compile( AST[0] )
            
            except BaseException as e:
                
                err = 1
                errmsg = 'Compilation Error, ' + str(e) + ''
            
        
        NOPS = None 
        OPS = None 
        AST = None
        xpr._symbol_table = None
        
        if err:
            evaluator = None
            xpr.variables = [ ]
            xpr._cnt = 0
            xpr._cache = { }
            xpr._evaluator_str = ''
            xpr._evaluator = xpr.dummy_evaluator
            print( 'Xpresion Error: ' + errmsg + ' at ' + expr )
        else:
            # make array
            xpr.variables = list( xpr.variables.keys() )
            xpr._evaluator_str = evaluator[0]
            xpr._evaluator = evaluator[1]
        
        return xpr
    
    def render(tok, args=None):
        if None==args: args=[]
        return tok.render( args )
    
    def defRE(obj, RE=None):
        if isinstance(obj,dict):
            RE = RE if None!=RE else Xpresion.RE
            for k in obj: RE[ k ] = obj[ k ]
        return RE
    
    def defBlock(obj, BLOCK=None):
        if isinstance(obj,dict):
            BLOCK = BLOCK if None!=BLOCK else Xpresion.BLOCKS
            for k in obj: BLOCK[ k ] = obj[ k ]
        return BLOCK
    
    def defReserved(obj, Reserved=None):
        if isinstance(obj,dict):
            Reserved = Reserved if None!=Reserved else Xpresion.Reserved
            for k in obj: Reserved[ k ] = obj[ k ]
        return Reserved
    
    def defOp(obj, OPERATORS=None):
        if isinstance(obj,dict):
            OPERATORS = OPERATORS if None!=OPERATORS else Xpresion.OPERATORS
            for k in obj: OPERATORS[ k ] = obj[ k ]
        return OPERATORS
    
    def defFunc(obj, FUNCTIONS=None):
        if isinstance(obj,dict):
            FUNCTIONS = FUNCTIONS if None!=FUNCTIONS else Xpresion.FUNCTIONS
            for k in obj: FUNCTIONS[ k ] = obj[ k ]
        return FUNCTIONS
    
    def defRuntimeFunc(obj, Fn=None):
        if isinstance(obj,dict):
            Fn = Fn if None!=Fn else Xpresion.Fn
            for k in obj: Fn[ k ] = obj[ k ]
        return Fn

    def __init__(self, expr=None):
        self.source = None
        self.variables = None

        self.RE = None
        self.Reserved = None
        self.BLOCKS = None
        self.OPERATORS = None
        self.FUNCTIONS = None
        self.Fn = None

        self._cnt = 0
        self._cache = None
        self._symbol_table = None
        self._evaluator_str = None
        self._evaluator = None
        self.dummy_evaluator = None

        self.source = str(expr) if expr else ''
        self.setup( )
        Xpresion.parse( self )

    def __del__(self):
        self.dispose()
        
    def dispose(self):
        self.RE = None
        self.Reserved = None
        self.BLOCKS = None
        self.OPERATORS = None
        self.FUNCTIONS = None
        self.Fn = None
        self.dummy_evaluator = None

        self.source = None
        self.variables = None

        self._cnt = None
        self._symbol_table = None
        self._cache = None
        self._evaluator_str = None
        self._evaluator = None

        return self

    def setup(self):
        self.RE = Xpresion.RE
        self.Reserved = Xpresion.Reserved
        self.BLOCKS = Xpresion.BLOCKS
        self.OPERATORS = Xpresion.OPERATORS
        self.FUNCTIONS = Xpresion.FUNCTIONS
        self.Fn = Xpresion.Fn
        self.dummy_evaluator = dummy
        return self

    def compile(self, AST):
        # depth-first traversal and rendering of Abstract Syntax Tree (AST)
        evaluator_str = str(Node.DFT( AST, Xpresion.render, True ))
        return [evaluator_str, createFunction('Var,Fn,Cache', '    return ' + evaluator_str + '')]

    def evaluator(self, *args):
        if len(args):
            evaluator = args[0]
            if callable(evaluator): self._evaluator = evaluator
            return self
        return self._evaluator

    def evaluate(self, data=dict(), Fn=None):
        if None==Fn: Fn = self.Fn
        return self._evaluator( data, Fn, self._cache )

    def debug(self, data=None):
        out = [
        'Expression: ' + self.source,
        'Variables : [' + ','.join(self.variables) + ']',
        'Evaluator : ' + self._evaluator_str
        ]
        if None!=data:
            out.append('Data      : ' + pprint.pformat(data, 4))
            out.append('Result    : ' + pprint.pformat(self.evaluate(data), 4))
        return ("\n").join(out)

    def __str__(self):
        return '[Xpresion source]: ' + self.source + ''

    def t_liter(self, token, type):
        if T_NUM == type: return Tok(T_NUM, token, token)
        return Alias.get_entry(self.Reserved, token.lower( ))

    def t_block(self, token, type, rest=''):
        if T_STR == type:
            return Tok(T_STR, token, token)

        elif T_REX == type:
            sid = 're_'+token+rest
            if sid in self._symbol_table:
                id = self._symbol_table[sid]
            else:
                self._cnt += 1
                id = 're_' + str(self._cnt)
                flags = 0
                if 'i' in rest: flags|= re.I
                self._cache[ id ] = re.compile(token[1:-1], flags)
                self._symbol_table[sid] = id
            return Tok(T_REX, token, 'Cache["'+id+'"]')

        #elif T_DTM == type:
        #    rest = (rest || '').slice(1,-1);
        #    var sid = 'dt_'+token+rest, id, rs;
        #    if ( this._symbol_table[HAS](sid) ) 
        #    {
        #        id = this._symbol_table[sid];
        #    }
        #    else
        #    {
        #        id = 'dt_' + (++this._cnt);
        #        rs = token.slice(1,-1);
        #        this._cache[ id ] = DATE(rs, rest);
        #        this._symbol_table[sid] = id;
        #    }
        #    return Tok(T_DTM, token, 'Cache.'+id+'');
        return False

    def t_var(self, token):
        if token not in self.variables: self.variables[ token ] = token
        return Tok(T_VAR, token, 'Var["' + '"]["'.join(token.split('.')) + '"]')

    def t_op(self, token):
        op = False
        op = Alias.get_entry(self.FUNCTIONS, token)
        if False == op: op = Alias.get_entry(self.OPERATORS, token)
        return op

    def t_tok(self, token): 
        return Tok(T_DFT, token, token)

    def init( andConfigure=False ):
        if Xpresion._inited: return
        Xpresion.OPERATORS = {}
        Xpresion.FUNCTIONS = {}
        Xpresion.Fn = Fn
        Xpresion.RE = {}
        Xpresion.BLOCKS = {}
        Xpresion.Reserved = {}
        Xpresion._inited = True
        if True == andConfigure: Xpresion.defaultConfiguration( )

    def defaultConfiguration( ):
        if Xpresion._configured: return

        Xpresion.defOp({
        #-------------------------------------------------------------------------------------------------
        # symbol     input       ,fixity     ,associativity  ,priority   ,arity  ,output     ,output_type
        #--------------------------------------------------------------------------------------------------
                    # bra-kets as n-ary operators
         '('    :   Op(
                    ['(',')']   ,POSTFIX    ,RIGHT          ,1          ,1      ,'$0'       ,T_DUM 
                    )
        ,')'    :   Op(')')
        ,'['    :   Op(
                    ['[',']']   ,POSTFIX    ,RIGHT          ,2          ,1      ,'[$0]'     ,T_ARY 
                    )
        ,']'    :   Op(']')
        ,','    :   Op(
                    ','         ,INFIX      ,LEFT           ,3          ,2      ,'$0,$1'    ,T_DFT 
                    )
                    # n-ary (ternary) if-then-else operator
        ,'?'    :   Op(
                    ['?',':']   ,INFIX      ,RIGHT          ,100        ,3      ,'($1 if $0 else $2)'   ,T_BOL 
                    )
        ,':'    :   Op(':')
        
        ,'!'    :   Op(
                    '!'         ,PREFIX     ,RIGHT          ,10         ,1      ,'(not $0)' ,T_BOL 
                    )
        ,'~'    :   Op(
                    '~'         ,PREFIX     ,RIGHT          ,10         ,1      ,'~$0'      ,T_NUM 
                    )
        ,'^'    :   Op(
                    '^'         ,INFIX      ,RIGHT          ,11         ,2      ,'($0**$1)' ,T_NUM 
                    )
        ,'*'    :   Op(
                    '*'         ,INFIX      ,LEFT           ,20         ,2      ,'($0*$1)'  ,T_NUM 
                    ) 
        ,'/'    :   Op(
                    '/'         ,INFIX      ,LEFT           ,20         ,2      ,'($0/$1)'  ,T_NUM 
                    )
        ,'%'    :   Op(
                    '%'         ,INFIX      ,LEFT           ,20         ,2      ,'($0%$1)'  ,T_NUM 
                    )
                    # addition/concatenation/unary plus as polymorphic operators
        ,'+'    :   Op().Polymorphic([
                    # array concatenation
                    ["${TOK} and (not ${PREV_IS_OP}) and (${DEDUCED_TYPE}==Xpresion.T_ARY)", Op(
                    '+'         ,INFIX      ,LEFT           ,25         ,2      ,'Fn.ary_merge($0,$1)'  ,T_ARY 
                    )]
                    # string concatenation
                    ,["${TOK} and (not ${PREV_IS_OP}) and (${DEDUCED_TYPE}==Xpresion.T_STR)", Op(
                    '+'         ,INFIX      ,LEFT           ,25         ,2      ,'($0+str($1))' ,T_STR 
                    )]
                    # numeric addition
                    ,["${TOK} and not ${PREV_IS_OP}", Op(
                    '+'         ,INFIX      ,LEFT           ,25         ,2      ,'($0+$1)'  ,T_NUM 
                    )]
                    # unary plus
                    ,["(not ${TOK}) or ${PREV_IS_OP}", Op(
                    '+'         ,PREFIX     ,RIGHT          ,4          ,1      ,'$0'       ,T_NUM 
                    )]
                    ])
        ,'-'    :   Op().Polymorphic([
                    # numeric subtraction
                    ["${TOK} and not ${PREV_IS_OP}", Op(
                    '-'         ,INFIX      ,LEFT           ,25         ,2      ,'($0-$1)'  ,T_NUM 
                    )]
                    # unary negation
                    ,["(not ${TOK}) or ${PREV_IS_OP}", Op(
                    '-'         ,PREFIX     ,RIGHT          ,4          ,1      ,'(-$0)'        ,T_NUM 
                    )]
                    ])
        ,'>>'   :   Op(
                    '>>'        ,INFIX      ,LEFT           ,30         ,2      ,'($0>>$1)'     ,T_NUM 
                    )
        ,'<<'   :   Op(
                    '<<'        ,INFIX      ,LEFT           ,30         ,2      ,'($0<<$1)'     ,T_NUM 
                    )
        ,'>'    :   Op(
                    '>'         ,INFIX      ,LEFT           ,35         ,2      ,'($0>$1)'      ,T_BOL 
                    )
        ,'<'    :   Op(
                    '<'         ,INFIX      ,LEFT           ,35         ,2      ,'($0<$1)'      ,T_BOL 
                    )
        ,'>='   :   Op(
                    '>='        ,INFIX      ,LEFT           ,35         ,2      ,'($0>=$1)'     ,T_BOL 
                    )
        ,'<='   :   Op(
                    '<='        ,INFIX      ,LEFT           ,35         ,2      ,'($0<=$1)'     ,T_BOL 
                    )
        ,'=='   :   Op().Polymorphic([
                    # array equivalence
                    ["${DEDUCED_TYPE}==Xpresion.T_ARY", Op(
                    '=='        ,INFIX      ,LEFT           ,40         ,2      ,'Fn.ary_eq($0,$1)' ,T_BOL 
                    )]
                    # default equivalence
                    ,["True", Op(
                    '=='        ,INFIX      ,LEFT           ,40         ,2      ,'($0==$1)'     ,T_BOL 
                    )]
                    ])
        ,'!='   :   Op(
                    '!='        ,INFIX      ,LEFT           ,40         ,2      ,'($0!=$1)'     ,T_BOL 
                    )
        ,'matches': Op(
                    'matches'   ,INFIX      ,NONE           ,40         ,2      ,'Fn.match($1,$0)'  ,T_BOL 
                    )
        ,'in'   :   Op(
                    'in'        ,INFIX      ,NONE           ,40         ,2      ,'($0 in $1)'   ,T_BOL 
                    )
        ,'has'  :   Op(
                    'has'       ,INFIX      ,NONE           ,40         ,2      ,'($1 in $0)'   ,T_BOL 
                    )
        ,'&'    :   Op(
                    '&'         ,INFIX      ,LEFT           ,45         ,2      ,'($0&$1)'      ,T_NUM 
                    )
        ,'|'    :   Op(
                    '|'         ,INFIX      ,LEFT           ,46         ,2      ,'($0|$1)'      ,T_NUM 
                    )
        ,'&&'   :   Op(
                    '&&'        ,INFIX      ,LEFT           ,47         ,2      ,'($0 and $1)'  ,T_BOL 
                    )
        ,'||'   :   Op(
                    '||'        ,INFIX      ,LEFT           ,48         ,2      ,'($0 or $1)'   ,T_BOL 
                    )
        #------------------------------------------
        #                aliases
        #-------------------------------------------
        ,'or'    :  Alias( '||' )
        ,'and'   :  Alias( '&&' )
        ,'not'   :  Alias( '!' )
        })

        Xpresion.defFunc({
        #------------------------------------------------------------------------------------
        #symbol              input   ,output             ,output_type    ,priority(default 5)
        #------------------------------------------------------------------------------------
         'min'      : Func('min'    ,'min($0)'          ,T_NUM  )
        ,'max'      : Func('max'    ,'max($0)'          ,T_NUM  )
        ,'pow'      : Func('pow'    ,'Fn.pow($0)'       ,T_NUM  )
        ,'sqrt'     : Func('sqrt'   ,'math.sqrt($0)'    ,T_NUM  )
        ,'len'      : Func('len'    ,'Fn.len($0)'       ,T_NUM  )
        ,'int'      : Func('int'    ,'int($0)'          ,T_NUM  )
        ,'str'      : Func('str'    ,'str($0)'          ,T_STR  )
        ,'clamp'    : Func('clamp'  ,'Fn.clamp($0)'     ,T_NUM  )
        ,'sum'      : Func('sum'    ,'Fn.sum($0)'       ,T_NUM  )
        ,'avg'      : Func('avg'    ,'Fn.avg($0)'       ,T_NUM  )
        #---------------------------------------
        #                aliases
        #----------------------------------------
         # ...
        })

        # function implementations (can also be overriden per instance/evaluation call)
        #Xpresion.Fn = Fn

        Xpresion.defRE({
        #-----------------------------------------------
        #token                re
        #-------------------------------------------------
         't_spc'        :  re.compile(r'^(\s+)')
        ,'t_nonspc'     :  re.compile(r'^(\S+)')
        ,'t_special'    :  re.compile(r'^([*.\-+\\\/\^\$\(\)\[\]|?<:>&~%!#@=_,;{}]+)')
        ,'t_num'        :  re.compile(r'^(\d+(\.\d+)?)')
        ,'t_ident'      :  re.compile(r'^([a-zA-Z_][a-zA-Z0-9_]*)\b')
        ,'t_var'        :  re.compile(r'^\$([a-zA-Z0-9_][a-zA-Z0-9_.]*)\b')
        })

        Xpresion.defBlock({
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
        #,'#': {
        #    type: T_DTM, 
        #    parse: Xpresion.parse_delimited_block,
        #    rest: function(s,i,l){
        #        var rest = '"Y-m-d"', ch = i < l ? s.charAt( i ) : '';
        #        if ( '"' === ch || "'" === ch ) 
        #            rest = Xpresion.parse_delimited_block(s,i,l,ch,true);
        #        return rest;
        #    }
        #}
        })

        Xpresion.defReserved({
         'null'     : Tok(T_IDE, 'null', 'None')
        ,'false'    : Tok(T_BOL, 'false', 'False')
        ,'true'     : Tok(T_BOL, 'true', 'True')
        ,'infinity' : Tok(T_NUM, 'Infinity', 'Fn.INF')
        ,'nan'      : Tok(T_NUM, 'NaN', 'Fn.NAN')
        # aliases
        ,'none'     : Alias('null')
        ,'inf'      : Alias('infinity')
        })

        Xpresion._configured = True
    
Xpresion.init( )

# if used with 'import *'
__all__ = ['Xpresion']
