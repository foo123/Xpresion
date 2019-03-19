<?php
require('../src/php/Xpresion.php');
function echo_($s='')
{
    echo $s . PHP_EOL;
}

function test_expr($expr, $evaluate=false)
{
    echo_('==========================================');
    try {
        // uses defaultConfiguration by default
        $xpr = Xpresion::_($expr);
    } catch (\Exception $err ) {
        $xpr = null;
        echo_($err->getMessage());
    }
    if ( $xpr )
    {
        $debug = $evaluate ? $xpr->debug(is_array($evaluate) ? $evaluate : array()) : $xpr->debug();
        echo_($debug);
    }
}

echo_( 'Xpresion.VERSION ' . Xpresion::VERSION . "\n" );

test_expr('13');
test_expr('1.32');
test_expr('-0.12');
test_expr('-3');
test_expr('("1,2,3")+3',true);
test_expr('"1,2,3"+3',true);
test_expr('"1,2,3"+3+4',true);
test_expr('[1,2,3]+3',true);
test_expr('-3+2',true);
test_expr('1-3+2',true);
test_expr('1+-3',true);
test_expr('+1+3',true);
test_expr('2*-1');
test_expr('2*(-1)');
test_expr('2^-1');
test_expr('2^(-1)');
test_expr('2^-1^3');
test_expr('-2^-1^3');
test_expr('2^(-1)^3');
test_expr('sqrt(2)', true);
test_expr('$v');
test_expr('$v.key.0.key', array('v'=>(object)array('key'=>array((object)array('key'=>'correct'),'foo'))));
test_expr('True');
test_expr('"string"');
test_expr('["a","rra","y"]');
test_expr('`^regex?`i');
test_expr('0 == 1');
test_expr('TRUE == False');
test_expr('TRUE is False');
test_expr('1+2');
test_expr('1+2+3');
test_expr('1+2*3');
test_expr('1*2+3');
test_expr('1*2*3');
test_expr('1+2/3');
test_expr('1*2/3');
test_expr('1^2');
test_expr('1^2^3');
test_expr('1^(2^3)');
test_expr('(1^2)^3');
test_expr('((1^2))^3');
test_expr('`^regex?`i matches "string"');
test_expr('`^regex?`i matches "string" and `^regex?`i matches "string2"');
test_expr('$v in ["a","b","c"]');
test_expr('1 ? : (1+2) (3+4)');
test_expr('1 ? sum(1,2) : (3+4)');
test_expr('1 ? 1+2 : (3+4)');
test_expr('1 ? (2+3) : 2 ? (3+4) : (4+5)');
test_expr('date("Y-m-d H:i:s")', true);
test_expr('time()', true);
test_expr('date("Y-m-d H:i:s", time())');
test_expr('pow(1,pow(2,3))');
test_expr('pow(pow(2,3),4)');
test_expr('pow(pow(1,2),pow(2,3))');
