const express = require("express");
const apiRouter = require("./routers/api.router");

const app = express();

app.use(express.json())

app.use("/api", apiRouter)

app.all('/*', (req, res) => {
  res.status(404).send({ status: 404, msg: 'Route not found' });
})

app.use((err, req, res, next) => {
  if(err.status) {
    res.status(err.status).send({msg: err.msg})
  } else if (err.code === '22P02') {
    res.status(400).send({msg: 'Bad request - invalid data type'})
  } else {
    console.log(err, "<<< unhandled error")
    res.status(500).send({msg: 'internal server error'})
  }
})

module.exports = app
