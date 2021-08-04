const db = require("../db/connection")

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

  exports.updateComment = async (comment_id, inc_vote) => {
    if (!inc_vote) {
      return Promise.reject({status: 400, msg: 'Bad request - invalid vote'})
    }
    const comment = await db
      .query(`
        UPDATE comments
        SET votes = votes + $1
        WHERE comment_id = $2
        RETURNING *;
        ;`, [inc_vote, comment_id])
      if (!comment.rows.length) {
        return Promise.reject({status: 404, msg: 'Resource not found'})
      }
    return comment.rows[0]
  }