const db = require("../db/connection")

exports.selectUsers = async () => {
    const users = await db
      .query(`SELECT * FROM users;`)
    return users.rows;
}

exports.selectUser = async (username) => {
    const user = await db
      .query(`SELECT * FROM users WHERE username = $1;`, [username])
      if (!user.rows.length) {
        return Promise.reject({status: 404, msg: 'Resource not found'})
    }
    return user.rows[0];
}