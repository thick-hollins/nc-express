exports.formatValues = (arrayOfObjects, cols) => {
  return arrayOfObjects.map((obj) => {
    let values = [];
    for (let col of cols) {
      values.push(obj[col]);
    }
    return values;
  });
};

exports.makeLookup = (arr, key, value) => {
  let lookup = {};
  arr.forEach((obj) => {
    lookup[obj[key]] = obj[value];
  });
  return lookup;
};
exports.updateKeyValue = (arr, keyToChange, newKey, lookup) => {
  return arr.map((obj) => {
    let copy = { ...obj };
    delete copy[keyToChange];
    copy[newKey] = lookup[obj[keyToChange]];
    return copy;
  });
};

exports.renameKeys = (arr, keyToChange, newKey) => {
  return arr.map((obj) => {
    let copy = { ...obj };
    delete copy[keyToChange];
    copy[newKey] = obj[keyToChange];
    return copy;
  });
};
