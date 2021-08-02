const db = require("../db/connection.js");

exports.selectTopics = async () => {
  const topics = await db.query(`SELECT * FROM topics;`);

  return topics.rows;
};
