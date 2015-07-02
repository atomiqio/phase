import parser from './phase-parser';
import { readFile, readFileSync } from 'fs';
import ZSchema from 'z-schema';
import { includes, find } from 'lodash';

const validatorFactory = (schema, options) => {
  const zschema = new ZSchema(options);

  if (typeof schema == 'string') {
    schema = JSON.parse(schema);
  }

  return {
    validate: json => {
      const valid = zschema.validate(json, schema);
      return valid ? { valid: true } : { valid: false, errors: zschema.getLastErrors() };
    }
  };
};

export class Phase {

  constructor(config) {
    this.config = config || {};
  }

  static parse(text, options) {
    const phase = new Phase();

    phase.raw = text;

    if (options && options.filename) {
      phase.filename = options.filename;
      phase.filepath = options.filepath;
    }

    try {
      phase.ast = parser.parse(phase.raw);
    } catch (err) {
      if (err.name == 'SyntaxError' && phase.filename) {
	err.filename = phase.filename;
	err.filepath = phase.filepath;
      }

      throw err;
    }

    phase.schema = transform(phase.ast);
    phase.validator = validatorFactory(phase.schema);

    return phase;
  }

  /**
   * If callback is provided, asynchronously loads schema file, otherwise loads synchronously
   */
  static load(filename, options, callback) {
    if (typeof options == 'function') {
      callback = options;
    }

    if (!options) {
      options = { encoding: 'utf8' };
    }
    options.filename = filename;


    if (!callback) {
      return Phase.parse(fs.readFileSync(filename, options || { encoding: 'utf8' }), options);
    }

    fs.readFile(filename, options, function(err, text) {
      if (err) return callback(err);

      try {
	callback(null, Phase.parse(text, options));
      } catch (err) {
        callback(err);
      }
    });
  }

  validate(obj) {
    return this.validator.validate(obj);
  }

}


/**
 * Transforms a phase ast into a JSON Schema
 * @param ast abstract syntax tree
 */
function transform(ast) {
  return generators[ast.tt](ast);
}

const generators = {

  typeSpec: generateFromTypeSpec,
  complexType: generateFromComplexType

}

function generateFromTypeSpec(ast) {
  return {
    type: ast.type
  }
}

function generateFromComplexType(ast) {
  let schema = {};

  ast.properties.forEach(p => {
    if (!schema.properties) schema.properties = {};

    schema.properties[p.name] = p.typeSpec && p.typeSpec.type ? { type: p.typeSpec.type } : {};

    if (p.typeSpec && p.typeSpec.annotations) {
      // TODO required will be a built in annotation, but still shouldn't be hard-coded like this
      let req = find(p.typeSpec.annotations, { name: 'required' });
      if (req) {
       if (!schema.required) schema.required = [];
       schema.required.push(p.name);
      }
    }

  });

  return schema;
}

