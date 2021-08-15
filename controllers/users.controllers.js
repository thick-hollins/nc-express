const { selectUsers, selectUser, selectLikes, insertUser, updateUser, login, logout } = require("../models/users.models");
const jwt = require('jsonwebtoken')

exports.getUsers = (req, res, next) => {
  selectUsers()
    .then(users => {
      res.status(200).send({ users })
    })
    .catch(next)
}

exports.getUser = (req, res, next) => {
  selectUser(req.params.username)
    .then(user => {
      res.status(200).send({ user })
    })
    .catch(next)
}

exports.postUser = (req, res, next) => {
  insertUser(req.body)
    .then(user => {
      res.status(201).send({ user })
    })
    .catch(next)
}

exports.getLikes = (req, res, next) => {
  selectLikes(req.params.username)
    .then(likes => {
      res.status(200).send({ likes })
    })
    .catch(next)
}

exports.patchUser = (req, res, next) => {
  const token = req.headers.authorization.split(' ')[1]
  updateUser(req.params.username, req.body, token)
    .then(user => {
      res.status(200).send({ user })
    })
    .catch(next)
}

exports.postLogin = (req, res, next) => {
  login(req.body)
    .then((token) => {
      res.status(200).send(token)
    })
    .catch(next)
}

exports.postLogout = (req, res, next) => {
  logout(req.headers.authorization.split(' ')[1])
    .then(() => {
      res.status(200).send({ msg: 'Logged out'})
    })
    .catch(next)
}