const { selectUsers, selectUser } = require("../models/users");

exports.getUsers = (req, res, next) => {
  selectUsers()
    .then((users) => {
      res.status(200).send({ users })
    })
    .catch(next)
}

exports.getUser = (req, res, next) => {
  selectUser(req.params.username)
    .then((user) => {
      res.status(200).send({ user })
    })
    .catch(next)
}
