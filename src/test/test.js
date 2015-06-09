import promisify from '@atomiq/promisify';
import assert from 'assert';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import tv4 from 'tv4';
import ZSchema from 'z-schema';
import { Phase } from '..';

const prn = console.log;

const samplesPath = join(__dirname, './samples');
/*

  samples/
    sample-01/
      only-1-per-directory-canonical.schema.json
      only-1-per-directory.phase
      only-1-per-directory.phase6
        pass/
	  sample1.json
	  sample2.json
	fail/
	  sample3.json
	  sample4.json
    sample-02/
      ...

*/

// As we process both phase and phase6 schemas, we will want to compare against canonical
// JSON Schemas. We will also want to ensure that the sample JSON files we use for testing
// phase/phase6 schemas actually pass canonical JSON Schema tests (thus ensuring we are
// actually using good test samples).
//
// For testing, will compare with both tv4 and z-schema (which swagger uses)

const tv4SchemaFactory = (text, options) => {
  const schema = JSON.parse(text);

  return {
    validate: json => {
      const valid = tv4.validate(json, schema);
      return valid ? {} : { errors: [ valid ] };
    }
  }
};

const zSchemaOptions = {};
const zSchemaFactory = (text, options) => {
  const validator = new ZSchema(zSchemaOptions);
  const schema = JSON.parse(text);

  return {
    validate: json => {
      const valid = validator.validate(json, schema);
      const errors = validator.getLastErrors();
      prn('valid: ', valid);
      return valid ? {} : { errors };
    }
  };
};


// PLACEHOLDER FOR HENRY'S PHASE6 UNTIL WE CAN IMPORT
const Phase6 = () => {
  return { validate: () => { throw new Error('not implemented yet'); }};
};



// for a factory, text is the schema to parse and options should include at least a file property with the path to the schema
const schemaTypes = [
  { name: 'tv4-schema', factory: (text, options) => tv4SchemaFactory(text, options), ext: '.schema.json', skip: process.env.SKIP_TV4_SCHEMA },
  { name: 'z-schema', factory: (text, options) => zSchemaFactory(text, options), ext: '.schema.json', skip: process.env.SKIP_Z_SCHEMA },
  { name: 'phase', factory: (text, options) => { return new Phase(text, options); }, ext: '.phase', skip: process.env.SKIP_PHASE },
  { name: 'phase6', factory: (text, options) => { return new Phase6(tect, options); }, ext: '.phase6', skip: process.env.SKIP_PHASE6 }
];



function* loadSamples(ext) {
  const samples = readdirSync(samplesPath);
  for (const sample of samples) {
    const samplePath = join(samplesPath, sample);
    const schemaFile = readdirSync(samplePath).filter(f => f.endsWith(ext))[0];
    if (!schemaFile) continue;

    const schemaPath = join(samplePath, schemaFile);
    const schema = readFileSync(schemaPath, 'utf8');
    const s = { path: samplePath, name: sample, schema: { schemaPath: schemaPath, text: schema } };

    for (const testType of ['pass', 'fail']) {
      for (const test of loadSample(s, testType)) {
        yield { path: samplePath, name: sample, schema: { schemaPath: schemaPath, text: schema }, test: test };
      }
    }
  }
}

function* loadSample(sample, testType) {
  const testTypePath = join(sample.path, testType);
  try {
    const tests = readdirSync(testTypePath);

    for (const test of tests) {
      const testPath = join(testTypePath, test);
      const testData = JSON.parse(readFileSync(testPath, 'utf8'));
      yield { path: testPath, testType: testType, name: test, data: testData };
    }
  } catch (err) {
    // ignore when the directory is missing (don't always provide pass or fail test directories)
    if (err.code != 'ENOENT') throw err;
  }
}



for (let { name, factory, ext, skip } of schemaTypes) {
  if (skip) continue;

  describe(name, () => {
    before(() => {
      // just to make the test suites a little easier to distinguish in the console
      prn('===================');
    });

    for (const sample of loadSamples(ext)) {
      const testName = sample.test.name.substring(0, sample.test.name.indexOf('.json'));

      it (testName, () => {
	prn('\n%s', testName);
	prn(sample.test.path);
	prn(sample.test.data);

	const phaser = factory(sample.schema.text, { file: sample.schema.schemaPath });

	const shouldPass = sample.test.testType == 'pass';
	const result = phaser.validate(sample.test.data);

	if (shouldPass) {
	  prn('should pass');
	  assert(!result.errors, 'test was expected to pass!');
	} else {
	  prn('should fail');
	  assert(result.errors, 'test was expected to fail!');
	}

      });
    }

  });
};

after(() => {
  prn('Summary');
  prn('===================');
});
