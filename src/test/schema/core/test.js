import { format } from 'util';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { Phase } from '../../../lib/phase';
import { isEqual } from '../../helpers';
import assert from 'assert';
import chalk from 'chalk';

const error = chalk.red;

const options = {
  //no_transform: true
};

const parse = function (text) {
  return Phase.parse(text, options);
};

function testcase(description, data, valid) {
  return {
    description: description,
    data: data,
    valid: valid
  };
}

function sample(description, schema) {
  return {
    description: description,
    schema: schema,
    tests: Array.prototype.slice.call(arguments, 2)
  };
}

function test(phase, sample, test) {
  let errMsg;

  try {
    const result = phase.validate(test.data);
    errMsg = dump(phase, sample, test, result);
    assert(result.valid, test.valid, errMsg);
  } catch (err) {
    console.log('================================');
    console.log(error('uncaught error! %s'), err.message);
    dump(phase, sample, test);
    console.log('---------------------------------');
    throw err;
  }
}

function stringify(data) {
  return JSON.stringify(data, null, 2);
}

function dump(phase, sample, test, result) {
  console.log('================================');
  console.log('[X] %s', sample.description);
  console.log('failed test case:');
  console.log('  descr: %s', test.description);
  console.log('  data:  %j', test.data);
  console.log('expected result: %s', test.valid);
  console.log('---------------------------------');
  console.log('parser input (phase schema):')
  console.log(stringify(phase.raw));
  console.log('parser output (json schema):');
  console.log(stringify(phase.schema));
  console.log('ast:')
  console.log(stringify(phase.ast));
  if (result) {
    console.log('---------------------------------');
    console.log('result:');
    console.log(result);
  }
}

samples().forEach(sample => {

  describe(sample.description, () => {
    const phase = parse(sample.schema);
    sample.tests && sample.tests.forEach(t => {
      it(t.description, function () {
        test(phase, sample, t);
      });
    });
  });

});

// TODO: add more samples!
function samples() { return [

    // the following tests fail since an empty Phase schema is getting
    // parsed as an empty string '', which is then transformed to an
    // undefined (an invalid JSON Schema) ...
  sample('match anything', "''",
      testcase('empty string', '""', true),
      testcase('string', '"foo"', true),
      testcase('boolean (true)', true, true),
      testcase('boolean (false)', false, true),
      testcase('array', [], true),
      testcase('object', {}, true))

]};

