const jwt = require('jsonwebtoken')
const client = require('./db/redis-connection')

exports.authoriseRequest = (req, res, next) => {
    if (req.originalUrl === '/api/users/signup' || 
        req.originalUrl === '/api/users/login') {
      return next()
    } else {
      const { headers: { authorization } } = req
      if (!authorization) return next({ status: 401, msg: 'Unauthorised' })
      const token = authorization.split(' ')[1]
      const decoded = jwt.decode(token)
      if (!decoded) return next({ status: 401, msg: 'Unauthorised' })
      const { username, iat } = decoded
  
      client.get(username, (err, data) => {
        if(err) next(err)
        if (data !== null && iat < data) {
          next({ status: 401, msg: 'Unauthorised' })
        }
        try {
          jwt.verify(token, process.env.JWT_SECRET) 
        } catch (err) { 
            next({ status: 401, msg: 'Unauthorised' })
        }
      next()
      })
    }
  }