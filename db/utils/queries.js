const db = require("../connection.js");
const f = require('pg-format')

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

exports.checkExists = async (table, column, value) => {
    const { rows } = await db.query(
        f('SELECT * FROM %I WHERE %I = %L;', table, column, value))
    if (!rows.length) {
        return Promise.reject({ status: 404, msg: 'Resource not found' })
    }
}