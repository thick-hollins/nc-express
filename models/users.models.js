const db = require("../db/connection")
const jwt = require('jsonwebtoken')
const f = require('pg-format')
const { checkExists } = require('../db/utils/queries')
const {generateSalt, hashPassword, validPassword} = require('../db/utils/auth')
const client = require('../db/redis-connection')
const comments = require("../db/data/test-data/comments")

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

exports.selectLikes = async (username, { liketype }) => {
  await checkExists(db, 'users', 'username', username)
  if (liketype) if (!['articles', 'comments'].includes(liketype)) {
    return Promise.reject({status: 400, msg: 'Bad request - invalid query'})
  }
  let articleLikes = []
  if (!liketype || liketype === 'articles') {
    articleLikes = await db
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
        ORDER BY
          articles.created_at DESC;
        ;`, [username])
  }
  let commentLikes = []
  if (!liketype || liketype === 'comments') {
    commentLikes = await db
    .query(`
      SELECT 
        comments.comment_id,
        comments.author,
        comments.article_id,
        comments.votes,
        comments.created_at,
        comments.body 
      FROM 
        users
      JOIN
        comment_votes
      ON
        users.username = comment_votes.username
      JOIN
        comments
      ON
        comments.comment_id = comment_votes.comment_id
      WHERE
        users.username = $1
      ORDER BY
        comments.created_at DESC;
      ;`, [username])
  }
  if (liketype && liketype === 'comments') return {comments: commentLikes.rows}
  if (liketype && liketype === 'articles') return {articles: articleLikes.rows}
  else return {articles: articleLikes.rows, comments: commentLikes.rows}
}

exports.updateUser = async (currentUsername, reqBody, token) => {
  const appUser = jwt.decode(token)
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
  if (username || password) {
    client.setex(currentUsername, 3600, Date.now())
  }
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
    const accessToken = jwt.sign({ username, admin, iat: Date.now() }, process.env.JWT_SECRET, {expiresIn: '3 years'})
    return { accessToken }
  }
}

exports.logout = async (token) => {
  const { username, exp } = jwt.decode(token)
  client.setex(username, exp, Date.now())

  return
}