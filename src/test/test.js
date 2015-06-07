import promisify from '@atomiq/promisify';
import assert from 'assert';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { Phase } from '../phase';
import { Phase6 } from '../phase6';

const prn = console.log;
const schemaTypes = [
  { name: 'phase', Factory: Phase, ext: '.phase', skip: process.env.SKIP_PHASE },
  { name: 'phase6', Factory: Phase6, ext: '.phase6', skip: process.env.SKIP_PHASE6 }
];
const samplesPath = join(__dirname, './samples');
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

function* loadSamples(ext) {
  const samples = readdirSync(samplesPath);
  for (const sample of samples) {
    const samplePath = join(samplesPath, sample);
    const phaseName = readdirSync(samplePath).filter(f => f.endsWith(ext))[0];
    if (!phaseName) { continue }

    const phasePath = join(samplePath, phaseName);
    const phase = readFileSync(phasePath, 'utf8');
    const s = { path: samplePath, name: sample, phase: { phasePath: phasePath, text: phase } };

    for (const testType of ['pass', 'fail']) {
      for (const test of loadSample(s, testType)) {
        yield { path: samplePath, name: sample, phase: { phasePath: phasePath, text: phase }, test: test };
      }
    }
  }
}

function* loadSample(sample, testType) {
  const testTypePath = join(sample.path, testType);
  const tests = readdirSync(testTypePath);

  for (const test of tests) {
    const testPath = join(testTypePath, test);
    const testData = JSON.parse(readFileSync(testPath, 'utf8'));
    yield { path: testPath, testType: testType, name: test, data: testData };
  }
}



for (let { name, Factory, ext, skip } of schemaTypes) {
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

	const phaser = new Factory(sample.phase.text, { file: sample.phase.phasePath });

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
}

after(() => {
  prn('Summary');
  prn('===================');
});
