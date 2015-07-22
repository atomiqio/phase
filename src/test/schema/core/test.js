import { format } from 'util';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { Phase } from '../../../lib/phase';
import { isEqual } from '../../helpers';
import assert from 'assert';

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

function test(phase, test) {
  let errMsg;

  try {
    const result = phase.validate(test.data);
    errMsg = dump(phase, test, result);
    assert(result.valid, test.valid, errMsg);
  } catch (err) {
    console.log('\n================================');
    console.log('Error: %s', err.message);
    dump(phase, test);
    console.log('\n---------------------------------');
    throw err;
  }
}

function dump(phase, test, result) {
  console.log('================================');
  console.log('parser:');
  console.log(phase);
  console.log('---------------------------------');
  console.log('test case:');
  console.log(test);
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
        test(phase, t);
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

