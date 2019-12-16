<?php
/**
*
*   Xpresion
*   Simple eXpression parser engine with variables and custom functions support for PHP, Python, Node.js and Browser
*   @version: 1.0.1
*
*   https://github.com/foo123/Xpresion
*
**/

// https://github.com/foo123/GrammarTemplate
if ( !class_exists('GrammarTemplate') )
{
class GrammarTemplate__StackEntry
{
    public $value = null;
    public $prev = null;

    public function __construct($stack=null, $value=null)
    {
        $this->prev = $stack;
        $this->value = $value;
    }
}
class GrammarTemplate__TplEntry
{
    public $node = null;
    public $prev = null;
    public $next = null;

    public function __construct($node=null, $tpl=null)
    {
        if ( $tpl ) $tpl->next = $this;
        $this->node = $node;
        $this->prev = $tpl;
        $this->next = null;
    }
}

class GrammarTemplate
{
    const VERSION = '3.0.0';

    public static function pad( $s, $n, $z='0', $pad_right=false )
    {
        $ps = (string)$s;
        if ( $pad_right ) while ( strlen($ps) < $n ) $ps .= $z;
        else while ( strlen($ps) < $n ) $ps = $z . $ps;
        return $ps;
    }

    public static function guid( )
    {
        static $GUID = 0;
        $GUID += 1;
        return self::pad(dechex(time()),12).'--'.self::pad(dechex($GUID),4);
    }

    private static function is_array( $a )
    {
        if ( (null != $a) && is_array( $a ) )
        {
            $array_keys = array_keys( $a );
            return !empty($array_keys) && (array_keys($array_keys) === $array_keys);
        }
        return false;
    }

    private static function compute_alignment( $s, $i, $l )
    {
        $alignment = '';
        while ( $i < $l )
        {
            $c = $s[$i];
            if ( (" " === $c) || ("\r" === $c) || ("\t" === $c) || ("\v" === $c) || ("\0" === $c) )
            {
                $alignment .= $c;
                $i += 1;
            }
            else
            {
                break;
            }
        }
        return $alignment;
    }

    public static function align( $s, $alignment )
    {
        $l = strlen($s);
        if ( $l && strlen($alignment) )
        {
            $aligned = '';
            for($i=0; $i<$l; $i++)
            {
                $c = $s[$i];
                $aligned .= $c;
                if ( "\n" === $c ) $aligned .= $alignment;
            }
        }
        else
        {
            $aligned = $s;
        }
        return $aligned;
    }

    private static function walk( $obj, $keys, $keys_alt=null, $obj_alt=null )
    {
        $found = 0;
        if ( $keys )
        {
            $o = $obj;
            $l = count($keys);
            $i = 0;
            $found = 1;
            while( $i < $l )
            {
                $k = $keys[$i++];
                if ( isset($o) )
                {
                    if ( is_array($o) && isset($o[$k]) )
                    {
                        $o = $o[$k];
                    }
                    elseif ( is_object($o) && isset($o->{$k}) )
                    {
                        $o = $o->{$k};
                    }
                    else
                    {
                        $found = 0;
                        break;
                    }
                }
                else
                {
                    $found = 0;
                    break;
                }
            }
        }
        if ( !$found && $keys_alt )
        {
            $o = $obj;
            $l = count($keys_alt);
            $i = 0;
            $found = 1;
            while( $i < $l )
            {
                $k = $keys_alt[$i++];
                if ( isset($o) )
                {
                    if ( is_array($o) && isset($o[$k]) )
                    {
                        $o = $o[$k];
                    }
                    elseif ( is_object($o) && isset($o->{$k}) )
                    {
                        $o = $o->{$k};
                    }
                    else
                    {
                        $found = 0;
                        break;
                    }
                }
                else
                {
                    $found = 0;
                    break;
                }
            }
        }
        if ( !$found && (null !== $obj_alt) && ($obj_alt !== $obj) )
        {
            if ( $keys )
            {
                $o = $obj_alt;
                $l = count($keys);
                $i = 0;
                $found = 1;
                while( $i < $l )
                {
                    $k = $keys[$i++];
                    if ( isset($o) )
                    {
                        if ( is_array($o) && isset($o[$k]) )
                        {
                            $o = $o[$k];
                        }
                        elseif ( is_object($o) && isset($o->{$k}) )
                        {
                            $o = $o->{$k};
                        }
                        else
                        {
                            $found = 0;
                            break;
                        }
                    }
                    else
                    {
                        $found = 0;
                        break;
                    }
                }
            }
            if ( !$found && $keys_alt )
            {
                $o = $obj_alt;
                $l = count($keys_alt);
                $i = 0;
                $found = 1;
                while( $i < $l )
                {
                    $k = $keys_alt[$i++];
                    if ( isset($o) )
                    {
                        if ( is_array($o) && isset($o[$k]) )
                        {
                            $o = $o[$k];
                        }
                        elseif ( is_object($o) && isset($o->{$k}) )
                        {
                            $o = $o->{$k};
                        }
                        else
                        {
                            $found = 0;
                            break;
                        }
                    }
                    else
                    {
                        $found = 0;
                        break;
                    }
                }
            }
        }
        return $found ? $o : null;
    }

    public static function multisplit( $tpl, $delims, $postop=false )
    {
        $IDL = $delims[0]; $IDR = $delims[1];
        $OBL = $delims[2]; $OBR = $delims[3];
        $lenIDL = strlen($IDL); $lenIDR = strlen($IDR);
        $lenOBL = strlen($OBL); $lenOBR = strlen($OBR);
        $ESC = '\\'; $OPT = '?'; $OPTR = '*'; $NEG = '!'; $DEF = '|'; $COMMENT = '#';
        $TPL = ':='; $REPL = '{'; $REPR = '}'; $DOT = '.'; $REF = ':'; $ALGN = '@'; //$NOTALGN = '&';
        $COMMENT_CLOSE = $COMMENT.$OBR;
        $default_value = null; $negative = 0; $optional = 0;
        $aligned = 0; $localised = 0;
        $l = strlen($tpl);

        $delim1 = array($IDL, $lenIDL, $IDR, $lenIDR);
        $delim2 = array($OBL, $lenOBL, $OBR, $lenOBR);
        $delim_order = array(null,0,null,0,null,0,null,0);

        $postop = true === $postop;
        $a = new GrammarTemplate__TplEntry((object)array('type'=> 0, 'val'=> '', 'algn'=> ''));
        $cur_arg = (object)array(
            'type'    => 1,
            'name'    => null,
            'key'     => null,
            'stpl'    => null,
            'dval'    => null,
            'opt'     => 0,
            'neg'     => 0,
            'algn'    => 0,
            'loc'     => 0,
            'start'   => 0,
            'end'     => 0
        );
        $roottpl = $a; $block = null;
        $opt_args = null; $subtpl = array(); $cur_tpl = null; $arg_tpl = array(); $start_tpl = null;

        // hard-coded merge-sort for arbitrary delims parsing based on str len
        if ( $delim1[1] < $delim1[3] )
        {
            $s = $delim1[0]; $delim1[2] = $delim1[0]; $delim1[0] = $s;
            $i = $delim1[1]; $delim1[3] = $delim1[1]; $delim1[1] = $i;
        }
        if ( $delim2[1] < $delim2[3] )
        {
            $s = $delim2[0]; $delim2[2] = $delim2[0]; $delim2[0] = $s;
            $i = $delim2[1]; $delim2[3] = $delim2[1]; $delim2[1] = $i;
        }
        $start_i = 0; $end_i = 0; $i = 0;
        while ( (4 > $start_i) && (4 > $end_i) )
        {
            if ( $delim1[$start_i+1] < $delim2[$end_i+1] )
            {
                $delim_order[$i] = $delim2[$end_i];
                $delim_order[$i+1] = $delim2[$end_i+1];
                $end_i += 2;
            }
            else
            {
                $delim_order[$i] = $delim1[$start_i];
                $delim_order[$i+1] = $delim1[$start_i+1];
                $start_i += 2;
            }
            $i += 2;
        }
        while ( 4 > $start_i )
        {
            $delim_order[$i] = $delim1[$start_i];
            $delim_order[$i+1] = $delim1[$start_i+1];
            $start_i += 2; $i += 2;
        }
        while ( 4 > $end_i )
        {
            $delim_order[$i] = $delim2[$end_i];
            $delim_order[$i+1] = $delim2[$end_i+1];
            $end_i += 2; $i += 2;
        }

        $stack = null; $s = '';

        $i = 0;
        while( $i < $l )
        {
            $c = $tpl[$i];
            if ( $ESC === $c )
            {
                $s .= $i+1 < $l ? $tpl[$i+1] : '';
                $i += 2;
                continue;
            }

            $delim = null;
            if ( $delim_order[0] === substr($tpl,$i,$delim_order[1]) )
                $delim = $delim_order[0];
            elseif ( $delim_order[2] === substr($tpl,$i,$delim_order[3]) )
                $delim = $delim_order[2];
            elseif ( $delim_order[4] === substr($tpl,$i,$delim_order[5]) )
                $delim = $delim_order[4];
            elseif ( $delim_order[6] === substr($tpl,$i,$delim_order[7]) )
                $delim = $delim_order[6];

            if ( $IDL === $delim )
            {
                $i += $lenIDL;

                if ( strlen($s) )
                {
                    if ( 0 === $a->node->type ) $a->node->val .= $s;
                    else $a = new GrammarTemplate__TplEntry((object)array('type'=> 0, 'val'=> $s, 'algn'=> ''), $a);
                }

                $s = '';
            }
            else if ( $IDR === $delim )
            {
                $i += $lenIDR;

                // argument
                $argument = $s; $s = '';
                $p = strpos($argument, $DEF);
                if ( false !== $p )
                {
                    $default_value = substr($argument, $p+1);
                    $argument = substr($argument, 0, $p);
                }
                else
                {
                    $default_value = null;
                }
                if ( $postop )
                {
                    $c = $i < $l ? $tpl[$i] : '';
                }
                else
                {
                    $c = $argument[0];
                }
                if ( $OPT === $c || $OPTR === $c )
                {
                    $optional = 1;
                    if ( $OPTR === $c )
                    {
                        $start_i = 1;
                        $end_i = -1;
                    }
                    else
                    {
                        $start_i = 0;
                        $end_i = 0;
                    }
                    if ( $postop )
                    {
                        $i += 1;
                        if ( ($i < $l) && ($NEG === $tpl[$i]) )
                        {
                            $negative = 1;
                            $i += 1;
                        }
                        else
                        {
                            $negative = 0;
                        }
                    }
                    else
                    {
                        if ( $NEG === $argument[1] )
                        {
                            $negative = 1;
                            $argument = substr($argument,2);
                        }
                        else
                        {
                            $negative = 0;
                            $argument = substr($argument,1);
                        }
                    }
                }
                elseif ( $REPL === $c )
                {
                    if ( $postop )
                    {
                        $s = ''; $j = $i+1; $jl = $l;
                        while ( ($j < $jl) && ($REPR !== $tpl[j]) ) $s .= $tpl[$j++];
                        $i = $j+1;
                    }
                    else
                    {
                        $s = ''; $j = 1; $jl = strlen($argument);
                        while ( ($j < $jl) && ($REPR !== $argument[$j]) ) $s .= $argument[$j++];
                        $argument = substr($argument, $j+1);
                    }
                    $s = explode(',', $s);
                    if ( count($s) > 1 )
                    {
                        $start_i = trim($s[0]);
                        $start_i = strlen($start_i) ? intval($start_i,10) : 0;
                        if ( is_nan($start_i) ) $start_i = 0;
                        $end_i = trim($s[1]);
                        $end_i = strlen($end_i) ? intval($end_i,10) : -1;
                        if ( is_nan($end_i) ) $end_i = 0;
                        $optional = 1;
                    }
                    else
                    {
                        $start_i = trim($s[0]);
                        $start_i = strlen($start_i) ? intval($start_i,10) : 0;
                        if ( is_nan($start_i) ) $start_i = 0;
                        $end_i = $start_i;
                        $optional = 0;
                    }
                    $s = '';
                    $negative = 0;
                }
                else
                {
                    $optional = 0;
                    $negative = 0;
                    $start_i = 0;
                    $end_i = 0;
                }
                if ( $negative && (null === $default_value) ) $default_value = '';

                $c = $argument[0];
                if ( $ALGN === $c )
                {
                    $aligned = 1;
                    $argument = substr($argument,1);
                }
                else
                {
                    $aligned = 0;
                }

                $c = $argument[0];
                if ( $DOT === $c )
                {
                    $localised = 1;
                    $argument = substr($argument,1);
                }
                else
                {
                    $localised = 0;
                }

                $template = false !== strpos($argument, $REF) ? explode($REF, $argument) : array($argument,null);
                $argument = $template[0]; $template = $template[1];
                $nested = false !== strpos($argument, $DOT) ? explode($DOT, $argument) : null;

                if ( $cur_tpl && !isset($arg_tpl[$cur_tpl]) ) $arg_tpl[$cur_tpl] = array();

                if ( $TPL.$OBL === substr($tpl,$i,2+$lenOBL) )
                {
                    // template definition
                    $i += 2;
                    $template = $template&&strlen($template) ? $template : 'grtpl--'.self::guid( );
                    $start_tpl = $template;
                    if ( $cur_tpl && strlen($argument))
                        $arg_tpl[$cur_tpl][$argument] = $template;
                }

                if ( !strlen($argument) ) continue; // template definition only

                if ( (null==$template) && $cur_tpl && isset($arg_tpl[$cur_tpl]) && isset($arg_tpl[$cur_tpl][$argument]) )
                    $template = $arg_tpl[$cur_tpl][$argument];

                if ( $optional && !$cur_arg->opt )
                {
                    $cur_arg->name = $argument;
                    $cur_arg->key = $nested;
                    $cur_arg->stpl = $template;
                    $cur_arg->dval = $default_value;
                    $cur_arg->opt = $optional;
                    $cur_arg->neg = $negative;
                    $cur_arg->algn = $aligned;
                    $cur_arg->loc = $localised;
                    $cur_arg->start = $start_i;
                    $cur_arg->end = $end_i;
                    // handle multiple optional arguments for same optional block
                    $opt_args = new GrammarTemplate__StackEntry(null, array($argument,$nested,$negative,$start_i,$end_i,$optional,$localised));
                }
                else if ( $optional )
                {
                    // handle multiple optional arguments for same optional block
                    if ( ($start_i !== $end_i) && ($cur_arg->start === $cur_arg->end) )
                    {
                        // set as main arg a loop arg, if exists
                        $cur_arg->name = $argument;
                        $cur_arg->key = $nested;
                        $cur_arg->stpl = $template;
                        $cur_arg->dval = $default_value;
                        $cur_arg->opt = $optional;
                        $cur_arg->neg = $negative;
                        $cur_arg->algn = $aligned;
                        $cur_arg->loc = $localised;
                        $cur_arg->start = $start_i;
                        $cur_arg->end = $end_i;
                    }
                    $opt_args = new GrammarTemplate__StackEntry($opt_args, array($argument,$nested,$negative,$start_i,$end_i,$optional,$localised));
                }
                else if ( !$optional && (null === $cur_arg->name) )
                {
                    $cur_arg->name = $argument;
                    $cur_arg->key = $nested;
                    $cur_arg->stpl = $template;
                    $cur_arg->dval = $default_value;
                    $cur_arg->opt = 0;
                    $cur_arg->neg = $negative;
                    $cur_arg->algn = $aligned;
                    $cur_arg->loc = $localised;
                    $cur_arg->start = $start_i;
                    $cur_arg->end = $end_i;
                    // handle multiple optional arguments for same optional block
                    $opt_args = new GrammarTemplate__StackEntry(null, array($argument,$nested,$negative,$start_i,$end_i,0,$localised));
                }
                if ( 0 === $a->node->type ) $a->node->algn = self::compute_alignment($a->node->val, 0, strlen($a->node->val));
                $a = new GrammarTemplate__TplEntry((object)array(
                    'type'    => 1,
                    'name'    => $argument,
                    'key'     => $nested,
                    'stpl'    => $template,
                    'dval'    => $default_value,
                    'opt'     => $optional,
                    'algn'    => $aligned,
                    'loc'     => $localised,
                    'start'   => $start_i,
                    'end'     => $end_i
                ), $a);
            }
            else if ( $OBL === $delim )
            {
                $i += $lenOBL;

                if ( strlen($s) )
                {
                    if ( 0 === $a->node->type ) $a->node->val .= $s;
                    else $a = new GrammarTemplate__TplEntry((object)array('type'=> 0, 'val'=> $s, 'algn'=> ''), $a);
                }
                $s = '';

                // comment
                if ( $COMMENT === $tpl[$i] )
                {
                    $j = $i+1; $jl = $l;
                    while ( ($j < $jl) && ($COMMENT_CLOSE !== substr($tpl,$j,$lenOBR+1)) ) $s .= $tpl[$j++];
                    $i = $j+$lenOBR+1;
                    if ( 0 === $a->node->type ) $a->node->algn = self::compute_alignment($a->node->val, 0, strlen($a->node->val));
                    $a = new GrammarTemplate__TplEntry((object)array('type'=> -100, 'val'=> $s), $a);
                    $s = '';
                    continue;
                }

                // optional block
                $stack = new GrammarTemplate__StackEntry($stack, array($a, $block, $cur_arg, $opt_args, $cur_tpl, $start_tpl));
                if ( $start_tpl ) $cur_tpl = $start_tpl;
                $start_tpl = null;
                $cur_arg = (object)array(
                    'type'    => 1,
                    'name'    => null,
                    'key'     => null,
                    'stpl'    => null,
                    'dval'    => null,
                    'opt'     => 0,
                    'neg'     => 0,
                    'algn'    => 0,
                    'loc'     => 0,
                    'start'   => 0,
                    'end'     => 0
                );
                $opt_args = null;
                $a = new GrammarTemplate__TplEntry((object)array('type'=> 0, 'val'=> '', 'algn'=> ''));
                $block = $a;
            }
            else if ( $OBR === $delim )
            {
                $i += $lenOBR;

                $b = $a;
                $cur_block = $block;
                $prev_arg = $cur_arg;
                $prev_opt_args = $opt_args;
                if ( $stack )
                {
                    $a = $stack->value[0];
                    $block = $stack->value[1];
                    $cur_arg = $stack->value[2];
                    $opt_args = $stack->value[3];
                    $cur_tpl = $stack->value[4];
                    $start_tpl = $stack->value[5];
                    $stack = $stack->prev;
                }
                else
                {
                    $a = null;
                }
                if ( strlen($s) )
                {
                    if ( 0 === $b->node->type ) $b->node->val .= $s;
                    else $b = new GrammarTemplate__TplEntry((object)array('type'=> 0, 'val'=> $s, 'algn'=> ''), $b);
                }

                $s = '';
                if ( $start_tpl )
                {
                    $subtpl[$start_tpl] = new GrammarTemplate__TplEntry((object)array(
                        'type'    => 2,
                        'name'    => $prev_arg->name,
                        'key'     => $prev_arg->key,
                        'loc'     => $prev_arg->loc,
                        'algn'    => $prev_arg->algn,
                        'start'   => $prev_arg->start,
                        'end'     => $prev_arg->end,
                        'opt_args'=> null,
                        'tpl'     => $cur_block
                    ));
                    $start_tpl = null;
                }
                else
                {
                    if ( 0 === $a->node->type ) $a->node->algn = self::compute_alignment($a->node->val, 0, strlen($a->node->val));
                    $a = new GrammarTemplate__TplEntry((object)array(
                        'type'    => -1,
                        'name'    => $prev_arg->name,
                        'key'     => $prev_arg->key,
                        'loc'     => $prev_arg->loc,
                        'algn'    => $prev_arg->algn,
                        'start'   => $prev_arg->start,
                        'end'     => $prev_arg->end,
                        'opt_args'=> $prev_opt_args,
                        'tpl'     => $cur_block
                    ), $a);
                }
            }
            else
            {
                $c = $tpl[$i++];
                if ( "\n" === $c )
                {
                    // note line changes to handle alignments
                    if ( strlen($s) )
                    {
                        if ( 0 === $a->node->type ) $a->node->val .= $s;
                        else $a = new GrammarTemplate__TplEntry((object)array('type'=> 0, 'val'=> $s, 'algn'=> ''), $a);
                    }
                    $s = '';
                    if ( 0 === $a->node->type ) $a->node->algn = self::compute_alignment($a->node->val, 0, strlen($a->node->val));
                    $a = new GrammarTemplate__TplEntry((object)array('type'=> 100, 'val'=> "\n"), $a);
                }
                else
                {
                    $s .= $c;
                }
            }
        }
        if ( strlen($s) )
        {
            if ( 0 === $a->node->type ) $a->node->val .= $s;
            else $a = new GrammarTemplate__TplEntry((object)array('type'=> 0, 'val'=> $s, 'algn'=> ''), $a);
        }
        if ( 0 === $a->node->type ) $a->node->algn = self::compute_alignment($a->node->val, 0, strlen($a->node->val));
        return array($roottpl, &$subtpl);
    }

    public static function optional_block( $args, $block, &$SUB, &$FN, $index=null, $alignment='', $orig_args=null )
    {
        $out = '';
        $block_arg = null;

        if ( -1 === $block->type )
        {
            // optional block, check if optional variables can be rendered
            $opt_vars = $block->opt_args;
            // if no optional arguments, render block by default
            if ( $opt_vars && $opt_vars->value[5] )
            {
                while( $opt_vars )
                {
                    $opt_v = $opt_vars->value;
                    $opt_arg = self::walk( $args, $opt_v[1], array((string)$opt_v[0]), $opt_v[6] ? null : $orig_args );
                    if ( (null === $block_arg) && ($block->name === $opt_v[0]) ) $block_arg = $opt_arg;

                    if ( (0 === $opt_v[2] && null === $opt_arg) || (1 === $opt_v[2] && null !== $opt_arg) )  return '';
                    $opt_vars = $opt_vars->prev;
                }
            }
        }
        else
        {
            $block_arg = self::walk( $args, $block->key, array((string)$block->name), $block->loc ? null : $orig_args );
        }

        $arr = self::is_array( $block_arg ); $len = $arr ? count($block_arg) : -1;
        //if ( !$block->algn ) $alignment = '';
        if ( $arr && ($len > $block->start) )
        {
            for($rs=$block->start,$re=(-1===$block->end?$len-1:min($block->end,$len-1)),$ri=$rs; $ri<=$re; $ri++)
                $out .= self::main( $args, $block->tpl, $SUB, $FN, $ri, $alignment, $orig_args );
        }
        else if ( !$arr && ($block->start === $block->end) )
        {
            $out = self::main( $args, $block->tpl, $SUB, $FN, null, $alignment, $orig_args );
        }
        return $out;
    }
    public static function non_terminal( $args, $symbol, &$SUB, &$FN, $index=null, $alignment='', $orig_args=null )
    {
        $out = '';
        if ( $symbol->stpl && (
            (!empty($SUB) && isset($SUB[$symbol->stpl])) ||
            (isset(self::$subGlobal[$symbol->stpl])) ||
            (!empty($FN) && (isset($FN[$symbol->stpl]) || isset($FN['*']))) ||
            (isset(self::$fnGlobal[$symbol->stpl]) || isset(self::$fnGlobal['*']))
        ) )
        {
            // using custom function or sub-template
            $opt_arg = self::walk( $args, $symbol->key, array((string)$symbol->name), $symbol->loc ? null : $orig_args );

            if ( (!empty($SUB) && isset($SUB[$symbol->stpl])) || isset(self::$subGlobal[$symbol->stpl]) )
            {
                // sub-template
                if ( (null !== $index) && ((0 !== $index) || ($symbol->start !== $symbol->end) || !$symbol->opt) && self::is_array($opt_arg) )
                {
                    $opt_arg = $index < count($opt_arg) ? $opt_arg[ $index ] : null;
                }
                if ( (null === $opt_arg) && (null !== $symbol->dval) )
                {
                    // default value if missing
                    $out = $symbol->dval;
                }
                else
                {
                    // try to associate sub-template parameters to actual input arguments
                    $tpl = !empty($SUB) && isset($SUB[$symbol->stpl]) ? $SUB[$symbol->stpl]->node : self::$subGlobal[$symbol->stpl]->node;
                    $tpl_args = array();
                    if ( null !== $opt_arg )
                    {
                        if ( self::is_array($opt_arg) ) $tpl_args[$tpl->name] = $opt_arg;
                        else $tpl_args = $opt_arg;
                    }
                    $out = self::optional_block( $tpl_args, $tpl, $SUB, $FN, null, $symbol->algn ? $alignment : '', null === $orig_args ? $args : $orig_args );
                    //if ( $symbol->algn ) $out = self::align($out, $alignment);
                }
            }
            else//if ( $fn )
            {
                // custom function
                $fn = null;
                if     ( !empty($FN) && isset($FN[$symbol->stpl]) ) $fn = $FN[$symbol->stpl];
                elseif ( !empty($FN) && isset($FN['*']) )           $fn = $FN['*'];
                elseif ( isset(self::$fnGlobal[$symbol->stpl]) )    $fn = self::$fnGlobal[$symbol->stpl];
                elseif ( isset(self::$fnGlobal['*']) )              $fn = self::$fnGlobal['*'];

                if ( self::is_array($opt_arg) )
                {
                    $index = null !== $index ? $index : $symbol->start;
                    $opt_arg = $index < count($opt_arg) ? $opt_arg[ $index ] : null;
                }

                if ( is_callable($fn) )
                {
                    $fn_arg = (object)array(
                        //'value'               => $opt_arg,
                        'symbol'              => $symbol,
                        'index'               => $index,
                        'currentArguments'    => &$args,
                        'originalArguments'   => &$orig_args,
                        'alignment'           => $alignment
                    );
                    $opt_arg = call_user_func($fn, $opt_arg, $fn_arg);
                }
                else
                {
                    $opt_arg = strval($fn);
                }

                $out = (null === $opt_arg) && (null !== $symbol->dval) ? $symbol->dval : strval($opt_arg);
                if ( $symbol->algn ) $out = self::align($out, $alignment);
            }
        }
        elseif ( $symbol->opt && (null !== $symbol->dval) )
        {
            // boolean optional argument
            $out = $symbol->dval;
        }
        else
        {
            // plain symbol argument
            $opt_arg = self::walk( $args, $symbol->key, array((string)$symbol->name), $symbol->loc ? null : $orig_args );

            // default value if missing
            if ( self::is_array($opt_arg) )
            {
                $index = null !== $index ? $index : $symbol->start;
                $opt_arg = $index < count($opt_arg) ? $opt_arg[ $index ] : null;
            }
            $out = (null === $opt_arg) && (null !== $symbol->dval) ? $symbol->dval : strval($opt_arg);
            if ( $symbol->algn ) $out = self::align($out, $alignment);
        }
        return $out;
    }
    public static function main( $args, $tpl, &$SUB=null, &$FN=null, $index=null, $alignment='', $orig_args=null )
    {
        $out = '';
        $current_alignment = $alignment;
        while ( $tpl )
        {
            $tt = $tpl->node->type;
            if ( -1 === $tt ) /* optional code-block */
            {
                $out .= self::optional_block( $args, $tpl->node, $SUB, $FN, $index, $tpl->node->algn ? $current_alignment : $alignment, $orig_args );
            }
            elseif ( 1 === $tt ) /* non-terminal */
            {
                $out .= self::non_terminal( $args, $tpl->node, $SUB, $FN, $index, $tpl->node->algn ? $current_alignment : $alignment, $orig_args );
            }
            elseif ( 0 === $tt ) /* terminal */
            {
                $current_alignment .= $tpl->node->algn;
                $out .= $tpl->node->val;
            }
            elseif ( 100 === $tt ) /* new line */
            {
                $current_alignment = $alignment;
                $out .= "\n" . $alignment;
            }
            /*elseif ( -100 === $tt ) /* comment * /
            {
                /* pass * /
            }*/
            $tpl = $tpl->next;
        }
        return $out;
    }

    public static $defaultDelimiters = array('<','>','[',']');
    public static $fnGlobal = array();
    public static $subGlobal = array();

    public $id = null;
    public $tpl = null;
    public $fn = null;
    protected $_args = null;

    public function __construct($tpl='', $delims=null, $postop=false)
    {
        $this->id = null;
        $this->tpl = null;
        $this->fn = array();
        if ( empty($delims) ) $delims = self::$defaultDelimiters;
        // lazy init
        $this->_args = array($tpl, $delims, $postop);
    }

    public function __destruct()
    {
        $this->dispose();
    }

    public function dispose()
    {
        $this->id = null;
        $this->tpl = null;
        $this->fn = null;
        $this->_args = null;
        return $this;
    }

    public function parse( )
    {
        if ( (null === $this->tpl) && (null !== $this->_args) )
        {
            // lazy init
            $this->tpl = self::multisplit( $this->_args[0], $this->_args[1], $this->_args[2] );
            $this->_args = null;
        }
        return $this;
    }

    public function render($args=null)
    {
        // lazy init
        if ( null === $this->tpl ) $this->parse( );
        return self::main( null === $args ? array() : $args, $this->tpl[0], $this->tpl[1], $this->fn );
    }
}
}

if (!class_exists('Xpresion'))
{
class XpresionUtils
{
    public static function dummy($Var)
    {
        return null;
    }

    public static function createFunc($args, $body)
    {
        if ( version_compare(phpversion(), '5.3.0', '>=') )
        {
            // create_function is deprecated in php 7.2+
            $func = eval('return function('.$args.'){'.$body.'};');
        }
        else
        {
            // older php versions are NOT supported
            $func = null;
        }
        return $func;
    }

    public static function parse_re_flags($s,$i,$l)
    {
        $flags = '';
        $has_i = false;
        $has_g = false;
        $has_m = false;
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

            if ('m' == $ch && !$has_m)
            {
                $flags .= 'm';
                $has_m = true;
            }

            if ('g' == $ch && !$has_g)
            {
                $flags .= 'g';
                $has_g = true;
            }

            if ($seq >= 3 || (!$has_i && !$has_g && !$has_m))
            {
                $not_done = false;
            }
        }
        return $flags;
    }

    public static function is_assoc_array( $a )
    {
        // http://stackoverflow.com/a/265144/3591273
        $k = array_keys( $a );
        return $k !== array_keys( $k );
    }

    public static function evaluator_factory( $evaluator_str, $Fn, $Cache )
    {
        // use closure to have access to $Fn and $Cache objects
        $evaluator_factory = self::createFunc('$Fn,$Cache',implode("\n", array(
            '$evaluator = function($Var) use($Fn,$Cache) {',
            '    return ' . $evaluator_str . ';',
            '};',
            'return $evaluator;'
        )));
        $evaluator = $evaluator_factory ? $evaluator_factory($Fn,$Cache) : null;
        return $evaluator;
    }
}

class XpresionNode
{
    # depth-first traversal
    public static function DFT($root, $action=null, $andDispose=false)
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
                $arity = $op->arity;
                if ( (Xpresion::T_OP & $op->type) && 0 === $arity ) $arity = 1; // have already padded with empty token
                elseif ( $arity > count($output) && $op->arity_min <= $op->arity ) $arity = $op->arity_min;
                $o = call_user_func($action, $op, (array)array_splice($output, -$arity, $arity));
                $output[] = $o;
                if ($andDispose) $node->dispose( );
            }
        }

        $stack = null;
        return $output[ 0 ];
    }

    public $type = null;
    public $arity = null;
    public $pos = null;
    public $node = null;
    public $op_parts = null;
    public $op_def = null;
    public $op_index = null;
    public $children = null;

    public function __construct($type, $arity, $node, $children=null, $pos=0)
    {
        $this->type = $type;
        $this->arity = $arity;
        $this->node = $node;
        $this->children = $children;
        $this->pos = $pos;
        $this->op_parts = null;
        $this->op_def = null;
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
        $this->arity = null;
        $this->pos = null;
        $this->node = null;
        $this->op_parts = null;
        $this->op_def = null;
        $this->op_index = null;
        $this->children = null;
        return $this;
    }

    public function op_next($op, $pos, &$op_queue, &$token_queue)
    {
        $num_args = 0;
        $next_index = array_search($op->input, $this->op_parts);
        $is_next = (0 === $next_index);
        if ( $is_next )
        {
            if ( 0 === $this->op_def[0][0] )
            {
                $num_args = XpresionOp::match_args($this->op_def[0][2], $pos-1, $op_queue, $token_queue );
                if ( false === $num_args )
                {
                    $is_next = false;
                }
                else
                {
                    $this->arity = $num_args;
                    array_shift($this->op_def);
                }
            }
        }
        if ( $is_next )
        {
            array_shift($this->op_def);
            array_shift($this->op_parts);
        }
        return $is_next;
    }

    public function op_complete()
    {
        return empty($this->op_parts);
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
                // circular reference
                if ($entry === $entries[ $id ]) return false;
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
    public $arity_min = null;
    public $arity_max = null;
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
        $this->arity_min = 0;
        $this->arity_max = 0;
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
        $this->arity_min = null;
        $this->arity_max = null;
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

        if ($token instanceof GrammarTemplate)   $out = $token->render( array('$'=>$args) );
        else                                     $out = strval($token);
        return $lparen . $out . $rparen;
    }

    public function node($args=null, $pos=0)
    {
        return new XpresionNode($this->type, $this->arity, $this, $args ? $args : null, $pos);
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
        if ( is_string($f[0]) )
        {
            try {
                $f[0] = XpresionUtils::createFunc('$curr', 'return '.$f[0].';');
            } catch (\Exception $e) {
                $f[0] = null;
            }
        }
        return array(
            is_callable($f[0]) ? $f[0] : null
            ,$f[1]
        );
    }

    public static function parse_definition( $op_def )
    {
        $parts = array();
        $op = array();
        $arity = 0;
        $arity_min = 0;
        $arity_max = 0;
        if ( is_string($op_def) )
        {
            // assume infix, arity = 2;
            $op_def = array(1,$op_def,1);
        }
        else
        {
            $op_def = (array)$op_def;
        }
        $l = count($op_def);
        for ($i=0; $i<$l; $i++)
        {
            if ( is_string( $op_def[$i] ) )
            {
                $parts[] = $op_def[$i];
                $op[] = array(1, $i, $op_def[$i]);
            }
            else
            {
                $op[] = array(0, $i, $op_def[$i]);
                $num_args = abs($op_def[$i]);
                $arity += $num_args;
                $arity_max += $num_args;
                $arity_min += $op_def[$i];
            }
        }
        if ( 1 === count($parts) && 1 === count($op) )
        {
            $op = array(array(0, 0, 1), array(1, 1, $parts[0]), array(0, 2, 1));
            $arity_min = $arity_max = $arity = 2; $type = Xpresion::T_OP;
        }
        else
        {
            $type = count($parts) > 1 ? Xpresion::T_N_OP : Xpresion::T_OP;
        }
        return array($type, $op, $parts, $arity, max(0, $arity_min), $arity_max);
    }

    public static function match_args( $expected_args, $args_pos, &$op_queue, &$token_queue )
    {
        $tl = count($token_queue);
        $t = $tl-1;
        $num_args = 0;
        $num_expected_args = abs($expected_args);
        $INF = -10;
        while ($num_args < $num_expected_args || $t >= 0 )
        {
            $p2 = $t >= 0 ? $token_queue[$t]->pos : $INF;
            if ( $args_pos === $p2 )
            {
                $num_args++;
                $args_pos--;
                $t--;
            }
            else break;
        }
        return $num_args >= $num_expected_args ? $num_expected_args : ($expected_args <= 0 ? 0 : false);
    }

    public $otype = null;
    public $ofixity = null;
    public $opdef = null;
    public $parts = null;
    public $morphes = null;

    public function __construct($input='', $output='', $otype=null, $fixity=null, $associativity=null, $priority=null, /*$arity,*/ $ofixity=null)
    {
        $opdef = self::parse_definition( $input );
        $this->type = $opdef[0];
        $this->opdef = $opdef[1];
        $this->parts = $opdef[2];

        if ( !($output instanceof GrammarTemplate) ) $output = new GrammarTemplate((string)$output);

        parent::__construct($this->type, $this->parts[0], $output);

        $this->fixity = null !== $fixity ? $fixity : Xpresion::PREFIX;
        $this->associativity = null !== $associativity ? $associativity : Xpresion::DEFAUL;
        $this->priority = null !== $priority ? $priority : 1000;
        $this->arity = $opdef[3];
        $this->arity_min = $opdef[4];
        $this->arity_max = $opdef[5];
        //$this->arity = $arity;
        $this->otype = null !== $otype ? $otype : Xpresion::T_MIX;
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
        $this->opdef = null;
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

        // array($pos,$token_queue,$op_queue)
        if (count($args) < 7)
        {
            $args[] = count($args[1]) ? $args[1][count($args[1])-1] : false;
            $args[] = count($args[2]) ? $args[2][0] : false;
            $args[] = $args[4] ? ($args[4]->pos+1===$args[0]) : false;
            $deduced_type = 0; // T_DUM
            $indt = count($args[1])-1; $indo = 0;
            // try to inherit type from other tokens/ops if current type is T_DUM(0), eg for bracket operator
            while (!$deduced_type)
            {
                if ($indt>=0 && $indo<count($args[2]) && $indo+1<count($args[2]) && ($args[2][$indo+1]->node instanceof XpresionFunc))
                    $deduced_type = /*$args[1][$indt]->pos>$args[2][$indo]->pos ?*/ $args[1][$indt--]->type /*: $args[2][$indo++]->type*/;
                elseif ($indo<count($args[2]))
                    $deduced_type = $args[2][$indo++]->type;
                elseif ($indt>=0)
                    $deduced_type = $args[1][$indt--]->type;
                else break;
            }
            $args[] = $deduced_type;
        }
        
        // array('${POS}'=>0,'${TOKS}'=>1,'${OPS}'=>2,'${TOK}'=>3,'${OP}'=>4,'${PREV_IS_OP}'=>5,'${DEDUCED_TYPE}'=>6)
        $nargs = (object)array(
            'POS' => $args[0],
            'TOKS' => $args[1],
            'OPS' => $args[2],
            'TOK' => $args[3],
            'OP' => $args[4],
            'PREV_IS_OP' => $args[5],
            'DEDUCED_TYPE' => $args[6]
            //'DEDUCED_TYPE_STR' => Xpresion::$TYPES[$deduced_type]
        );

        while ($i < $l)
        {
            $op = $morphes[$i++];
            $matched = (bool)call_user_func($op[0], $nargs);
            if (true === $matched)
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

        if ($op instanceof GrammarTemplate)
            $out = $lparen . $op->render( array('$'=>$args) ) . $rparen;
        elseif (Xpresion::INFIX === $out_fixity)
            $out = $lparen . implode(strval($op), $args) . $rparen;
        elseif (Xpresion::POSTFIX === $out_fixity)
            $out = $lparen . implode($comma, $args) . $rparen . strval($op);
        else // if (Xpresion::PREFIX === $out_fixity)
            $out = strval($op) . $lparen . implode($comma, $args) . $rparen;
        return new XpresionTok($output_type, $out, $out);
    }

    public function validate($pos, &$op_queue, &$token_queue)
    {
        $msg = ''; $num_args = 0;
        if ( 0 === $this->opdef[0][0] ) // expecting argument(s)
        {
            $num_args = self::match_args($this->opdef[0][2], $pos-1, $op_queue, $token_queue );
            if ( false === $num_args )
            {
                $msg = 'Operator "' . $this->input . '" expecting ' . $this->opdef[0][2] . ' prior argument(s)';
            }
        }
        return array($num_args, $msg);
    }

    public function node($args=null, $pos=0, $op_queue=null, $token_queue=null)
    {
        $otype = $this->otype;
        if (null===$args) $args = array();
        if ($this->revert) $args = array_reverse($args);
        if (Xpresion::T_DUM === $otype && !empty($args)) $otype = $args[ 0 ]->type;
        elseif (!empty($args)) $args[0]->type = $otype;
        $n = new XpresionNode($otype, $this->arity, $this, $args, $pos);
        if (Xpresion::T_N_OP === $this->type && null !== $op_queue)
        {
            $n->op_parts = array_slice($this->parts, 1);
            $n->op_def = array_slice($this->opdef, 0 === $this->opdef[0][0] ? 2 : 1);
            $n->op_index = count($op_queue)+1;
        }
        return $n;
    }
}

class XpresionFunc extends XpresionOp
{
    public function __construct($input='', $output='', $otype=null, $priority=null, $arity=null, $associativity=null, $ofixity=null)
    {
        parent::__construct(
            is_string($input) ? array($input, null !== $arity ? $arity : 1) : $input,
            $output,
            null !== $otype ? $otype : Xpresion::T_MIX,
            Xpresion::PREFIX,
            null !== $associativity ? $associativity : Xpresion::RIGHT,
            null !== $priority ? $priority : 1,
            null !== $ofixity ? $ofixity : Xpresion::PREFIX
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

    public $INF = INF;
    public $NAN = NAN;

    public function __construct()
    {
        $this->Fn = array();
        $this->INF = INF;
        $this->NAN = NAN;
    }

    public function __call($fn, $args)
    {
        if ( $fn && isset($this->Fn[$fn]) && is_callable($this->Fn[$fn]) )
        {
            return call_user_func_array($this->Fn[$fn], (array)$args);
        }
        throw new \RuntimeException('Xpresion: Unknown Runtime Function "'.$fn.'"');
    }
}

class XpresionConfiguration
{
    public $RE = null;
    public $BLOCKS = null;
    public $RESERVED = null;
    public $OPERATORS = null;
    public $FUNCTIONS = null;
    public $FN = null;

    public function __construct($conf=array())
    {
        $this->RE = array();
        $this->BLOCKS = array();
        $this->RESERVED = array();
        $this->OPERATORS = array();
        $this->FUNCTIONS = array();
        $this->FN = new XpresionFn();

        if ( !empty($conf) )
        {
            $conf = (array)$conf;

            if ( !empty($conf['re']) )
                $this->defRE($conf['re']);

            if ( !empty($conf['blocks']) )
                $this->defBlock($conf['blocks']);

            if ( !empty($conf['reserved']) )
                $this->defReserved($conf['reserved']);

            if ( !empty($conf['operators']) )
                $this->defOp($conf['operators']);

            if ( !empty($conf['functions']) )
                $this->defFunc($conf['functions']);

            if ( !empty($conf['runtime']) )
                $this->defRuntimeFunc($conf['runtime']);
        }
    }

    public function __destruct()
    {
        $this->dispose();
    }

    public function dispose()
    {
        $this->RE = null;
        $this->BLOCKS = null;
        $this->RESERVED = null;
        $this->OPERATORS = null;
        $this->FUNCTIONS = null;
        $this->FN = null;
        return $this;
    }

    public function defRE($obj)
    {
        if (is_array($obj) || is_object($obj))
        {
            foreach ((array)$obj as $k=>$v)
                $this->RE[ $k ] = $v;
        }
        return $this;
    }

    public function defBlock($obj)
    {
        if (is_array($obj) || is_object($obj))
        {
            foreach ((array)$obj as $k=>$v)
                $this->BLOCKS[ $k ] = $v;
        }
        return $this;
    }

    public function defReserved($obj)
    {
        if (is_array($obj) || is_object($obj))
        {
            foreach ((array)$obj as $k=>$v)
                $this->RESERVED[ $k ] = $v;
        }
        return $this;
    }

    public function defOp($obj)
    {
        if (is_array($obj) || is_object($obj))
        {
            foreach ((array)$obj as $k=>$op)
            {
                if ( !$op ) continue;

                if ( $op instanceof XpresionAlias || $op instanceof XpresionOp )
                {
                    $this->OPERATORS[ $k ] = $op;
                    continue;
                }

                $op = (array)$op;
                if ( isset($op['polymorphic']) )
                {
                    $this->OPERATORS[ $k ] = (new XpresionOp())->Polymorphic(array_map(function($entry){
                        $entry = (array)$entry;
                        if ( isset($entry['op']) )
                        {

                            $func = $entry['check'];
                            $op = $entry['op'];
                        }
                        else// if ( is_array($entry) )
                        {
                            $func = $entry[0];
                            $op = $entry[1];
                        }
                        $op = $op instanceof XpresionOp ? $op : new XpresionOp(
                        $op['input'],
                        isset($op['output']) ? $op['output'] : '',
                        isset($op['otype']) ? $op['otype'] : null,
                        isset($op['fixity']) ? $op['fixity'] : null,
                        isset($op['associativity']) ? $op['associativity'] : null,
                        isset($op['priority']) ? $op['priority'] : null,
                        isset($op['ofixity']) ? $op['ofixity'] : null
                        );
                        return array($func, $op);
                    }, (array)$op['polymorphic']));
                }
                else
                {
                    $this->OPERATORS[ $k ] = new XpresionOp(
                    $op['input'],
                    isset($op['output']) ? $op['output'] : '',
                    isset($op['otype']) ? $op['otype'] : null,
                    isset($op['fixity']) ? $op['fixity'] : null,
                    isset($op['associativity']) ? $op['associativity'] : null,
                    isset($op['priority']) ? $op['priority'] : null,
                    isset($op['ofixity']) ? $op['ofixity'] : null
                    );
                }
            }
        }
        return $this;
    }

    public function defFunc($obj)
    {
        if (is_array($obj) || is_object($obj))
        {
            foreach ((array)$obj as $k=>$op)
            {
                if ( !$op ) continue;

                if ( $op instanceof XpresionAlias || $op instanceof XpresionFunc )
                {
                    $this->FUNCTIONS[ $k ] = $op;
                    continue;
                }

                $op = (array)$op;
                $this->FUNCTIONS[ $k ] = new XpresionFunc(
                $op['input'],
                isset($op['output']) ? $op['output'] : '',
                isset($op['otype']) ? $op['otype'] : null,
                isset($op['priority']) ? $op['priority'] : null,
                isset($op['arity']) ? $op['arity'] : null,
                isset($op['associativity']) ? $op['associativity'] : null,
                isset($op['ofixity']) ? $op['ofixity'] : null
                );
            }
        }
        return $this;
    }

    public function defRuntimeFunc($obj)
    {
        if (is_array($obj) || is_object($obj))
        {
            foreach ((array)$obj as $k=>$v)
                $this->FN->Fn[ $k ] = $v;
        }
        return $this;
    }
}

class Xpresion
{
    const VERSION = "1.0.1";

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
    const T_MIX       =   1;
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
    const T_EMPTY     =   1024;

    public static $TYPES = array(
        0 => 'T_DUM',
        1 => 'T_MIX',
        //1 => 'T_DFT',
        16 => 'T_IDE',
        17 => 'T_VAR',
        32 => 'T_LIT',
        33 => 'T_NUM',
        34 => 'T_STR',
        35 => 'T_REX',
        36 => 'T_BOL',
        37 => 'T_DTM',
        38 => 'T_ARY',
        128 => 'T_OP',
        129 => 'T_N_OP',
        130 => 'T_POLY_OP',
        131 => 'T_FUN',
        1024 => 'T_EMPTY'
    );
    
    public static $_inited = false;

    public static $EMPTY_TOKEN = null;
    public static $CONF = null;

    public static function Configuration($conf=array())
    {
        return new XpresionConfiguration($conf);
    }

    public static function Tpl($tpl='')
    {
        return new GrammarTemplate((string)$tpl);
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

    public static function Op($input='', $output='', $otype=null, $fixity=null, $associativity=null, $priority=null, /*$arity,*/ $ofixity=null)
    {
        return new XpresionOp($input, $output, $otype, $fixity, $associativity, $priority, /*$arity,*/ $ofixity);
    }

    public static function Func($input='', $output='', $otype=null, $priority=null, $arity=null, $associativity=null, $ofixity=null)
    {
        return new XpresionFunc($input, $output, $otype, $priority, $arity, $associativity, $ofixity);
    }

    public static function reduce(&$token_queue, &$op_queue, &$nop_queue, $current_op=null, $pos=0, $err=null)
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
                $validation = $opc->validate($pos, $op_queue, $token_queue);
                if ( false === $validation[0] )
                {
                    // operator is not valid in current state
                    $err->err = true;
                    $err->msg = $validation[1];
                    return false;
                }
                $n = $opc->node(null, $pos, $op_queue, $token_queue);
                $n->arity = $validation[0];
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
                if ($nop && $nop->op_next( $opc, $pos, $op_queue, $token_queue ))
                {
                    while (count($op_queue) > $nop_index)
                    {
                        $entry = array_shift($op_queue);
                        $op = $entry->node;
                        $arity = $op->arity;
                        if ( (Xpresion::T_OP & $op->type) && 0 === $arity ) $arity = 1; // have already padded with empty token
                        elseif ( $arity > count($token_queue) && $op->arity_min <= $op->arity ) $arity = $op->arity_min;
                        $n = $op->node(array_splice($token_queue, -$arity, $arity), $entry->pos);
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
                else
                {
                    $validation = $opc->validate($pos, $op_queue, $token_queue);
                    if ( false === $validation[0] )
                    {
                        // operator is not valid in current state
                        $err->err = true;
                        $err->msg = $validation[1];
                        return false;
                    }
                }

                $fixity = $opc->fixity;

                if (Xpresion::POSTFIX === $fixity)
                {
                    // postfix assumed to be already in correct order,
                    // no re-structuring needed
                    $arity = $opc->arity;
                    if ( $arity > count($token_queue) && $opc->arity_min <= count($token_queue) ) $arity = $opc->arity_min;
                    $n = $opc->node(array_splice($token_queue, -$arity, $arity), $pos);
                    array_push($token_queue, $n);
                }

                elseif (Xpresion::PREFIX === $fixity)
                {
                    // prefix assumed to be already in reverse correct order,
                    // just push to op queue for later re-ordering
                    array_unshift($op_queue, new XpresionNode($opc->otype, $opc->arity, $opc, null, $pos));
                    if ( (/*T_FUN*/Xpresion::T_OP & $opc->type) && (0 === $opc->arity) )
                    {
                        array_push($token_queue,Xpresion::$EMPTY_TOKEN->node(null, $pos+1));
                    }
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
                            $arity = $op->arity;
                            if ( (Xpresion::T_OP & $op->type) && 0 === $arity ) $arity = 1; // have already padded with empty token
                            elseif ( $arity > count($token_queue) && $op->arity_min <= $op->arity ) $arity = $op->arity_min;
                            $n = $op->node(array_splice($token_queue, -$arity, $arity), $entry->pos);
                            array_push($token_queue, $n);
                        }
                        else
                        {
                            array_unshift($op_queue, $entry);
                            break;
                        }
                    }
                    array_unshift($op_queue, new XpresionNode($opc->otype, $opc->arity, $opc, null, $pos));
                }
            }
        }
        else
        {
            while (!empty($op_queue))
            {
                $entry = array_shift($op_queue);
                $op = $entry->node;
                $arity = $op->arity;
                if ( (Xpresion::T_OP & $op->type) && 0 === $arity ) $arity = 1; // have already padded with empty token
                elseif ( $arity > count($token_queue) && $op->arity_min <= $op->arity ) $arity = $op->arity_min;
                $n = $op->node(array_splice($token_queue, -$arity, $arity), $entry->pos);
                array_push($token_queue, $n);
            }
        }
    }

    public static function parse_delimited_block($s, $i, $l, $delim, $is_escaped=true)
    {
        $p = $delim;
        $esc = false;
        $ch = '';
        $is_escaped = (false !== $is_escaped);
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

    public static function parse($xpr, $conf)
    {
        $t_var_is_also_ident = !isset($conf->RE['t_var']);

        $err = 0;
        $errors = (object)array('err'=> false, 'msg'=> '');
        $expr = (string)$xpr->source;
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
            $block = XpresionAlias::get_entry($conf->BLOCKS, $ch);
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

                    $t = $xpr->t_block( $conf, $v, $block['type'], $block_rest );
                    if (false !== $t)
                    {
                        $t_index+=1;
                        array_push($AST, $t->node(null, $t_index));
                        continue;
                    }
                }
            }

            $e = substr($expr, $i);

            if (preg_match($conf->RE['t_spc'], $e, $m)) // space
            {
                $i += strlen($m[ 0 ]);
                continue;
            }

            if (preg_match($conf->RE['t_num'], $e, $m)) // number
            {
                $t = $xpr->t_liter( $conf, $m[ 1 ], Xpresion::T_NUM );
                if (false !== $t)
                {
                    $t_index+=1;
                    array_push($AST, $t->node(null, $t_index));
                    $i += strlen($m[ 0 ]);
                    continue;
                }
            }

            if (preg_match($conf->RE['t_ident'], $e, $m)) // ident, reserved, function, operator, etc..
            {
                $t = $xpr->t_liter( $conf, $m[ 1 ], Xpresion::T_IDE ); // reserved keyword
                if (false !== $t)
                {
                    $t_index+=1;
                    array_push($AST, $t->node(null, $t_index));
                    $i += strlen($m[ 0 ]);
                    continue;
                }

                $t = $xpr->t_op( $conf, $m[ 1 ] ); // (literal) operator
                if (false !== $t)
                {
                    $t_index+=1;
                    static::reduce( $AST, $OPS, $NOPS, $t, $t_index, $errors );
                    if ( $errors->err )
                    {
                        $err = 1;
                        $errmsg = $errors->msg;
                        break;
                    }
                    $i += strlen($m[ 0 ]);
                    continue;
                }

                if ($t_var_is_also_ident)
                {
                    $t = $xpr->t_var( $conf, $m[ 1 ] ); // variables are also same identifiers
                    if (false !== $t)
                    {
                        $t_index+=1;
                        array_push($AST, $t->node(null, $t_index));
                        $i += strlen($m[ 0 ]);
                        continue;
                    }
                }
            }

            if (preg_match($conf->RE['t_special'], $e, $m)) // special symbols..
            {
                $v = $m[ 1 ];
                $t = false;
                while (strlen($v) > 0) // try to match maximum length op/func
                {
                    $t = $xpr->t_op( $conf, $v ); // function, (non-literal) operator
                    if (false !== $t) break;
                    $v = substr($v,0,-1);
                }
                if (false !== $t)
                {
                    $t_index+=1;
                    static::reduce( $AST, $OPS, $NOPS, $t, $t_index, $errors );
                    if ( $errors->err )
                    {
                        $err = 1;
                        $errmsg = $errors->msg;
                        break;
                    }
                    $i += strlen($v);
                    continue;
                }
            }

            if (!$t_var_is_also_ident)
            {
                if (preg_match($conf->RE['t_var'], $e, $m)) // variables
                {
                    $t = $xpr->t_var( $conf, $m[ 1 ] );
                    if (false !== $t)
                    {
                        $t_index+=1;
                        array_push($AST, $t->node(null, $t_index));
                        $i += strlen($m[ 0 ]);
                        continue;
                    }
                }
            }


            if (preg_match($conf->RE['t_nonspc'], $e, $m)) // other non-space tokens/symbols..
            {
                $t = $xpr->t_liter( $conf, $m[ 1 ], Xpresion::T_LIT ); // reserved keyword
                if (false !== $t)
                {
                    $t_index+=1;
                    array_push($AST, $t->node(null, $t_index));
                    $i += strlen($m[ 0 ]);
                    continue;
                }

                $t = $xpr->t_op( $conf, $m[ 1 ] ); // function, other (non-literal) operator
                if (false !== $t)
                {
                    $t_index+=1;
                    static::reduce( $AST, $OPS, $NOPS, $t, $t_index, $errors );
                    if ( $errors->err )
                    {
                        $err = 1;
                        $errmsg = $errors->msg;
                        break;
                    }
                    $i += strlen($m[ 0 ]);
                    continue;
                }

                /*$t = $xpr->t_tok( $conf, $m[ 1 ] );
                $t_index+=1;
                array_push($AST, $t->node(null, $t_index)); // pass-through ..
                $i += strlen($m[ 0 ]);*/
                //continue
                $err = 1;
                $errmsg = 'Unknown token "'.$m[0].'"'; // exit with error
                break;
            }
        }

        if ( !$err )
        {
            static::reduce( $AST, $OPS, $NOPS );

            if ((1 !== count($AST)) || !empty($OPS))
            {
                $err = 1;
                $errmsg = 'Parse Error, Mismatched Parentheses or Operators';
            }
        }

        if (!$err)
        {
            try {

                $evaluator = $xpr->compile( $AST[0], $conf );
            }
            catch (\Exception $ex) {

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
            $xpr->evaluatorString = '';
            $xpr->evaluator = $xpr->dummy_evaluator;
            throw new \RuntimeException('Xpresion Error: ' . $errmsg . ' at ' . $expr);
        }
        else
        {
            // make array
            $xpr->variables = array_keys( $xpr->variables );
            $xpr->evaluatorString = $evaluator[0];
            $xpr->evaluator = $evaluator[1];
        }

        return $xpr;
    }

    public static function render($tok, $args=null)
    {
        if (null===$args) $args=array();
        return $tok->render( $args );
    }

    public static function GET($obj, $keys=array())
    {
        $keys = (array)$keys;
        if ( empty($keys) ) return $obj;
        $o = $obj;
        $c = count($keys);
        $i = 0;
        foreach($keys as $k)
        {
            $i++;
            if ( is_array($o) )
            {
                if ( isset($o[$k]) )
                {
                    $o = $o[$k];
                }
                else
                {
                    break;
                }
            }
            elseif ( is_object($o) )
            {
                if ( isset($o->{$k}) )
                {
                    $o = $o->{$k};
                }
                else
                {
                    break;
                }
            }
            else
            {
                break;
            }
        }
        return $i===$c ? $o : null;
    }

    public static function defaultConfiguration($conf=null)
    {
        if ( func_num_args() )
        {
            static::$CONF = $conf;
        }
        return static::$CONF;
    }

    public static function _($expr=null,$conf=null)
    {
        return new static($expr,$conf);
    }

    public $source = null;
    public $variables = null;
    public $evaluatorString = null;
    public $evaluator = null;

    public $dummy_evaluator = null;
    public $_cnt = 0;
    public $_cache = null;
    public $_symbol_table = null;

    public function __construct($expr=null, $conf=null)
    {
        if ( !$conf || !($conf instanceof XpresionConfiguration) )
            $conf = static::defaultConfiguration();

        $this->source = (string)$expr;

        $this->dummy_evaluator = array('XpresionUtils','dummy');

        static::parse( $this, $conf );
    }

    public function __destruct()
    {
        $this->dispose();
    }

    public function dispose()
    {
        $this->dummy_evaluator = null;

        $this->source = null;
        $this->variables = null;
        $this->evaluatorString = null;
        $this->evaluator = null;

        $this->_cnt = null;
        $this->_symbol_table = null;
        $this->_cache = null;

        return $this;
    }

    public function compile($AST, $conf=null)
    {
        // depth-first traversal and rendering of Abstract Syntax Tree (AST)
        $static = get_called_class();
        if ( !$conf )
            $conf = $static::defaultConfiguration();
        $evaluator_str = XpresionNode::DFT( $AST, array(get_called_class(),'render'), true );
        return array($evaluator_str, XpresionUtils::evaluator_factory($evaluator_str, $conf->FN, $this->_cache));
    }

    public function evaluate($data=array())
    {
        return is_callable($this->evaluator) ? call_user_func($this->evaluator, $data) : null;
    }

    public function debug($data=null)
    {
        $out = array(
        'Expression: ' . $this->source,
        'Variables : [' . implode(',', $this->variables) . ']',
        'Evaluator : ' . $this->evaluatorString
        );
        if (null!==$data)
        {
            $result = $this->evaluate($data);

            ob_start();
            var_dump($data);
            $output = ob_get_clean();
            $out[] = 'Data      : ' . $output;

            ob_start();
            var_dump($result);
            $output = ob_get_clean();
            $out[] = 'Result    : ' . $output;
        }
        return implode("\n", $out);
    }

    public function __toString()
    {
        return '[Xpresion source]: ' . (string)$this->source . '';
    }

    public function t_liter($conf, $token, $type)
    {
        $static = get_called_class();
        if (Xpresion::T_NUM === $type)
            return $static::Tok(Xpresion::T_NUM, $token, $token);
        return XpresionAlias::get_entry($conf->RESERVED, strtolower($token));
    }

    public function t_block($conf, $token, $type, $rest='')
    {
        $static = get_called_class();
        if (Xpresion::T_STR === $type)
        {
            return $static::Tok(Xpresion::T_STR, $token, $token);
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
                if (false !== strpos($rest, 'm')) $flags.= 'm';
                $this->_cache->{$id} = $token . $flags;
                $this->_symbol_table[$sid] = $id;
            }
            return $static::Tok(Xpresion::T_REX, $token, '$Cache->'.$id);
        }
        return false;
    }

    public function t_var($conf, $token)
    {
        $static = get_called_class();
        $parts = explode('.', $token, 2);
        $main = $parts[0];
        if (!isset($this->variables[$main]))
            $this->variables[ $main ] = $main;
        if ( isset($parts[1]) )
        {
            $keys = 'array("' . implode('","', explode('.', $parts[1])) . '")';
            return $static::Tok(Xpresion::T_VAR, $token, 'Xpresion::GET($Var["' . $main . '"],'.$keys.')');
        }
        else
        {
            return $static::Tok(Xpresion::T_VAR, $main, '$Var["' . $main . '"]');
        }
        /*
        if (!isset($this->variables[$token]))
            $this->variables[ $token ] = $token;
        return $static::Tok(Xpresion::T_VAR, $token, '$Var["' . implode('"]["', explode('.', $token)) . '"]');*/
    }

    public function t_op($conf, $token)
    {
        $op = false;
        $op = XpresionAlias::get_entry($conf->FUNCTIONS, $token);
        if (false === $op) $op = XpresionAlias::get_entry($conf->OPERATORS, $token);
        return $op;
    }

    public function t_tok($conf, $token)
    {
        $static = get_called_class();
        return $static::Tok(Xpresion::T_MIX, $token, $token);
    }

    public static function init( )
    {
        if ( static::$_inited ) return;

        static::$_inited = true;

        static::$EMPTY_TOKEN = static::Tok(Xpresion::T_EMPTY, '', '');

        // e.g https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
        static::defaultConfiguration(new XpresionConfiguration(array(
        // regular expressions for tokens
        // ===============================
        're' => array(
         't_spc'        =>  '/^(\\s+)/'
        ,'t_nonspc'     =>  '/^(\\S+)/'
        ,'t_special'    =>  '/^([*.\\\\\\-+\\/\^\\$\\(\\)\\[\\]|?<:>&~%!#@=_,;{}]+)/'
        ,'t_num'        =>  '/^(\\d+(\\.\\d+)?)/'
        ,'t_ident'      =>  '/^([a-zA-Z_][a-zA-Z0-9_]*)\\b/'
        ,'t_var'        =>  '/^\\$([a-zA-Z0-9_][a-zA-Z0-9_.]*)\\b/'
        )

        // block-type tokens (eg strings and regexes)
        // ==========================================
        ,'blocks' => array(
         '\'' => array(
            'type' => Xpresion::T_STR,
            'parse' => array(get_called_class(),'parse_delimited_block')
        )
        ,'"' => static::Alias('\'')
        ,'`' => array(
            'type' => Xpresion::T_REX,
            'parse' => array(get_called_class(),'parse_delimited_block'),
            'rest' => array('XpresionUtils','parse_re_flags')
        )
        )

        // reserved keywords and literals
        // ===============================
        ,'reserved'=>array(
         'null'     => static::Tok(Xpresion::T_IDE, 'null', 'null')
        ,'false'    => static::Tok(Xpresion::T_BOL, 'false', 'false')
        ,'true'     => static::Tok(Xpresion::T_BOL, 'true', 'true')
        ,'infinity' => static::Tok(Xpresion::T_NUM, 'Infinity', 'INF')
        ,'nan'      => static::Tok(Xpresion::T_NUM, 'NaN', 'NAN')
        // aliases
        ,'none'     => static::Alias('null')
        ,'inf'      => static::Alias('infinity')
        )

        // operators
        // ==========
        ,'operators' => array(
        // bra-kets as n-ary operators
        // negative number of arguments, indicate optional arguments (experimental)
         '('    =>  array(
                         'input'        => array('(',-1,')')
                        ,'output'       => '<$.0>'
                        ,'otype'        => Xpresion::T_DUM
                        ,'fixity'       => Xpresion::POSTFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 0
                    )
        ,')'    =>  array('input'=>array(-1,')'))
        ,'['    =>  array(
                         'input'        => array('[',-1,']')
                        ,'output'       => 'array(<$.0>)'
                        ,'otype'        => Xpresion::T_ARY
                        ,'fixity'       => Xpresion::POSTFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 2
                    )
        ,']'    =>  array('input'=>array(-1,']'))
        ,','    =>  array(
                         'input'        => array(1,',',1)
                        ,'output'       => '<$.0>,<$.1>'
                        ,'otype'        => Xpresion::T_DFT
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 103 // comma operator needs to have very low priority because it can break other expressions which are between commas
                    )
       // n-ary (ternary) if-then-else operator
        ,'?'    =>  array(
                         'input'        => array(1,'?',1,':',1)
                        ,'output'       => '(<$.0>?<$.1>:<$.2>)'
                        ,'otype'        => Xpresion::T_MIX
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 100
                    )
        ,':'    =>  array('input'=>array(1,':',1))
        ,'!'    =>  array(
                         'input'        => array('!',1)
                        ,'output'       => '!<$.0>'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::PREFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 10
                    )
        ,'~'    =>  array(
                         'input'        => array('~',1)
                        ,'output'       => '~<$.0>'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::PREFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 10
                    )
        ,'^'    =>  array(
                         'input'        => array(1,'^',1)
                        ,'output'       => 'pow(<$.0>,<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 11
                    )
        ,'*'    =>  array(
                         'input'        => array(1,'*',1)
                        ,'output'       => '(<$.0>*<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 20
                    )
        ,'/'    =>  array(
                         'input'        => array(1,'/',1)
                        ,'output'       => '(<$.0>/<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 20
                    )
        ,'%'    =>  array(
                         'input'        => array(1,'%',1)
                        ,'output'       => '(<$.0>%<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 20
                    )
        // addition/concatenation/unary plus as polymorphic operators
        ,'+'    =>  array('polymorphic'=>array(
                    // array concatenation
                    array(
                    function($curr){return $curr->TOK && !$curr->PREV_IS_OP && $curr->DEDUCED_TYPE===Xpresion::T_ARY;},
                    array(
                         'input'        => array(1,'+',1)
                        ,'output'       => '$Fn-\\>ary_merge(<$.0>,<$.1>)'
                        ,'otype'        => Xpresion::T_ARY
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 25
                    )
                    )
                    // string concatenation
                    ,array(
                    function($curr){return $curr->TOK && !$curr->PREV_IS_OP && $curr->DEDUCED_TYPE===Xpresion::T_STR;},
                    array(
                         'input'        => array(1,'+',1)
                        ,'output'       => '(<$.0>.strval(<$.1>))'
                        ,'otype'        => Xpresion::T_STR
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 25
                    )
                    )
                    // numeric addition
                    ,array(
                    function($curr){return $curr->TOK && !$curr->PREV_IS_OP;},
                    array(
                         'input'        => array(1,'+',1)
                        ,'output'       => '(<$.0>+<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 25
                    )
                    )
                    // unary plus
                    ,array(
                    function($curr){return !$curr->TOK || $curr->PREV_IS_OP;},
                    array(
                         'input'        => array('+',1)
                        ,'output'       => '<$.0>'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::PREFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 4
                    )
                    )
                    ))
        ,'-'    =>  array('polymorphic'=>array(
                    // numeric subtraction
                    array(
                    function($curr){return $curr->TOK && !$curr->PREV_IS_OP;},
                    array(
                         'input'        => array(1,'-',1)
                        ,'output'       => '(<$.0>-<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 25
                    )
                    )
                    // unary negation
                    ,array(
                    function($curr){return !$curr->TOK || $curr->PREV_IS_OP;},
                    array(
                         'input'        => array('-',1)
                        ,'output'       => '(-<$.0>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::PREFIX
                        ,'associativity'=> Xpresion::RIGHT
                        ,'priority'     => 4
                    )
                    )
                    ))
        ,'>>'   =>  array(
                         'input'        => array(1,'>>',1)
                        ,'output'       => '(<$.0>\\>\\><$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 30
                    )
        ,'<<'   =>  array(
                         'input'        => array(1,'<<',1)
                        ,'output'       => '(<$.0>\\<\\<<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 30
                    )
        ,'>'    =>  array(
                         'input'        => array(1,'>',1)
                        ,'output'       => '(<$.0>\\><$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 35
                    )
        ,'<'    =>  array(
                         'input'        => array(1,'<',1)
                        ,'output'       => '(<$.0>\\<<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 35
                    )
        ,'>='   =>  array(
                         'input'        => array(1,'>=',1)
                        ,'output'       => '(<$.0>\\>=<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 35
                    )
        ,'<='   =>  array(
                         'input'        => array(1,'<=',1)
                        ,'output'       => '(<$.0>\\<=<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 35
                    )
        ,'=='   =>  array('polymorphic'=>array(
                    // array equivalence
                    array(
                    function($curr){return $curr->DEDUCED_TYPE===Xpresion::T_ARY;},
                    array(
                         'input'        => array(1,'==',1)
                        ,'output'       => '$Fn-\\>ary_eq(<$.0>,<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 40
                    )
                    )
                    // default equivalence
                    ,array(
                    function($curr){return true;},
                    array(
                         'input'        => array(1,'==',1)
                        ,'output'       => '(<$.0>==<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 40
                    )
                    )
                    ))
        ,'!='   =>  array(
                         'input'        => array(1,'!=',1)
                        ,'output'       => '(<$.0>!=<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 40
                    )
        ,'is'   =>  array(
                         'input'        => array(1,'is',1)
                        ,'output'       => '(<$.0>===<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 40
                    )
        ,'matches'=>array(
                         'input'        => array(1,'matches',1)
                        ,'output'       => '$Fn-\\>match(<$.1>,<$.0>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::NONE
                        ,'priority'     => 40
                    )
        ,'in'   =>  array(
                         'input'        => array(1,'in',1)
                        ,'output'       => '$Fn-\\>contains(<$.1>,<$.0>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::NONE
                        ,'priority'     => 40
                    )
        ,'&'    =>  array(
                         'input'        => array(1,'&',1)
                        ,'output'       => '(<$.0>&<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 45
                    )
        ,'|'    =>  array(
                         'input'        => array(1,'|',1)
                        ,'output'       => '(<$.0>|<$.1>)'
                        ,'otype'        => Xpresion::T_NUM
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 46
                    )
        ,'&&'   =>  array(
                         'input'        => array(1,'&&',1)
                        ,'output'       => '(<$.0>&&<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 47
                    )
        ,'||'   =>  array(
                         'input'        => array(1,'||',1)
                        ,'output'       => '(<$.0>||<$.1>)'
                        ,'otype'        => Xpresion::T_BOL
                        ,'fixity'       => Xpresion::INFIX
                        ,'associativity'=> Xpresion::LEFT
                        ,'priority'     => 48
                    )
        ,'or'   =>  static::Alias( '||' )
        ,'and'  =>  static::Alias( '&&' )
        ,'not'  =>  static::Alias( '!' )
        )

        // functional operators
        // ====================
        ,'functions'=>array(
         'min'      => array(
                             'input'    => 'min'
                            ,'output'   => 'min(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                        )
        ,'max'      => array(
                             'input'    => 'max'
                            ,'output'   => 'max(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                        )
        ,'pow'      => array(
                             'input'    => 'pow'
                            ,'output'   => 'pow(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                        )
        ,'sqrt'     => array(
                             'input'    => 'sqrt'
                            ,'output'   => 'sqrt(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                    )
        ,'len'      => array(
                             'input'    => 'len'
                            ,'output'   => '$Fn-\\>len(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                    )
        ,'int'      => array(
                             'input'    => 'int'
                            ,'output'   => 'intval(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                    )
        ,'float'    => array(
                             'input'    => 'float'
                            ,'output'   => 'floatval(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                    )
        ,'str'      => array(
                             'input'    => 'str'
                            ,'output'   => 'strval(<$.0>)'
                            ,'otype'    => Xpresion::T_STR
                    )
        ,'array'    => array(
                             'input'    => 'array'
                            ,'output'   => '$Fn-\\>ary(<$.0>)'
                            ,'otype'    => Xpresion::T_ARY
                    )
        ,'clamp'    => array(
                             'input'    => 'clamp'
                            ,'output'   => '$Fn-\\>clamp(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                    )
        ,'sum'      => array(
                             'input'    => 'sum'
                            ,'output'   => '$Fn-\\>sum(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                    )
        ,'avg'      => array(
                             'input'    => 'avg'
                            ,'output'   => '$Fn-\\>avg(<$.0>)'
                            ,'otype'    => Xpresion::T_NUM
                    )
        ,'time'     => array(
                             'input'    => 'time'
                            ,'output'   => 'time()'
                            ,'otype'    => Xpresion::T_NUM
                            ,'arity'    => 0
                    )
        ,'date'     => array(
                             'input'    => 'date'
                            ,'output'   => 'date(<$.0>)'
                            ,'otype'    => Xpresion::T_STR
                    )
        //---------------------------------------
        //                aliases
        //----------------------------------------
         // ...
        )

        // runtime (implementation) functions
        // ==================================
        ,'runtime'=>array(
        'clamp'     => function($v, $m, $M) {
                        if ($m > $M) return ($v > $m ? $m : ($v < $M ? $M : $v));
                        else return ($v > $M ? $M : ($v < $m ? $m : $v));
                    }
        ,'len'      => function($v) {
                        if (null == $v) return 0;
                        if (is_string($v)) return strlen($v);
                        elseif (is_array($v)) return count($v);
                        elseif (is_object($v)) return count((array)$v);
                        return 1;
                    }
        ,'sum'      => function(/* args */) {
                        $args = func_get_args();
                        $s = 0;
                        $values = $args;
                        if (!empty($values) && is_array($values[0])) $values = $values[0];
                        foreach ($values as $v) $s += $v;
                        return $s;
                    }
        ,'avg'      => function(/* args */) {
                        $args = func_get_args();
                        $s = 0;
                        $values = $args;
                        if (!empty($values) && is_array($values[0])) $values = $values[0];
                        $l = count($values);
                        foreach ($values as $v) $s += $v;
                        return $l > 0 ? $s/$l : $s;
                    }
        ,'ary'      => function( $x ) {
                        return is_array($x) ? $x : array($x);
                    }
        ,'ary_eq'   => function( $a1, $a2 ) {
                        return ((array)$a1) == ((array)$a2);
                    }
        ,'ary_merge'=> function( $a1, $a2 ) {
                        return array_merge((array)$a1, (array)$a2);
                    }
        ,'match'    => function( $str, $regex ) {
                        return (bool)preg_match($regex, $str, $m);
                    }
        ,'contains' => function( $o, $i ) {
                        if ( is_string($o) ) return (false !== strpos($o, strval($i)));
                        elseif ( XpresionUtils::is_assoc_array($o) ) return array_key_exists($i, $o);
                        elseif ( is_array($o) ) return in_array($i, $o);
                        return false;
                    }
        )
        )));
    }
}

Xpresion::init( );
}
