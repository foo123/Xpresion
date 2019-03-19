# -*- coding: UTF-8 -*-
##
#
#   Xpresion
#   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node.js and Browser
#   @version: 1.0.0
#
#   https://github.com/foo123/Xpresion
#
##
import re, time, datetime, calendar, math, pprint
from collections import namedtuple

# https://github.com/foo123/GrammarTemplate
def pad( s, n, z='0', pad_right=False ):
    ps = str(s)
    if pad_right:
        while len(ps) < n: ps += z
    else:
        while len(ps) < n: ps = z + ps
    return ps

GUID = 0
def guid( ):
    global GUID
    GUID += 1
    return pad(hex(int(time.time()))[2:],12)+'--'+pad(hex(GUID)[2:],4)

def is_array( v ):
    return isinstance(v, (list,tuple))


def compute_alignment( s, i, l ):
    alignment = ''
    while i < l:
        c = s[i]
        if (" " == c) or ("\r" == c) or ("\t" == c) or ("\v" == c) or ("\0" == c):
            alignment += c
            i += 1
        else:
            break
    return alignment

def align( s, alignment ):
    l = len(s)
    if l and len(alignment):
        aligned = '';
        for c in s:
            aligned += c
            if "\n" == c: aligned += alignment
    else:
        aligned = s
    return aligned

def walk( obj, keys, keys_alt=None, obj_alt=None ):
    found = 0
    if keys:
        o = obj
        l = len(keys)
        i = 0
        found = 1
        while i < l:
            k = keys[i]
            i += 1
            if o is not None:
                if isinstance(o,(list,tuple)) and int(k)<len(o):
                    o = o[int(k)]
                elif isinstance(o,dict) and (k in o):
                    o = o[k]
                else:
                    try:
                        o = getattr(o, k)
                    except AttributeError:
                        found = 0
                        break
            else:
                found = 0
                break
    if (not found) and keys_alt:
        o = obj
        l = len(keys_alt)
        i = 0
        found = 1
        while i < l:
            k = keys_alt[i]
            i += 1
            if o is not None:
                if isinstance(o,(list,tuple)) and int(k)<len(o):
                    o = o[int(k)]
                elif isinstance(o,dict) and (k in o):
                    o = o[k]
                else:
                    try:
                        o = getattr(o, k)
                    except AttributeError:
                        found = 0
                        break
            else:
                found = 0
                break
    if (not found) and (obj_alt is not None) and (obj_alt is not obj):
        if keys:
            o = obj_alt
            l = len(keys)
            i = 0
            found = 1
            while i < l:
                k = keys[i]
                i += 1
                if o is not None:
                    if isinstance(o,(list,tuple)) and int(k)<len(o):
                        o = o[int(k)]
                    elif isinstance(o,dict) and (k in o):
                        o = o[k]
                    else:
                        try:
                            o = getattr(o, k)
                        except AttributeError:
                            found = 0
                            break
                else:
                    found = 0
                    break
        if (not found) and keys_alt:
            o = obj_alt
            l = len(keys_alt)
            i = 0
            found = 1
            while i < l:
                k = keys_alt[i]
                i += 1
                if o is not None:
                    if isinstance(o,(list,tuple)) and int(k)<len(o):
                        o = o[int(k)]
                    elif isinstance(o,dict) and (k in o):
                        o = o[k]
                    else:
                        try:
                            o = getattr(o, k)
                        except AttributeError:
                            found = 0
                            break
                else:
                    found = 0
                    break
    return o if found else None


class StackEntry:
    def __init__(self, stack=None, value=None):
        self.prev = stack
        self.value = value

class TplEntry:
    def __init__(self, node=None, tpl=None ):
        if tpl: tpl.next = self
        self.node = node
        self.prev = tpl
        self.next = None

def multisplit( tpl, delims, postop=False ):
    IDL = delims[0]
    IDR = delims[1]
    OBL = delims[2]
    OBR = delims[3]
    lenIDL = len(IDL)
    lenIDR = len(IDR)
    lenOBL = len(OBL)
    lenOBR = len(OBR)
    ESC = '\\'
    OPT = '?'
    OPTR = '*'
    NEG = '!'
    DEF = '|'
    COMMENT = '#'
    TPL = ':='
    REPL = '{'
    REPR = '}'
    DOT = '.'
    REF = ':'
    ALGN = '@'
    #NOTALGN = '&'
    COMMENT_CLOSE = COMMENT+OBR
    default_value = None
    negative = 0
    optional = 0
    aligned = 0
    localised = 0
    l = len(tpl)

    delim1 = [IDL, lenIDL, IDR, lenIDR]
    delim2 = [OBL, lenOBL, OBR, lenOBR]
    delim_order = [None,0,None,0,None,0,None,0]

    postop = postop is True
    a = TplEntry({'type': 0, 'val': '', 'algn': ''})
    cur_arg = {
        'type'    : 1,
        'name'    : None,
        'key'     : None,
        'stpl'    : None,
        'dval'    : None,
        'opt'     : 0,
        'neg'     : 0,
        'algn'    : 0,
        'loc'     : 0,
        'start'   : 0,
        'end'     : 0
    }
    roottpl = a
    block = None
    opt_args = None
    subtpl = {}
    cur_tpl = None
    arg_tpl = {}
    start_tpl = None

    # hard-coded merge-sort for arbitrary delims parsing based on str len
    if delim1[1] < delim1[3]:
        s = delim1[0]
        delim1[2] = delim1[0]
        delim1[0] = s
        i = delim1[1]
        delim1[3] = delim1[1]
        delim1[1] = i
    if delim2[1] < delim2[3]:
        s = delim2[0]
        delim2[2] = delim2[0]
        delim2[0] = s
        i = delim2[1]
        delim2[3] = delim2[1]
        delim2[1] = i
    start_i = 0
    end_i = 0
    i = 0
    while (4 > start_i) and (4 > end_i):
        if delim1[start_i+1] < delim2[end_i+1]:
            delim_order[i] = delim2[end_i]
            delim_order[i+1] = delim2[end_i+1]
            end_i += 2
        else:
            delim_order[i] = delim1[start_i]
            delim_order[i+1] = delim1[start_i+1]
            start_i += 2
        i += 2
    while 4 > start_i:
        delim_order[i] = delim1[start_i]
        delim_order[i+1] = delim1[start_i+1]
        start_i += 2
        i += 2
    while 4 > end_i:
        delim_order[i] = delim2[end_i]
        delim_order[i+1] = delim2[end_i+1]
        end_i += 2
        i += 2

    stack = None
    s = ''

    i = 0
    while i < l:

        c = tpl[i]
        if ESC == c:
            s += tpl[i+1] if i+1 < l else ''
            i += 2
            continue

        delim = None
        if delim_order[0] == tpl[i:i+delim_order[1]]:
            delim = delim_order[0]
        elif delim_order[2] == tpl[i:i+delim_order[3]]:
            delim = delim_order[2]
        elif delim_order[4] == tpl[i:i+delim_order[5]]:
            delim = delim_order[4]
        elif delim_order[6] == tpl[i:i+delim_order[7]]:
            delim = delim_order[6]

        if IDL == delim:
            i += lenIDL

            if len(s):
                if 0 == a.node['type']: a.node['val'] += s
                else: a = TplEntry({'type': 0, 'val': s, 'algn': ''}, a)
            s = ''

        elif IDR == delim:
            i += lenIDR

            # argument
            argument = s
            s = ''
            p = argument.find(DEF)
            if -1 < p:
                default_value = argument[p+1:]
                argument = argument[0:p]
            else:
                default_value = None
            if postop:
                c = tpl[i] if i < l else ''
            else:
                c = argument[0]
            if OPT == c or OPTR == c:
                optional = 1
                if OPTR == c:
                    start_i = 1
                    end_i = -1
                else:
                    start_i = 0
                    end_i = 0
                if postop:
                    i += 1
                    if (i < l) and (NEG == tpl[i]):
                        negative = 1
                        i += 1
                    else:
                        negative = 0
                else:
                    if NEG == argument[1]:
                        negative = 1
                        argument = argument[2:]
                    else:
                        negative = 0
                        argument = argument[1:]
            elif REPL == c:
                if postop:
                    s = ''
                    j = i+1
                    jl = l
                    while (j < jl) and (REPR != tpl[j]):
                        s += tpl[j]
                        j += 1
                    i = j+1
                else:
                    s = ''
                    j = 1
                    jl = len(argument)
                    while (j < jl) and (REPR != argument[j]):
                        s += argument[j]
                        j += 1
                    argument = argument[j+1:]
                s = s.split(',')
                if len(s) > 1:
                    start_i = s[0].strip()
                    start_i = int(start_i,10) if len(start_i) else 0
                    end_i = s[1].strip()
                    end_i = int(end_i,10) if len(end_i) else -1
                    optional = 1
                else:
                    start_i = s[0].strip()
                    start_i = int(start_i,10) if len(start_i) else 0
                    end_i = start_i
                    optional = 0
                s = ''
                negative = 0
            else:
                optional = 0
                negative = 0
                start_i = 0
                end_i = 0
            if negative and default_value is None: default_value = ''

            c = argument[0]
            if ALGN == c:
                aligned = 1
                argument = argument[1:]
            else:
                aligned = 0

            c = argument[0]
            if DOT == c:
                localised = 1
                argument = argument[1:]
            else:
                localised = 0

            p = argument.find(REF)
            template = argument.split(REF) if -1 < p else [argument,None]
            argument = template[0]
            template = template[1]
            p = argument.find(DOT)
            nested = argument.split(DOT) if -1 < p else None

            if cur_tpl and (cur_tpl not in arg_tpl): arg_tpl[cur_tpl] = {}

            if TPL+OBL == tpl[i:i+2+lenOBL]:
                # template definition
                i += 2
                template = template if template and len(template) else 'grtpl--'+guid()
                start_tpl = template
                if cur_tpl and len(argument):
                    arg_tpl[cur_tpl][argument] = template

            if not len(argument): continue # template definition only

            if (template is None) and cur_tpl and (cur_tpl in arg_tpl) and (argument in arg_tpl[cur_tpl]):
                template = arg_tpl[cur_tpl][argument]

            if optional and not cur_arg['opt']:
                cur_arg['name'] = argument
                cur_arg['key'] = nested
                cur_arg['stpl'] = template
                cur_arg['dval'] = default_value
                cur_arg['opt'] = optional
                cur_arg['neg'] = negative
                cur_arg['algn'] = aligned
                cur_arg['loc'] = localised
                cur_arg['start'] = start_i
                cur_arg['end'] = end_i
                # handle multiple optional arguments for same optional block
                opt_args = StackEntry(None, [argument,nested,negative,start_i,end_i,optional,localised])

            elif optional:
                # handle multiple optional arguments for same optional block
                if (start_i != end_i) and (cur_arg['start'] == cur_arg['end']):
                    # set as main arg a loop arg, if exists
                    cur_arg['name'] = argument
                    cur_arg['key'] = nested
                    cur_arg['stpl'] = template
                    cur_arg['dval'] = default_value
                    cur_arg['opt'] = optional
                    cur_arg['neg'] = negative
                    cur_arg['algn'] = aligned
                    cur_arg['loc'] = localised
                    cur_arg['start'] = start_i
                    cur_arg['end'] = end_i
                opt_args = StackEntry(opt_args, [argument,nested,negative,start_i,end_i,optional,localised])

            elif (not optional) and (cur_arg['name'] is None):
                cur_arg['name'] = argument
                cur_arg['key'] = nested
                cur_arg['stpl'] = template
                cur_arg['dval'] = default_value
                cur_arg['opt'] = 0
                cur_arg['neg'] = negative
                cur_arg['algn'] = aligned
                cur_arg['loc'] = localised
                cur_arg['start'] = start_i
                cur_arg['end'] = end_i
                # handle multiple optional arguments for same optional block
                opt_args = StackEntry(None, [argument,nested,negative,start_i,end_i,0,localised])

            if 0 == a.node['type']: a.node['algn'] = compute_alignment(a.node['val'], 0, len(a.node['val']))
            a = TplEntry({
                'type'    : 1,
                'name'    : argument,
                'key'     : nested,
                'stpl'    : template,
                'dval'    : default_value,
                'opt'     : optional,
                'algn'    : aligned,
                'loc'     : localised,
                'start'   : start_i,
                'end'     : end_i
            }, a)

        elif OBL == delim:
            i += lenOBL

            if len(s):
                if 0 == a.node['type']: a.node['val'] += s
                else: a = TplEntry({'type': 0, 'val': s, 'algn': ''}, a)
            s = ''

            # comment
            if COMMENT == tpl[i]:
                j = i+1
                jl = l
                while (j < jl) and (COMMENT_CLOSE != tpl[j:j+lenOBR+1]):
                    s += tpl[j]
                    j += 1
                i = j+lenOBR+1
                if 0 == a.node['type']: a.node['algn'] = compute_alignment(a.node['val'], 0, len(a.node['val']))
                a = TplEntry({'type': -100, 'val': s}, a)
                s = ''
                continue

            # optional block
            stack = StackEntry(stack, [a, block, cur_arg, opt_args, cur_tpl, start_tpl])
            if start_tpl: cur_tpl = start_tpl
            start_tpl = None
            cur_arg = {
                'type'    : 1,
                'name'    : None,
                'key'     : None,
                'stpl'    : None,
                'dval'    : None,
                'opt'     : 0,
                'neg'     : 0,
                'algn'    : 0,
                'loc'     : 0,
                'start'   : 0,
                'end'     : 0
            }
            opt_args = None
            a = TplEntry({'type': 0, 'val': '', 'algn': ''})
            block = a

        elif OBR == delim:
            i += lenOBR

            b = a
            cur_block = block
            prev_arg = cur_arg
            prev_opt_args = opt_args
            if stack:
                a = stack.value[0]
                block = stack.value[1]
                cur_arg = stack.value[2]
                opt_args = stack.value[3]
                cur_tpl = stack.value[4]
                start_tpl = stack.value[5]
                stack = stack.prev
            else:
                a = None

            if len(s):
                if 0 == b.node['type']: b.node['val'] += s
                else: b = TplEntry({'type': 0, 'val': s, 'algn': ''}, b)
            s = ''

            if start_tpl:
                subtpl[start_tpl] = TplEntry({
                    'type'    : 2,
                    'name'    : prev_arg['name'],
                    'key'     : prev_arg['key'],
                    'loc'     : prev_arg['loc'],
                    'algn'    : prev_arg['algn'],
                    'start'   : prev_arg['start'],
                    'end'     : prev_arg['end'],
                    'opt_args': None,#opt_args
                    'tpl'     : cur_block
                })
                start_tpl = None
            else:
                if 0 == a.node['type']: a.node['algn'] = compute_alignment(a.node['val'], 0, len(a.node['val']))
                a = TplEntry({
                    'type'    : -1,
                    'name'    : prev_arg['name'],
                    'key'     : prev_arg['key'],
                    'loc'     : prev_arg['loc'],
                    'algn'    : prev_arg['algn'],
                    'start'   : prev_arg['start'],
                    'end'     : prev_arg['end'],
                    'opt_args': prev_opt_args,
                    'tpl'     : cur_block
                }, a)

        else:
            c = tpl[i]
            i += 1
            if "\n" == c:
                # note line changes to handle alignments
                if len(s):
                    if 0 == a.node['type']: a.node['val'] += s
                    else: a = TplEntry({'type': 0, 'val': s, 'algn': ''}, a)
                s = ''
                if 0 == a.node['type']: a.node['algn'] = compute_alignment(a.node['val'], 0, len(a.node['val']))
                a = TplEntry({'type': 100, 'val': "\n"}, a)
            else:
                s += c

    if len(s):
        if 0 == a.node['type']: a.node['val'] += s
        else: a = TplEntry({'type': 0, 'val': s, 'algn': ''}, a)
    if 0 == a.node['type']: a.node['algn'] = compute_alignment(a.node['val'], 0, len(a.node['val']))
    return [roottpl, subtpl]

def optional_block( args, block, SUB=None, FN=None, index=None, alignment='', orig_args=None ):
    out = ''
    block_arg = None

    if -1 == block['type']:
        # optional block, check if optional variables can be rendered
        opt_vars = block['opt_args']
        # if no optional arguments, render block by default
        if opt_vars and opt_vars.value[5]:
            while opt_vars:
                opt_v = opt_vars.value
                opt_arg = walk( args, opt_v[1], [str(opt_v[0])], None if opt_v[6] else orig_args )
                if (block_arg is None) and (block['name'] == opt_v[0]): block_arg = opt_arg

                if ((0 == opt_v[2]) and (opt_arg is None)) or ((1 == opt_v[2]) and (opt_arg is not None)): return ''
                opt_vars = opt_vars.prev
    else:
        block_arg = walk( args, block['key'], [str(block['name'])], None if block['loc'] else orig_args )

    arr = is_array( block_arg )
    lenn = len(block_arg) if arr else -1
    #if not block['algn']: alignment = ''
    if arr and (lenn > block['start']):
        rs = block['start']
        re = lenn-1 if -1==block['end'] else min(block['end'],lenn-1)
        ri = rs
        while ri <= re:
            out += main( args, block['tpl'], SUB, FN, ri, alignment, orig_args )
            ri += 1
    elif (not arr) and (block['start'] == block['end']):
        out = main( args, block['tpl'], SUB, FN, None, alignment, orig_args )

    return out

def non_terminal( args, symbol, SUB=None, FN=None, index=None, alignment='', orig_args=None ):
    out = ''
    if symbol['stpl'] and ((SUB and (symbol['stpl'] in SUB)) or (symbol['stpl'] in GrammarTemplate.subGlobal) or (FN and ((symbol['stpl'] in FN) or ('*' in FN))) or ((symbol['stpl'] in GrammarTemplate.fnGlobal) or ('*' in GrammarTemplate.fnGlobal))):
        # using custom function or sub-template
        opt_arg = walk( args, symbol['key'], [str(symbol['name'])], None if symbol['loc'] else orig_args )

        if (SUB and (symbol['stpl'] in SUB)) or (symbol['stpl'] in GrammarTemplate.subGlobal):
            # sub-template
            if (index is not None) and ((0 != index) or (symbol['start'] != symbol['end']) or (not symbol['opt'])) and is_array(opt_arg):
                opt_arg = opt_arg[ index ] if index < len(opt_arg) else None

            if (opt_arg is None) and (symbol['dval'] is not None):
                # default value if missing
                out = symbol['dval']
            else:
                # try to associate sub-template parameters to actual input arguments
                tpl = SUB[symbol['stpl']].node if SUB and (symbol['stpl'] in SUB) else GrammarTemplate.subGlobal[symbol['stpl']].node
                tpl_args = {}
                if opt_arg is not None:
                    if is_array(opt_arg): tpl_args[tpl['name']] = opt_arg
                    else: tpl_args = opt_arg
                out = optional_block( tpl_args, tpl, SUB, FN, None, alignment if symbol['algn'] else '', args if orig_args is None else orig_args )
                #if symbol['algn']: out = align(out, alignment)
        else:#elif fn:
            # custom function
            fn = None
            if   FN and (symbol['stpl'] in FN):              fn = FN[symbol['stpl']]
            elif FN and ('*' in FN):                         fn = FN['*']
            elif symbol['stpl'] in GrammarTemplate.fnGlobal: fn = GrammarTemplate.fnGlobal[symbol['stpl']]
            elif '*' in GrammarTemplate.fnGlobal:            fn = GrammarTemplate.fnGlobal['*']

            if is_array(opt_arg):
                index = index if index is not None else symbol['start']
                opt_arg = opt_arg[ index ] if index < len(opt_arg) else None

            if callable(fn):
                fn_arg = {
                    #'value'               : opt_arg,
                    'symbol'              : symbol,
                    'index'               : index,
                    'currentArguments'    : args,
                    'originalArguments'   : orig_args,
                    'alignment'           : alignment
                }
                opt_arg = fn( opt_arg, fn_arg )
            else:
                opt_arg = str(fn)

            out = symbol['dval'] if (opt_arg is None) and (symbol['dval'] is not None) else str(opt_arg)
            if symbol['algn']: out = align(out, alignment)

    elif symbol['opt'] and (symbol['dval'] is not None):
        # boolean optional argument
        out = symbol['dval']

    else:
        # plain symbol argument
        opt_arg = walk( args, symbol['key'], [str(symbol['name'])], None if symbol['loc'] else orig_args )

        # default value if missing
        if is_array(opt_arg):
            index = index if index is not None else symbol['start']
            opt_arg = opt_arg[ index ] if index < len(opt_arg) else None
        out = symbol['dval'] if (opt_arg is None) and (symbol['dval'] is not None) else str(opt_arg)
        if symbol['algn']: out = align(out, alignment)

    return out

def main( args, tpl, SUB=None, FN=None, index=None, alignment='', orig_args=None ):
    out = ''
    current_alignment = alignment
    while tpl:
        tt = tpl.node['type']
        if -1 == tt: # optional code-block
            out += optional_block( args, tpl.node, SUB, FN, index, current_alignment if tpl.node['algn'] else alignment, orig_args )
        elif 1 == tt: # non-terminal
            out += non_terminal( args, tpl.node, SUB, FN, index, current_alignment if tpl.node['algn'] else alignment, orig_args )
        elif 0 == tt: # terminal
            current_alignment += tpl.node['algn']
            out += tpl.node['val']
        elif 100 == tt: # new line
            current_alignment = alignment
            out += "\n" + alignment
        #elif -100 == tt: # comment
        #    # pass
        tpl = tpl.next
    return out


class GrammarTemplate:
    """
    GrammarTemplate for Python,
    https://github.com/foo123/GrammarTemplate
    """

    VERSION = '3.0.0'


    defaultDelimiters = ['<','>','[',']']
    fnGlobal = {}
    subGlobal = {}
    guid = guid
    multisplit = multisplit
    align = align
    main = main

    def __init__(self, tpl='', delims=None, postop=False):
        self.id = None
        self.tpl = None
        self.fn = {}
        # lazy init
        self._args = [ tpl, delims if delims else GrammarTemplate.defaultDelimiters, postop ]

    def __del__(self):
        self.dispose()

    def dispose(self):
        self.id = None
        self.tpl = None
        self.fn = None
        self._args = None
        return self

    def parse(self):
        if (self.tpl is None) and (self._args is not None):
            # lazy init
            self.tpl = GrammarTemplate.multisplit( self._args[0], self._args[1], self._args[2] )
            self._args = None
        return self

    def render(self, args=None):
        # lazy init
        if self.tpl is None: self.parse( )
        return GrammarTemplate.main( {} if None == args else args, self.tpl[0], self.tpl[1], self.fn )


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


def dummy( *args ):
    return None

def evaluator_factory(evaluator_str,Fn,Cache):
    evaluator_factory = createFunction('Fn,Cache', "\n".join([
    '    def evaluator(Var):',
    '        return ' + evaluator_str,
    '    return evaluator'
    ]), {'math':math,'Xpresion':Xpresion})
    return evaluator_factory(Fn,Cache)


default_date_locale = {
 'meridian': { 'am':'am', 'pm':'pm', 'AM':'AM', 'PM':'PM' }
,'ordinal': { 'ord':{1:'st',2:'nd',3:'rd'}, 'nth':'th' }
,'timezone': [ 'UTC','EST','MDT' ]
,'timezone_short': [ 'UTC','EST','MDT' ]
,'day': [ 'Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday' ]
,'day_short': [ 'Sun','Mon','Tue','Wed','Thu','Fri','Sat' ]
,'month': [ 'January','February','March','April','May','June','July','August','September','October','November','December' ]
,'month_short': [ 'Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec' ]
}

def php_time( ):
    return int(time.time())

def php_date( format, timestamp=None ):
    global default_date_locale
    locale = default_date_locale
    # http://php.net/manual/en/datetime.formats.date.php
    # http://strftime.org/
    # https://docs.python.org/2/library/time.html
    # adapted from http://brandonwamboldt.ca/python-php-date-class-335/
    if timestamp is None: timestamp = php_time( )
    utime = timestamp
    dtime  = datetime.datetime.fromtimestamp(timestamp)

    D = { }
    w = dtime.weekday()
    W = dtime.isocalendar()[1]
    d = dtime.day
    dmod10 = d % 10
    n = dtime.month
    Y = dtime.year
    g = int(dtime.strftime("%I"))
    G = int(dtime.strftime("%H"))
    meridian = dtime.strftime("%p")
    tzo = int(time.timezone / 60)
    atzo = abs(tzo)

    # Calculate and return Swatch Internet Time
    # http://code.activestate.com/recipes/578473-calculating-swatch-internet-time-or-beats/
    lh, lm, ls = time.localtime()[3:6]
    beats = ((lh * 3600) + (lm * 60) + ls + time.timezone) / 86.4
    if beats > 1000: beats -= 1000
    elif beats < 0: beats += 1000

    # Day --
    D['d'] = str( d ).zfill(2)
    D['D'] = locale['day_short'][ w ]
    D['j'] = str( d )
    D['l'] = locale['day'][ w ]
    D['N'] = str( w if 0 < w else 7 )
    D['S'] = locale['ordinal']['ord'][ d ] if d in locale['ordinal']['ord'] else (locale['ordinal']['ord'][ dmod10 ] if dmod10 in locale['ordinal']['ord'] else locale['ordinal']['nth'])
    D['w'] = str( w )
    D['z'] = str( dtime.timetuple().tm_yday )

    # Week --
    D['W'] = str( W )

    # Month --
    D['F'] = locale['month'][ n ]
    D['m'] = str( n ).zfill(2)
    D['M'] = locale['month_short'][ n ]
    D['n'] = str( n )
    D['t'] = str( calendar.monthrange(Y, n)[1] )

    # Year --
    D['L'] = str( int(calendar.isleap(Y)) )
    D['o'] = str(Y + (1 if n == 12 and W < 9 else (-1 if n == 1 and W > 9 else 0)))
    D['Y'] = str( Y )
    D['y'] = str( Y )[2:]

    # Time --
    D['a'] = locale['meridian'][meridian.lower()] if meridian.lower() in locale['meridian'] else meridian.lower()
    D['A'] = locale['meridian'][meridian] if meridian in locale['meridian'] else meridian
    D['B'] = str( int(beats) ).zfill(3)
    D['g'] = str( g )
    D['G'] = str( G )
    D['h'] = str( g ).zfill(2)
    D['H'] = str( G ).zfill(2)
    D['i'] = str( dtime.minute ).zfill(2)
    D['s'] = str( dtime.second ).zfill(2)
    D['u'] = str( dtime.microsecond ).zfill(6)

    # Timezone --
    D['e'] = '' # TODO, missing
    D['I'] = str( dtime.dst() )
    D['O'] = ('-' if tzo > 0 else '+')+str(int(atzo / 60) * 100 + atzo % 60).zfill(4)
    D['P'] = D['O'][:3]+':'+D['O'][3:]
    D['T'] = 'UTC'
    D['Z'] = str(-tzo*60)

    # Full Date/Time --
    D['c'] = ''.join([ D['Y'],'-',D['m'],'-',D['d'],'\\',D['T'],D['H'],':',D['i'],':',D['s'],D['P'] ])
    D['r'] = ''.join([ D['D'],', ',D['d'],' ',D['M'],' ',D['Y'],' ',D['H'],':',D['i'],':',D['s'],' ',D['O'] ])
    D['U'] = str( utime )

    formatted_datetime = ''
    for f in format: formatted_datetime += D[f] if f in D else f
    return formatted_datetime


def parse_re_flags(s,i,l):
    flags = ''
    has_i = False
    has_g = False
    has_m = False
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

        if 'm' == ch and not has_m:
            flags += 'm'
            has_m = True

        if 'g' == ch and not has_g:
            flags += 'g'
            has_g = True

        if seq >= 3 or (not has_i and not has_g and not has_m):
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
T_MIX       =   1
T_DFT       =   T_MIX
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
T_EMPTY     =   1024

T_REGEXP = type(NEWLINE)


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
        andDispose = bool(andDispose is not False)
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
                arity = op.arity
                if (T_OP & op.type) and 0 == arity: arity = 1 # have already padded with empty token
                elif arity > len(output) and op.arity_min <= op.arity: arity = op.arity_min
                o = action(op, array_splice(output, -arity, arity))
                output.append( o )
                if andDispose: node.dispose( )


        stack = None
        return output[ 0 ]

    def __init__(self, type, arity, node, children=None, pos=0):
        self.type = type
        self.arity = arity
        self.node = node
        self.children = children
        self.pos = pos
        self.op_parts = None
        self.op_def = None
        self.op_index = None

    def __del__(self):
        self.dispose()

    def dispose(self):
        c = self.children
        if c and len(c):
            for ci in c:
                if ci: ci.dispose( )

        self.type = None
        self.arity = None
        self.pos = None
        self.node = None
        self.op_parts = None
        self.op_def = None
        self.op_index = None
        self.children = None
        return self


    def op_next(self, op, pos, op_queue, token_queue):
        num_args = 0
        next_index = -1
        try:
            next_index = self.op_parts.index( op.input )
        except:
            next_index = -1
        is_next = (0 == next_index)
        if is_next:
            if 0 == self.op_def[0][0]:
                num_args = Op.match_args(self.op_def[0][2], pos-1, op_queue, token_queue )
                if num_args is False:
                    is_next = False
                else:
                    self.arity = num_args
                    self.op_def.pop(0)

        if is_next:
            self.op_def.pop(0)
            self.op_parts.pop(0)
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
        self.arity_min = 0
        self.arity_max = 0
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
        self.arity_min = None
        self.arity_max = None
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

        if isinstance(token,GrammarTemplate): out = str(token.render( {'$':args} ))
        else:                                 out = str(token)
        return lparen + out + rparen

    def node(self, args=None, pos=0):
        return Node(self.type, self.arity, self, args if args else None, pos)

    def __str__(self):
        return str(self.output)


class Op(Tok):
    def Condition(f):
        if isinstance(f[0],str):
            try:
                f[0] = createFunction('curr,Xpresion', '    return '+f[0])
            except BaseException:
                f[0] = None
        return [
        f[0] if callable(f[0]) else None
        ,f[1]
        ]

    def parse_definition(op_def):
        parts = []
        op = []
        arity = 0
        arity_min = 0
        arity_max = 0
        if isinstance(op_def, str):
            # assume infix, arity = 2;
            op_def = [1,op_def,1]
        else:
            op_def = list(op_def)
        for i in range(len(op_def)):
            if isinstance(op_def[i], str):
                parts.append(op_def[i])
                op.append([1, i, op_def[i]])
            else:
                op.append([0, i, op_def[i]])
                num_args = abs(op_def[i])
                arity += num_args
                arity_max += num_args
                arity_min += op_def[i]

        if 1 == len(parts) and 1 == len(op):
            op = [[0, 0, 1], [1, 1, parts[0]], [0, 2, 1]]
            arity = 2
            arity_min = 2
            arity_max = 2
            type = T_OP
        else:
            type = T_N_OP if len(parts) > 1 else T_OP
        return [type, op, parts, arity, max(0, arity_min), arity_max]

    def match_args(expected_args, args_pos, op_queue, token_queue):
        tl = len(token_queue)
        t = tl-1
        num_args = 0
        num_expected_args = abs(expected_args)
        INF = -10
        while num_args < num_expected_args or t >= 0:
            p2 = INF if t < 0 else token_queue[t].pos
            if args_pos == p2:
                num_args+=1
                args_pos-=1
                t-=1
            else: break
        return num_expected_args if num_args >= num_expected_args else (0 if expected_args <= 0 else False)

    def __init__(self, input='', output='', otype=None, fixity=None, associativity=None, priority=None, ofixity=None):
        opdef = Op.parse_definition( input )
        self.type = opdef[0]
        self.opdef = opdef[1]
        self.parts = opdef[2]

        if not isinstance(output, GrammarTemplate): output = GrammarTemplate(str(output))

        super(Op, self).__init__(self.type, self.parts[0], output)

        self.fixity = fixity if fixity is not None else PREFIX
        self.associativity = associativity if associativity is not None else DEFAULT
        self.priority = priority if priority is not None else 1000
        self.arity = opdef[3]
        #self.arity = arity
        self.otype = otype if otype is not None else T_MIX
        self.ofixity = ofixity if ofixity is not None else self.fixity
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
        self.opdef = None
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

        # [pos,token_queue,op_queue]
        if len(args) < 7:
            args.append(args[1][-1] if len(args[1]) else False)
            args.append(args[2][0] if len(args[2]) else False)
            args.append((args[4].pos+1==args[0]) if args[4] else False)
            args.append(args[4].type if args[4] else (args[3].type if args[3] else 0))
            #args.append(Xpresion)

        # {'${POS}':0,'${TOKS}':1,'${OPS}':2,'${TOK}':3,'${OP}':4,'${PREV_IS_OP}':5,'${DEDUCED_TYPE}':6,'Xpresion':7}
        #nargs = {
        #    'POS': args[0],
        #    'TOKS': args[1],
        #    'OPS': args[2],
        #    'TOK': args[3],
        #    'OP': args[4],
        #    'PREV_IS_OP' : args[5],
        #    'DEDUCED_TYPE': args[6]#,
        #    #'Xpresion': args[7]
        #}
        nargs = namedtuple("stdClass", ['POS','TOKS','OPS','TOK','OP','PREV_IS_OP','DEDUCED_TYPE'])(*args)

        while i < l:
            op = morphes[i]
            i += 1
            matched = bool(op[0]( nargs, Xpresion ))
            if True == matched:
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

        if isinstance(op, GrammarTemplate):
            out = lparen + str(op.render( {'$':args} )) + rparen
        elif INFIX == out_fixity:
            out = lparen + str(op).join(args) + rparen
        elif POSTFIX == out_fixity:
            out = lparen + comma.join(args) + rparen + str(op)
        else: # if PREFIX == out_fixity:
            out = str(op) + lparen + comma.join(args) + rparen
        return Tok(output_type, out, out)

    def validate(self, pos, op_queue, token_queue ):
        num_args = 0
        msg = ''
        if 0 == self.opdef[0][0]: # expecting argument(s)
            num_args = Op.match_args(self.opdef[0][2], pos-1, op_queue, token_queue )
            if num_args is False:
                msg = 'Operator "' + str(self.input) + '" expecting ' + str(self.opdef[0][2]) + ' prior argument(s)'
        return [num_args, msg]

    def node(self, args=None, pos=0, op_queue=None, token_queue=None):
        otype = self.otype
        if None==args: args = []
        if self.revert: args = args[::-1]
        if (T_DUM == otype) and len(args): otype = args[ 0 ].type
        elif len(args): args[0].type = otype
        n = Node(otype, self.arity, self, args, pos)
        if T_N_OP == self.type and None != op_queue:
            n.op_parts = self.parts[1:]
            n.op_def = self.opdef[2:] if 0 == self.opdef[0][0] else self.opdef[1:]
            n.op_index = len(op_queue)+1
        return n

class Func(Op):

    def __init__(self, input='', output='', otype=None, priority=None, arity=None, associativity=None, ofixity=None):
        super(Func, self).__init__(
            [input, arity if arity is not None else 1] if isinstance(input, str) else input,
            output,
            otype if otype is not None else T_MIX,
            PREFIX,
            associativity if associativity is not None else RIGHT,
            priority if priority is not None else 1,
            ofixity if ofixity is not None else PREFIX
        )
        self.type = T_FUN

    def __del__(self):
        self.dispose()


class Fn:

    def __init__(self):
        self.INF = float("inf")
        self.NAN = float("nan")


class Configuration:

    def __init__(self, conf=None):
        self.RE = {}
        self.BLOCKS = {}
        self.RESERVED = {}
        self.OPERATORS = {}
        self.FUNCTIONS = {}
        self.FN = Fn()

        if conf and isinstance(conf, dict):
            if 're' in conf:
                self.defRE(conf['re'])
            if 'blocks' in conf:
                self.defBlock(conf['blocks'])
            if 'reserved' in conf:
                self.defReserved(conf['reserved'])
            if 'operators' in conf:
                self.defOp(conf['operators'])
            if 'functions' in conf:
                self.defFunc(conf['functions'])
            if 'runtime' in conf:
                self.defRuntimeFunc(conf['runtime'])

    def __del__(self):
        self.dispose()

    def dispose(self):
        self.RE = None
        self.BLOCKS = None
        self.RESERVED = None
        self.OPERATORS = None
        self.FUNCTIONS = None
        self.FN = None
        return self

    def defRE(self, obj):
        if isinstance(obj,dict):
            for k in obj: self.RE[ k ] = obj[ k ]
        return self

    def defBlock(self, obj):
        if isinstance(obj,dict):
            for k in obj: self.BLOCKS[ k ] = obj[ k ]
        return self

    def defReserved(self, obj):
        if isinstance(obj,dict):
            for k in obj: self.RESERVED[ k ] = obj[ k ]
        return self

    def defOp(self, obj):
        if isinstance(obj,dict):
            for k in obj:
                op = obj[ k ]
                if not op: continue

                if isinstance(op, Alias) or isinstance(op, Op):
                    self.OPERATORS[ k ] = op
                    continue

                if ('polymorphic' in op) and (op['polymorphic']):
                    def mapper(entry):
                        if isinstance(entry,dict):
                            func = entry['check']
                            op = entry['op']
                        else:#if isinstance(entry,(list,tuple)):
                            func = entry[0]
                            op = entry[1]
                        op = op if isinstance(op, Op) else Op(
                        op['input'],
                        op['output'] if 'output' in op else '',
                        op['otype'] if 'otype' in op else None,
                        op['fixity'] if 'fixity' in op else None,
                        op['associativity'] if 'associativity' in op else None,
                        op['priority'] if 'priority' in op else None,
                        op['ofixity'] if 'ofixity' in op else None
                        )
                        return [func, op]

                    self.OPERATORS[ k ] = Op().Polymorphic(list(map(mapper, op['polymorphic'])))
                else:
                    self.OPERATORS[ k ] = Op(
                    op['input'],
                    op['output'] if 'output' in op else '',
                    op['otype'] if 'otype' in op else None,
                    op['fixity'] if 'fixity' in op else None,
                    op['associativity'] if 'associativity' in op else None,
                    op['priority'] if 'priority' in op else None,
                    op['ofixity'] if 'ofixity' in op else None
                    )
        return self

    def defFunc(self, obj):
        if isinstance(obj,dict):
            for k in obj:
                op = obj[ k ]
                if not op: continue

                if isinstance(op, Alias) or isinstance(op, Func):
                    self.FUNCTIONS[ k ] = op
                    continue

                self.FUNCTIONS[ k ] = Func(
                op['input'],
                op['output'] if 'output' in op else '',
                op['otype'] if 'otype' in op else None,
                op['priority'] if 'priority' in op else None,
                op['arity'] if 'arity' in op else None,
                op['associativity'] if 'associativity' in op else None,
                op['ofixity'] if 'ofixity' in op else None
                )
        return self

    def defRuntimeFunc(self, obj):
        if isinstance(obj,dict):
            #fix: TypeError: 'type' object does not support item assignment
            # use setattr
            for k in obj: setattr(self.FN, k, obj[ k ])
            #for k in obj: self.FN[ k ] = obj[ k ]
        return self


class Xpresion:
    """
    Xpresion for Python,
    https://github.com/foo123/Xpresion
    """

    VERSION = "1.0.0"

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
    T_MIX       = T_MIX
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
    T_EMPTY     = T_EMPTY

    EMPTY_TOKEN = Tok(T_EMPTY, '', '')
    CONF = None

    _inited = False

    Tpl = GrammarTemplate
    Configuration = Configuration
    Node = Node
    Alias = Alias
    Tok = Tok
    Op = Op
    Func = Func
    Fn = Fn

    def reduce(token_queue, op_queue, nop_queue, current_op=None, pos=0, err=None):
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
                validation = opc.validate(pos, op_queue, token_queue)
                if validation[0] is False:
                    # operator is not valid in current state
                    err['err'] = True
                    err['msg'] = validation[1]
                    return False
                n = opc.node(None, pos, op_queue, token_queue)
                n.arity = validation[0]
                nop_queue.insert( 0, n )
                op_queue.insert( 0, n )

            else:
                if len(nop_queue):
                    nop = nop_queue[0]
                    nop_index = nop.op_index

                # n-ary/multi-part operator, further parts
                # combine one-by-one, until n-ary operator is complete
                if nop and nop.op_next( opc, pos, op_queue, token_queue ):

                    while len(op_queue) > nop_index:
                        entry = op_queue.pop(0)
                        op = entry.node
                        arity = op.arity
                        if (T_OP & op.type) and 0 == arity: arity = 1 # have already padded with empty token
                        elif arity > len(token_queue) and op.arity_min <= op.arity: arity = op.arity_min
                        n = op.node(array_splice(token_queue, -arity, arity), entry.pos)
                        token_queue.append( n )


                    if nop.op_complete( ):
                        nop_queue.pop(0)
                        op_queue.pop(0)
                        opc = nop.node
                        nop.dispose( )
                        nop_index = nop_queue[0].op_index if len(nop_queue) else 0
                    else:
                        return
                else:
                    validation = opc.validate(pos, op_queue, token_queue)
                    if validation[0] is False:
                        # operator is not valid in current state
                        err['err'] = True
                        err['msg'] = validation[1]
                        return False


                fixity = opc.fixity
                if POSTFIX == fixity:
                    # postfix assumed to be already in correct order,
                    # no re-structuring needed
                    arity = opc.arity
                    if arity > len(token_queue) and opc.arity_min <= len(token_queue): arity = opc.arity_min
                    n = opc.node(array_splice(token_queue, -arity, arity), pos)
                    token_queue.append( n )

                elif PREFIX == fixity:
                    # prefix assumed to be already in reverse correct order,
                    # just push to op queue for later re-ordering
                    op_queue.insert( 0, Node(opc.otype, opc.arity, opc, None, pos) )
                    if (T_OP & opc.type) and (0 == opc.arity):
                        token_queue.append(Xpresion.EMPTY_TOKEN.node(None, pos+1))

                else: # if INFIX == fixity:
                    while len(op_queue) > nop_index:

                        entry = op_queue.pop(0)
                        op = entry.node

                        if (op.priority < opc.priority) or (op.priority == opc.priority and (op.associativity < opc.associativity or (op.associativity == opc.associativity and op.associativity < 0))):


                            arity = op.arity
                            if (T_OP & op.type) and 0 == arity: arity = 1 # have already padded with empty token
                            elif arity > len(token_queue) and op.arity_min <= op.arity: arity = op.arity_min
                            n = op.node(array_splice(token_queue, -arity, arity), entry.pos)
                            token_queue.append( n )

                        else:
                            op_queue.insert( 0, entry )
                            break

                    op_queue.insert( 0, Node(opc.otype, opc.arity, opc, None, pos) )

        else:
            while len(op_queue):
                entry = op_queue.pop(0)
                op = entry.node
                arity = op.arity
                if (T_OP & op.type) and 0 == arity: arity = 1 # have already padded with empty token
                elif arity > len(token_queue) and op.arity_min <= op.arity: arity = op.arity_min
                n = op.node(array_splice(token_queue, -arity, arity), entry.pos)
                token_queue.append( n )


    def parse_delimited_block(s, i, l, delim, is_escaped=True):
        p = delim
        esc = False
        ch = ''
        is_escaped = is_escaped is not False
        i += 1
        while i < l:
            ch = s[i]
            i += 1
            p += ch
            if delim == ch and not esc: break
            esc = ((not esc) and ('\\' == ch)) if is_escaped else False
        return p

    def parse(xpr, conf):
        get_entry = Alias.get_entry
        reduce = Xpresion.reduce
        t_var_is_also_ident = 't_var' not in conf.RE

        err = 0
        errmsg = ''
        errors = {'err': False, 'msg': ''}
        expr = str(xpr.source)
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
            block = get_entry(conf.BLOCKS, ch)
            if block: # string or regex or date ('"`#)

                v = block['parse'](expr, i, l, ch)
                if v is not False:

                    i += len(v)
                    if 'rest' in block:

                        block_rest = block['rest'](expr, i, l)
                        if not block_rest: block_rest = ''

                    else:

                        block_rest = ''

                    i += len(block_rest)

                    t = xpr.t_block( conf, v, block['type'], block_rest )
                    if t is not False:

                        t_index+=1
                        AST.append( t.node(None, t_index) )
                        continue




            e = expr[ i: ]

            m = conf.RE['t_spc'].match(e)
            if m: # space

                i += len(m.group( 0 ))
                continue


            m = conf.RE['t_num'].match(e)
            if m: # number

                t = xpr.t_liter( conf, m.group( 1 ), T_NUM )
                if t is not False:

                    t_index+=1
                    AST.append( t.node(None, t_index) )
                    i += len(m.group( 0 ))
                    continue



            m = conf.RE['t_ident'].match(e)
            if m: # ident, reserved, function, operator, etc..

                t = xpr.t_liter( conf, m.group( 1 ), T_IDE ) # reserved keyword
                if t is not False:

                    t_index+=1
                    AST.append( t.node(None, t_index) )
                    i += len(m.group( 0 ))
                    continue

                t = xpr.t_op( conf, m.group( 1 ) ) # (literal) operator
                if t is not False:

                    t_index+=1
                    reduce( AST, OPS, NOPS, t, t_index, errors )
                    if errors['err']:
                        err = 1
                        errmsg = errors['msg']
                        break
                    i += len(m.group( 0 ))
                    continue

                if t_var_is_also_ident:

                    t = xpr.t_var( conf, m.group( 1 ) ) # variables are also same identifiers
                    if t is not False:

                        t_index+=1
                        AST.append( t.node(None, t_index) )
                        i += len(m.group( 0 ))
                        continue



            m = conf.RE['t_special'].match(e)
            if m: # special symbols..

                v = m.group( 1 )
                t = False
                while len(v) > 0: # try to match maximum length op/func

                    t = xpr.t_op( conf, v ) # function, (non-literal) operator
                    if t is not False: break
                    v = v[0:-1]

                if t is not False:

                    t_index+=1
                    reduce( AST, OPS, NOPS, t, t_index, errors )
                    if errors['err']:
                        err = 1
                        errmsg = errors['msg']
                        break
                    i += len(v)
                    continue



            if not t_var_is_also_ident:
                m = conf.RE['t_var'].match(e)
                if m: # variables

                    t = xpr.t_var( conf, m.group( 1 ) )
                    if t is not False:

                        t_index+=1
                        AST.append( t.node(None, t_index) )
                        i += len(m.group( 0 ))
                        continue



            m = conf.RE['t_nonspc'].match(e)
            if m: # other non-space tokens/symbols..

                t = xpr.t_liter( conf, m.group( 1 ), T_LIT ) # reserved keyword
                if t is not False:

                    t_index+=1
                    AST.append( t.node(None, t_index) )
                    i += len(m.group( 0 ))
                    continue

                t = xpr.t_op( conf, m.group( 1 ) ) # function, other (non-literal) operator
                if t is not False:

                    t_index+=1
                    reduce( AST, OPS, NOPS, t, t_index, errors )
                    if errors['err']:
                        err = 1
                        errmsg = errors['msg']
                        break
                    i += len(m.group( 0 ))
                    continue

                t = xpr.t_tok( conf, m.group( 1 ) )
                t_index+=1
                AST.append( t.node(None, t_index) ) # pass-through ..
                i += len(m.group( 0 ))
                #continue



        if not err:
            reduce( AST, OPS, NOPS )

            if (1 != len(AST)) or (len(OPS) > 0):
                err = 1
                errmsg = 'Parse Error, Mismatched Parentheses or Operators'

            if not err:

                try:

                    evaluator = xpr.compile( AST[0], conf )

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
            xpr.evaluatorString = ''
            xpr.evaluator = xpr.dummy_evaluator
            raise RuntimeError('Xpresion Error: ' + errmsg + ' at ' + expr)
        else:
            # make array
            xpr.variables = list( xpr.variables.keys() )
            xpr.evaluatorString = evaluator[0]
            xpr.evaluator = evaluator[1]

        return xpr

    def render(tok, args=None):
        if None==args: args=[]
        return tok.render( args )

    def GET(obj, keys=list()):
        if not len(keys): return obj

        o = obj
        c = len(keys)
        i = 0
        while i < c:
            k = keys[i]
            i += 1

            if o is None:
                break

            if isinstance(o,(list,tuple)):
                if int(k)<len(o):
                    o = o[int(k)]
                else:
                    break

            elif isinstance(o,dict):
                if k in o:
                    o = o[k]
                else:
                    break

            else:
                try:
                    o = getattr(o, k)
                except AttributeError:
                    break

        return o if i==c else None

    def defaultConfiguration(*args):
        if len(args):
            Xpresion.CONF = args[0]
        return Xpresion.CONF

    def __init__(self, expr=None, conf=None):
        self.source = None
        self.variables = None
        self.evaluatorString = None
        self.evaluator = None

        self._cnt = 0
        self._cache = None
        self._symbol_table = None
        self.dummy_evaluator = None

        if (not conf) or not isinstance(conf,Configuration):
            conf = Xpresion.defaultConfiguration()

        self.source = str(expr) if expr else ''
        self.dummy_evaluator = dummy
        Xpresion.parse( self, conf )

    def __del__(self):
        self.dispose()

    def dispose(self):
        self.dummy_evaluator = None

        self.source = None
        self.variables = None
        self.evaluatorString = None
        self.evaluator = None

        self._cnt = None
        self._symbol_table = None
        self._cache = None

        return self

    def compile(self, AST, conf=None):
        # depth-first traversal and rendering of Abstract Syntax Tree (AST)
        if not conf:
            conf = Xpresion.defaultConfiguration()
        evaluator_str = str(Node.DFT( AST, Xpresion.render, True ))
        return [evaluator_str, evaluator_factory(evaluator_str,conf.FN,self._cache)]

    def evaluate(self, data=dict()):
        return self.evaluator( data ) if callable(self.evaluator) else None

    def debug(self, data=None):
        out = [
        'Expression: ' + self.source,
        'Variables : [' + ','.join(self.variables) + ']',
        'Evaluator : ' + self.evaluatorString
        ]
        if None!=data:
            out.append('Data      : ' + pprint.pformat(data, 4))
            out.append('Result    : ' + pprint.pformat(self.evaluate(data), 4))
        return ("\n").join(out)

    def __str__(self):
        return '[Xpresion source]: ' + str(self.source) + ''

    def t_liter(self, conf, token, type):
        if T_NUM == type: return Tok(T_NUM, token, token)
        return Alias.get_entry(conf.RESERVED, token.lower( ))

    def t_block(self, conf, token, type, rest=''):
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
                if 'm' in rest: flags|= re.M
                self._cache[ id ] = re.compile(token[1:-1], flags)
                self._symbol_table[sid] = id
            return Tok(T_REX, token, 'Cache["'+id+'"]')

        return False

    def t_var(self, conf, token):
        parts = token.split('.', 1)
        main = parts[0]
        if main not in self.variables: self.variables[ main ] = main
        if 1 < len(parts):
            keys = '["' + '","'.join(parts[1].split('.')) + '"]'
            return Tok(T_VAR, token, 'Xpresion.GET(Var["' + main + '"],'+keys+')')
        else:
            return Tok(T_VAR, main, 'Var["' + main + '"]')
        #return Tok(T_VAR, token, 'Var["' + '"]["'.join(token.split('.')) + '"]')

    def t_op(self, conf, token):
        op = False
        op = Alias.get_entry(conf.FUNCTIONS, token)
        if op is False: op = Alias.get_entry(conf.OPERATORS, token)
        return op

    def t_tok(self, conf, token):
        return Tok(T_MIX, token, token)

    def init( ):
        if Xpresion._inited: return
        Xpresion._inited = True

        #def sqrt(v):
        #    import math
        #    return math.sqrt(v)

        def clamp(v, m, M):
            if m > M: return m if v > m else (M if v < M else v)
            else: return M if v > M else (m if v < m else v)

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
            #l = len(a1)
            #if l==len(a2):
            #    for i in range(l):
            #        if a1[i]!=a2[i]: return False
            #else: return False
            #return True
            return a1 == a2

        # e.g https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
        Xpresion.defaultConfiguration(Configuration({
        # regular expressions for tokens
        # ===============================
         're' : {
         't_spc'        :  re.compile(r'^(\s+)')
        ,'t_nonspc'     :  re.compile(r'^(\S+)')
        ,'t_special'    :  re.compile(r'^([*.\-+\\\/\^\$\(\)\[\]|?<:>&~%!#@=_,;{}]+)')
        ,'t_num'        :  re.compile(r'^(\d+(\.\d+)?)')
        ,'t_ident'      :  re.compile(r'^([a-zA-Z_][a-zA-Z0-9_]*)\b')
        ,'t_var'        :  re.compile(r'^\$([a-zA-Z0-9_][a-zA-Z0-9_.]*)\b')
        }

        # block-type tokens (eg strings and regexes)
        # ==========================================
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

        # reserved keywords and literals
        # ===============================
        ,'reserved' : {
         'null'     : Tok(T_IDE, 'null', 'None')
        ,'false'    : Tok(T_BOL, 'false', 'False')
        ,'true'     : Tok(T_BOL, 'true', 'True')
        ,'infinity' : Tok(T_NUM, 'Infinity', 'Fn.INF')
        ,'nan'      : Tok(T_NUM, 'NaN', 'Fn.NAN')
        # aliases
        ,'none'     : Alias('null')
        ,'inf'      : Alias('infinity')
        }

        # operators
        # ==========
        ,'operators' : {
        # bra-kets as n-ary operators
        # negative number of arguments, indicate optional arguments (experimental)
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
        # n-ary (ternary) if-then-else operator
        ,'?'    :   {
                        'input'         : [1,'?',1,':',1]
                        ,'output'       : '(<$.1> if <$.0> else <$.2>)'
                        ,'otype'        : T_BOL
                        ,'fixity'       : INFIX
                        ,'associativity': RIGHT
                        ,'priority'     : 100
                    }
        ,':'    :   {'input':[1,':',1]}

        ,'!'    :   {
                        'input'         : ['!',1]
                        ,'output'       : '(not <$.0>)'
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
                        ,'output'       : '(<$.0>**<$.1>)'
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
        # addition/concatenation/unary plus as polymorphic operators
        ,'+'    :   {'polymorphic':[
                    # array concatenation
                    [
                    lambda curr,Xpresion: curr.TOK and (not curr.PREV_IS_OP) and (curr.DEDUCED_TYPE==Xpresion.T_ARY),
                    {
                        'input'         : [1,'+',1]
                        ,'output'       : 'Fn.ary_merge(<$.0>,<$.1>)'
                        ,'otype'        : T_ARY
                        ,'fixity'       : INFIX
                        ,'associativity': LEFT
                        ,'priority'     : 25
                    }
                    ]
                    # string concatenation
                    ,[
                    lambda curr,Xpresion: curr.TOK and (not curr.PREV_IS_OP) and (curr.DEDUCED_TYPE==Xpresion.T_STR),
                    {
                        'input'         : [1,'+',1]
                        ,'output'       : '(<$.0>+str(<$.1>))'
                        ,'otype'        : T_STR
                        ,'fixity'       : INFIX
                        ,'associativity': LEFT
                        ,'priority'     : 25
                    }
                    ]
                    # numeric addition
                    ,[
                    lambda curr,Xpresion: curr.TOK and not curr.PREV_IS_OP,
                    {
                        'input'         : [1,'+',1]
                        ,'output'       : '(<$.0>+<$.1>)'
                        ,'otype'        : T_NUM
                        ,'fixity'       : INFIX
                        ,'associativity': LEFT
                        ,'priority'     : 25
                    }
                    ]
                    # unary plus
                    ,[
                    lambda curr,Xpresion: (not curr.TOK) or curr.PREV_IS_OP,
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
                    # numeric subtraction
                    [
                    lambda curr,Xpresion: curr.TOK and not curr.PREV_IS_OP,
                    {
                        'input'         : [1,'-',1]
                        ,'output'       : '(<$.0>-<$.1>)'
                        ,'otype'        : T_NUM
                        ,'fixity'       : INFIX
                        ,'associativity': LEFT
                        ,'priority'     : 25
                    }
                    ]
                    # unary negation
                    ,[
                    lambda curr,Xpresion: (not curr.TOK) or curr.PREV_IS_OP,
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
                    # array equivalence
                    [
                    lambda curr,Xpresion: curr.DEDUCED_TYPE==Xpresion.T_ARY,
                    {
                        'input'         : [1,'==',1]
                        ,'output'       : 'Fn.ary_eq(<$.0>,<$.1>)'
                        ,'otype'        : T_BOL
                        ,'fixity'       : INFIX
                        ,'associativity': LEFT
                        ,'priority'     : 40
                    }
                    ]
                    # default equivalence
                    ,[
                    lambda curr,Xpresion: True,
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
                        ,'output'       : '(<$.0> is <$.1>)'
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
                        ,'output'       : '(<$.0> and <$.1>)'
                        ,'otype'        : T_BOL
                        ,'fixity'       : INFIX
                        ,'associativity': LEFT
                        ,'priority'     : 47
                    }
        ,'||'   :   {
                        'input'         : [1,'||',1]
                        ,'output'       : '(<$.0> or <$.1>)'
                        ,'otype'        : T_BOL
                        ,'fixity'       : INFIX
                        ,'associativity': LEFT
                        ,'priority'     : 48
                    }
        #------------------------------------------
        #                aliases
        #-------------------------------------------
        ,'or'    :  Alias( '||' )
        ,'and'   :  Alias( '&&' )
        ,'not'   :  Alias( '!' )
        }

        # functional operators
        # ====================
        ,'functions' : {
         'min'      : {
                        'input'     : 'min'
                        ,'output'   : 'min(<$.0>)'
                        ,'otype'    : T_NUM
                    }
        ,'max'      : {
                        'input'     : 'max'
                        ,'output'   : 'max(<$.0>)'
                        ,'otype'    : T_NUM
                    }
        ,'pow'      : {
                        'input'     : 'pow'
                        ,'output'   : 'Fn.pow(<$.0>)'
                        ,'otype'    : T_NUM
                    }
        ,'sqrt'     : {
                        'input'     : 'sqrt'
                        ,'output'   : 'math.sqrt(<$.0>)'
                        ,'otype'    : T_NUM
                    }
        ,'len'      : {
                        'input'     : 'len'
                        ,'output'   : 'Fn.len(<$.0>)'
                        ,'otype'    : T_NUM
                    }
        ,'int'      : {
                        'input'     : 'int'
                        ,'output'   : 'int(<$.0>)'
                        ,'otype'    : T_NUM
                    }
        ,'str'      : {
                        'input'     : 'str'
                        ,'output'   : 'str(<$.0>)'
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
        #---------------------------------------
        #                aliases
        #----------------------------------------
         # ...
        }

        # runtime (implementation) functions
        # ==================================
        ,'runtime' : {
        'pow'       : lambda base, exponent: base ** exponent
        ,'clamp'    : clamp
        ,'len'      : lambda v: 0 if v is None else (len(v) if isinstance(v,(str,list,tuple,dict)) else 1)
        ,'sum'      : sum
        ,'avg'      : avg
        ,'ary_merge': ary_merge
        ,'ary_eq'   : ary_eq
        ,'match'    : lambda s, regex: bool(re.search(regex, s ))
        ,'contains' : lambda o, i: bool(i in o)
        ,'time'     : php_time
        ,'date'     : php_date
        }
        }))



Xpresion.init( )

# if used with 'import *'
__all__ = ['Xpresion']
