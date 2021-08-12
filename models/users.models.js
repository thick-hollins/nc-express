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

exports.selectLikes = async (username) => {
  await checkExists(db, 'users', 'username', username)
  const likes = await db
    .query(`
      SELECT 
        articles.article_id,
        articles.title,
        articles.votes,
        articles.topic,
        articles.author,
        articles.created_at,
        articles.body 
      FROM 
        users
      JOIN
        article_votes
      ON
        users.username = article_votes.username
      JOIN
        articles
      ON
        articles.article_id = article_votes.article_id
      WHERE
        users.username = $1
        AND
          article_votes.up = true
      ;`, [username])
  return likes.rows;
}

exports.updateUser = async (currentUsername, reqBody, appUser) => {
  const {
    username, 
    name, 
    avatar_url, 
    admin, 
    password
  } = reqBody
  if (!username && !name && !avatar_url && admin === undefined && !password) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  await checkExists(db, 'users', 'username', currentUsername)
  if (!appUser.admin && (currentUsername !== appUser.username || admin)) {
    return Promise.reject({status: 401, msg: 'Unauthorised'})
  }
  let salt
  let hash
  if (password) {
    salt = generateSalt()
    hash = hashPassword(password, salt)
  }
  let toSet = [
    ['username', username], 
    ['name', name], 
    ['avatar_url', avatar_url], 
    ['admin', admin], 
    ['salt', salt], 
    ['hash', hash]]
    .filter(pair => pair[1])
    .map(pair => `${pair[0]} = ${f.literal(pair[1])}`)
    .join(',')

  const user = await db
    .query(`
      UPDATE users
      SET 
      ${toSet}
      WHERE username = ${f.literal(currentUsername)}
      RETURNING username, name, avatar_url, admin;
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
  if (!username || !name || !avatar_url || !password) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
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
  if (!username || !password) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
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