exports.formatValues = (arrayOfObjects, cols) => {
    return arrayOfObjects.map(obj => {
        let values = []
        for (let col of cols) {
            values.push(obj[col])
        }
        return values
    })
}

exports.formatDate = (date) => {
    const dateObj = new Date(date)
    return `${dateObj.toISOString()}`
}