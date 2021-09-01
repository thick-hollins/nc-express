const db = require("../db/connection")
const { checkExists } = require('../db/utils/queries')
const f = require('pg-format')

exports.removeComment = async (comment_id, user) => {
  const owner = await db
    .query(`
      SELECT author FROM comments
      WHERE comment_id = $1
      `, [comment_id])
  if (!user.admin && (owner.rows.length && owner.rows[0].author !== user.username)) {
    return Promise.reject({status: 401, msg: 'Unauthorised'})
  }
  const res = await db
    .query(`
      DELETE FROM comments
      WHERE comment_id = $1
      RETURNING *;
      ;`, [comment_id])
    if (!res.rows.length) {
      return Promise.reject({status: 404, msg: 'Resource not found'})
    }
  }

  exports.updateComment = async (comment_id, {inc_votes, body}, user) => {
    await checkExists(db, 'comments', 'comment_id', comment_id)
    if (inc_votes === 0) {
      return Promise.reject({status: 400, msg: 'Bad request - invalid vote'})
    }
    if (!inc_votes && !body) {
      return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
    }
    const up = inc_votes === 1
    await db.query(`
      INSERT INTO comment_votes
        (comment_id, username, up)
      VALUES
        ($1, $2, $3)
    `, [comment_id, user.username, up])

    if (body) {
      const owner = await db
      .query(`
        SELECT author FROM comments
        WHERE comment_id = $1
        `, [comment_id])
      if (!user.admin && (owner.rows.length && owner.rows[0].author !== user.username)) {
        return Promise.reject({status: 401, msg: 'Unauthorised'})
      }
    }
    const comment = await db
      .query(`
        UPDATE comments
        ${inc_votes? 'SET votes = votes + ' + f.literal(inc_votes): ''}
        ${body? 'SET body = ' + f.literal(body): ''}
        WHERE comment_id = ${f.literal(comment_id)}
        RETURNING *;
        ;`)
    return comment.rows[0]
  }

  exports.selectNewComments = async () => {
    const articles = await db
    .query(`
    SELECT *
    FROM comments
    WHERE 
      created_at > NOW() - interval '10 minutes'
    ORDER BY
      created_at DESC;
    `)
    return articles.rows
  }