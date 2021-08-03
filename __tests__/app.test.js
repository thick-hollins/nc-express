const db = require("../db/connection.js");
const request = require("supertest");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const app = require("../app.js");
const { checkExists } = require('../db/utils/queries')

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe('GET not-a-route', () => {
  it('status 404, relevant message', async () => {
    const { body: {msg} } = await request(app)
      .get("/not_a_route")
      .expect(404)
      expect(msg).toBe('Route not found')
  });
});

describe("GET api/topics", () => {
  it("status 200 - returns an object with an array of topic objects on a key of topics", async () => {
    const { body: { topics }} = await request(app)
      .get("/api/topics")
      .expect(200)
      expect(topics).toBeInstanceOf(Array);
      topics.forEach((topic) => {
        expect(topic).toMatchObject({
          description: expect.any(String),
          slug: expect.any(String),
        });
      });
  });
  it("status 200 - returns an object with the relevant article", async () => {
    const { body: { topics }} = await request(app)
      .get("/api/topics")
      .expect(200)
      topics.forEach((topic) => {
        expect(topic).toMatchObject({
          description: expect.any(String),
          slug: expect.any(String),
        });
      });
  });
});

describe('GET api/articles/:article_id', () => {
  it('status 200 - returns an object with the relevant article', async () => {
    const { body: { article } } = await request(app)
      .get('/api/articles/1')
      .expect(200)
      expect(article.article_id).toBe(1)
      expect(article).toEqual(
          expect.objectContaining({
          article_id: expect.any(Number),
          title: expect.any(String),
          author: expect.any(String),
          body: expect.any(String),
          votes: expect.any(Number),
          author: expect.any(String),
          topic: expect.any(String),
          created_at: expect.any(String)
          })
      );
  })

  // promise .all() - get all comments on article 1, count them

  it('calculates comment count', async () => {
    const { body: { article: { comment_count } } } = await request(app)
      .get('/api/articles/1')
      expect(comment_count).toBe(13)
  })
  it('status 404, well-formed but non-existant article ID', async () => {
    const { body: { msg } } = await request(app)
      .get("/api/articles/899")
      .expect(404)
      expect(msg).toBe('Resource not found')
  });
  it('status 400, malformed id', async () => {
    const { body: { msg } } = await request(app)
    .get("/api/articles/albania")
    .expect(400)
    expect(msg).toBe('Bad request - invalid data type')
  });
})

describe('PATCH /api/articles/:article_id', () => {
  it('increments an articles votes by given amount, responds with article', async () => {
    const { body: { article } } = await request(app)
    .patch('/api/articles/2').expect(200)
    .send({ inc_votes: 1 })
      expect(article).toEqual(
          expect.objectContaining({ votes: 1 })
      )
  });  
});

describe('PATCH /api/articles/:article_id', () => {
  it('rejects with 404 given non-existant ID', async () => {
    const { body: { msg } } = await request(app)
    .patch('/api/articles/200').expect(404)
    .send({ inc_votes: 1 })
      expect(msg).toBe('Resource not found')
  });  
  it('rejects with 400 given request without inc_vote', async () => {
    const { body: { msg } } = await request(app)
    .patch('/api/articles/2').expect(400)
    .send({})
      expect(msg).toBe('Bad request - invalid vote')
  });  
  it('rejects with 400 given invalid data type', async () => {
    const { body: { msg } } = await request(app)
    .patch('/api/articles/2').expect(400)
    .send({ inc_votes: 'Leeds' })
      expect(msg).toBe('Bad request - invalid data type')
  });  
});

describe('GET /api/articles', () => {
  it('responds with an array of article objects', async () => {
    const { body: { articles } } = await request(app)
    .get('/api/articles')
    .expect(200)
    expect(articles).toBeInstanceOf(Array);
    articles.forEach((article) => {
        expect(article).toEqual(
            expect.objectContaining({
            article_id: expect.any(Number),
            title: expect.any(String),
            topic: expect.any(String),
            created_at: expect.any(String),
            votes: expect.any(Number),
            comment_count: expect.any(Number),
            })
        );
      });
  });
  it('sorts by default by created_at, descending', async () => {
    const { body: { articles } } = await request(app)
    .get('/api/articles')
    expect(articles).toBeSortedBy('created_at', { descending: true })
  });
  it('sorts by all other columns', async () => {
    const byAuthor =  request(app).get('/api/articles?sort_by=author')
    const byTitle = request(app).get('/api/articles?sort_by=title')
    const byArticleId = request(app).get('/api/articles?sort_by=article_id')
    const byTopic = request(app).get('/api/articles?sort_by=topic')
    const byCreatedAt = request(app).get('/api/articles?sort_by=created_at')
    const byVotes = request(app).get('/api/articles?sort_by=votes')
    const byCommentCount = request(app).get('/api/articles?sort_by=comment_count')
    const [author, title, articleId, topic, createdAt, votes, commentCount] 
      = await Promise.all([
      byAuthor,
      byTitle,
      byArticleId, 
      byTopic, 
      byCreatedAt, 
      byVotes, 
      byCommentCount])
    expect(author.body.articles).toBeSortedBy('author', { descending: true })
    expect(title.body.articles).toBeSortedBy('title', { descending: true })
    expect(articleId.body.articles).toBeSortedBy('article_id', { descending: true })
    expect(topic.body.articles).toBeSortedBy('topic', { descending: true })
    expect(createdAt.body.articles).toBeSortedBy('created_at', { descending: true })
    expect(votes.body.articles).toBeSortedBy('votes', { descending: true })
    expect(commentCount.body.articles).toBeSortedBy('comment_count', { descending: true })
  });
  it('sorts ascending when given as order', async () => {
    const { body: { articles } } = await request(app)
    .get('/api/articles?order=asc')
    expect(articles).toBeSortedBy('created_at', { descending: false })
  });
  it('error 400 given sort col not in table', async () => {
    const { body: { msg } } = await request(app)
    .get('/api/articles?sort_by=not_a_col')
    .expect(400)
    .send()
    expect(msg).toBe('Bad request - invalid sort')
  });
  it('error 400 given sort order not asc or desc', async () => {
    const { body: { msg } } = await request(app)
    .get('/api/articles?order=not_an_order')
    .expect(400)
    .send()
    expect(msg).toBe('Bad request - invalid sort')
  });
  it('queries by author', async () => {
    const { body: { articles } } = await request(app)
    .get('/api/articles?author=butter_bridge')
    articles.forEach((article) => {
        expect(article.author).toBe('butter_bridge')
      });
  });
  it('queries by topic', async () => {
    const { body: { articles } } = await request(app)
    .get('/api/articles?topic=mitch')
    articles.forEach((article) => {
        expect(article.topic).toBe('mitch')
      });
  });
  it('given existant topic with no linked articles, returns an empty array', async () => {
    const { body: { articles } } = await request(app)
    .get('/api/articles?topic=paper')
    expect(articles).toEqual([])
  });
  it('given existant author with no linked articles, returns an empty array', async () => {
    const { body: { articles } } = await request(app)
    .get('/api/articles?author=lurker')
    expect(articles).toEqual([])
  });
  it('given well-formed but non-existant topic, responds with 404', async () => {
    const { body: { msg } } = await request(app)
    .get('/api/articles?topic=tennis')
    .expect(404)
    expect(msg).toBe('Resource not found')
  });
});

describe('GET /api/articles/:article_id/comments', () => {
  it('responds with all commment objects relating to the article_id parameter', async () => {
    const { body: { comments }} = await request(app)
    .get("/api/articles/1/comments")
    .expect(200)
    comments.forEach((comment) => {
      expect(comment).toMatchObject({
        comment_id: expect.any(Number),
        article_id: 1,
        votes: expect.any(Number),
        created_at: expect.any(String),
        author: expect.any(String),
        body: expect.any(String),
      });
    });
  });
  it('non-existant article ID gives 404', async () => {
    const { body: { msg } } = await request(app)
    .get('/api/articles/1000/comments')
    .expect(404)
    expect(msg).toBe('Resource not found')
  });
  it('existant article ID with no comments gives 200 and empty array', async () => {
    const { body: { comments } } = await request(app)
    .get('/api/articles/2/comments')
    .expect(200)
    expect(comments).toEqual([])
  });
  it('400 - malformed article ID', async () => {
    const { body: { msg } } = await request(app)
    .get('/api/articles/beetroot/comments')
    .expect(400)
    expect(msg).toBe('Bad request - invalid data type')
  });
});

xdescribe('GET /api/', () => {
  it('should ', async () => {
    const endpoints = await request(app)
    .get("/api/")
    .expect(200)
    expect(endpoints).toEqual()
  });
});

xdescribe('checkExists', () => {
  it('should respond with 404 given non existant value in the database in a valid table and col', async () => {
    await expect(checkExists('topics', 'slug', 'mitch')).rejects
  });
});
