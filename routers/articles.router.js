const express = require("express")
const { getArticleById, patchArticle, getArticles } = require("../controllers/articles")
const articlesRouter = express.Router()

articlesRouter.route("/:article_id")
    .get(getArticleById)
    .patch(patchArticle)
articlesRouter.route('/')
    .get(getArticles)
module.exports = articlesRouter