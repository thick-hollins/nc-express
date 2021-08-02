const db = require("../connection.js");
const format = require("pg-format");

const seed = async (data) => {
  const { articleData, commentData, topicData, userData } = data;
  await db.query(`DROP TABLE IF EXISTS comments;`);
  await db.query(`DROP TABLE IF EXISTS articles;`);
  await db.query(`DROP TABLE IF EXISTS users;`);
  await db.query(`DROP TABLE IF EXISTS topics;`);
  console.log("Dropped all tables");
  await db.query(`CREATE TABLE topics (
    slug VARCHAR(100) PRIMARY KEY,
    description VARCHAR(300)
  );`);
  await db.query(`CREATE TABLE users (
    username VARCHAR(100) PRIMARY KEY,
    avatar_url VARCHAR(230),
    name VARCHAR(100)
  );`);
  await db.query(`CREATE TABLE articles (
    article_id SERIAL PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    body TEXT,
    votes INT DEFAULT 0,
    topic VARCHAR(100) REFERENCES topics(slug) NOT NULL,
    author VARCHAR(100) REFERENCES users(username),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );`);
  await db.query(`CREATE TABLE comments (
    comment_id SERIAL PRIMARY KEY,
    author VARCHAR(100) REFERENCES users(username),
    article_id INT REFERENCES articles(article_id) NOT NULL,
    votes INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    body TEXT
  );`);
  console.log("created tables!");
  // 1. create tables
  // 2. insert data
};

module.exports = seed;
