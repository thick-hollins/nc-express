const { selectArticleById, updateArticle, selectArticles, selectComments } = require("../models/articles");

exports.getArticleById = (req, res, next) => {
  selectArticleById(req.params.article_id)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next)
}

exports.patchArticle = (req, res, next) => {
  updateArticle(req.params.article_id, req.body.inc_votes)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next)
}

exports.getArticles = (req, res, next) => {
  selectArticles(req.query)
    .then((articles) => {
      res.status(200).send({ articles });
    })
    .catch(next)
}

exports.getComments = (req, res, next) => {
  selectComments(req.params.article_id)
    .then((comments) => {
      res.status(200).send({ comments })
    })
    .catch(next)
}
