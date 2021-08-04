const db = require("../db/connection.js");

exports.selectTopics = async () => {
  const topics = await db.query(`SELECT * FROM topics;`);
  return topics.rows;
};

exports.insertTopic = async (newTopic) => {
  const {slug, description} = newTopic
  if (!slug || !description) {
    return Promise.reject({status: 400, msg: 'Bad request - missing field(s)'})
  }
  const topic = await db
    .query(`
    INSERT INTO topics
      (slug, description)
    VALUES
      ($1, $2)
    RETURNING *;
    `, [slug, description])
return topic.rows[0]
}