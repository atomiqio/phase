import assert from 'assert';
import { join, dirname } from 'path';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { format, inherits } from 'util';
import { isEqual } from '../helpers';
import { draft4 } from 'json-schema-test-suite';
import { Phase } from '../../lib/phase';
import tv4 from 'tv4';
import ZSchema from 'z-schema';
import testSuite from './testsuite';

const prn = console.log;

// The testsuite directory structure was created using the gulp task generate-testsuite.
// It uses the testsuite module's exported generate function to create and populate
// directories with schema.json and tests.json files. These files are based on tests exported
// by json-schema-test-suite. The loadSamples function in this module relies on this
// directory structure. The tests will load a schema.phase file, if present, to compare
// against the reference schema.json file.
const testSuitePath = join(__dirname, './testsuite');

// factory function for creating a tv4 JSON Schema validator
const tv4SchemaFactory = (schema, options) => {
  if (typeof schema == 'string') {
    schema = JSON.parse(schema);
  }

  return {
    validate: json => {
      try {
        const valid = tv4.validate(json, schema);
        return valid ? { valid: true } : { valid: false, errors: [tv4.error] };
      } catch (err) {
        return { valid: false, errors: [err.message] };
      }
    }
  }
};

// factory function for creating a z-schema JSON Schema validator
const zSchemaFactory = (schema, options) => {
  const zschema = new ZSchema(options);

  if (typeof schema == 'string') {
    schema = JSON.parse(schema);
  }

  return {
    validate: json => {
      try {
        const valid = zschema.validate(json, schema);
        return valid ? { valid: true } : { valid: false, errors: zschema.getLastErrors() };
      } catch (err) {
        return { valid: false, errors: [err.message] };
      }
    }
  };
};

const validators = [
//  { name: 'tv4-schema', factory: (schema, options) => tv4SchemaFactory(schema, options), ext: '.json', skip: process.env.SKIP_TV4_SCHEMA },
//  { name: 'z-schema', factory: (schema, options) => zSchemaFactory(schema, options), ext: '.json', skip: process.env.SKIP_Z_SCHEMA },
  {
    name: 'phase',
    factory: (schema, options) => { return Phase.parse(schema, options) },
    ext: '.phase',
    skip: process.env.SKIP_PHASE
  }
];


/**
 * Generator function to traverse the testsuite directory and yield schema sample objects:
 *
 * Directory structure:
 *
 * testsuite/
 *   additionalItems/
 *     additionalItems~are~allowed~by~default/
 *       schema.json
 *       schema.phase
 *       tests.json
 *   ...
 *
 * Generates schema samples:
 *
 * {
 *   group: 'additionalItems',
 *   schema: '(contents of schema.json)',
 *   description: 'additionalItems are allowed by default',
 *   filename: 'schema.phase',
 *   filepath: '/.../testsuite/additionalItems/additionalItems~are~allowed~by~default/schema.phase',
 *   tests: [{
 *     description: '',
 *     data: *,
 *     valid: t|f
 *   }, ...]
 * }
 *
 * @param {string} ext - File extension to load, such as '.phase'
 * @return {object} yields a schema sample
 */
function* loadSamples(ext) {
  const testsuitePath = join(__dirname, 'testsuite');
  for (const sample of testSuite.load(testSuitePath, ext)) {
    yield sample;
  }
}


// TESTS

describe.skip('validator tests', function () {

  for (let { name, factory, ext, skip } of validators) {
    if (skip) continue;

    // create a test suite for each validator under test
    describe(name, () => {
      for (const sample of loadSamples(ext)) {

        // create a test suite for each sample group
        describe(sample.group, function () {

          // create a test suite for sample group description
          describe(sample.description, () => {

            try {
              const phaser = factory(sample.schema, { filename: sample.filename, filepath: sample.filepath });

              dumpDebug(dirname(sample.filepath), phaser);

              for (const test of sample.tests) {

                // create a test case for each test
                it(test.description, function () {

                  // if the generated schema is equal to the source, then validation should pass
                  verifyEqual(phaser, sample);

                  // explicit validation
                  //validate(phaser, sample, test);

                });
              }
            } catch (err) {
              // SyntaxError requires special handling with Mocha
              if (err.name == 'SyntaxError') {
                console.log(err);
              }
              throw err;
            }

          });
        });
      }
    });
  }

});

/**
 * To help with debugging, dump a file with the parsed AST and generated schema
 * @param {string} dir - The directory representing the current test case
 * @param {object} validator - Phase instance
 */
function dumpDebug(dir, validator) {
  if (validator.ast && validator.schema) {
    let data = {
      ast: validator.ast,
      schema: validator.schema
    }
    writeFileSync(join(dir, 'dump.json'), JSON.stringify(data, null, 2));
  }
}

/**
 * Helper function for ValidationError
 */
function dumpStr(msg, validator, sample, test, result) {
  let lines = [];

  function prn() {
    lines.push(format.apply(null, arguments));
  }

  prn('\n%s: %s', msg, sample.description);
  prn(sample.filepath);
  if (test) {
    prn('test description: %s =>', test.description);
    prn(test.data);
  }
  if (result) {
    prn('\n%s', 'result =>');
    prn(result);
  }
  if (test && test.errors && test.errors.length) {
    prn('\nerrors (%d)', test.errors.length);
    prn(test.errors);
  }
  prn('\n%s', 'Validator State =>');
  prn(validator);

  return lines.join('\n');
}

/**
 * Provide better error info than AssertionError when comparing validation result against expected
 */
function ValidationError(validator, sample, test, result) {
  this.name = 'ValidationError';

  let message;

  // it should have passed if test.valid is true
  if (test.valid && !result.valid) {
    message = dumpStr('expected to pass', validator, sample, test, result);
  } else {
    message = dumpStr('expected to fail', validator, sample, test);
  }

  this.message = message;
}

inherits(ValidationError, Error);

/**
 * Validate the test data using the generated schema
 */
function validate(validator, sample, test) {
  const result = validator.validate(test.data);

  if (test.valid != result.valid) {
    throw new ValidationError(validator, sample, test, result);
  }
}

/**
 * Provide better error info than AssertionError when comparing generated schema against test suite schema
 */
function VerificationError(validator, sample) {
  this.name = 'VerificationError';
  this.message = dump('generated schema does not match original', validator, sample);
}

inherits(VerificationError, Error);

/**
 * Verify that the generated schema is identical to the test suite schema
 */
function verifyEqual(validator, sample) {
  if (!isEqual(validator.schema, sample.jsonSchema)) {
    throw new VerificationError(validator, sample);
  }
}

