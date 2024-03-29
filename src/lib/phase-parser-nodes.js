// ========================================================
// Declarations
// ========================================================

exports.type = function(value) {
  if (Array.isArray(value)) {
    return {
      tag: 'union',
      type: 'union',
      value: value
    };
  } else {
    return {
      tag: 'type',
      type: value,
      value: value
    };
  }
};

exports.annotation = function(name, args) {
  return {
    tag: 'annotation',
    name: name,
    args: args || []
  };
};

exports.annotatedType = function(type, annotations) {
  return {
    tag: 'annotatedType',
    type: type,
    annotations: annotations || []
  };
};

exports.anonymousDeclaration = function(annotatedType) {
  return {
    tag: 'anonymousDeclaration',
    annotatedType: annotatedType
  };
};

exports.declaration = function(name, annotatedType) {
  return {
    tag: 'declaration',
    name: name,
    annotatedType: annotatedType
  };
};

exports.compoundType = function(declarations) {
  return {
    tag: 'compoundType',
    declarations: declarations || []
  };
};

exports.schema = function(decl) {
  return {
    tag: 'schema',
    declaration: decl
  };
};

// ========================================================
// literals
// ========================================================

exports.undefinedLiteral = function() {
  return {
    tag: 'undefined',
    type: typeof undefined,
    text: 'undefined',
    value: undefined
  };
};

exports.nullLiteral = function() {
  return {
    tag: 'null',
    type: typeof null,
    text: 'null',
    value: null
  };
};

exports.booleanLiteral = function(text) {
  return {
    tag: 'boolean',
    type: 'boolean',
    text: text,
    value: text === 'true'
  };
};

exports.stringLiteral = function(text) {
  return {
    tag: 'string',
    type: 'string',
    text: text,
    value: text
  };
};

exports.arrayLiteral = function(text, value) {
  return {
    tag: 'array',
    type: 'object',
    text: text,
    value: value || []
  };
};

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
};

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
};

