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
}

start
 = schema

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
 = first:[a-zA-Z_$^] rest:[a-zA-Z0-9_$]* { return first + rest.join('') }

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
 = [a-zA-Z0-9_$-]*

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

