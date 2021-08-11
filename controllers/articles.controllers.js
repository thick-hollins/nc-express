const {
  selectArticleById, 
  updateArticle, 
  selectArticles, 
  selectComments, 
  insertComment,
  insertArticle,
  removeArticle,
  selectNewArticles
  } = require("../models/articles.models");
  const jwt = require('jsonwebtoken')

exports.getArticleById = (req, res, next) => {
  selectArticleById(req.params.article_id)
    .then((article) => {
      res.status(200).send({ article });
    })
    .catch(next)
}

exports.patchArticle = (req, res, next) => {
  const user = jwt.decode(req.headers.authorization.split(' ')[1])
  updateArticle(req.params.article_id, req.body, user)
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
  selectComments(req.params.article_id, req.query)
    .then((comments) => {
      res.status(200).send({ comments })
    })
    .catch(next)
}

exports.postComment = (req, res, next) => {
  const user = jwt.decode(req.headers.authorization.split(' ')[1])
  insertComment(req.params.article_id, req.body, user)
    .then((comment) => {
      res.status(201).send({ comment })
    })
    .catch(next)
}

exports.postArticle = (req, res, next) => {
  const user = jwt.decode(req.headers.authorization.split(' ')[1])
  insertArticle(req.body, user)
    .then((article) => {
      res.status(201).send({ article })
    })
    .catch(next)
}

exports.deleteArticle = (req, res, next) => {
  removeArticle(req.params.article_id)
    .then(() => {
      res.status(204).send()
    })
    .catch(next)
}

exports.getNewArticles = (req, res, next) => {
  selectNewArticles()
    .then((articles) => {
      res.status(200).send({ articles });
    })
    .catch(next)
}