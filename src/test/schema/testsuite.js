import { draft4 } from 'json-schema-test-suite';
import { join } from 'path';
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';

const testsuite = draft4();


module.exports = {
  generate: generate,
  load: load,
  tests: testsuite
};


// note the source test suite is not prettified, but it can be helpful
function stringify(json, spaces) {
  return JSON.stringify(json, null, spaces);
}

/**
 * This function generates a set of directories that correspond to the JSON Schema Test Suite
 * for draft 4. Each directory in the test suite directory is named after the test group;
 * each subdirectory of a test group corresponds to a test group schema. The name of the
 * subdirectory corresponds to the name of the schema description, including punctionation,
 * except that spaces are replaced with tildes ('~').
 * Each directory will have a file in it named schema.json that contains the original
 * schema from the test suite for comparison.
 *
 * @param dir - the target directory to create the test suite structure. If the directory
 *        doesn't exist, it will be created.
 */
function generate(dir) {
  makeDir(dir);

  testsuite.forEach(group => {
    const groupDir = createDir(dir, group.name);

    group.schemas.forEach(schema => {
      const name = schema.description.replace(/[ ]/g, '~');
      const schemaPath = createDir(groupDir, name, ' - ');
      writeFileSync(join(schemaPath, 'schema.json'), stringify(schema.schema, 2));
      writeFileSync(join(schemaPath, 'tests.json'), stringify(schema.tests, 2));
    });
  });

}

function createDir(dir, name, prefix) {
  const result = makeDir(join(dir, name), prefix);
  if (result.created) {
    console.log('%s%s', prefix || '', name);
  }
  return result.dir;
}

function makeDir(dir) {
  try {
    mkdirSync(dir);
    return {
      created: true,
      dir: dir
    }
  } catch (err) {
    if (err.code != 'EEXIST') throw err;
    return {
      created: false,
      dir: dir
    }
  }
}

/*
 testsuite/
   additionalItems/
     additionalItems-are-allowed-by-default/
       schema.json
     additionalItems-as-false-without-items/
       schema.json
     addtionalItems-as-schema/
       schema.json
     array-of-items-with-no-additionalItems/
       schema.json
     items-is-schema,-no-additionalItems/
       schema.json
     additionalProperties/
     additionalProperties-are-allowed-by-default/
       schema.json
     additionalProperties-allows-a-schema-which-should-validate/
       schema.json
     additionalProperties-are-allowed-by-default/
       schema.json
     additionalProperties-being-false-does-not-allow-other-properties/
       schema.json
   additionalProperties-can-exist-by-itself/
     schema.json
   ...
 */
/**
 * Walk the test suite structure and yield each schema along with associated JSON tests.
 *
 */
function* load(dir, ext) {
  const groups = readdirSync(dir);

  // each group corresponds to the test group name from the test suite
  for (const group of groups) {
    const groupPath = join(dir, group);

    // each schemaDir corresponds to the test suite schema description
    const schemaDirs = readdirSync(groupPath);
    for (const schemaDir of schemaDirs) {
      const schemaPath = join(groupPath, schemaDir);
      //const schemaFile = readdirSync(schemaPath).filter(f => f.endsWith(ext))[0];
      const schemaFile = readdirSync(schemaPath).filter(f => f.endsWith('schema' + ext))[0];
      if (!schemaFile) continue;

      const schemaFilePath = join(schemaPath, schemaFile);
      const schema = readFileSync(schemaFilePath, 'utf8');

      // add the original JSON schema file for reference
      const jsonSchemaFile = readdirSync(schemaPath).filter(f => f == 'schema.json')[0];
      let jsonSchema;
      if (jsonSchemaFile) {
	jsonSchema = JSON.parse(readFileSync(join(schemaPath, jsonSchemaFile), 'utf8'));
      }

      // restore spaces to get actual description from test suite
      const description = schemaDir.replace(/[~]/g, ' ');

      const tests = testsuite
          .filter(testgroup => testgroup.name == group)
          .map(testgroup => testgroup.schemas)[0]
          .filter(schema => schema.description == description)
          .map(schema => schema.tests)[0];

      yield {
        schema: schema,
	jsonSchema: jsonSchema,
        description: description,
        filename: schemaFile,
        filepath: schemaFilePath,
        group: group,
        tests: tests
      };
    }
  }
}
