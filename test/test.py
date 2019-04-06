#!/usr/bin/env python

# import the Dromeo.py engine (as a) module, probably you will want to place this in another dir/package
import os, sys, imp
ModulePath = os.path.join(os.path.dirname(__file__), '../src/python/')
try:
    ModFp, ModPath, ModDesc  = imp.find_module('Xpresion', [ModulePath])
    Xpresion = getattr( imp.load_module('Xpresion', ModFp, ModPath, ModDesc), 'Xpresion' )
except ImportError as exc:
    Xpresion = None
    sys.stderr.write("Error: failed to import module ({})".format(exc))
finally:
    if ModFp: ModFp.close()

if not Xpresion:
    print ('Could not load the Xpresion Module')
    sys.exit(1)
else:    
    print ('Xpresion Module loaded succesfully')

def echo(s=''):
    print(s)

def test_expr(expr,evaluate=False):
    echo('==========================================')
    try:
        # uses defaultConfiguration by default
        xpr = Xpresion(expr)
    except RuntimeError as err:
        xpr = None
        echo(str(err))
    
    if xpr:
        debug = xpr.debug(evaluate if isinstance(evaluate,dict) else {}) if evaluate else xpr.debug()
        echo(debug)
        
class TestObject:
    pass

testObj = TestObject()
setattr(testObj,'key',[{'key':'correct'},'foo'])

echo( 'Xpresion.VERSION ' + Xpresion.VERSION + "\n" )

test_expr('array("string")',True)
test_expr('array(["ar","ra","y"])',True)
test_expr('str(2)',True)
test_expr('str("2")',True)
test_expr('int(2)',True)
test_expr('int("2")',True)
test_expr('math.pow(self)');
test_expr('13')
test_expr('1.32')
test_expr('-0.12')
test_expr('-3')
test_expr('("1,2,3")+3',True)
test_expr('"1,2,3"+3',True)
test_expr('"1,2,3"+3+4',True)
test_expr('[1,2,3]+3',True)
test_expr('-3+2',True)
test_expr('1-3+2',True)
test_expr('1+-3',True)
test_expr('+1+3',True)
test_expr('2*-1')
test_expr('2*(-1)')
test_expr('2^-1')
test_expr('2^(-1)')
test_expr('2^-1^3')
test_expr('-2^-1^3')
test_expr('2^(-1)^3')
test_expr('sqrt(2)', True)
test_expr('$v')
test_expr('$v.key.0.key', {'v':testObj})
test_expr('True')
test_expr('"string"')
test_expr('["a","rra","y"]')
test_expr('`^regex?`i')
test_expr('0 == 1')
test_expr('TRUE == False')
test_expr('TRUE is False')
test_expr('1+2')
test_expr('1+2+3')
test_expr('1+2*3')
test_expr('1*2+3')
test_expr('1*2*3')
test_expr('1+2/3')
test_expr('1*2/3')
test_expr('1^2')
test_expr('1^2^3')
test_expr('1^(2^3)')
test_expr('(1^2)^3')
test_expr('((1^2))^3')
test_expr('`^regex?`i matches "string"')
test_expr('`^regex?`i matches "string" and `^regex?`i matches "string2"')
test_expr('$v in ["a","b","c"]')
test_expr('1 ? : (1+2) (3+4)')
test_expr('1 ? sum(1,2) : (3+4)')
test_expr('1 ? 1+2 : (3+4)')
test_expr('1 ? (2+3) : 2 ? (3+4) : (4+5)')
test_expr('date("Y-m-d H:i:s")', True)
test_expr('time()', True)
test_expr('date("Y-m-d H:i:s", time())')
test_expr('pow(1,pow(2,3))')
test_expr('pow(pow(2,3),4)')
test_expr('pow(pow(1,2),pow(2,3))')
