var echo = console.log, 
    Xpresion = require(__dirname+'/../src/js/Xpresion.js')
;

function test_expr(expr, evaluate)
{
    evaluate = evaluate || false;
    echo('==========================================');
    var xpr = null;
    try {
        // uses defaultConfiguration by default
        xpr = Xpresion(expr);
    } catch (err ) {
        xpr = null;
        echo(err.toString());
    }
    if ( xpr )
    {
        var debug = evaluate ? xpr.debug(evaluate instanceof Object ? evaluate : {}) : xpr.debug();
        echo(debug);
    }
}

echo( 'Xpresion.VERSION ' + Xpresion.VERSION + "\n" );

test_expr('array("string")',true);
test_expr('array(["ar","ra","y"])',true);
test_expr('str(2)',true);
test_expr('str("2")',true);
test_expr('int(2)',true);
test_expr('int("2")',true);
test_expr('Math.pow(this)');
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
test_expr('$v.key.0.key', {'v':{'key':[{'key':'correct'},'foo']}});
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
