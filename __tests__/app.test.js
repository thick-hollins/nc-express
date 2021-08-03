const db = require("../db/connection.js");
const request = require("supertest");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const app = require("../app.js");

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
});

describe("GET api/articles/:article_id", () => {
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

// expect TIMESTAMP regex?

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
});