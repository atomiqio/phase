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

function transformFromAnonymousDeclaration(decl) {
	const schema = jsb.schema();
	Object.assign(schema, getProps(decl.annotatedType));

	return schema.json();
}

function getProps(value) {
	let result, props;

	const type = getType(value.type);
	const annotations = transformAnnotations(value.annotations);

	if (type && annotations) {
		props = jsb.schema();
		props._keywords = type._keywords.concat(annotations._keywords);
	} else {
		props = type ? type : annotations;
	}

	if (props) {
		result = jsb.schema();
		Object.assign(result, props);
	}

	return result;
}

function getType(obj) {
	const schema = typeTags[obj.tag] ? jsb.schema() : null;

	if (schema) {
		const result = typeTags[obj.tag](obj);
		Object.assign(schema, result);
	}

	return schema;
}

const typeTags = {
	type: simpleTypes,
	union: simpleTypes,
	compoundType: compoundType
};

function simpleTypes(obj) {
	const schema = jsb.schema();

	let result = obj.value;

	if (Array.isArray(obj.value)) {
		result = [];

		obj.value.forEach(elem => {
			result.push(elem.value.value);
		});
	}

	return schema.type(result);
}

function compoundType(value) {
	const schema = jsb.schema();

	if (value.declarations.length) {
		value.declarations.forEach(elem => {
			if (elem.tag === 'annotation') {
				schema[elem.name](getAnnotationValue(elem.args));
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

function transformAnnotations(value) {
	let result;

	value = Array.isArray(value) ? value : Array.of(value);

	if (value.length) {
		result = jsb.schema();
		value.forEach(elem => {
			result[elem.name](getAnnotationValue(elem.args));
		});
	}

	return result;
}

function getAnnotationValue(args) {
	// if no arguments supplied, set default value to empty object
	let result = jsb.schema();

	if (args.length) {
		result = [];

		args.forEach(arg => {
			let value = arg.value;

			if (typeTags[arg.tag]) {
				value = getType(arg);
			} else if (arg.tag === 'annotation') {
				value = transformAnnotations(arg);
			} else if (arg.tag === 'object') {
				value = jsb.schema();
			} else if (arg.tag === 'array' && arg.value.length) {
				value = [];
				value.push(getAnnotationValue(arg.value));
			}

			result.push(value);
		});

		if (result.length < 2) {
			result = result[0];
		}
	}

	return result;
}
