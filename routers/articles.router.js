const express = require("express");
const { getArticleById } = require("../controllers/articles");
const articlesRouter = express.Router();

//endpoints
articlesRouter.route("/:article_id").get(getArticleById);

module.exports = articlesRouter;
