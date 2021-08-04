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