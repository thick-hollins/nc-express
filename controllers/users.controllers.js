const { selectUsers, selectUser, insertUser, login } = require("../models/users.models");

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

exports.postUser = (req, res, next) => {
  insertUser(req.body)
    .then(user => {
      res.status(201).send({ user })
    })
    .catch(next)
}

exports.postLogin = (req, res, next) => {
  login(req.body)
    .then((loggedIn) => {
      res.status(201).send(loggedIn)
    })
    .catch(next)
}