<?php
/**
*
*   Xpresion
*   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node/JS, ActionScript
*   @version: 0.5
*
*   https://github.com/foo123/Xpresion
*
**/

if (!class_exists('Xpresion'))
{

class XpresionUtils
{
    #def trace( stack ):
    #    out = []
    #    for i in stack: out.append(i.__str__())
    #    return (",\n").join(out)
        
    public static $dummy = null;

    public static function parse_re_flags($s,$i,$l)
    {
        $flags = '';
        $has_i = false;
        $has_g = false;
        $seq = 0;
        $i2 = $i+$seq;
        $not_done = true;
        while ($i2 < $l && $not_done)
        {
            $ch = $s[$i2++];
            $seq += 1;
            if ('i' == $ch && !$has_i)
            {
                $flags .= 'i';
                $has_i = true;
            }
            
            if ('g' == $ch && !$has_g)
            {
                $flags .= 'g';
                $has_g = true;
            }
            
            if ($seq >= 2 || (!$has_i && !$has_g))
            {
                $not_done = false;
            }
        }
        return $flags;
    }
}

            
class XpresionTpl
{    
    public static function multisplit($tpl, $reps, $as_array=false)
    {
        $a = array( array(1, $tpl) );
        foreach ((array)$reps as $r=>$s)
        {
            $c = array( ); 
            $sr = $as_array ? $s : $r;
            $s = array(0, $s);
            foreach ($a as $ai)
            {
                if (1 === $ai[ 0 ])
                {
                    $b = explode($sr, $ai[ 1 ]);
                    $bl = count($b);
                    $c[] = array(1, $b[0]);
                    if ($bl > 1)
                    {
                        for ($j=0; $j<$bl-1; $j++)
                        {
                            $c[] = $s;
                            $c[] = array(1, $b[$j+1]);
                        }
                    }
                }        
                else
                {
                    $c[] = $ai;
                }
            }
            $a = $c;
        }
        return $a;
    }

    public static function arg($key=null, $argslen=null)
    {
        $out = '$args';
        
        if ($key)
        {
            if (is_string($key))
                $key = !empty($key) ? explode('.', $key) : array();
            else 
                $key = array($key);
            $givenArgsLen = (bool)(null !=$argslen && is_string($argslen));
            
            foreach ($key as $k)
            {
                $kn = is_string($k) ? intval($k,10) : $k;
                if (!is_nan($kn))
                {
                    if ($kn < 0) $k = ($givenArgsLen ? $argslen : 'count('.$out.')') . ('-'.(-$kn));
                    
                    $out .= '[' . $k . ']';
                }
                else
                {
                    $out .= '["' . $k . '"]';
                }
            }
        }        
        return $out;
    }

    public static function compile($tpl, $raw=false)
    {
        static $NEWLINE = '/\\n\\r|\\r\\n|\\n|\\r/'; 
        static $SQUOTE = "/'/";
        
        if (true === $raw)
        {
            $out = 'return (';
            foreach ($tpl as $tpli)
            {
                $notIsSub = $tpli[ 0 ];
                $s = $tpli[ 1 ];
                $out .= $notIsSub ? $s : self::arg($s);
            }
            $out .= ');';
        }    
        else
        {
            $out = '$argslen=count($args); return (';
            foreach ($tpl as $tpli)
            {
                $notIsSub = $tpli[ 0 ];
                $s = $tpli[ 1 ];
                if ($notIsSub) $out .= "'" . preg_replace($NEWLINE, "' + \"\\n\" + '", preg_replace($SQUOTE, "\\'", $s)) . "'";
                else $out .= " . strval(" . self::arg($s,'$argslen') . ") . ";
            }
            $out .= ');';
        }
        return create_function('$args', $out);
    }

    
    public static $defaultArgs = array('$-5'=>-5,'$-4'=>-4,'$-3'=>-3,'$-2'=>-2,'$-1'=>-1,'$0'=>0,'$1'=>1,'$2'=>2,'$3'=>3,'$4'=>4,'$5'=>5);
    
    public $id = null;
    public $tpl = null;
    private $_renderer = null;
    
    public function __construct($tpl='', $replacements=null, $compiled=false)
    {
        $this->id = null;
        $this->_renderer = null;
        
        if ( !$replacements ) $replacements = self::$defaultArgs;
        $this->tpl = self::multisplit( $tpl, $replacements );
        if (true === $compiled) $this->_renderer = self::compile( $this->tpl );
    }

    public function __destruct()
    {
        $this->dispose();
    }
    
    public function dispose()
    {
        $this->id = null;
        $this->tpl = null;
        $this->_renderer = null;
        return $this;
    }
    
    public function render($args=null)
    {
        if (!$args) $args = array();
        
        if ($this->_renderer) 
        {
            $f = $this->_renderer;
            return $f( $args );
        }
        
        $out = '';
        
        foreach ($this->tpl as $tpli)
        {
            $notIsSub = $tpli[ 0 ];
            $s = $tpli[ 1 ];
            $out .= $notIsSub ? $s : strval($args[ $s ]);
        }
        return $out;
    }
}    


class XpresionNode
{
    # depth-first traversal
    public static function DFT($root, $action=null, $andDispose=False)
    {
        /*
            one can also implement a symbolic solver here
            by manipulating the tree to produce 'x' on one side 
            and the reverse operators/tokens on the other side
            i.e by transposing the top op on other side of the '=' op and using the 'associated inverse operator'
            in stack order (i.e most top op is transposed first etc.. until only the branch with 'x' stays on one side)
            (easy when only one unknown in one state, more difficult for many unknowns 
            or one unknown in different states, e.g x and x^2 etc..)
        */
        $andDispose = (false !== $andDispose);
        if (!$action) $action = array('Xpresion','render');
        $stack = array( $root );
        $output = array( );
        
        while (!empty($stack))
        {
            $node = $stack[ 0 ];
            if ($node->children && !empty($node->children))
            {
                $stack = array_merge($node->children, $stack);
                $node->children = null;
            }
            else
            {
                array_shift($stack);
                $op = $node->node;
                $o = call_user_func($action, $op, (array)array_splice($output, -$op->arity, $op->arity));
                $output[] = $o;
                if ($andDispose) $node->dispose( );
            }
        }

        $stack = null;
        return $output[ 0 ];
    }
    
    public $type = null;
    public $pos = null;
    public $node = null;
    public $op_parts = null;
    public $op_index = null;
    public $children = null;
    
    public function __construct($type, $node, $children=null, $pos=0)
    {
        $this->type = $type;
        $this->node = $node;
        $this->children = $children;
        $this->pos = $pos;
        $this->op_parts = null;
        $this->op_index = null;
    }
    
    public function __destruct()
    {
        $this->dispose();
    }
    
    public function dispose()
    {
        $c = $this->children;
        if ($c && !empty($c))
        {
            foreach ($c as $ci) 
                if ($ci) $ci->dispose( );
        }
        
        $this->type = null;
        $this->pos = null;
        $this->node = null;
        $this->op_parts = null;
        $this->op_index = null;
        $this->children = null;
        return $this;
    }
    
    public function op_next($op)
    {
        $next_index = array_search($op->input, $this->op_parts);
        $is_next = (bool)(0 === $next_index);
        if ($is_next) array_shift($this->op_parts);
        return $is_next;
    }
    
    public function op_complete()
    {
        return (bool)empty($this->op_parts);
    }
    
    public function __toString(/*$tab=""*/)
    {
        $out = array();
        $n = $this->node;
        $c = !empty($this->children) ? $this->children : array();
        $tab = "";
        $tab_tab = $tab."  ";
        
        foreach ($c as $ci) $out[] = $ci->__toString(/*$tab_tab*/);
        if (isset($n->parts) && $n->parts) $parts = implode(" ", $n->parts);
        else $parts = $n->input;
        return $tab . implode("\n".$tab, array(
        "Node(".strval($n->type)."): " . $parts,
        "Childs: [",
        $tab . implode("\n".$tab, $out),
        "]"
        )) . "\n";
    }
}    


class XpresionAlias
{    
    public static function get_entry(&$entries, $id)
    {
        if ($id && $entries && isset($entries[$id]))
        {
            // walk/bypass aliases, if any
            $entry = $entries[ $id ];
            while (($entry instanceof XpresionAlias) && (isset($entries[$entry->alias])))
            {
                $id = $entry->alias;
                $entry = $entries[ $id ];
            }
            return $entry;
        }
        return false;
    }
        
    public function __construct($alias)
    {
        $this->alias = strval($alias);
    }
    
    public function __destruct()
    {
        $this->alias = null;
    }
}

class XpresionTok
{    
    public static function render_tok($t)
    {
        if ($t instanceof XpresionTok) return $t->render();
        return strval($t);
    }
    
    public $type = null;
    public $input = null;
    public $output = null;
    public $value = null;
    public $priority = null;
    public $parity = null;
    public $arity = null;
    public $associativity = null;
    public $fixity = null;
    public $parenthesize = null;
    public $revert = null;
    
    public function __construct($type, $input, $output, $value=null)
    {
        $this->type = $type;
        $this->input = $input;
        $this->output = $output;
        $this->value = $value;
        $this->priority = 1000;
        $this->parity = 0;
        $this->arity = 0;
        $this->associativity = Xpresion::DEFAUL;
        $this->fixity = Xpresion::INFIX;
        $this->parenthesize = false;
        $this->revert = false;
    }
    
    public function __destruct()
    {
        $this->dispose();
    }
    
    public function dispose()
    {
        $this->type = null;
        $this->input = null;
        $this->output = null;
        $this->value = null;
        $this->priority = null;
        $this->parity = null;
        $this->arity = null;
        $this->associativity = null;
        $this->fixity = null;
        $this->parenthesize = null;
        $this->revert = null;
        return $this;
    }
    
    public function setType($type)
    {
        $this->type = $type;
        return $this;
    }
    
    public function setParenthesize($bol)
    {
        $this->parenthesize = (bool)$bol;
        return $this;
    }
    
    public function setReverse($bol)
    {
        $this->revert = (bool)$bol;
        return $this;
    }
    
    public function render($args=null)
    {
        $token = $this->output;
        $p = $this->parenthesize;
        $lparen = $p ? Xpresion::LPAREN : '';
        $rparen = $p ? Xpresion::RPAREN : '';
        if (null===$args) $args=array();
        array_unshift($args, $this->input);
        
        if ($token instanceof XpresionTpl)   $out = $token->render( $args );
        else                                 $out = strval($token);
        return $lparen . $out . $rparen;
    }
    
    public function node($args=null, $pos=0)
    {
        return new XpresionNode($this->type, $this, $args ? $args : null, $pos);
    }
    
    public function __toString()
    {
        return strval($this->output);
    }
}    

class XpresionOp extends XpresionTok
{
    public static function Condition($f)
    {
        return array(
            is_callable($f[0]) ? $f[0] : XpresionTpl::compile(XpresionTpl::multisplit($f[0],array('${POS}'=>0,'${TOKS}'=>1,'${OPS}'=>2,'${TOK}'=>3,'${OP}'=>4,'${PREV_IS_OP}'=>5,'${DEDUCED_TYPE}'=>6 /*,'${XPRESION}'=>7*/)), true)
            ,$f[1]
        );
    }
    
    public $otype = null;
    public $ofixity = null;
    public $parts = null;
    public $morphes = null;
    
    public function __construct($input='', $fixity=null, $associativity=null, $priority=1000, $arity=0, $output='', $otype=null, $ofixity=null)
    {
        # n-ary/multi-part operator
        if (is_array($input))
        {
            $this->parts = $input;
            $this->type = Xpresion::T_N_OP;
        }
        else
        {
            $this->parts = array($input);
            $this->type = Xpresion::T_OP;
        }
        
        parent::__construct($this->type, $this->parts[0], $output);
        
        $this->fixity = null !== $fixity ? $fixity : Xpresion::PREFIX;
        $this->associativity = null !== $associativity ? $associativity : Xpresion::DEFAUL;
        $this->priority = $priority;
        $this->arity = $arity;
        $this->otype = $otype;
        $this->ofixity = null !== $ofixity ? $ofixity : $this->fixity;
        $this->parenthesize = false;
        $this->revert = false;
        $this->morphes = null;
    }
    
    public function __destruct()
    {
        $this->dispose();
    }
    
    public function dispose()
    {
        parent::dispose();
        $this->otype = null;
        $this->ofixity = null;
        $this->parts = null;
        $this->morphes = null;
        return $this;
    }
    
    public function Polymorphic($morphes=null)
    {
        if (null===$morphes) $morphes = array();
        $this->type = Xpresion::T_POLY_OP;
        $this->morphes = array_map(array('XpresionOp','Condition'), (array)$morphes);
        return $this;
    }
    
    public function morph($args)
    {
        $morphes = $this->morphes;
        $l = count($morphes);
        $i = 0;
        $minop = $morphes[0][1];
        $found = false;
        
        if (count($args) < 7)
        {
            $args[] = count($args[1]) ? $args[1][count($args[1])-1] : false;
            $args[] = count($args[2]) ? $args[2][0] : false;
            $args[] = $args[4] ? ($args[4]->pos+1===$args[0]) : false;
            $args[] = $args[4] ? $args[4]->type : ($args[3] ? $args[3]->type : 0);
            //$args[] = Xpresion;
        }
        
        while ($i < $l)
        {
            $op = $morphes[$i++];
            if (true === (bool)$op[0]( $args ))
            {
                $op = $op[1];
                $found = true;
                break;
            }
            if ($op[1]->priority >= $minop->priority) $minop = $op[1];
        }
        
        # try to return minimum priority operator, if none matched
        if (!$found) $op = $minop;
        # nested polymorphic op, if any
        while (Xpresion::T_POLY_OP === $op->type) $op = $op->morph( $args );
        return $op;
    }
    
    public function render($args=null)
    {
        $output_type = $this->otype;
        $op = $this->output;
        $p = $this->parenthesize;
        $lparen = $p ? Xpresion::LPAREN : '';
        $rparen = $p ? Xpresion::RPAREN : '';
        $comma = Xpresion::COMMA;
        $out_fixity = $this->ofixity;
        if (!$args || empty($args)) $args=array('','');
        $numargs = count($args);
        
        //if (T_DUM == output_type) and numargs:
        //    output_type = args[ 0 ].type
        
        //args = list(map(Tok.render, args))
        
        if ($op instanceof XpresionTpl)
            $out = $lparen . $op->render( $args ) . $rparen;
        elseif (Xpresion::INFIX === $out_fixity)
            $out = $lparen . implode(strval($op), $args) . $rparen;
        elseif (Xpresion::POSTFIX === $out_fixity)
            $out = $lparen . implode($comma, $args) . $rparen . strval($op);
        else // if (Xpresion::PREFIX === $out_fixity)
            $out = strval($op) . $lparen . implode($comma, $args) . $rparen;
        return new XpresionTok($output_type, $out, $out);
    }
    
    public function node($args=null, $pos=0, $op_index=0)
    {
        $otype = $this->otype;
        if (null===$args) $args = array();
        if ($this->revert) $args = array_reverse($args);
        if ((Xpresion::T_DUM === $otype) && !empty($args)) $otype = $args[ 0 ]->type;
        elseif (!empty($args)) $args[0]->type = $otype;
        $n = new XpresionNode($otype, $this, $args, $pos);
        if (Xpresion::T_N_OP === $this->type)
        {
            $n->op_parts = array_slice($this->parts, 1);
            $n->op_index = $op_index;
        }
        return $n;
    }
}

class XpresionFunc extends XpresionOp
{    
    public function __construct($input='', $output='', $otype=null, $priority=5, $associativity=null, $fixity=null)
    {
        parent::__construct(
            $input, 
            Xpresion::PREFIX, 
            null !== $associativity ? $associativity : Xpresion::RIGHT, 
            $priority, 
            1, 
            $output, 
            $otype, 
            null !== $fixity ? $fixity : Xpresion::PREFIX
        );
        $this->type = Xpresion::T_FUN;
    }
    
    public function __destruct()
    {
        $this->dispose();
    }
}

class XpresionFn
{
    public $Fn = array();
    
    public function __call($fn, $args)
    {
        if ( $fn && isset($this->Fn[$fn]) && is_callable($this->Fn[$fn]) )
        {
            return call_user_func_array($this->Fn[$fn], (array)$args);
        }
        throw new Exception('Unknown Runtime Function "'.$fn.'"');
    }
    
    # function implementations (can also be overriden per instance/evaluation call)
    public function clamp($v, $m, $M)
    {
        if ($m > $M) return ($v > $m ? $m : ($v < $M ? $M : $v));
        else return ($v > $M ? $M : ($v < $m ? $m : $v));
    }

    public function len($v)
    {
        if ($v)
        {
            if (is_string($v)) return strlen($v);
            elseif (is_array($v)) return count($v);
            elseif (is_object($v)) return count((array)$v);
            return 1;
        }
        return 0;
    }

    public function sum(/* args */)
    {
        $args = func_get_args();
        $s = 0;
        $values = $args;
        if (!empty($values) && is_array($values[0])) $values = $values[0];
        foreach ($values as $v) $s += $v;
        return $s;
    }

    public function avg(/* args */)
    {
        $args = func_get_args();
        $s = 0;
        $values = $args;
        if (!empty($values) && is_array($values[0])) $values = $values[0];
        $l = count($values);
        foreach ($values as $v) $s += $v;
        return $l > 0 ? $s/$l : $s;
    }

    public function ary_merge($a1, $a2)
    {
        return array_merge((array)$a1, (array)$a2);
    }

    public function ary_eq($a1, $a2)
    {
        return (bool)(((array)$a1) == ((array)$a2));
    }

    public function match($str, $regex)
    {
        return (bool)preg_match($regex, $str, $m);
    }

    public function contains($list, $item)
    {
        return (bool)in_array($item, $list);
    }
}

class Xpresion
{
    const VERSION = "0.5";
    
    const COMMA       =   ',';
    const LPAREN      =   '(';
    const RPAREN      =   ')';
    
    const NONE        =   0;
    const DEFAUL      =   1;
    const LEFT        =  -2;
    const RIGHT       =   2;
    const PREFIX      =   2;
    const INFIX       =   4;
    const POSTFIX     =   8;
    
    const T_DUM       =   0;
    const T_DFT       =   1;
    const T_IDE       =   16;
    const T_VAR       =   17;
    const T_LIT       =   32;
    const T_NUM       =   33;
    const T_STR       =   34;
    const T_REX       =   35;
    const T_BOL       =   36;
    const T_DTM       =   37;
    const T_ARY       =   38;
    const T_OP        =   128;
    const T_N_OP      =   129;
    const T_POLY_OP   =   130;
    const T_FUN       =   131;
    
    public static $_inited = false;
    
    public static $OPERATORS_S = null;
    public static $FUNCTIONS_S = null;
    public static $BLOCKS_S = null;
    public static $RE_S = null;
    public static $Reserved_S = null;
    public static $Fn_S = null;
    
    public static function Tpl($tpl='', $replacements=null, $compiled=false)
    {
        return new XpresionTpl($tpl, $replacements, $compiled);
    }
    public static function Node($type, $node, $children=null, $pos=0)
    {
        return new XpresionNode($type, $node, $children, $pos);
    }
    public static function Alias($alias)
    {
        return new XpresionAlias($alias);
    }
    public static function Tok($type, $input, $output, $value=null)
    {
        return new XpresionTok($type, $input, $output, $value);
    }
    public static function Op($input='', $fixity=null, $associativity=null, $priority=1000, $arity=0, $output='', $otype=null, $ofixity=null)
    {
        return new XpresionOp($input, $fixity, $associativity, $priority, $arity, $output, $otype, $ofixity);
    }
    public static function Func($input='', $output='', $otype=null, $priority=5, $associativity=null, $fixity=null)
    {
        return new XpresionFunc($input, $output, $otype, $priority, $associativity, $fixity);
    }
        
    public static function reduce(&$token_queue, &$op_queue, &$nop_queue, $current_op=null, $pos=0)
    {
        $nop = null;
        $nop_index = 0;
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
        
        if ($current_op)
        {
            $opc = $current_op;
            
            // polymorphic operator
            // get the current operator morph, based on current context
            if (Xpresion::T_POLY_OP === $opc->type) 
                $opc = $opc->morph(array($pos,$token_queue,$op_queue));
            
            // n-ary/multi-part operator, initial part
            // push to nop_queue/op_queue
            if (Xpresion::T_N_OP === $opc->type)
            {
                $n = $opc->node(null, $pos, count($op_queue)+1);
                array_unshift($nop_queue, $n);
                array_unshift($op_queue, $n);
            }
            else
            {
                if (!empty($nop_queue))
                {
                    $nop = $nop_queue[0];
                    $nop_index = $nop->op_index;
                }
                
                // n-ary/multi-part operator, further parts
                // combine one-by-one, until n-ary operator is complete
                if ($nop && $nop->op_next( $opc ))
                {
                    while (count($op_queue) > $nop_index)
                    {
                        $entry = array_shift($op_queue);
                        $op = $entry->node;
                        $n = $op->node(array_splice($token_queue, -$op->arity, $op->arity), $entry->pos);
                        array_push($token_queue, $n);
                    }
                    
                    
                    if ($nop->op_complete( ))
                    {
                        array_shift($nop_queue);
                        array_shift($op_queue);
                        $opc = $nop->node;
                        $nop->dispose( );
                        $nop_index = !empty($nop_queue) ? $nop_queue[0]->op_index : 0;
                    }
                    else
                    {
                        return;
                    }
                }
                
                $fixity = $opc->fixity;
                
                if (Xpresion::POSTFIX === $fixity)
                {
                    // postfix assumed to be already in correct order, 
                    // no re-structuring needed
                    $n = $opc->node(array_splice($token_queue, -$opc->arity, $opc->arity), $pos);
                    array_push($token_queue, $n);
                }
                
                elseif (Xpresion::PREFIX === $fixity)
                {
                    // prefix assumed to be already in reverse correct order, 
                    // just push to op queue for later re-ordering
                    array_unshift($op_queue, new XpresionNode($opc->otype, $opc, null, $pos));
                }
                
                else // if (Xpresion::INFIX === $fixity)
                {
                    while (count($op_queue) > $nop_index)
                    {
                        $entry = array_shift($op_queue);
                        $op = $entry->node;
                        
                        if (
                            ($op->priority < $opc->priority) || 
                            ($op->priority === $opc->priority && 
                            ($op->associativity < $opc->associativity || 
                            ($op->associativity === $opc->associativity && 
                            $op->associativity < 0)))
                        )
                        {
                            $n = $op->node(array_splice($token_queue, -$op->arity, $op->arity), $entry->pos);
                            array_push($token_queue, $n);
                        }
                        else
                        {
                            array_unshift($op_queue, $entry);
                            break;
                        }
                    }    
                    array_unshift($op_queue, new XpresionNode($opc->otype, $opc, null, $pos));
                }
            }
        }        
        else
        {
            while (!empty($op_queue))
            {
                $entry = array_shift($op_queue);
                $op = $entry->node;
                $n = $op->node(array_splice($token_queue, -$op->arity, $op->arity), $entry->pos);
                array_push($token_queue, $n);
            }
        }
    }        

    public static function parse_delimited_block($s, $i, $l, $delim, $is_escaped=true)
    {
        $p = $delim;
        $esc = false;
        $ch = '';
        $is_escaped = (bool)(false !== $is_escaped);
        $i += 1;
        while ($i < $l)
        {
            $ch = $s[$i++];
            $p .= $ch;
            if ($delim === $ch && !$esc) break;
            $esc = $is_escaped ? (!$esc && ('\\' === $ch)) : false;
        }
        return $p;
    }
    
    public static function parse($xpr)
    {
        $RE =& $xpr->RE;
        $BLOCK =& $xpr->BLOCKS;
        $t_var_is_also_ident = !isset($RE['t_var']);
        
        $err = 0;
        
        $expr = $xpr->source;
        $l = strlen($expr);
        $xpr->_cnt = 0;
        $xpr->_symbol_table = array();
        $xpr->_cache = new \stdClass;
        $xpr->variables = array();
        $AST = array();
        $OPS = array();
        $NOPS = array();
        $t_index = 0;
        $i = 0;
        
        while ($i < $l)
        {
            $ch = $expr[ $i ];
            
            // use customized (escaped) delimited blocks here
            // TODO: add a "date" block as well with #..#
            $block = XpresionAlias::get_entry($BLOCK, $ch);
            if ($block) // string or regex or date ('"`#)
            {
                $v = call_user_func($block['parse'], $expr, $i, $l, $ch);
                if (false !== $v)
                {
                    $i += strlen($v);
                    if (isset($block['rest']))
                    {
                        $block_rest = call_user_func($block['rest'], $expr, $i, $l);
                        if (!$block_rest) $block_rest = '';
                    }
                    else
                    {
                        $block_rest = '';
                    }
                    
                    $i += strlen($block_rest);
                    
                    $t = $xpr->t_block( $v, $block['type'], $block_rest );
                    if (false !== $t)
                    {
                        $t_index+=1;
                        array_push($AST, $t->node(null, $t_index));
                        continue;
                    }
                }
            }
            
            $e = substr($expr, $i);
            
            if (preg_match($RE['t_spc'], $e, $m)) // space
            {
                $i += strlen($m[ 0 ]);
                continue;
            }

            if (preg_match($RE['t_num'], $e, $m)) // number
            {
                $t = $xpr->t_liter( $m[ 1 ], Xpresion::T_NUM );
                if (false !== $t)
                {
                    $t_index+=1;
                    array_push($AST, $t->node(null, $t_index));
                    $i += strlen($m[ 0 ]);
                    continue;
                }
            }    
            
            if (preg_match($RE['t_ident'], $e, $m)) // ident, reserved, function, operator, etc..
            {
                $t = $xpr->t_liter( $m[ 1 ], Xpresion::T_IDE ); // reserved keyword
                if (false !== $t)
                {
                    $t_index+=1;
                    array_push($AST, $t->node(null, $t_index));
                    $i += strlen($m[ 0 ]);
                    continue;
                }
                
                $t = $xpr->t_op( $m[ 1 ] ); // (literal) operator
                if (false !== $t)
                {
                    $t_index+=1;
                    Xpresion::reduce( $AST, $OPS, $NOPS, $t, $t_index );
                    $i += strlen($m[ 0 ]);
                    continue;
                }
                
                if ($t_var_is_also_ident)
                {
                    $t = $xpr->t_var( $m[ 1 ] ); // variables are also same identifiers
                    if (false !== $t)
                    {
                        $t_index+=1;
                        array_push($AST, $t->node(null, $t_index));
                        $i += strlen($m[ 0 ]);
                        continue;
                    }
                }
            }        
                
            if (preg_match($RE['t_special'], $e, $m)) // special symbols..
            {
                $v = $m[ 1 ];
                $t = false;
                while (strlen($v) > 0) // try to match maximum length op/func
                {
                    $t = $xpr->t_op( $v ); // function, (non-literal) operator
                    if (false !== $t) break;
                    $v = substr($v,0,-1);
                }
                if (false !== $t)
                {
                    $t_index+=1;
                    Xpresion::reduce( $AST, $OPS, $NOPS, $t, $t_index );
                    $i += strlen($v);
                    continue;
                }
            }     
            
            if (!$t_var_is_also_ident)
            {
                if (preg_match($RE['t_var'], $e, $m)) // variables
                {
                    $t = $xpr->t_var( $m[ 1 ] );
                    if (false !== $t)
                    {
                        $t_index+=1;
                        array_push($AST, $t->node(null, $t_index));
                        $i += strlen($m[ 0 ]);
                        continue;
                    }
                }
            }        
                
            
            if (preg_match($RE['t_nonspc'], $e, $m)) // other non-space tokens/symbols..
            {
                $t = $xpr->t_liter( $m[ 1 ], Xpresion::T_LIT ); // reserved keyword
                if (false !== $t)
                {
                    $t_index+=1;
                    array_push($AST, $t->node(null, $t_index));
                    $i += strlen($m[ 0 ]);
                    continue;
                }
                
                $t = $xpr->t_op( $m[ 1 ] ); // function, other (non-literal) operator
                if (false !== $t)
                {
                    $t_index+=1;
                    Xpresion::reduce( $AST, $OPS, $NOPS, $t, $t_index );
                    $i += strlen($m[ 0 ]);
                    continue;
                }
                
                $t = $xpr->t_tok( $m[ 1 ] );
                $t_index+=1;
                array_push($AST, $t->node(null, $t_index)); // pass-through ..
                $i += strlen($m[ 0 ]);
                //continue
            }
        }
        
        $err = 0;
        Xpresion::reduce( $AST, $OPS, $NOPS );
        
        if ((1 !== count($AST)) || !empty($OPS))
        {
            $err = 1;
            $errmsg = 'Parse Error, Mismatched Parentheses or Operators';
        }
        
        if (!$err)
        {    
            try {
                
                $evaluator = $xpr->compile( $AST[0] );
            }
            catch (Exception $ex) {
                
                $err = 1;
                $errmsg = 'Compilation Error, ' . $ex->getMessage() . '';
            }
        }    
        
        $NOPS = null;
        $OPS = null;
        $AST = null;
        $xpr->_symbol_table = null;
        
        if ($err)
        {
            $evaluator = null;
            $xpr->variables = array();
            $xpr->_cnt = 0;
            $xpr->_cache = new \stdClass;
            $xpr->_evaluator_str = '';
            $xpr->_evaluator = $xpr->dummy_evaluator;
            echo( 'Xpresion Error: ' . $errmsg . ' at ' . $expr );
        }
        else
        {
            // make array
            $xpr->variables = array_keys( $xpr->variables );
            $xpr->_evaluator_str = $evaluator[0];
            $xpr->_evaluator = $evaluator[1];
        }
        
        return $xpr;
    }
    
    public static function render($tok, $args=null)
    {
        if (null===$args) $args=array();
        return $tok->render( $args );
    }
    
    public static function &defRE($obj, &$RE=null)
    {
        if (is_array($obj) || is_object($obj))
        {
            if (!$RE) $RE =& Xpresion::$RE_S;
            foreach ((array)$obj as $k=>$v) $RE[ $k ] = $v;
        }
        return $RE;
    }
    
    public static function &defBlock($obj, &$BLOCK=null)
    {
        if (is_array($obj) || is_object($obj))
        {
            if (!$BLOCK) $BLOCK =& Xpresion::$BLOCKS_S;
            foreach ((array)$obj as $k=>$v) $BLOCK[ $k ] = $v;
        }
        return $BLOCK;
    }
    
    public static function &defReserved($obj, &$Reserved=null)
    {
        if (is_array($obj) || is_object($obj))
        {
            if (!$Reserved) $Reserved =& Xpresion::$Reserved_S;
            foreach ((array)$obj as $k=>$v) $Reserved[ $k ] = $v;
        }
        return $Reserved;
    }
    
    public static function &defOp($obj, &$OPERATORS=null)
    {
        if (is_array($obj) || is_object($obj))
        {
            if (!$OPERATORS) $OPERATORS =& Xpresion::$OPERATORS_S;
            foreach ((array)$obj as $k=>$v) $OPERATORS[ $k ] = $v;
        }
        return $OPERATORS;
    }
    
    public static function &defFunc($obj, &$FUNCTIONS=null)
    {
        if (is_array($obj) || is_object($obj))
        {
            if (!$FUNCTIONS) $FUNCTIONS =& Xpresion::$FUNCTIONS_S;
            foreach ((array)$obj as $k=>$v) $FUNCTIONS[ $k ] = $v;
        }
        return $FUNCTIONS;
    }
    
    public static function &defRuntimeFunc($obj, &$Fn=null)
    {
        if (is_array($obj) || is_object($obj))
        {
            if (!$Fn) $Fn =& Xpresion::$Fn_S->$Fn;
            foreach ((array)$obj as $k=>$v) $Fn[ $k ] = $v;
        }
        return $Fn;
    }

    public $source = null;
    public $variables = null;
    
    public $RE = null;
    public $Reserved = null;
    public $BLOCKS = null;
    public $OPERATORS = null;
    public $FUNCTIONS = null;
    public $Fn = null;
    
    public $_cnt = 0;
    public $_cache = null;
    public $_symbol_table = null;
    public $_evaluator_str = null;
    public $_evaluator = null;
    public $dummy_evaluator = null;
    
    public function __construct($expr=null)
    {
        $this->source = $expr ? strval($expr) : '';
        $this->setup( );
        Xpresion::parse( $this );
    }

    public function __destruct()
    {
        $this->dispose();
    }
    
    public function dispose()
    {
        $this->RE = null;
        $this->Reserved = null;
        $this->BLOCKS = null;
        $this->OPERATORS = null;
        $this->FUNCTIONS = null;
        $this->Fn = null;
        $this->dummy_evaluator = null;
        
        $this->source = null;
        $this->variables = null;
        
        $this->_cnt = null;
        $this->_symbol_table = null;
        $this->_cache = null;
        $this->_evaluator_str = null;
        $this->_evaluator = null;

        return $this;
    }

    public function setup()
    {
        $this->RE = Xpresion::$RE_S;
        $this->Reserved = Xpresion::$Reserved_S;
        $this->BLOCKS = Xpresion::$BLOCKS_S;
        $this->OPERATORS = Xpresion::$OPERATORS_S;
        $this->FUNCTIONS = Xpresion::$FUNCTIONS_S;
        $this->Fn = Xpresion::$Fn_S;
        $this->dummy_evaluator = XpresionUtils::$dummy;
        return $this;
    }

    public function compile($AST)
    {
        // depth-first traversal and rendering of Abstract Syntax Tree (AST)
        $evaluator_str = XpresionNode::DFT( $AST, array('Xpresion','render'), true );
        return array($evaluator_str, create_function('$Var,$Fn,$Cache', 'return ' . $evaluator_str . ';'));
    }

    public function evaluator($evaluator=null)
    {
        if (func_num_args())
        {
            if (is_callable($evaluator)) $this->_evaluator = $evaluator;
            return $this;
        }
        return $this->_evaluator;
    }

    public function evaluate($data=array(), $Fn=null)
    {
        if (!$Fn) $Fn = $this->Fn;
        $e = $this->_evaluator;
        return $e( $data, $Fn, $this->_cache );
    }

    public function debug($data=null)
    {
        $out = array(
        'Expression: ' . $this->source,
        'Variables : [' . implode(',', $this->variables) . ']',
        'Evaluator : ' . $this->_evaluator_str
        );
        if (null!==$data)
        {
            $out[] = 'Data      : ' . print_r($data, true);
            $out[] = 'Result    : ' . print_r($this->evaluate($data), true);
        }
        return implode("\n", $out);
    }

    public function __toString()
    {
        return '[Xpresion source]: ' . $this->source . '';
    }

    public function t_liter($token, $type)
    {
        if (Xpresion::T_NUM === $type) return Xpresion::Tok(Xpresion::T_NUM, $token, $token);
        return XpresionAlias::get_entry($this->Reserved, strtolower($token));
    }

    public function t_block($token, $type, $rest='')
    {
        if (Xpresion::T_STR === $type)
        {
            return Xpresion::Tok(Xpresion::T_STR, $token, $token);
        }

        elseif (Xpresion::T_REX === $type)
        {
            $sid = 're_'.$token.$rest;
            if (isset($this->_symbol_table[$sid]))
            {
                $id = $this->_symbol_table[$sid];
            }
            else
            {
                $this->_cnt += 1;
                $id = 're_' . $this->_cnt;
                $flags = '';
                if (false !== strpos($rest, 'i')) $flags.= 'i';
                $this->_cache->{$id} = $token . $flags;
                $this->_symbol_table[$sid] = $id;
            }
            return Xpresion::Tok(Xpresion::T_REX, $token, '$Cache->'.$id);
        }
        /*elif T_DTM == type:
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
            return Tok(T_DTM, token, 'Cache.'+id+'');*/
        return false;
    }

    public function t_var($token)
    {
        if (!isset($this->variables[$token])) $this->variables[ $token ] = $token;
        return Xpresion::Tok(Xpresion::T_VAR, $token, '$Var["' . implode('"]["', explode('.', $token)) . '"]');
    }

    public function t_op($token)
    {
        $op = false;
        $op = XpresionAlias::get_entry($this->FUNCTIONS, $token);
        if (false === $op) $op = XpresionAlias::get_entry($this->OPERATORS, $token);
        return $op;
    }

    public function t_tok($token)
    {
        return Xpresion::Tok(Xpresion::T_DFT, $token, $token);
    }

    public static function _($expr=null)
    {
        return new Xpresion($expr);
    }
    
    public static function init( )
    {
    if (self::$_inited) return;

    Xpresion::$OPERATORS_S = array(
    //------------------------------------------------------------------------------------------------------------------------------
    //symbol                    input,             fixity,           associativity,         priority, arity, output,     output_type
    //------------------------------------------------------------------------------------------------------------------------------
                   // bra-kets as n-ary operators
     '('    =>     Xpresion::Op(array('(',')'), Xpresion::POSTFIX, Xpresion::RIGHT,          1,        1,    Xpresion::Tpl('$0'),   Xpresion::T_DUM )
    ,')'    =>     Xpresion::Op(')')
            
    ,'['    =>     Xpresion::Op(array('[',']'), Xpresion::POSTFIX, Xpresion::RIGHT,          2,        1,    Xpresion::Tpl('array($0)'), Xpresion::T_ARY )
    ,']'    =>     Xpresion::Op(']')
            
    ,','    =>     Xpresion::Op(',',       Xpresion::INFIX,   Xpresion::LEFT,           3,        2,    Xpresion::Tpl('$0,$1'), Xpresion::T_DFT )
                   // n-ary (ternary) if-then-else operator
    ,'?'    =>     Xpresion::Op(array('?',':'), Xpresion::INFIX,   Xpresion::LEFT,         100,        3,    Xpresion::Tpl('($0?$1:$2)'), Xpresion::T_BOL )
    ,':'    =>     Xpresion::Op(':')
            
    ,'!'    =>     Xpresion::Op('!',       Xpresion::PREFIX,  Xpresion::RIGHT,         10,        1,    Xpresion::Tpl('!$0'), Xpresion::T_BOL )
    ,'~'    =>     Xpresion::Op('~',       Xpresion::PREFIX,  Xpresion::RIGHT,         10,        1,    Xpresion::Tpl('~$0'), Xpresion::T_NUM )
            
    ,'^'    =>     Xpresion::Op('^',       Xpresion::INFIX,   Xpresion::RIGHT,         11,        2,    Xpresion::Tpl('pow($0,$1)'), Xpresion::T_NUM, Xpresion::PREFIX )
    ,'*'    =>     Xpresion::Op('*',       Xpresion::INFIX,   Xpresion::LEFT,          20,        2,    Xpresion::Tpl('($0*$1)'), Xpresion::T_NUM ) 
    ,'/'    =>     Xpresion::Op('/',       Xpresion::INFIX,   Xpresion::LEFT,          20,        2,    Xpresion::Tpl('($0/$1)'), Xpresion::T_NUM )
    ,'%'    =>     Xpresion::Op('&',       Xpresion::INFIX,   Xpresion::LEFT,          20,        2,    Xpresion::Tpl('($0%$1)'), Xpresion::T_NUM )
                   // addition/concatenation/unary plus as polymorphic operators
    ,'+'    =>     Xpresion::Op()->Polymorphic(array(
                   // array concatenation
                   array('${TOK} and (!${PREV_IS_OP}) and (${DEDUCED_TYPE}===Xpresion::T_ARY)',
                   Xpresion::Op('+',       Xpresion::INFIX,   Xpresion::LEFT,          25,        2,    Xpresion::Tpl('$Fn->ary_merge($0,$1)'), Xpresion::T_ARY ))
                   // string concatenation
                   ,array('${TOK} and (!${PREV_IS_OP}) and (${DEDUCED_TYPE}===Xpresion::T_STR)',
                   Xpresion::Op('+',       Xpresion::INFIX,   Xpresion::LEFT,          25,        2,    Xpresion::Tpl('($0.strval($1))'), Xpresion::T_STR ))
                   // numeric addition
                   ,array('${TOK} and (!${PREV_IS_OP})',
                   Xpresion::Op('+',       Xpresion::INFIX,   Xpresion::LEFT,          25,        2,    Xpresion::Tpl('($0+$1)'),  Xpresion::T_NUM ))
                   // unary plus
                   ,array('!${TOK} or ${PREV_IS_OP}',
                   Xpresion::Op('+',       Xpresion::PREFIX,  Xpresion::RIGHT,          4,        1,    Xpresion::Tpl('$0'),  Xpresion::T_NUM ))
                   ))
            
    ,'-'    =>     Xpresion::Op()->Polymorphic(array(
                   // numeric subtraction
                   array('${TOK} and (!${PREV_IS_OP})',
                   Xpresion::Op('-',       Xpresion::INFIX,   Xpresion::LEFT,          25,        2,    Xpresion::Tpl('($0-$1)'), Xpresion::T_NUM ))
                   // unary negation
                   ,array('!${TOK} or ${PREV_IS_OP}',
                   Xpresion::Op('-',       Xpresion::PREFIX,  Xpresion::RIGHT,          4,        1,    Xpresion::Tpl('(-$0)'),  Xpresion::T_NUM ))
                   ))
            
    ,'>>'   =>     Xpresion::Op('>>',      Xpresion::INFIX,   Xpresion::LEFT,          30,        2,    Xpresion::Tpl('($0>>$1)'), Xpresion::T_NUM )
    ,'<<'   =>     Xpresion::Op('<<',      Xpresion::INFIX,   Xpresion::LEFT,          30,        2,    Xpresion::Tpl('($0<<$1)'), Xpresion::T_NUM )
            
    ,'>'    =>     Xpresion::Op('>',       Xpresion::INFIX,   Xpresion::LEFT,          35,        2,    Xpresion::Tpl('($0>$1)'),  Xpresion::T_BOL )
    ,'<'    =>     Xpresion::Op('<',       Xpresion::INFIX,   Xpresion::LEFT,          35,        2,    Xpresion::Tpl('($0<$1)'),  Xpresion::T_BOL )
    ,'>='   =>     Xpresion::Op('>=',      Xpresion::INFIX,   Xpresion::LEFT,          35,        2,    Xpresion::Tpl('($0>=$1)'), Xpresion::T_BOL )
    ,'<='   =>     Xpresion::Op('<=',      Xpresion::INFIX,   Xpresion::LEFT,          35,        2,    Xpresion::Tpl('($0<=$1)'), Xpresion::T_BOL )
            
    ,'=='   =>     Xpresion::Op()->Polymorphic(array(
                   // array equivalence
                   array('${DEDUCED_TYPE}===Xpresion::T_ARY',
                   Xpresion::Op('==',      Xpresion::INFIX,   Xpresion::LEFT,          40,        2,    Xpresion::Tpl('$Fn->ary_eq($0,$1)'), Xpresion::T_BOL ))
                   // default equivalence
                   ,array('true',
                   Xpresion::Op('==',      Xpresion::INFIX,   Xpresion::LEFT,          40,        2,    Xpresion::Tpl('($0==$1)'), Xpresion::T_BOL ))
                   ))
            
    ,'!='   =>     Xpresion::Op('!=',      Xpresion::INFIX,   Xpresion::LEFT,          40,        2,    Xpresion::Tpl('($0!=$1)'), Xpresion::T_BOL )

    ,'matches' =>  Xpresion::Op('matches', Xpresion::INFIX,   Xpresion::NONE,          40,        2,    Xpresion::Tpl('$Fn->match($1,$0)'), Xpresion::T_BOL )
    ,'in'   =>     Xpresion::Op('in',      Xpresion::INFIX,   Xpresion::NONE,          40,        2,    Xpresion::Tpl('in_array($0,$1)'), Xpresion::T_BOL )
    ,'has'     =>  Xpresion::Op('has',     Xpresion::INFIX,   Xpresion::NONE,          40,        2,    Xpresion::Tpl('in_array($1,$0)'), Xpresion::T_BOL )

    ,'&'    =>     Xpresion::Op('&',       Xpresion::INFIX,   Xpresion::LEFT,          45,        2,    Xpresion::Tpl('($0&$1)'),  Xpresion::T_NUM )
    ,'|'    =>     Xpresion::Op('|',       Xpresion::INFIX,   Xpresion::LEFT,          46,        2,    Xpresion::Tpl('($0|$1)'),  Xpresion::T_NUM )

    ,'&&'   =>     Xpresion::Op('&&',      Xpresion::INFIX,   Xpresion::LEFT,          47,        2,    Xpresion::Tpl('($0&&$1)'), Xpresion::T_BOL )
    ,'||'   =>     Xpresion::Op('||',      Xpresion::INFIX,   Xpresion::LEFT,          48,        2,    Xpresion::Tpl('($0||$1)'), Xpresion::T_BOL )
     
    //------------------------------------------
    //                aliases
    //-------------------------------------------
    ,'or'    =>    Xpresion::Alias( '||' )
    ,'and'   =>    Xpresion::Alias( '&&' )
    ,'not'   =>    Xpresion::Alias( '!' )
    );

    Xpresion::$FUNCTIONS_S = array(
    //-----------------------------------------------------------------------
    //symbol              input,                     output,          output_type,priority
    //-------------------------------------------------------------------------
     'min'      => Xpresion::Func('min',   Xpresion::Tpl('min($0)'),  Xpresion::T_NUM,   5  )
    ,'max'      => Xpresion::Func('max',   Xpresion::Tpl('max($0)'),  Xpresion::T_NUM,   5  )
    ,'pow'      => Xpresion::Func('pow',   Xpresion::Tpl('pow($0)'),  Xpresion::T_NUM,   5  )
    ,'sqrt'     => Xpresion::Func('sqrt',  Xpresion::Tpl('sqrt($0)'), Xpresion::T_NUM,   5  )
    ,'len'      => Xpresion::Func('len',   Xpresion::Tpl('$Fn->len($0)'),    Xpresion::T_NUM,   5  )
    ,'int'      => Xpresion::Func('int',   Xpresion::Tpl('intval($0)'),  Xpresion::T_NUM,   5  )
    ,'str'      => Xpresion::Func('str',   Xpresion::Tpl('strval($0)'),  Xpresion::T_STR,   5  )
    ,'clamp'    => Xpresion::Func('clamp', Xpresion::Tpl('$Fn->clamp($0)'),  Xpresion::T_NUM,   5  )
    ,'sum'      => Xpresion::Func('sum',   Xpresion::Tpl('$Fn->sum($0)'),    Xpresion::T_NUM,   5  )
    ,'avg'      => Xpresion::Func('avg',   Xpresion::Tpl('$Fn->avg($0)'),    Xpresion::T_NUM,   5  )
    //---------------------------------------
    //                aliases
    //----------------------------------------
     // ...
    );

    // function implementations (can also be overriden per instance/evaluation call)
    Xpresion::$Fn_S = new XpresionFn();

    Xpresion::$RE_S = array(
    //-----------------------------------------------
    //token                re
    //-------------------------------------------------
     't_spc'        =>  '/^(\\s+)/'
    ,'t_nonspc'     =>  '/^(\\S+)/'
    ,'t_special'    =>  '/^([*.\\-+\\\\\\/\^\\$\\(\\)\\[\\]|?<:>&~%!#@=_,;{}]+)/'
    ,'t_num'        =>  '/^(\\d+(\\.\\d+)?)/'
    ,'t_ident'      =>  '/^([a-zA-Z_][a-zA-Z0-9_]*)\\b/'
    ,'t_var'        =>  '/^\\$([a-zA-Z0-9_][a-zA-Z0-9_.]*)\\b/'
    );

    Xpresion::$BLOCKS_S = array(
     '\''=> array(
        'type'=> Xpresion::T_STR, 
        'parse'=> array('Xpresion','parse_delimited_block')
    )
    ,'"'=> Xpresion::Alias('\'')
    ,'`'=> array(
        'type'=> Xpresion::T_REX, 
        'parse'=> array('Xpresion','parse_delimited_block'),
        'rest'=> array('XpresionUtils','parse_re_flags')
    )
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
    );

    Xpresion::$Reserved_S = array(
     'null'     => Xpresion::Tok(Xpresion::T_IDE, 'null', 'null')
    ,'false'    => Xpresion::Tok(Xpresion::T_BOL, 'false', 'false')
    ,'true'     => Xpresion::Tok(Xpresion::T_BOL, 'true', 'true')
    ,'infinity' => Xpresion::Tok(Xpresion::T_NUM, 'Infinity', 'INF')
    ,'nan'      => Xpresion::Tok(Xpresion::T_NUM, 'NaN', 'NAN')
    // aliases
    ,'none'     => Xpresion::Alias('null')
    ,'inf'      => Xpresion::Alias('inf')
    );

    XpresionUtils::$dummy = create_function('$Var,$Fn,$Cache', 'return null;');
    
    self::$_inited = true;
    }
    
}

Xpresion::init( );
}
