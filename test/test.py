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

Xpresion.defaultConfiguration()

echo( 'Xpresion.VERSION ' + Xpresion.VERSION + "\n" )

echo(Xpresion('13').debug())
echo(Xpresion('1.32').debug())
echo(Xpresion('-0.12').debug())
echo(Xpresion('-3').debug())
echo(Xpresion('("1,2,3")+3').debug({}))
echo(Xpresion('"1,2,3"+3').debug({}))
echo(Xpresion('"1,2,3"+3+4').debug({}))
echo(Xpresion('[1,2,3]+3').debug({}))
echo(Xpresion('-3+2').debug({}))
echo(Xpresion('1-3+2').debug({}))
echo(Xpresion('1+-3').debug({}))
echo(Xpresion('+1+3').debug({}))
echo(Xpresion('2*-1').debug())
echo(Xpresion('2*(-1)').debug())
echo(Xpresion('2^-1').debug())
echo(Xpresion('2^(-1)').debug())
echo(Xpresion('2^-1^3').debug())
echo(Xpresion('-2^-1^3').debug())
echo(Xpresion('2^(-1)^3').debug())
echo(Xpresion('$v').debug())
echo(Xpresion('True').debug())
echo(Xpresion('"string"').debug())
echo(Xpresion('["a","rra","y"]').debug())
echo(Xpresion('`^regex?`i').debug())
echo(Xpresion('0 == 1').debug())
echo(Xpresion('TRUE == False').debug())
echo(Xpresion('1+2').debug())
echo(Xpresion('1+2+3').debug())
echo(Xpresion('1+2*3').debug())
echo(Xpresion('1*2+3').debug())
echo(Xpresion('1*2*3').debug())
echo(Xpresion('1+2/3').debug())
echo(Xpresion('1*2/3').debug())
echo(Xpresion('1^2').debug())
echo(Xpresion('1^2^3').debug())
echo(Xpresion('1^(2^3)').debug())
echo(Xpresion('(1^2)^3').debug())
echo(Xpresion('((1^2))^3').debug())
echo(Xpresion('`^regex?`i matches "string"').debug())
echo(Xpresion('`^regex?`i matches "string" and `^regex?`i matches "string2"').debug())
echo(Xpresion('$v in ["a","b","c"]').debug())
echo(Xpresion('1 ? (2+3) : (3+4)').debug())
echo(Xpresion('1 ? (2+3) : 2 ? (3+4) : (4+5)').debug())

