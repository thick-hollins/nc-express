exports.mapCols = (arr, cb, ...cols) => {
    return arr.map(obj => {
        let copy = { ...obj }
        for (let col of cols) {
            if (copy.hasOwnProperty(col)) {
                copy[col] = cb(copy[col])
            }
        }
        return copy
    })
}