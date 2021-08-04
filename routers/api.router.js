const express = require("express");
const apiRouter = express.Router();
const topicsRouter = require("./topics.router");
const articlesRouter = require('./articles.router');
const { getEndpoints } = require('../controllers/api')

apiRouter.route('/')
    .get(getEndpoints)

apiRouter.use("/topics", topicsRouter);
apiRouter.use('/articles', articlesRouter)

module.exports = apiRouter;
