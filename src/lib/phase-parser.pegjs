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

type
 = 'array'
 / 'boolean'
 / 'integer'
 / 'number'
 / 'null'
 / 'object'
 / 'string'

typespec
 = type:type { return typespec(type) }

schema
 = ws+ { return }
 / ws* typespec:typespec ws* { return typespec }


