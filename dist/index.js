"use strict";

var _createClass = require("babel-runtime/helpers/create-class")["default"];

var _classCallCheck = require("babel-runtime/helpers/class-call-check")["default"];

var _Object$defineProperty = require("babel-runtime/core-js/object/define-property")["default"];

_Object$defineProperty(exports, "__esModule", {
  value: true
});

var Phase = (function () {
  function Phase(text, options) {
    _classCallCheck(this, Phase);

    this.text = text;
    if (options) {
      this.file = options.file;
    }

    this.parse(text);
  }

  _createClass(Phase, [{
    key: "parse",
    value: function parse() {}
  }, {
    key: "validate",
    value: function validate(obj) {
      return {};
      return { errors: [] };
    }
  }]);

  return Phase;
})();

exports.Phase = Phase;
//# sourceMappingURL=index.js.map