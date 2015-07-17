import { format } from 'util';
import { join } from 'path';
import { readdirSync, readFileSync } from 'fs';
import { Phase } from '../../lib/phase';
import { isEqual } from '../helpers';

const samplesDir = join(__dirname, './samples');

const options = {
  no_transform: true
};

// only want the ast for testing
const parse = function (text) {
  return Phase.parse(text, options).ast;
};

function* load() {
  const files = readdirSync(samplesDir);

  for (const f of files) {
    const file = join(samplesDir, f);
    const text = readFileSync(file, 'utf8');

    try {
      const ast = parse(text);
      yield {
        file: f,
        pathname: file,
        text: text,
        ast: ast
      }

    } catch (err) {
      yield {
        file: f,
        pathname: file,
        text: text,
        error: err
      }

    }
  }
}

describe('parse tests', function() {

  for (const result of load()) {

    it ('should parse ' + result.file, function() {
      if (result.error) {
        console.log(result.error);
        throw new Error(result.error.message);
      }

      console.log('\n=========================');
      console.log(JSON.stringify(result, null, 2));

    })

  }

})
