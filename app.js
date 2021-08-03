const express = require("express");
const apiRouter = require("./routers/api.router");
const app = express()
const {
  handleCustomErrors,
  handlePsqlErrors,
  handleServerErrors,
} = require('./errors.js')

app.use(express.json())

app.use("/api", apiRouter)

app.all('/*', (req, res, next) => {
  res.status(404).send({ status: 404, msg: 'Route not found' });
})

app.use(handleCustomErrors)
app.use(handlePsqlErrors)
app.use(handleServerErrors)

module.exports = app
