import promisify from '@atomiq/promisify';
import assert from 'assert';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { Phase } from '../phase';
import { Phase6 } from '../phase6';
import tv4 from 'tv4';
import ZSchema from 'z-schema';
import testSuite from './testsuite';
import { draft4 } from 'json-schema-test-suite';

const prn = console.log;

const testSuitePath = join(__dirname, './testsuite');

// As we process both phase and phase6 schemas, we will want to compare against canonical
// JSON Schemas. We will also want to ensure that the sample JSON files we use for testing
// phase/phase6 schemas actually pass canonical JSON Schema tests (thus ensuring we are
// actually using good test samples).
//
// For testing, will compare with both tv4 and z-schema (which swagger uses)

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

const zSchemaFactory = (schema, options) => {
  const zschema = new ZSchema(options);

  if (typeof schema == 'string') {
    schema = JSON.parse(schema);
  }

  return {
    validate: json => {
      try {
        var valid = zschema.validate(json, schema);
        return valid ? { valid: true } : { valid: false, errors: zschema.getLastErrors() };
      } catch (err) {
        return { valid: false, errors: [err.message] };
      }
    }
  };
};

// for a factory, schema is either a string or JSON object, and options is a validator-specific set of options to pass along
const validators = [
  { name: 'tv4-schema', factory: (schema, options) => tv4SchemaFactory(schema, options), ext: '.json', skip: process.env.SKIP_TV4_SCHEMA },
  { name: 'z-schema', factory: (schema, options) => zSchemaFactory(schema, options), ext: '.json', skip: process.env.SKIP_Z_SCHEMA },
  { name: 'phase', factory: (schema, options) => { return new Phase(schema, options); }, ext: '.phase', skip: process.env.SKIP_PHASE },
  { name: 'phase6', factory: (schema, options) => { return new Phase6(schema, options); }, ext: '.phase6', skip: process.env.SKIP_PHASE6 }
];

function dump(msg, sample, test, result) {
  prn('\n[X] %s: %s', msg, sample.description);
  prn(sample.filepath);
  prn(' -> %s', test.description);
  prn(test.data);
  prn();
  if (test.errors && test.errors.length) {
    prn('errors (%d)', test.errors.length);
    prn(test.errors);
    prn('-----------------\n');
  }
}


/**
 * Traverse the testsuite directory and yield schema objects:
 * {
 *   group: '',
 *   schema: '',
 *   description: '',
 *   filename: '',
 *   filepath: '',
 *   tests: [{
 *     description: '',
 *     data: *,
 *     valid: t|f
 *   }]
 * }
 *
 */
function* loadSamples(ext) {
  const testsuitePath = join(__dirname, 'testsuite');
  for (const sample of testSuite.load(testSuitePath, ext)) {
    yield sample;
  }
}


// TESTS

describe('validator tests', function () {

  after(() => {
    prn('===================');
    prn('Summary');
    prn('===================');
  });

  for (let { name, factory, ext, skip } of validators) {
    if (skip) continue;

    describe(name, () => {
      before(() => {
        // just to make the test suites a little easier to distinguish in the console
        prn('===================');
      });


      for (const sample of loadSamples(ext)) {

        describe(sample.group, function () {
          describe(sample.description, () => {
            const phaser = factory(sample.schema);

            for (const test of sample.tests) {
              it(test.description, function () {
                const result = phaser.validate(test.data);
                const shouldPass = test.valid;

                if (shouldPass) {
                  if (!result.valid) dump('expected to pass', sample, test, result);
                  assert(result.valid, 'test was expected to pass!');
                } else {
                  if (result.valid) dump('expected to fail', sample, test);
                  assert(!result.valid, 'test was expected to fail!');
                }

              });
            }

          });
        });
      }
    });
  }

});

