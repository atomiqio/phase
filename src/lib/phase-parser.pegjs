{
  var t = require('./phase-node-types');
}

start
 = schema

schema
 = literal
 / type

literal
 = booleanLiteral
 / stringLiteral
 / numberLiteral
 / undefinedLiteral
 / nullLiteral
 / arrayLiteral
 / objectLiteral

// ===== whitespace

space = [ \t]
lb = [\r\n]
ws = space / lb

// ===== Common Productions

sign = [+-]

id = first:[a-zA-Z_$] rest:[a-zA-Z0-9_$]* { return first + rest.join('') }

list
 = literal:literal literals:(ws* ',' ws* literal)* {
   return [literal].concat(literals.map(function(v) { return v[3] }));
 }

// ===== undefined literal

undefinedLiteral = s:'undefined' { return t.undefinedLiteral(s) }

// ===== null literal

nullLiteral = s:'null' { return t.nullLiteral(s) }

// ===== object literal

property
 = key:stringLiteral ws* ':' ws* literal:literal { return [key.value, literal] }

propertyList
 = prop:property props:(ws* ',' ws* property)* {
   return [prop].concat(props.map(function(p) { return p[3] }));
 }

objectLiteral
 = '{' ws* props:propertyList? ws* '}' {
   return t.objectLiteral(text(), props || []);
 }

// ===== array literal

arrayLiteral
 = str:('[' ws* list? ws* ']') {
   var list = str[2] || [];
   list = list.map(function(l) { return l.text; }).join(',');
   return t.arrayLiteral('[' + list + ']', str[2]);
 }

// ===== boolean literal

booleanLiteral
 = s:'true' { return t.booleanLiteral(s) }
 / s:'false' { return t.booleanLiteral(s) }

// ===== string literal

stringLiteral
 = str:("'" [^']* "'") { return t.stringLiteral(str[0] + str[1].join('') + str[2]) }
 / str:('"' [^"]* '"') { return t.stringLiteral(str[0] + str[1].join('') + str[2]) }

// ===== number literal (integer and floating-point)

numberLiteral
 = float
 / integer
 / nan
 / infinity

digit
 = [0-9]

hexdigit
 = [0-9a-fA-F]

// [sign][0[(x|X)]](digits|hexdigit)
integer
 = sign:sign? '0' hex:[xX] hexdigits:hexdigit+ {
   return t.numberLiteral((sign || '') + '0' + hex + hexdigits.join(''), "integer")
 }
 / sign:sign? '0' digits:digit+ {
   return t.numberLiteral((sign || '') + '0' + digits.join(''), "integer")
 }
 / sign:sign? digits:digit+ {
   return t.numberLiteral((sign || '') + digits.join(''), "integer")
 }

// [sign][digits].digits[(E|e)[(+|-)]digits]
float
 = sign:sign? int:digit* '.' mantissa:digit+ exp:([eE] sign? digit+)? {
   return t.numberLiteral((sign || '') + (int ? int.join('') : '') + '.'
     + mantissa.join('') + (exp ? exp.join('')  : ''), "float")
 }

nan
 = 'NaN' { return t.numberLiteral("NaN", typeof(NaN)) }

infinity
 = sign:[+-]? 'Infinity' {
     return t.numberLiteral((sign || '') + 'Infinity', typeof(Infinity))
   }

// ===== types

type
 = s:'array' { return t.type(s) }
 / s:'boolean' { return t.type(s) }
 / s:'number' { return t.type(s) }
 / s:'object' { return t.type(s) }
 / s:'string' { return t.type(s) }
 / u:union { return t.type(u) }

union
 = '[' ws* type:type types:(ws* ',' ws* type ws*)* ']' {
     return [t.type(type)].concat(types.map(function(type) {
       return t.type(type[3]);
     }))
   }

// ===== annotation

annotation
 = '@' id:id '(' args:arguments ')' { return annotationWithArg(id, args) }
 / '@' id:id '(' argument:argument ')' { return annotationWithArg(id, argument) }
 / '@' id:id '(' space* ')' { return annotation(id) }
 / '@' id:id { return annotation(id) }

annotations
 = annotation:annotation annotations:(ws+ annotation)* { return [annotation].concat(annotations.map(function(a) {
     return a[1]
   }))}

propertyOrAnnotation
 = property
 / annotation





/*

schema
 = ws* typeSpec:typeSpec ws* { return typeSpec }
 / ws* complexType:complexType ws* { return complexType }
 / ws+ { return }

id
 = first:[a-zA-Z_$] rest:[a-zA-Z0-9_$]* { return first + rest.join('') }

property
 = id:id typeSpec:(space+ typeSpec) {
     return property(id, typeSpec[1])
   }
 / id:id annotations:(space+ annotations)? {
     return property(id, typeSpec(undefined, annotations ? annotations[1] : []))
   }
 / id:id {
     return property(id)
   }

complexType
 = '{' ws* propertyOrAnnotation:propertyOrAnnotation properties:(space* lb+ ws* propertyOrAnnotation)* ws* '}' {
     return complexType([propertyOrAnnotation].concat(properties.map(function(p) {
       return p[3]
     })))
   }

uniontype
 = '[' ws* type:type types:(ws* ',' ws* type ws*)* ']' {
     return [type].concat(types.map(function(t) {
       return t[3];
     }))
   }

type
 = 'array'
 / 'boolean'
 / 'integer'
 / 'number'
 / 'null'
 / 'object'
 / 'string'
 / uniontype

typeSpec
 = type:type annotations:(space+ annotations)? { return typeSpec(type, annotations ? annotations[1] : undefined )}

string
 = [a-zA-Z0-9_$-]+

integer
 = [-0-9]*

boolean
 = 'true'
 / 'false'

object
 = '{}'

array
 = '[]'

structure
 = object
 / array

argument
 = ['] argument:string ['] { return argument.join('')}
 / ["] argument:string ["] { return argument.join('')}
 / argument:structure { return JSON.parse(argument) }
 / argument:typeSpec
 / argument:annotation
 / argument:boolean { return JSON.parse(argument) }
 / argument:integer { return parseInt(argument.join('')) }

arguments
 = arguments:((argument ([,] space+))+ argument) { function trueArg(value){return value[0] !== ',' && literal[1] !== ' '};
    var args = [];
    arguments[0].forEach(function(a) {
      if (Array.isArray(a)) {
        a.forEach(function(v) {
          if (trueArg(v)) {
            args.push(v)
          }
        })
      }
    })
    args.push(arguments[arguments.length-1]);
    return args
}

annotation
 = '@' id:id '(' args:arguments ')' { return annotationWithArg(id, args) }
 / '@' id:id '(' argument:argument ')' { return annotationWithArg(id, argument) } 
 / '@' id:id '(' space* ')' { return annotation(id) }
 / '@' id:id { return annotation(id) }

annotations
 = annotation:annotation annotations:(ws+ annotation)* { return [annotation].concat(annotations.map(function(a) {
     return a[1]
   }))}

propertyOrAnnotation
 = property
 / annotation


*/