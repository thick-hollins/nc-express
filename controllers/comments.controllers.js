const { removeComment, updateComment, selectNewComments } = require("../models/comments.models");

exports.deleteComment = (req, res, next) => {
  removeComment(req.params.comment_id)
    .then(() => {
      res.status(204).send()
    })
    .catch(next)
}

exports.patchComment = (req, res, next) => {
  updateComment(req.params.comment_id, req.body)
    .then(comment => {
      res.status(200).send({ comment })
    })
    .catch(next)
}

exports.getNewComments = (req, res, next) => {
  selectNewComments()
    .then(comments => {
      res.status(200).send({ comments })
    })
    .catch(next)
}
