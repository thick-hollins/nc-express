const express = require("express");
const apiRouter = express.Router();
const topicsRouter = require("./topics.router");
const commentsRouter = require('./comments.router')
const articlesRouter = require('./articles.router')

apiRouter.use("/topics", topicsRouter);
apiRouter.use('/comments', commentsRouter)
apiRouter.use('/articles', articlesRouter)

module.exports = apiRouter;
