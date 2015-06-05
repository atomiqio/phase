import promisify from '@atomiq/promisify';
import assert from 'assert';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import {Phase} from '..';

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

function* loadSamples() {
  const samples = readdirSync(samplesPath);
  for (const sample of samples) {
    let samplePath = join(samplesPath, sample);
    let phaseName = readdirSync(samplePath).filter(f => f.endsWith('.phase'))[0];
    if (!phaseName) continue;

    let phasePath = join(samplePath, phaseName);
    let phase = readFileSync(phasePath, 'utf8');
    let s = { path: samplePath, name: sample, phase: { phasePath: phasePath, text: phase } };

    for (let testType of ['pass', 'fail']) {
      for (let test of loadSample(s, testType)) {
        yield { path: samplePath, name: sample, phase: { phasePath: phasePath, text: phase }, test: test };
      }
    }
  };
}

function* loadSample(sample, testType) {
  let testTypePath = join(sample.path, testType);
  let tests = readdirSync(testTypePath);
  for (let test of tests) {
    let testPath = join(testTypePath, test);
    let testData = JSON.parse(readFileSync(testPath, 'utf8'));
    yield { path: testPath, testType: testType, name: test, data: testData };
  }
}



for (let sample of loadSamples()) {

  it (sample.test.name, () => {
    console.log(sample.test.name);
    console.log(sample.test.data);
    let phase = new Phase(sample.phase.text, { file: sample.phase.phasePath });

    let shouldPass = sample.test.testType == 'pass';
    let result = phase.validate(sample.test.data);

    if (shouldPass) {
      console.log('should pass');
      assert(!result.errors, 'test was expected to pass!');
    } else {
      console.log('should fail');
      assert(result.errors, 'test was expected to fail!');
    }

  });

}

