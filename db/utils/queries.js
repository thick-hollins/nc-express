exports.mapCols = (arr, cb, ...cols) => {
    return arr.map(obj => {
        for (let col of cols) {
            obj[col] = cb(obj[col])
        }
        return obj
    })
}