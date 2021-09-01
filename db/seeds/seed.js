const db = require("../connection.js");
const f = require("pg-format");
const {
  orderValues,
  makeLookup,
  updateKeyValue,
  renameKeys,
} = require("../utils/data-manipulation")

const seed = async data => {
  const { articleData, commentData, topicData, userData } = data

  await db.query(`DROP TABLE IF EXISTS comment_votes;`)
  await db.query(`DROP TABLE IF EXISTS article_votes;`)
  await db.query(`DROP TABLE IF EXISTS comments;`)
  await db.query(`DROP TABLE IF EXISTS articles;`)
  await db.query(`DROP TABLE IF EXISTS users;`)
  await db.query(`DROP TABLE IF EXISTS topics;`)
  
  await db.query(`
    CREATE TABLE topics (
      slug VARCHAR(100) PRIMARY KEY,
      description VARCHAR(300) NOT NULL
    );`)
  
  await db.query(`
    CREATE TABLE users (
      username VARCHAR(100) PRIMARY KEY,
      avatar_url VARCHAR(230) NOT NULL,
      name VARCHAR(100) NOT NULL,
      admin BOOLEAN DEFAULT false NOT NULL, 
      hash VARCHAR(256),
      salt VARCHAR(100)
    );`)
  
  await db.query(`
    CREATE TABLE articles (
      article_id SERIAL PRIMARY KEY,
      title VARCHAR(150) NOT NULL,
      body TEXT NOT NULL,
      votes INT DEFAULT 0 NOT NULL,
      topic VARCHAR(100) REFERENCES topics(slug) NOT NULL,
      author VARCHAR(100) REFERENCES users(username) ON UPDATE CASCADE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
    );`)
  
  await db.query(`
    CREATE TABLE comments (
      comment_id SERIAL PRIMARY KEY,
      author VARCHAR(100) REFERENCES users(username) ON UPDATE CASCADE NOT NULL,
      article_id INT REFERENCES articles(article_id) ON DELETE CASCADE NOT NULL,
      votes INT DEFAULT 0 NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      body TEXT NOT NULL
    );`)

    await db.query(`
    CREATE TABLE article_votes (
      username VARCHAR(100) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
      article_id INT REFERENCES articles(article_id) ON DELETE CASCADE NOT NULL,
      PRIMARY KEY(username, article_id),
      time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      up BOOLEAN NOT NULL
    );`)

    await db.query(`
    CREATE TABLE comment_votes (
      username VARCHAR(100) REFERENCES users(username) ON DELETE CASCADE NOT NULL,
      comment_id INT REFERENCES comments(comment_id) ON DELETE CASCADE NOT NULL,
      PRIMARY KEY(username, comment_id),
      time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
      up BOOLEAN NOT NULL
    );`)

  await db.query(`
    INSERT INTO topics
      (slug, description)
    VALUES
      ${f.literal(orderValues(topicData, ["slug", "description"]))};
    `)

  await db.query(`
    INSERT INTO users
      (username, avatar_url, name, admin, salt, hash)
    VALUES
      ${f.literal(orderValues(userData, ["username", "avatar_url", "name", "admin", "salt", "hash"]))};
    `)

  const articles = await db.query(`
    INSERT INTO articles
      (title, body, votes, topic, author, created_at)
    VALUES
      ${f.literal(orderValues(articleData, [
        "title",
        "body",
        "votes",
        "topic",
        "author",
        "created_at",
      ]))}
    RETURNING article_id, title;
  `,)

  const lookup = makeLookup(articles.rows, "title", "article_id");
  const idAdded = updateKeyValue(commentData, "belongs_to", "article_id", lookup)
  const authorAdded = renameKeys(idAdded, "created_by", "author")

  await db.query(`
    INSERT INTO comments
      (author, article_id, votes, created_at, body)
    VALUES
      ${f.literal(orderValues(authorAdded, [
        "author",
        "article_id",
        "votes",
        "created_at",
        "body",
      ]))};
    `)
}

module.exports = seed