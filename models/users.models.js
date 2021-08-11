const db = require("../db/connection")
const jwt = require('jsonwebtoken')
const f = require('pg-format')
const { checkExists } = require('../db/utils/queries')
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

exports.updateUser = async (currentUsername, {username, name, avatar_url}) => {
  await checkExists(db, 'users', 'username', currentUsername)
  if (!username && !name && !avatar_url) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  const user = await db
    .query(`
      UPDATE users
      ${username? 'SET username =' + f.literal(username): ''}
      ${name? 'SET name = ' + f.literal(name): ''}
      ${avatar_url? 'SET body = ' + f.literal(avatar_url): ''}
      WHERE username = ${f.literal(currentUsername)}
      RETURNING *;
      ;`)
  return user.rows[0]
}

exports.insertUser = async ({ username, name, avatar_url, password }) => {
  const unique = await db
    .query(`
    SELECT * FROM users WHERE username = $1
    `, [username])
    if (unique.rows.length) {
      return Promise.reject({status: 400, msg: 'Username is taken'})
    }
  const salt = generateSalt()
  const hash = hashPassword(password, salt)
  const user = await db
    .query(`
      INSERT INTO users
        (username, name, avatar_url, hash, salt)
      VALUES
        ($1, $2, $3, $4, $5)
      RETURNING username, name, avatar_url;
    `, [username, name, avatar_url, hash, salt])
  return user.rows[0]
}

exports.login = async ({ username, password }) => {
  const user = await db
    .query(`SELECT * FROM users WHERE username = $1;`, [username])
  if (!user.rows.length) {
    return Promise.reject({status: 400, msg: 'User not found'})
  }

  const { salt, hash, admin } = user.rows[0]
  if (!validPassword(password, hash, salt)) {
    return Promise.reject({status: 400, msg: 'Incorrect password'})
  } else {
    const accessToken = jwt.sign({ username, admin }, process.env.JWT_SECRET)
    return { accessToken }
  }
}