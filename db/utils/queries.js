const db = require("../connection.js");
const format = require('pg-format')

exports.checkExists = async (table, column, value) => {
    const { rows } = await db.query(
        format('SELECT * FROM %I WHERE %I = %L;', table, column, value))
    if (!rows.length) {
        return Promise.reject({ status: 404, msg: 'Resource not found' })
    }
}