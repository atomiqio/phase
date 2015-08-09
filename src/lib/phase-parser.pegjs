{
  var t = require('./phase-parser-nodes');

  function p() {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  }
}

start = schema

sp = [ \t]
lb = [\r\n]
ws = ( sp / lb / comment ) { return '' }

comment = slComment / mlComment
slComment = '//' (!lb .)* { return '' }
mlComment = '/*' (!'*/' .)* '*/' { return '' }

sign = [+-]

// ========================================================
// Declarations
// ========================================================

schema
  = ws* decl:anonymousDeclaration ws* { return t.schema(decl) }
  / ws* decl:declaration ws* { return t.schema(decl) }
  / literal
  / ws* { return t.schema() }

anonymousDeclaration
  = at:annotatedType ws* [;]? { return t.anonymousDeclaration(at) }

id = $([a-zA-Z_$] [a-zA-Z0-9_$]*)

type
  = 'array' { return t.type(text()) }
  / 'boolean' { return t.type(text()) }
  / 'number' { return t.type(text()) }
  / 'integer' { return t.type(text()) }
  / 'null' { return t.type(text()) }
  / 'object' { return t.type(text()) }
  / 'string' { return t.type(text()) }
  / u:union { return t.type(u) }

union
  = '[' ws* type:type types:(ws* ',' ws* type ws*)* ']' {
      return [t.type(type)].concat(types.map(function(type) {
        return t.type(type[3]);
      }))
    }

annotation
  = '@' name:id args:arguments? { return t.annotation(name, args) }

argument
  = literal
  / type
  / compoundType
  / annotation

arguments
  = "(" ws* arg:argument args:(ws* ',' ws* argument)* ws* ")" {
      return [arg].concat(args.map(function(e) { return e[3] }))
    }

annotations
  = ann:annotation annotations:(ws+ annotation)* {
      return [ann].concat(annotations.map(function(e) { return e[1] }))
    }

annotatedType
  = type:type list:(ws+ annotations)? {
      return t.annotatedType(type, list ? list[1] : []);
    }
  / type:compoundType list:(ws+ annotations)? {
      return t.annotatedType(type, list ? list[1] : []);
    }

declaration
  = id:id ws+ type:annotatedType? (!'}' ws)* ';'? { return t.declaration(id, type) }

declarations
  = decl:declaration list:(ws* declaration)* {
      return [decl].concat(list.map(function(e) { return e[1] }))
    }

compoundType
  = "{" ws* seq:declarations? ws* "}" { return t.compoundType(seq) }
  / "{" ws* seq:annotations? ws* "}" { return t.compoundType(seq) }
  / "{" ws* "}" { return t.compoundType() }

// ========================================================
// Literals
// ========================================================

literal
  = booleanLiteral
  / numberLiteral
  / undefinedLiteral
  / nullLiteral
  / arrayLiteral
  / objectLiteral
  / stringLiteral

list
  = literal:literal literals:(ws* ',' ws* literal)* {
      return [literal].concat(literals.map(function(v) { return v[3] }));
    }

// ===== undefined literal

undefinedLiteral = 'undefined' { return t.undefinedLiteral() }

// ===== null literal

nullLiteral = 'null' { return t.nullLiteral() }

// ===== boolean literal

booleanLiteral
  = 'true' { return t.booleanLiteral('true') }
  / 'false' { return t.booleanLiteral('false') }

// ===== string literal

escapedBackSlash
  = '\\' { return text() }

charSequenceDquotes
  = esc:escapedBackSlash cs:charSequenceDquotes* { return text() }
  / char:[^"] cs:charSequenceDquotes* { return text() }

charSequenceSquotes
  = esc:escapedBackSlash cs:charSequenceSquotes* { return text() }
  / char:[^'] cs:charSequenceSquotes* { return text() }

stringLiteral
  = "'" cs:charSequenceSquotes? "'" { return t.stringLiteral(cs || '') }
  / '"' cs:charSequenceDquotes? '"' { return t.stringLiteral(cs || '') }

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
        + mantissa.join('') + (exp ? exp[0] + (exp[1] || '') + exp[2].join('')  : ''), "float")
    }

nan
  = 'NaN' { return t.numberLiteral("NaN", typeof(NaN)) }

infinity
  = sign:[+-]? 'Infinity' {
      return t.numberLiteral((sign || '') + 'Infinity', typeof(Infinity))
    }

