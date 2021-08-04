const express = require("express");
const apiRouter = express.Router();
const topicsRouter = require("./topics.router");
const articlesRouter = require('./articles.router');
const commentsRouter = require('./comments.router')
const usersRouter = require('./users.router')
const { getEndpoints } = require('../controllers/api')

apiRouter.route('/')
    .get(getEndpoints)

apiRouter.use("/topics", topicsRouter);
apiRouter.use('/articles', articlesRouter)
apiRouter.use('/comments', commentsRouter)
apiRouter.use('/users', usersRouter)

module.exports = apiRouter;
