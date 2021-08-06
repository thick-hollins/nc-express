const db = require("../db/connection.js")
const { checkExists } = require('../db/utils/queries')
const { mapCols } = require('../db/utils/data-manipulation')
const f = require('pg-format')

exports.selectArticleById = async article_id => {
  const article = await db
    .query(`
    SELECT
      articles.author,
      title,
      articles.article_id,
      articles.body,
      topic,
      articles.created_at,
      articles.votes,
      COUNT(comments.article_id) AS
        comment_count
    FROM articles
    LEFT JOIN comments
    ON articles.article_id = comments.article_id
    WHERE articles.article_id = $1
    GROUP BY articles.article_id
    ;`, [article_id])
    if (!article.rows.length) {
      return Promise.reject({status: 404, msg: 'Resource not found'})
    }
  return mapCols(article.rows, col => parseInt(col), 'comment_count')[0]
}

exports.updateArticle = async (article_id, inc_votes) => {
  if (!inc_votes) {
    return Promise.reject({status: 400, msg: 'Bad request - invalid vote'})
  }
  const article = await db
    .query(`
    UPDATE articles
        SET votes = votes + $1
        WHERE article_id = $2
        RETURNING *;
    ;`, [inc_votes, article_id])
    if (!article.rows.length) {
      return Promise.reject({status: 404, msg: 'Resource not found'})
    }
  return article.rows[0]
}

exports.selectArticles = async (queries) => {
  const {
    sort_by = 'created_at',
    order = 'desc',
    limit = 10,
    page = 1,
    topic,
    author
  } = queries
  if (!['article_id', 'author', 'title', 'topic', 'created_at', 'votes', 'comment_count']
        .includes(sort_by) || 
      !['asc', 'desc'].includes(order) ||
      !Number.isInteger(parseInt(limit))) {
    return Promise.reject({status: 400, msg: 'Bad request - invalid sort'})
  }
  const articles = await db
    .query(`
    SELECT
      articles.author,
      title,
      articles.article_id,
      articles.body,
      topic,
      articles.created_at,
      articles.votes,
      COUNT(comments.article_id) AS
        comment_count
    FROM articles
    LEFT JOIN comments
    ON articles.article_id = comments.article_id
    ${topic || author ? `WHERE ` : ''}
      ${topic? `topic = ${f.literal(topic)}`: '' }
      ${topic && author ? `AND ` : ''}
      ${author? `articles.author = ${f.literal(author)}` : ''}
      GROUP BY 
        articles.article_id
      ORDER BY
        ${sort_by} ${order}
      LIMIT
        ${f.literal(limit)}
      OFFSET
        ${f.literal((page - 1) * limit)};
    `)
  if (topic && !articles.rows.length) {
    await checkExists('topics', 'slug', topic)
  }
  if (author && !articles.rows.length) {
    await checkExists('users', 'username', author)
  }
  return mapCols(articles.rows, col => parseInt(col), 'comment_count')
}

exports.selectComments = async (article_id, { limit = 10, page = 1 }) => {
  const comments = await db
    .query(`
    SELECT
      comment_id,
      article_id,
      votes,
      created_at,
      author,
      body 
    FROM comments
    WHERE article_id = $1
    ORDER BY comment_id
    LIMIT $2
    OFFSET $3
    ;`, [
      article_id,
      limit,
      (page - 1) * limit 
    ])
    if (!comments.rows.length) {
      await checkExists('articles', 'article_id', article_id)
    }
  return comments.rows
}

exports.insertComment = async (article_id, newComment) => {
  const {username, body} = newComment
  if (!username || !body) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  await checkExists('articles', 'article_id', article_id)
  await checkExists('users', 'username', username)
  const comment = await db
    .query(`
    INSERT INTO comments
      (article_id, author, body)
    VALUES
      ($1, $2, $3)
    RETURNING *;
    `, [article_id, username, body])
return comment.rows[0]
}

exports.insertArticle = async (newComment) => {
  const {author, title, body, topic} = newComment
  if (!author || !body || !title || !topic) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  const article = await db
    .query(`
    INSERT INTO articles
      (author, title, body, topic)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *;
    `, [author, title, body, topic])
return article.rows[0]
}

exports.removeArticle = async (article_id) => {
  const res = await db
    .query(`
      DELETE FROM articles
      WHERE article_id = $1
      RETURNING *;
      ;`, [article_id])
    if (!res.rows.length) {
      return Promise.reject({status: 404, msg: 'Resource not found'})
    }
}