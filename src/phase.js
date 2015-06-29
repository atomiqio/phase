

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
    throw new Error('not implemented');
    return { valid: false, errors: [ 'not implemented' ] };
  }

}


