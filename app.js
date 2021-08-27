const express = require("express");
const apiRouter = require("./routers/api.router");
const cors = require('cors');
const app = express()
const {
  handleCustomErrors,
  handlePsqlErrors,
  handleServerErrors,
} = require('./errors.js')
const { authoriseRequest } = require('./auth-middleware')

app.use(cors())

app.use(authoriseRequest)

app.use(express.json())

app.use("/api", apiRouter)

app.all('/*', (req, res, next) => {
  res.status(404).send({ status: 404, msg: 'Route not found' });
})

app.use(handleCustomErrors)
app.use(handlePsqlErrors)
app.use(handleServerErrors)

module.exports = app
