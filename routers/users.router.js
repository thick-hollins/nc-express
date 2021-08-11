const express = require("express")
const { 
    getUsers, 
    getUser, 
    postUser, 
    postLogin, 
    patchUser,
    getLikes } = require("../controllers/users.controllers")
const usersRouter = express.Router()

usersRouter.route("/")
    .get(getUsers)

usersRouter.route('/:username')
    .get(getUser)
    .patch(patchUser)

usersRouter.route('/:username/likes')
    .get(getLikes)

usersRouter.route('/signup')
    .post(postUser)

usersRouter.route('/login')
    .post(postLogin)

module.exports = usersRouter