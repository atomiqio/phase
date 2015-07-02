{
  function typespec(type, decorators) {
    return {
      type: type,
      decorators: decorators || []
    }
  }
}

start
 = schema

lb
 = [\r\n]

ws
 = [ \t]
 / lb

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

typespec
 = type:type { return typespec(type) }

schema
 = ws* typespec:typespec ws* { return typespec }
 / ws+ { return }


