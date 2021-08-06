const db = require("../db/connection")
const { checkExists } = require('../db/utils/queries')
const f = require('pg-format')

exports.removeComment = async (comment_id) => {
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

  exports.updateComment = async (comment_id, {inc_votes, body}) => {
    await checkExists('comments', 'comment_id', comment_id)
    if (inc_votes === 0) {
      return Promise.reject({status: 400, msg: 'Bad request - invalid vote'})
    }
    if (!inc_votes && !body) {
      return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
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