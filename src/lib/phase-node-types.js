// ========================================================
// Parsed literal values (primitives, objects, & arrays)
// ========================================================

exports.undefinedLiteral = function() {
  return {
    tag: 'undefined',
    type: typeof undefined,
    text: 'undefined',
    value: undefined
  }
}

exports.nullLiteral = function() {
  return {
    tag: 'null',
    type: typeof null,
    text: 'null',
    value: null
  }
}

exports.booleanLiteral = function(text) {
  return {
    tag: 'boolean',
    type: 'boolean',
    text: text,
    value: text === 'true'
  };
}

exports.stringLiteral = function(text) {
  return {
    tag: 'string',
    type: 'string',
    text: text,
    value: text
  };
}

exports.arrayLiteral = function(text, value) {
  return {
    tag: 'array',
    type: 'object',
    text: text,
    value: value
  };
}

exports.objectLiteral = function(text, props) {
  var o = {};
  props.forEach(function (p) {
    o[p[0]] = p[1];
  });

  return {
    tag: 'object',
    type: 'object',
    text: text,
    value: o
  };
}

exports.numberLiteral = function(text, format) {
  var sign, value, error, num, base, input = text;

  num = {
    tag: 'number',
    type: 'number',
    text: input,
    format: format
  };

  if (format == 'float') {
    try {
      num.value = parseFloat(input);

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

    } catch (err) {
      error = err.message;
    }
  }

  if (error) num.error = error;

  return num;
}

// ========================================================
//
// ========================================================

exports.type = function(value) {
  if (Array.isArray(value)) {
    return {
      tag: 'union',
      type: 'union',
      text: JSON.stringify(value),
      value: value
    }
  }

  return {
    tag: 'type',
    type: value,
    text: value,
    value: value
  }
}

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

