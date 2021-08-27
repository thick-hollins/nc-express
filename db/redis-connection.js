const redis = require("redis");
const client = redis.createClient(process.env.REDIS_URL)

client.on("error", (error) => {
  console.error(error);
});

module.exports = client