import parser from './phase-parser';
import { readFile, readFileSync } from 'fs';
import ZSchema from 'z-schema';
import { includes, find } from 'lodash';

/**
 * Factory for creating an official JSON Schema validator
 * @param {(string|object)} schema - JSON schema string or object
 * @param [options] - Will be supplied to the validator's constructor function
 * @return {object} with a validate method that takes an object and validates against the schema provided to the factory
 */
const validatorFactory = (schema, options) => {
  const zschema = new ZSchema(options);

  if (typeof schema == 'string') {
    schema = JSON.parse(schema);
  }

  return {
    validate: data => {
      const valid = zschema.validate(data, schema);
      return valid ? { valid: true } : { valid: false, errors: zschema.getLastErrors() };
    }
  };
};

export class Phase {

  constructor(config) {
    this.config = config || {};
  }

  /**
   * Factory method to create a validator for the the supplied phase schema
   * @param {string} text - The raw phase schema input text to parse and generate JSON schema
   * @param {object} [options] - Should at least contain filename and filepath properties for source schema
   * @param {string} options.filename - The name of the source schema file
   * @param {string} options.filepath - The full pathname of the source schema file
   * @param {object} new Phase instance
   */
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

    // transform the phase schema to standard JSON schema
    phase.schema = transform(phase.ast);

    // create a validator for the JSON schema
    phase.validator = validatorFactory(phase.schema);

    return phase;
  }

  /**
   * Phase load callback
   * @callback phaseLoadCallback
   * @param {object} error
   * @param {object} phase instance
   */

  /**
   * Factory method to create a validator for the the supplied phase schema
   * @param {string} text - The raw phase schema input text to parse and generate JSON schema
   * @param {object} [options] - Should at least contain filename and filepath properties for source schema
   * @param {phaseLoadCallback} [callback] - If provided, asynchronously loads schema file, otherwise loads synchronously
   * @param {object} new Phase instance
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

  /**
   * Validate data
   * @param {*} data - The object to be validated against this instance's schema
   * @return {object} an object with at least a 'valid' property; if false, then also an 'errors' array property
   */
  validate(data) {
    return this.validator.validate(data);
  }

}


/**
 * Transforms a phase ast into a JSON Schema
 * @param ast abstract syntax tree
 */
function transform(ast) {
  return generators[ast.tt](ast);
}

/**
 * Map AST types to generator functions
 */
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
    if (!schema.properties && p.tt !== 'annotation') schema.properties = {};

    if (p.tt === 'annotation') {
      if (p.hasOwnProperty('value')) {
        schema[p.name] = p.value;
      }
    } else {
      schema.properties[p.name] = p.typeSpec && p.typeSpec.type ? { type: p.typeSpec.type } : {};
    }

    if (p.typeSpec && p.typeSpec.annotations) {
      // TODO required will be a built in annotation, but still shouldn't be hard-coded like this
      let req = find(p.typeSpec.annotations, { name: 'required' });
      if (req) {
       if (!schema.required) schema.required = [];
       schema.required.push(p.name);
      }
      p.typeSpec.annotations.forEach(a => {
        if (a.hasOwnProperty('value')) {
          schema.properties[p.name][a.name] = a.value;
        }
      })
    }

  });

  return schema;
}

