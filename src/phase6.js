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
      this.validator = eval(this.code);
    } catch (e) {
      console.error('Error creating validators');
      console.error(e.stack);
    }
  }

  validate(obj) {
    const errors = [];
    const name = this.validator.name;
    const data = obj[name];
    const validators = this.validator.prototype._validators;
    for (const property in data) {
      if (data.hasOwnProperty(property)) {
        if (!validators[property]) {
          errors.push(new Error(`Unknown property: ${property}, value: ${data[property]}`));
        } else {
          for (const validator of validators[property]) { 
           try {
              validator(data, property, data[property]);
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
