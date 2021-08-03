const db = require("../db/connection.js")
const { mapCols } = require('../db/utils/queries')
const f = require('pg-format')

// merge this with selectArticles model?

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
      COUNT(articles.article_id) AS
        comment_count
    FROM articles
    JOIN comments
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

// DEFAULT ORDER - should be different depending on column

// error handling.md suggests non-existant author or topic is an error?
// also existant... but no articles

exports.selectArticles = async (queries) => {
  const {
    sort_by = 'created_at',
    order = 'desc',
    topic,
    author
  } = queries
  if (!['article_id', 'author', 'title', 'topic', 'created_at', 'votes', 'comment_count']
        .includes(sort_by) || 
      !['asc', 'desc'].includes(order)) {
    return Promise.reject({status: 400, msg: 'Bad request - invalid sort'})
  }
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
      COUNT(articles.article_id) AS
        comment_count
    FROM articles
    JOIN comments
    ON articles.article_id = comments.article_id
    ${topic || author ? `WHERE ` : ''}
      ${topic? `topic = ${f.literal(topic)}`: '' }
      ${topic && author ? `AND ` : ''}
      ${author? `author = ${f.literal(author)}` : ''}
      GROUP BY 
        articles.article_id
      ORDER BY
        ${sort_by} ${order};
    `)
  return mapCols(article.rows, col => parseInt(col), 'comment_count')
}