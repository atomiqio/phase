'use strict';

var _regeneratorRuntime = require('babel-runtime/regenerator')['default'];

var _getIterator = require('babel-runtime/core-js/get-iterator')['default'];

var marked0$0 = [loadSamples, loadSample].map(_regeneratorRuntime.mark);
var promisify = require('@atomiq/promisify');
var assert = require('assert');
var path = require('path');
var fs = promisify(require('fs'));
var samplesPath = path.join(__dirname, './samples');
var Phase = require('..').Phase;

/*

  samples/
    sample-01/
      only-1-per-directory.phase
        pass/
	  sample1.json
	  sample2.json
	fail/
	  sample3.json
	  sample4.json
    sample-02/
      ...

*/

function loadSamples() {
  var samples, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, sample, samplePath, phaseName, phasePath, phase, _arr, _i, testType, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, test;

  return _regeneratorRuntime.wrap(function loadSamples$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        samples = fs.readdirSync(samplesPath);
        _iteratorNormalCompletion = true;
        _didIteratorError = false;
        _iteratorError = undefined;
        context$1$0.prev = 4;
        _iterator = _getIterator(samples);

      case 6:
        if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
          context$1$0.next = 51;
          break;
        }

        sample = _step.value;
        samplePath = path.join(samplesPath, sample);
        phaseName = fs.readdirSync(samplePath).filter(function (f) {
          return f.endsWith('.phase');
        })[0];

        if (phaseName) {
          context$1$0.next = 12;
          break;
        }

        return context$1$0.abrupt('continue', 48);

      case 12:
        phasePath = path.join(samplePath, phaseName);
        phase = fs.readFileSync(phasePath, 'utf8');
        sample = { path: samplePath, name: sample, phase: { phasePath: phasePath, text: phase } };
        _arr = ['pass', 'fail'];
        _i = 0;

      case 17:
        if (!(_i < _arr.length)) {
          context$1$0.next = 48;
          break;
        }

        testType = _arr[_i];
        _iteratorNormalCompletion2 = true;
        _didIteratorError2 = false;
        _iteratorError2 = undefined;
        context$1$0.prev = 22;
        _iterator2 = _getIterator(loadSample(sample, testType));

      case 24:
        if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
          context$1$0.next = 31;
          break;
        }

        test = _step2.value;
        context$1$0.next = 28;
        return { path: samplePath, name: sample, phase: { phasePath: phasePath, text: phase }, test: test };

      case 28:
        _iteratorNormalCompletion2 = true;
        context$1$0.next = 24;
        break;

      case 31:
        context$1$0.next = 37;
        break;

      case 33:
        context$1$0.prev = 33;
        context$1$0.t0 = context$1$0['catch'](22);
        _didIteratorError2 = true;
        _iteratorError2 = context$1$0.t0;

      case 37:
        context$1$0.prev = 37;
        context$1$0.prev = 38;

        if (!_iteratorNormalCompletion2 && _iterator2['return']) {
          _iterator2['return']();
        }

      case 40:
        context$1$0.prev = 40;

        if (!_didIteratorError2) {
          context$1$0.next = 43;
          break;
        }

        throw _iteratorError2;

      case 43:
        return context$1$0.finish(40);

      case 44:
        return context$1$0.finish(37);

      case 45:
        _i++;
        context$1$0.next = 17;
        break;

      case 48:
        _iteratorNormalCompletion = true;
        context$1$0.next = 6;
        break;

      case 51:
        context$1$0.next = 57;
        break;

      case 53:
        context$1$0.prev = 53;
        context$1$0.t1 = context$1$0['catch'](4);
        _didIteratorError = true;
        _iteratorError = context$1$0.t1;

      case 57:
        context$1$0.prev = 57;
        context$1$0.prev = 58;

        if (!_iteratorNormalCompletion && _iterator['return']) {
          _iterator['return']();
        }

      case 60:
        context$1$0.prev = 60;

        if (!_didIteratorError) {
          context$1$0.next = 63;
          break;
        }

        throw _iteratorError;

      case 63:
        return context$1$0.finish(60);

      case 64:
        return context$1$0.finish(57);

      case 65:
        ;

      case 66:
      case 'end':
        return context$1$0.stop();
    }
  }, marked0$0[0], this, [[4, 53, 57, 65], [22, 33, 37, 45], [38,, 40, 44], [58,, 60, 64]]);
}

function loadSample(sample, testType) {
  var testTypePath, tests, _iteratorNormalCompletion3, _didIteratorError3, _iteratorError3, _iterator3, _step3, test, testPath, testData;

  return _regeneratorRuntime.wrap(function loadSample$(context$1$0) {
    while (1) switch (context$1$0.prev = context$1$0.next) {
      case 0:
        testTypePath = path.join(sample.path, testType);
        tests = fs.readdirSync(testTypePath);
        _iteratorNormalCompletion3 = true;
        _didIteratorError3 = false;
        _iteratorError3 = undefined;
        context$1$0.prev = 5;
        _iterator3 = _getIterator(tests);

      case 7:
        if (_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done) {
          context$1$0.next = 16;
          break;
        }

        test = _step3.value;
        testPath = path.join(testTypePath, test);
        testData = JSON.parse(fs.readFileSync(testPath, 'utf8'));
        context$1$0.next = 13;
        return { path: testPath, testType: testType, name: test, data: testData };

      case 13:
        _iteratorNormalCompletion3 = true;
        context$1$0.next = 7;
        break;

      case 16:
        context$1$0.next = 22;
        break;

      case 18:
        context$1$0.prev = 18;
        context$1$0.t0 = context$1$0['catch'](5);
        _didIteratorError3 = true;
        _iteratorError3 = context$1$0.t0;

      case 22:
        context$1$0.prev = 22;
        context$1$0.prev = 23;

        if (!_iteratorNormalCompletion3 && _iterator3['return']) {
          _iterator3['return']();
        }

      case 25:
        context$1$0.prev = 25;

        if (!_didIteratorError3) {
          context$1$0.next = 28;
          break;
        }

        throw _iteratorError3;

      case 28:
        return context$1$0.finish(25);

      case 29:
        return context$1$0.finish(22);

      case 30:
      case 'end':
        return context$1$0.stop();
    }
  }, marked0$0[1], this, [[5, 18, 22, 30], [23,, 25, 29]]);
}

var _iteratorNormalCompletion4 = true;
var _didIteratorError4 = false;
var _iteratorError4 = undefined;

try {
  var _loop = function () {
    var sample = _step4.value;

    it(sample.test.name, function () {
      console.log(sample.test.name);
      console.log(sample.test.data);
      var phase = new Phase(sample.phase.text, { file: sample.phase.phasePath });

      var shouldPass = sample.test.testType == 'pass';
      var result = phase.validate(sample.test.data);

      if (shouldPass) {
        console.log('should pass');
        assert(!result.errors, 'test was expected to pass!');
      } else {
        console.log('should fail');
        assert(result.errors, 'test was expected to fail!');
      }
    });
  };

  for (var _iterator4 = _getIterator(loadSamples()), _step4; !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done); _iteratorNormalCompletion4 = true) {
    _loop();
  }
} catch (err) {
  _didIteratorError4 = true;
  _iteratorError4 = err;
} finally {
  try {
    if (!_iteratorNormalCompletion4 && _iterator4['return']) {
      _iterator4['return']();
    }
  } finally {
    if (_didIteratorError4) {
      throw _iteratorError4;
    }
  }
}
//# sourceMappingURL=../test/test.js.map