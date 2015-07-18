describe('core parser tests', function() {
  describe.skip('literal tests', function() {
    require('./literals/test');
  });

  describe('grammar tests', function() {
    require('./grammar/test');
  });
});

describe.only('schema parser tests', function() {
  require('./schema/test');
});

