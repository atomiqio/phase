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
  = ws* ad:anonymousDeclaration ws* { return t.schema('anonymousDeclaration', ad) }
  / ws* decl:declaration ws* { return t.schema('declaration', decl) }
  / ws* { return null }

anonymousDeclaration
  = at:annotatedType ws* [;]? { return at }

id = id:$([a-zA-Z_$] [a-zA-Z0-9_$]*) { return t.id(text()) }

type
  = 'array' { return t.type(text()) }
  / 'boolean' { return t.type(text()) }
  / 'number' { return t.type(text()) }
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
  = '@' ann:id args:arguments? { return t.annotation(ann, args) }

argument
  = literal

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
  = id:id sp+ at:annotatedType sp* lb { return t.declaration(id, at) }
  / id:id sp+ at:annotatedType sp* &'}' { return t.declaration(id, at) }
  / id:id sp+ at:annotatedType sp* ';' { return t.declaration(id, at) }
  // TODO - the following two rules need to return nodes
  / id:id sp+ block:compoundType sp* lb { return { id:id, compoundType:block } }
  / id:id sp+ block:compoundType sp* ';' { return { id:id, compoundType:block } }

declarations
  = decl:declaration list:(ws* declaration)* {
      return [decl].concat(list.map(function(e) { return e[1] }))
    }

compoundType
  = "{" ws* seq:declarations? ws* "}" {
      // FIX
      return { tag:'compoundType', declarations:seq }
    }
  / "{" ws* "}"

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
  = '\\' { p('escapedBackSlash: \\'); return text() }

charSequenceDquotes
  = esc:escapedBackSlash cs:charSequenceDquotes* {
      p('charSequence: escapedBackSlash charSequenceDquotes* => ', esc, cs.join(''))
      return text()
    }
  / char:[^"] cs:charSequenceDquotes* {
      p('charSequence: [^"] charSequenceDquotes* => ', char, cs.join(''))
      return text()
    }

charSequenceSquotes
  = esc:escapedBackSlash cs:charSequenceSquotes* {
      p('charSequence: escapedBackSlash charSequenceSquotes* => ', esc, cs.join(''))
      return text()
    }
  / char:[^'] cs:charSequenceSquotes* {
      p('charSequence: [^\'] charSequenceSquotes* => ', char, cs.join(''))
      return text()
    }

stringLiteral
  = "'" cs:charSequenceSquotes? "'" { p('stringLiteral:squote => %s', cs); return t.stringLiteral(cs || '') }
  / '"' cs:charSequenceDquotes? '"' { p('stringLiteral:dquote => %s', cs); return t.stringLiteral(cs || '') }

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

