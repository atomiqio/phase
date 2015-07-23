describe('core parser tests', function() {
  describe('literal tests', function() {
    require('./literals/test');
  });

  describe('grammar tests', function() {
    require('./grammar/test');
  });
});

describe('schema parser tests', function() {
  describe('core tests', function() {
    require('./schema/core/test');
  });

  describe.skip('standard schema test suite', function() {
    require('./schema/standard-testsuite/test');
  });
});

