<?php
require('../src/php/Xpresion.php');
function echo_($s='')
{
    echo $s . PHP_EOL;
}

Xpresion::defaultConfiguration();

echo_( 'Xpresion.VERSION ' . Xpresion::VERSION . "\n" );

echo_(Xpresion::_('13')->debug());
echo_(Xpresion::_('1.32')->debug());
echo_(Xpresion::_('-0.12')->debug());
echo_(Xpresion::_('-3')->debug());
echo_(Xpresion::_('("1,2,3")+3')->debug(array()));
echo_(Xpresion::_('"1,2,3"+3')->debug(array()));
echo_(Xpresion::_('"1,2,3"+3+4')->debug(array()));
echo_(Xpresion::_('[1,2,3]+3')->debug(array()));
echo_(Xpresion::_('-3+2')->debug(array()));
echo_(Xpresion::_('1-3+2')->debug(array()));
echo_(Xpresion::_('1+-3')->debug(array()));
echo_(Xpresion::_('+1+3')->debug(array()));
echo_(Xpresion::_('2*-1')->debug());
echo_(Xpresion::_('2*(-1)')->debug());
echo_(Xpresion::_('2^-1')->debug());
echo_(Xpresion::_('2^(-1)')->debug());
echo_(Xpresion::_('2^-1^3')->debug());
echo_(Xpresion::_('-2^-1^3')->debug());
echo_(Xpresion::_('2^(-1)^3')->debug());
echo_(Xpresion::_('$v')->debug());
echo_(Xpresion::_('True')->debug());
echo_(Xpresion::_('"string"')->debug());
echo_(Xpresion::_('["a","rra","y"]')->debug());
echo_(Xpresion::_('`^regex?`i')->debug());
echo_(Xpresion::_('0 == 1')->debug());
echo_(Xpresion::_('TRUE == False')->debug());
echo_(Xpresion::_('1+2')->debug());
echo_(Xpresion::_('1+2+3')->debug());
echo_(Xpresion::_('1+2*3')->debug());
echo_(Xpresion::_('1*2+3')->debug());
echo_(Xpresion::_('1*2*3')->debug());
echo_(Xpresion::_('1+2/3')->debug());
echo_(Xpresion::_('1*2/3')->debug());
echo_(Xpresion::_('1^2')->debug());
echo_(Xpresion::_('1^2^3')->debug());
echo_(Xpresion::_('1^(2^3)')->debug());
echo_(Xpresion::_('(1^2)^3')->debug());
echo_(Xpresion::_('((1^2))^3')->debug());
echo_(Xpresion::_('`^regex?`i matches "string"')->debug());
echo_(Xpresion::_('`^regex?`i matches "string" and `^regex?`i matches "string2"')->debug());
echo_(Xpresion::_('$v in ["a","b","c"]')->debug());
echo_(Xpresion::_('1 ? (2+3) : (3+4)')->debug());
echo_(Xpresion::_('1 ? (2+3) : 2 ? (3+4) : (4+5)')->debug());

