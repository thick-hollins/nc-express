const express = require("express")
const { 
    getArticleById, 
    patchArticle, 
    getArticles, 
    getComments, 
    postComment, 
    postArticle, 
    deleteArticle 
} = require("../controllers/articles")

const articlesRouter = express.Router()

articlesRouter.route("/:article_id")
    .get(getArticleById)
    .patch(patchArticle)

articlesRouter.route("/:article_id/comments")
    .get(getComments) 
    .post(postComment)

articlesRouter.route('/')
    .get(getArticles)
    .post(postArticle)
    .delete(deleteArticle)

module.exports = articlesRouter