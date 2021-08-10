const express = require("express")
const { 
    getArticleById, 
    patchArticle, 
    getArticles, 
    getComments, 
    postComment, 
    postArticle, 
    deleteArticle,
    getNewArticles
} = require("../controllers/articles.controllers")

const articlesRouter = express.Router()

articlesRouter.route('/new')
    .get(getNewArticles)

articlesRouter.route("/:article_id")
    .get(getArticleById)
    .patch(patchArticle)
    .delete(deleteArticle)

articlesRouter.route("/:article_id/comments")
    .get(getComments) 
    .post(postComment)

articlesRouter.route('/')
    .get(getArticles)
    .post(postArticle)


module.exports = articlesRouter