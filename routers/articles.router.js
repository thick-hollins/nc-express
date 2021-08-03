const express = require("express")
const { getArticleById, patchArticle, getArticles, getComments } = require("../controllers/articles")
const articlesRouter = express.Router()

articlesRouter.route("/:article_id")
    .get(getArticleById)
    .patch(patchArticle)
articlesRouter.route("/:article_id/comments")
    .get(getComments) 
articlesRouter.route('/')
    .get(getArticles)
module.exports = articlesRouter