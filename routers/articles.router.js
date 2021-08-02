const express = require("express")
const { getArticleById, patchArticle } = require("../controllers/articles")
const articlesRouter = express.Router()

articlesRouter.route("/:article_id")
    .get(getArticleById)
    .patch(patchArticle)


module.exports = articlesRouter