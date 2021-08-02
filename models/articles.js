const db = require("../db/connection.js");

exports.selectArticleById = async (article_id) => {
  const article = await db
    .query(`
    SELECT * 
    FROM articles
    WHERE article_id = $1
    ;`, [article_id])
  return article.rows[0]
}
