const { removeComment, updateComment, selectNewComments } = require("../models/comments.models");

exports.deleteComment = (req, res, next) => {
  const user = jwt.decode(req.headers.authorization.split(' ')[1])
  removeComment(req.params.comment_id, user)
    .then(() => {
      res.status(204).send()
    })
    .catch(next)
}

exports.patchComment = (req, res, next) => {
  const user = jwt.decode(req.headers.authorization.split(' ')[1])
  updateComment(req.params.comment_id, req.body, user)
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
