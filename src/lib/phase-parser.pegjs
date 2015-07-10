{
  function typeSpec(type, annotations) {
    return {
      tt: 'typeSpec',
      type: type,
      annotations: annotations || []
    }
  }

  function property(id, typeSpec) {
    return {
      tt: 'property',
      name: id,
      typeSpec: typeSpec
    }
  }

  function complexType(properties) {
    return {
      tt: 'complexType',
      properties: properties
    }
  }

  function annotation(name) {
    return {
      tt: 'annotation',
      name: name
    }
  }

  function annotationWithArg(name, value) {
    return {
      tt: 'annotation',
      name: name,
      value: value
    }
  }

  function dump(value) {
    return {
      value: value,
      type: typeof value
    }
  }

  function number(text, type) {
    var sign, value, error, num, base, input = text;

    num = {
      tag: 'number',
      text: input
    };

    if (type == 'float') {
      try {
        num.value = parseFloat(input);
        num.type = type;

      } catch (err) {
        error = err.message;
      }

    } else {
      try {
        if (/[+-]/.test(text[0])) {
          sign = text[0];
          text = text.substr(1);
        }

        base = 10;
        if (text[0] === '0') {
          if (/[xX]/.test(text[1])) {
            base = 16;
          } else {
            base = 8;
          }
        }

        num.value = parseInt(input, base);
        num.type = type;

      } catch (err) {
        error = err.message;
      }
    }

    if (error) num.error = error;

    return num;
  }

  function string(text) {
    return {
      tag: 'string',
      text: text,
      value: text.substring(1, text.length-1)
    };
  }

  function null_t(text) {
    return {
      tag: 'null',
      text: text,
      value: null,
      type: typeof null
    };
  }

  function undefined_t(text) {
    return {
      tag: 'undefined',
      text: text,
      value: undefined
    };
  }
}

start
// = schema

 = string
 / number
 / undefined
 / null

// ===== simple tokens

sign = [+-]
null = s:('n' 'u' 'l' 'l') { return null_t(s.join('')) }
undefined = s:('u' 'n' 'd' 'e' 'f' 'i' 'n' 'e' 'd') { return undefined_t(s.join('')) }


// ===== string

string
 = str:("'" [^']* "'") { return string(str[0] + str[1].join('') + str[2]) }
 / str:('"' [^"]* '"') { return string(str[0] + str[1].join('') + str[2]) }

// ===== number
// * integer literal
// * floating-point literal

number
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
   return number((sign || '') + '0' + hex + hexdigits.join(''), "integer")
 }
 / sign:sign? '0' digits:digit+ {
   return number((sign || '') + '0' + digits.join(''), "integer")
 }
 / sign:sign? digits:digit+ {
   return number((sign || '') + digits.join(''), "integer")
 }

// [sign][digits].digits[(E|e)[(+|-)]digits]
float
 = sign:sign? int:digit* '.' mantissa:digit+ exp:([eE] sign? digit+)? {
   return number((sign || '') + (int ? int.join('') : '') + '.'
     + mantissa.join('') + (exp ? exp.join('')  : ''), "float")
 }

nan
 = 'N' 'a' 'N' { return number("NaN", typeof(NaN)) }

infinity
 = sign:[+-]? 'I' 'n' 'f' 'i' 'n' 'i' 't' 'y' {
     return number((sign || '') + 'Infinity', typeof(Infinity))
   }




/*

schema
 = ws* typeSpec:typeSpec ws* { return typeSpec }
 / ws* complexType:complexType ws* { return complexType }
 / ws+ { return }

// ===== whitespace

lb
 = [\r\n]

space
 = [ \t]

ws
 = space
 / lb

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
 = arguments:((argument ([,] space+))+ argument) { function trueArg(value){return value[0] !== ',' && value[1] !== ' '}; 
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