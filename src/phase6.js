import { transform } from 'babel';

export class Phase6 {

  constructor(text, {file} = {}) {
    Object.assign(this, { text, file });
    this.parse();
  }
  
  parse() {
    this.code = transform(`import { string } from './decorators';
      ${this.text}`, { stage: 1 }).code;
    try {
      const exports = {};
      this.validators = eval(this.code).prototype._validators;
    } catch (e) {
      console.error('Error creating validators');
      console.error(e.stack);
    }
  }

  validate(obj) {
    const errors = [];
    for (const property in obj) {
      if (obj.hasOwnProperty(property)) {
        if (!this.validators[property]) {
          errors.push(new Error(`Unknown property: ${property}, value: ${obj[property]}`));
        } else {
          for (const validator of this.validators[property]) {
            try {
              validator(obj, property, obj[property]);
            } catch (error) {
              errors.push(error);
            }
          }
        }
      }
    }
    if (errors.length) {
      return { errors };
    }
    return {};
  }

}
