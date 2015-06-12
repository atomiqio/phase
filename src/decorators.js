const exists = (object, property, value) => {
  if (value === undefined) {
    throw new Error(`property: ${property} should exist`);
  }
};

export const string = (target, name, descriptor) => {
  target._validators = target._validators || {};
  target._validators[name] = target._validators[name] || [exists];
  target._validators[name].push((object, property, value) => {
    if (typeof value !== 'string') {
      throw new Error(`property: ${property} should be a string, got a ${typeof value}`);
    } 
  });
};

export const enumerated = values => 
  (target, name, descriptor) => {
    target._validators = target._validators || {};
    target._validators[name] = target._validators[name] || [exists];
    target._validators[name].push((object, property, value) => values.includes(value));
  };
