describe('core parser tests', function() {
  describe.skip('literal tests', function() {
    require('./literals/test');
  });

  describe('grammar tests', function() {
    require('./grammar/test');
  });
});

describe('schema parser tests', function() {
  describe.only('core tests', function() {
    require('./schema/core/test');
  });

  describe('standard schema test suite', function() {
    require('./schema/standard-testsuite/test');
  });
});

