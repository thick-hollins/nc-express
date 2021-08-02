exports.formatValues = (arrayOfObjects, cols) => {
    return arrayOfObjects.map(obj => {
        let values = []
        for (let col of cols) {
            values.push(obj[col])
        }
        return values
    })
}