import { format } from 'util';
import { Phase } from '../../lib/phase';
import { isEqual } from '../helpers';

const options = {
  no_transform: true
};

const parse = function (text) {
  return Phase.parse(text, options).ast;
};

const test = function (descr, input, expected) {
  if (arguments.length < 3) {
    expected = input;
    input = descr;
  }
  ;

  it('should parse ' + descr, function () {
        var ast = parse(input);

        if (Array.isArray(expected)) {

          function toArray(a) {
            return a.tag
                ? Array.isArray(a.value)
                ? a.value.map(function (e) { return toArray(e); })
                : a.value
                : a;
          }

          var values = toArray(ast);
          if (isEqual(values, expected)) return;
          throw new Error(format('Expected \n%j\nActual\n%j\n', expected, values));

        } else if (typeof expected == 'object') {

          if (ast.tag == 'object') {

            function toObject(ast) {
              var o = {};
              Object.keys(ast.value).forEach(function (key) {
                o[key] = ast.value[key].value;
              });
              return o;
            }

            var o = toObject(ast);
            if (isEqual(o, expected)) return;
            throw new Error(format('Expected \n%j\nActual\n%j\n', expected, o));

          } else {


            if (isEqual(ast, expected)) return;
            throw new Error(format('Expected \n%j\nActual\n%j\n', expected, ast));
          }

        }
        else {

          if (ast.value === expected) return;
          throw new Error(format('Expected \n%j\nActual\n%j\n', expected, ast.value));
        }
      }
  )
  ;
};

describe('null and undefined literals', function () {

  // TODO: null is tricky!
  // it can be both a type specifier in json schema
  // as well as a literal when used in an argument list.
  // We want to test as a literal, but we're not ready
  // yet to test more advanced syntax like an
  // annotation with arguments
  /*
  test('null', {
    tag: 'null',
    type: 'object',
    text: 'null',
    value: null
  });
  */

  test('undefined', {
    tag: 'undefined',
    type: 'undefined',
    text: 'undefined',
    value: undefined
  });

});

describe('boolean literals', function () {

  test("false", {
    tag: 'boolean',
    type: 'boolean',
    text: 'false',
    value: false
  });

  test('true', {
    tag: 'boolean',
    type: 'boolean',
    text: 'true',
    value: true
  });

});

describe('string literals', function () {

  test("'hello'", {
    tag: 'string',
    type: 'string',
    text: "'hello'",
    value: 'hello'
  });

  test('"hello"', "hello");
  test('""', "");
  test("''", "");

  test("'\\t'", "'\t'", "\t");
  test("'\\r\\n'", "'\r\n'", "\r\n");

  // troublemakers:
  test("'\\'", "'\\'", "\\");
  test('"don\'t"', "don't");
  test('"don\'t"', "don\'t");

  // TODO worst troublemaker - cannot pass
  // test("'don\'t'", "don\'t");

});

describe('numbers', function () {

  describe('integer literals', function () {
    test('1', {
      tag: 'number',
      type: 'number',
      format: 'integer',
      text: '1',
      value: 1
    });

    test('+1', {
      tag: 'number',
      type: 'number',
      format: 'integer',
      text: '+1',
      value: 1
    });

    test('-1', {
      tag: 'number',
      type: 'number',
      format: 'integer',
      text: '-1',
      value: -1
    });

    test('1234567890', 1234567890);
    test('-23', -23);

    test('011 as octal', '011', {
      tag: 'number',
      type: 'number',
      format: 'integer',
      text: '011',
      value: 9
    });

    test('010', 8);
    test('01', 1);
    test('-012', -10);

    test('0x11 as hexadecimal', '0x11', {
      tag: 'number',
      type: 'number',
      format: 'integer',
      text: '0x11',
      value: 17
    });

    test('0XFF as hexadecimal', '0XFF', 255);
    test('-0XFF as hexadecimal', '-0XFF', -255);
  });


  describe('float literals', function () {

    test('0.1', {
      tag: 'number',
      type: 'number',
      format: 'float',
      text: '0.1',
      value: 0.1
    });

    test('1.2E-3', {
      tag: 'number',
      type: 'number',
      format: 'float',
      text: '1.2E-3',
      value: 1.2E-3
    });

    test('.3', 0.3);
    test('-.3', -0.3);
    test('1.2e3', 1.2e3);
    test('1.2E-3', 1.2E-3);
    test('-12.12E-1', -12.12E-1);
    test('-12.12E-1234', -12.12E-1234);
    test('-12.12E1234', -12.12E1234);
    test('-12.12E-1', {
      tag: 'number',
      type: 'number',
      format: 'float',
      text: '-12.12E-1',
      value: -12.12E-1
    });

  });

});

describe('object literals', function () {

  test('{ "foo" : "bar" }', { foo: 'bar' });

});

describe('array literals', function () {

  test("[1]", {
    tag: 'array',
    type: 'object',
    text: "[1]",
    value: [{
      tag: 'number',
      type: 'number',
      format: 'integer',
      text: '1',
      value: 1
    }]
  });

  test("[1]", [1]);
  test("[ 1, 2.0, 'three', false, true ]", [1, 2.0, 'three', false, true]);
  test("[undefined, null]", [undefined, null]);
  test("[ 1, 2, [3,4] ]", [1, 2, [3, 4]]);
  test("[ [ [1, 2], [3, 4] ], [ 5, 6 ] ]", [[[1, 2], [3, 4]], [5, 6]]);

});

