const { formatValues } = require('../db/utils/data-manipulation')

describe('orderValues', () => {
    const cols = ['c', 'b', 'a']
    const arrayOfObjects = [{a: 3, b: 2, c: 1}, {a: 1, b: 2, c: 3}]
    it('should make an array of objects into an array of arrays containing values from the object in a given order', () => {
        expect(formatValues(arrayOfObjects, cols)).toEqual([[1, 2, 3], [3, 2, 1]])
    });
    it('returned array has different reference to original array', () => {
        expect(formatValues(arrayOfObjects, cols)).not.toBe(arrayOfObjects);
    });
    it('an object in array has different reference to original object', () => {
        expect(formatValues(arrayOfObjects, cols)[0]).not.toBe(arrayOfObjects[0]);
    });
    it('original object in array is not mutated', () => {
        const original = [{a: 3, b: 2, c: 1}, {a: 1, b: 2, c: 3}]
        formatValues(original, cols)
        expect(original[0]).toEqual({a: 3, b: 2, c: 1})
        expect(original[1]).toEqual({a: 1, b: 2, c: 3})
    });
});