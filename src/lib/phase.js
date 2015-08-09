import parser from './phase-parser';
import * as jsb from 'json-schema-builder';
import { readFile, readFileSync } from 'fs';
import ZSchema from 'z-schema';
import { find } from 'lodash';
import { format } from 'util';

/**
 * Factory for creating an official JSON Schema validator
 * @param {(string|object)} schema - JSON schema string or object
 * @param [options] - Will be supplied to the validator's constructor function
 * @return {object} with a validate method that takes an object and validates against the schema provided to the factory
 */
const validatorFactory = (schema, options) => {
	const zschema = new ZSchema(options);
	const orig = schema;

	if (typeof schema == 'string') {
		schema = JSON.parse(schema);
	}

	if (typeof schema == 'undefined') {
		//throw new Error(format('not a valid schema (schema is undefined): %s', orig));
		schema = jsb.schema();
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

		console.log('---------');
		console.log('parse:');
		console.log(text);

		phase.raw = text;

		if (options && options.filename) {
			phase.filename = options.filename;
			phase.filepath = options.filepath;
		}

		try {
			phase.ast = parser.parse(phase.raw);
			console.log('ast:');
			console.log(JSON.stringify(phase.ast, null, 2));
		} catch (err) {
			if (err.name == 'SyntaxError' && phase.filename) {
				err.filename = phase.filename;
				err.filepath = phase.filepath;
			}
			throw new Error(format('Invalid schema (delimited with |): |%s|. Detail: %s', text, err.message));
		}

		if (options && !options.no_transform) {
			// transform the phase schema to standard JSON schema
			phase.schema = transform(phase.ast);

			// create a validator for the JSON schema
			phase.validator = validatorFactory(phase.schema);
		}

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
			return Phase.parse(readFileSync(filename, options || { encoding: 'utf8' }), options);
		}

		readFile(filename, options, function(err, text) {
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
	return ast.declaration ? transformers[ast.declaration.tag](ast.declaration) : jsb.schema().json();
}

/**
 * Map AST declarations to transformer functions
 */
const transformers = {

	declaration: transformFromDeclaration,
	anonymousDeclaration: transformFromAnonymousDeclaration

};

function transformFromDeclaration(ast) {
}

/**
 * @param decl AST declaration tagged 'anonymousDeclaration'
 */
function transformFromAnonymousDeclaration(decl) {
	const schema = jsb.schema();
	Object.assign(schema, getProps(decl.annotatedType));

	return schema.json();
}

/**
 * @param value: declaration.annotatedType
 * @returns schema properties, or undefined
 */
function getProps(value) {
	let result, props;

	// get type or property declarations and any nested annotations
	const type = getType(value.type);
	// get base-level annotations
	const annotations = transformAnnotations(value.annotations);

	// if type and annotations are defined, merge their jsb keywords...
	if (type && annotations) {
		props = jsb.schema();
		props._keywords = type._keywords.concat(annotations._keywords);
	} else {
	// ... otherwise use whichever is defined, or leave undefined
		props = type ? type : annotations;
	}

	// assign props to valid schema instance
	if (props) {
		result = jsb.schema();
		Object.assign(result, props);
	}

	return result;
}

/**
 *
 * @param type: declaration.annotatedType.type object
 * @returns valid schema with 'type' property or other declarations, or undefined
 */
function getType(type) {
	const schema = typeTags[type.tag] ? jsb.schema() : null;

	if (schema) {
		const result = typeTags[type.tag](type);
		Object.assign(schema, result);
	}

	return schema;
}

/**
 * Map declaration.annotatedType.type.tag to associated function
 */
const typeTags = {
	type: simpleTypes,
	union: simpleTypes,
	compoundType: compoundType
};

/**
 * @param type: declaration.annotatedType.type object with 'type' or 'union' tag
 * @returns {"type": <type/[types]> } or undefined
 */
function simpleTypes(type) {
	const schema = jsb.schema();

	let result = type.value;

	if (Array.isArray(type.value)) {
		result = [];

		type.value.forEach(elem => {
			result.push(elem.value.value);
		});
	}

	return schema.type(result);
}

/**
 * Iterate over declarations and return JSB schema object
 * @param obj: declaration.annotatedType.type object with 'compoundType' tag
 */
function compoundType(obj) {
	const schema = jsb.schema();

	if (obj.declarations.length) {
		obj.declarations.forEach(elem => {
			if (elem.tag === 'annotation') {
				// Map to matching jsb method with evaluated arguments
				schema[elem.name](getArgValue(elem.args));
			}

			if (elem.tag === 'declaration') {
				const value = jsb.schema();

				if (elem.annotatedType) {
					Object.assign(value, getProps(elem.annotatedType));
				}

				schema.property(elem.name, value);
			}
		});
	}

	return schema;
}

/**
 * Map to matching jsb method with evaluated arguments, or return undefined
 */
function transformAnnotations(value) {
	let result;

	value = Array.isArray(value) ? value : Array.of(value);

	if (value.length) {
		result = jsb.schema();
		value.forEach(elem => {
			result[elem.name](getArgValue(elem.args));
		});
	}

	return result;
}

/**
 * Evaluate annotation args array and return correct values
 */
function getArgValue(args) {
	// if no arguments supplied, return empty schema object
	let result = !args ? jsb.schema() : args;

	if (args.length) {
		result = [];

		args.forEach(arg => {
			// default for string, number, or boolean values
			let value = arg.value;

			if (typeTags[arg.tag]) {
				value = getType(arg);
			}
			else if (arg.tag === 'annotation') {
				value = transformAnnotations(arg);
			}
			else if (arg.tag === 'array' && arg.value.length) {
				value = [ getArgValue(arg.value) ];
			}
			else if (arg.tag === 'object') {
				let obj = jsb.schema();

				if (Object.keys(arg.value).length) {
					for (let prop in arg.value) {
						obj[prop] = getArgValue(arg.value[prop].value);
					}
				}

				value = obj;
			}

			result.push(value);
		});

		if (result.length < 2) {
			result = result[0];
		}
	}

	return result;
}
