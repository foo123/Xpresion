var path = require('path'), 
    Xpresion = require(path.join(__dirname, '../src/js/Xpresion.js')),
    echo = console.log
;


echo( 'Xpresion.VERSION ' + Xpresion.VERSION + "\n" );

echo(Xpresion('13').debug());
echo(Xpresion('1.32').debug());
echo(Xpresion('-0.12').debug());
echo(Xpresion('-3').debug());
echo(Xpresion('("1,2,3")+3').debug({}));
echo(Xpresion('"1,2,3"+3').debug({}));
echo(Xpresion('"1,2,3"+3+4').debug({}));
echo(Xpresion('[1,2,3]+3').debug({}));
echo(Xpresion('-3+2').debug({}));
echo(Xpresion('1-3+2').debug({}));
echo(Xpresion('1+-3').debug({}));
echo(Xpresion('+1+3').debug({}));
echo(Xpresion('2*-1').debug());
echo(Xpresion('2*(-1)').debug());
echo(Xpresion('2^-1').debug());
echo(Xpresion('2^(-1)').debug());
echo(Xpresion('2^-1^3').debug());
echo(Xpresion('-2^-1^3').debug());
echo(Xpresion('2^(-1)^3').debug());
echo(Xpresion('$v').debug());
echo(Xpresion('True').debug());
echo(Xpresion('"string"').debug());
echo(Xpresion('["a","rra","y"]').debug());
echo(Xpresion('`^regex?`i').debug());
echo(Xpresion('0 == 1').debug());
echo(Xpresion('TRUE == False').debug());
echo(Xpresion('1+2').debug());
echo(Xpresion('1+2+3').debug());
echo(Xpresion('1+2*3').debug());
echo(Xpresion('1*2+3').debug());
echo(Xpresion('1*2*3').debug());
echo(Xpresion('1+2/3').debug());
echo(Xpresion('1*2/3').debug());
echo(Xpresion('1^2').debug());
echo(Xpresion('1^2^3').debug());
echo(Xpresion('1^(2^3)').debug());
echo(Xpresion('(1^2)^3').debug());
echo(Xpresion('((1^2))^3').debug());
echo(Xpresion('`^regex?`i matches "string"').debug());
echo(Xpresion('`^regex?`i matches "string" and `^regex?`i matches "string2"').debug());
echo(Xpresion('["a","b","c"] has $v').debug());
echo(Xpresion('$v in ["a","b","c"]').debug());
echo(Xpresion('1 ? (2+3) : (3+4)').debug());

