const db = require("../db/connection.js");
const request = require("supertest");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const app = require("../app.js");

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe('GET not-a-route', () => {
  it('status 404, relevant message', () => {
    return request(app)
      .get("/not_a_route")
      .expect(404)
      .then(res => {
        expect(res.body.msg).toBe('Route not found')
      })
  });
});

describe("GET api/topics", () => {
  it("status 200 - returns an object with an array of topic objects on a key of topics", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then((result) => {
        expect(result.body.topics).toBeInstanceOf(Array);
        result.body.topics.forEach((topic) => {
          expect(topic).toMatchObject({
            description: expect.any(String),
            slug: expect.any(String),
          });
        });
      });
  });
});

describe("GET api/articles/:article_id", () => {
  it("status 200 - returns an object with the relevant article", () => {
    return request(app)
      .get("/api/topics")
      .expect(200)
      .then(result => {
        result.body.topics.forEach((topic) => {
          expect(topic).toMatchObject({
            description: expect.any(String),
            slug: expect.any(String),
          });
        });
      });
  });
});

// expect TIMESTAMP ?

describe('GET api/articles/:article_id', () => {
  it('status 200 - returns an object with the relevant article', () => {
    return request(app)
      .get('/api/articles/1')
      .expect(200)
      .then(res => {
          const { article } = res.body
          expect(article.article_id).toBe(1)
          expect(article).toEqual(
              expect.objectContaining({
              article_id: expect.any(Number),
              title: expect.any(String),
              body: expect.any(String),
              votes: expect.any(Number),
              author: expect.any(String),
              topic: expect.any(String),
              created_at: expect.any(String)
              })
          );
      })
  })

  // promise .all() - get all comments on article 1, count them

  it('calculates comment count', () => {
    return request(app)
      .get('/api/articles/1')
      .then(res => {
        expect(res.body.article.comment_count).toBe(13)
      })
  })
  it('status 404, well-formed but non-existant article ID', () => {
    return request(app)
      .get("/api/articles/899")
      .expect(404)
      .then(res => {
        expect(res.body.msg).toBe('Resource not found')
      })
  });
  it('status 400, malformed id', () => {
    return request(app)
    .get("/api/articles/albania")
    .expect(400)
    .then(res => {
      expect(res.body.msg).toBe('Bad request - invalid data type')
    })
  });
})
