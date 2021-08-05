const db = require("../db/connection")
const jwt = require('jsonwebtoken')
const {generateSalt, hashPassword, validPassword} = require('../db/utils/auth')

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

exports.insertUser = async ({ username, name, avatar_url, password }) => {
  const salt = generateSalt()
  const hash = hashPassword(password, salt)
  const user = await db
    .query(`
      INSERT INTO users
        (username, name, avatar_url, hash, salt)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING *;
    `, [username, name, avatar_url, hash, salt])
  return user.rows[0]
}

exports.login = async ({ username, password }) => {
  const user = await db
    .query(`SELECT * FROM users WHERE username = $1;`, [username])
  if (!user.rows.length) {
    return Promise.reject({status: 400, msg: 'User not found'})
  }

  const { hash, salt } = user.rows[0]
  if (!validPassword(password, hash, salt)) {
    return Promise.reject({status: 400, msg: 'Incorrect password'})
  } else {
    const accessToken = jwt.sign({ username: username }, process.env.secret)
    console.log(accessToken)
    return { accessToken }
  }

}