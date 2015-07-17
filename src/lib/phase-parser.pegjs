{
  var t = require('./phase-node-types');

  function p() {
    console.log.apply(console, Array.prototype.slice.call(arguments));
  }
}

start
  = schema

schema
  = ws* type:annotatedType ws* [;]? { return type }
  / ws* decl:declaration ws* { return decl }
  / ws* complexDecl:complexDeclaration ws* { return complexDecl }
  / ws* { return null }


space = [ \t]
lb = [\r\n]
ws = space / lb


/*
type
  = "boolean"
  / "number"
  / "string"
  / "array"
*/


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


annotation
  = '@' ann:id args:arguments? { return { annotation:ann, arguments:args } }

argument
  = literal

arguments
  = "(" ws* arg:argument args:(ws* ',' ws* argument)* ws* ")" {
      return [arg].concat(args.map(function(e) { return e[3] }))
    }

annotatedType
  = type:type list:(ws+ annotation)* {
      return { type: type, annotations: list.map(function(e) { return e[1] }) }
    }

declaration
  = id:id ws+ at:annotatedType space* [;\r\n] { return { id:id, type:at } }
  / id:id ws+ at:annotatedType space* &'}' { return { id:id, type:at } }
  / id:id ws+ decl:complexDeclaration { return { id:id, complexType:decl } }

declarationList
  = decl:declaration list:(ws* declaration)* {
      return [decl].concat(list.map(function(e) { return e[1] } ))
    }


id = [a-zA-Z_$] [a-zA-Z0-9_$]* { /* TODO return node */ return text() }

complexDeclaration
  = "{" ws* decl:declarationList? ws* "}" { return decl || {} }

// ================================================================================

literal
  = booleanLiteral
  / numberLiteral
  / undefinedLiteral
  / nullLiteral
  / arrayLiteral
  / objectLiteral
  / stringLiteral

// ===== whitespace

space = [ \t]
lb = [\r\n]
ws = space / lb

// ===== Common Productions

sign = [+-]


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

