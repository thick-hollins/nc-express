const express = require("express");
const apiRouter = require("./routers/api.router");

const app = express();

app.use("/api", apiRouter);

app.all('/*', (req, res) => {
  res.status(404).send({ status: 404, msg: 'Route not found' });
});

app.use((err, req, res, next) => {
  console.log(err, "<<<   unhandled error");
});

module.exports = app;
