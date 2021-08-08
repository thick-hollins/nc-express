const express = require("express");
const apiRouter = require("./routers/api.router");
const app = express()
const jwt = require('jsonwebtoken')
const {
  handleCustomErrors,
  handlePsqlErrors,
  handleServerErrors,
} = require('./errors.js')

// app.use((req, res, next) => {
//   console.log(req)
//   const { authorization } = req.headers
//   const token = authorization.split(' ')[1];
//   try { 
//     jwt.verify(token, process.env.JWT_SECRET) 
//    } catch (err) { 
//      next({ status: 401, msg: 'Unauthorised' })
//   }
// })

app.use(express.json())

app.use("/api", apiRouter)

app.all('/*', (req, res, next) => {
  res.status(404).send({ status: 404, msg: 'Route not found' });
})

app.use(handleCustomErrors)
app.use(handlePsqlErrors)
app.use(handleServerErrors)

module.exports = app
