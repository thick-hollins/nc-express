const express = require("express");
const apiRouter = require("./routers/api.router");
const app = express()
const jwt = require('jsonwebtoken')
const client = require('./db/redis-connection')
const {
  handleCustomErrors,
  handlePsqlErrors,
  handleServerErrors,
} = require('./errors.js')

app.use((req, res, next) => {
  if (req.originalUrl === '/api/users/signup' || 
      req.originalUrl === '/api/users/login') {
    return next()
  } else {
    const { headers: { authorization } } = req  
    try { 
      const token = authorization.split(' ')[1]
      client.get(`blacklist_${token}`, (error, data) => {
        if (data !== null) {
          next({ status: 401, msg: 'Unauthorised' })
        }
      })
      jwt.verify(token, process.env.JWT_SECRET) 
      } catch (err) { 
        next({ status: 401, msg: 'Unauthorised' })
    }
  next()
  }
})

app.use(express.json())

app.use("/api", apiRouter)

app.all('/*', (req, res, next) => {
  res.status(404).send({ status: 404, msg: 'Route not found' });
})

app.use(handleCustomErrors)
app.use(handlePsqlErrors)
app.use(handleServerErrors)

module.exports = app
