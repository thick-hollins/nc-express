const express = require("express")
const { getUsers, getUser } = require("../controllers/users.controllers")
const usersRouter = express.Router()

usersRouter.route("/")
    .get(getUsers)

usersRouter.route('/:username')
    .get(getUser)

module.exports = usersRouter