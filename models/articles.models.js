const db = require("../db/connection.js")
const { checkExists } = require('../db/utils/queries')
const { mapCols } = require('../db/utils/data-manipulation')
const f = require('pg-format')
const { request } = require("express")

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

exports.updateArticle = async (article_id, { inc_votes, body }, user) => {
  await checkExists(db, 'articles', 'article_id', article_id)
  if (inc_votes !== undefined) {
    if (inc_votes !== 1 && inc_votes !== -1) {
      return Promise.reject({status: 400, msg: 'Bad request - invalid vote'})
    }
    const up = inc_votes === 1
    await db.query(`
      INSERT INTO article_votes
        (article_id, username, up)
      VALUES
        ($1, $2, $3)
    `, [article_id, user.username, up])
  }
  if (!inc_votes && !body) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  if (body) {
    const owner = await db
    .query(`
      SELECT author FROM articles
      WHERE article_id = $1
      `, [article_id])
    if (!user.admin && (owner.rows.length && owner.rows[0].author !== user.username)) {
      return Promise.reject({status: 401, msg: 'Unauthorised'})
    }
  }
  const article = await db
    .query(`
    UPDATE articles
        ${inc_votes? 'SET votes = votes + ' + f.literal(inc_votes): ''}
        ${body? 'SET body = ' + f.literal(body): ''}
        WHERE article_id = ${f.literal(article_id)}
        RETURNING *;
    ;`)
  return article.rows[0]
}

exports.selectArticles = async (queries) => {
  const {
    sort_by = 'created_at',
    order = 'desc',
    limit = 10,
    page = 1,
    topic,
    author,
    title
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
        comment_count,
      COUNT(*) OVER() AS total_count
    FROM articles
    LEFT JOIN comments
    ON articles.article_id = comments.article_id
    ${topic || author || title ? `WHERE ` : ''}
      ${topic? `topic = ${f.literal(topic)}`: '' }
      ${topic && author ? `AND ` : ''}
      ${author? `articles.author = ${f.literal(author)}` : ''}
      ${(topic || author) && title ? `AND ` : ''}
      ${title? `title ~* ${f.literal(title)}` : ''}
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
    await checkExists(db, 'topics', 'slug', topic)
  }
  if (author && !articles.rows.length) {
    await checkExists(db, 'users', 'username', author)
  }
  let total_count
  if (!articles.rows.length) total_count = 0
  else total_count = articles.rows[0].total_count
  let processed = articles.rows.map(row => {
    const {total_count, comment_count, ...rest} = row
    return Object.assign({comment_count: parseInt(comment_count)}, rest)
  })
  return {
    rows: processed, 
    total_count, 
    page, 
    total_pages: Math.ceil(total_count / limit)
  }
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
      await checkExists(db, 'articles', 'article_id', article_id)
    }
  return comments.rows
}

exports.insertComment = async (article_id, newComment, user) => {
  const { body } = newComment
  if (!body) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  await checkExists(db, 'articles', 'article_id', article_id)
  await checkExists(db, 'users', 'username', user.username)
  const comment = await db
    .query(`
    INSERT INTO comments
      (article_id, author, body)
    VALUES
      ($1, $2, $3)
    RETURNING *;
    `, [article_id, user.username, body])
return comment.rows[0]
}

exports.insertArticle = async (newComment, user) => {
  const {title, body, topic} = newComment
  if (!body || !title || !topic) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  const article = await db
    .query(`
    INSERT INTO articles
      (author, title, body, topic)
    VALUES
      ($1, $2, $3, $4)
    RETURNING *;
    `, [user.username, title, body, topic])
return article.rows[0]
}

exports.removeArticle = async (article_id, user) => {
  const owner = await db
    .query(`
    SELECT author FROM articles
    WHERE article_id = $1
    `, [article_id])
    if (!user.admin && (owner.rows.length && owner.rows[0].author !== user.username)) {
      return Promise.reject({status: 401, msg: 'Unauthorised'})
    }
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

exports.selectNewArticles = async () => {
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
  WHERE 
    articles.created_at > NOW() - interval '10 minutes'
  GROUP BY 
    articles.article_id
  ORDER BY
    articles.created_at DESC;
  `)
  return articles.rows
}