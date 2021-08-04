const { removeComment, updateComment } = require("../models/comments");

exports.deleteComment = (req, res, next) => {
  removeComment(req.params.comment_id)
    .then(() => {
      res.status(204).send()
    })
    .catch(next)
}

exports.patchComment = (req, res, next) => {
  updateComment(req.params.comment_id, req.body.inc_votes)
    .then((comment) => {
      res.status(200).send({ comment })
    })
    .catch(next)
}
