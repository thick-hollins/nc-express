const express = require("express");
const apiRouter = require("./routers/api.router");

const app = express();

app.use("/api", apiRouter);

app.use((err, req, res, next) => {
  console.log(err, "<<<   unhandled error");
});

module.exports = app;
