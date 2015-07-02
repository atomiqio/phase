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

annotation
 = '@' id:id { return annotation(id) }

annotations
 = annotation:annotation annotations:(ws+ annotation)* { return [annotation].concat(annotations.map(function(a) {
     return a[1]
   }))}

propertyOrAnnotation
 = property
 / annotation


