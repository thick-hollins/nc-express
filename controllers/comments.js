const { removeComment } = require("../models/comments");

exports.deleteComment = (req, res, next) => {
  removeComment(req.params.comment_id)
    .then(() => {
      res.status(204).send()
    })
    .catch(next)
}
