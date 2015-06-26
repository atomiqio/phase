

export class Phase {

  constructor(text, options) {
    this.text = text;
    if (options) {
      this.file = options.file;
    }

    this.parse(text);
  }
  
  parse() {
  }

  validate(obj) {
    return {};
    return { errors: [] };
  }

}


