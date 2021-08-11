const express = require("express")
const { deleteComment, patchComment, getNewComments } = require("../controllers/comments.controllers")
const commentsRouter = express.Router()

commentsRouter.route("/:comment_id")
    .delete(deleteComment)
    .patch(patchComment)

commentsRouter.route("/new")
    .get(getNewComments)

module.exports = commentsRouter