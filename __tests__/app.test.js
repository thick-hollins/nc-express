const db = require("../db/connection.js");
const app = require("../app.js");
const defaults = require('superagent-defaults');
const supertest = require('supertest')
var request = defaults(supertest(app));
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");

beforeEach(() => seed(testData));
beforeEach(async () => {
  await request
    .post('/api/users/signup')
    .send({ username: 'test_user', name: 'test', avatar_url: 'test', password: 'pizza' })
    .expect(201)
  const { body: { accessToken } } = await request
    .post('/api/users/login')
    .send({ username: 'test_user', password: 'pizza' })
    .expect(200)
  request.set('Authorization', `BEARER ${accessToken}`)
});
afterAll(() => db.end());

describe('Topics', () => {
  describe("GET /api/topics", () => {
    it("status 200 - returns an object with an array of topic objects on a key of topics", async () => {
      const { body: { topics }} = await request
        .get("/api/topics")
        .expect(200)
        expect(topics).toBeInstanceOf(Array);
        expect(topics.length).toBeGreaterThan(0)
        topics.forEach((topic) => {
          expect(topic).toMatchObject({
            description: expect.any(String),
            slug: expect.any(String),
          });
        });
    });
  })
  
  describe('POST /api/topics', () => {
    it('should add a topic and respond with the added topic', async () => {
      testReq = {
        slug: 'hailstorms',
        description: 'sleet'
      }
      const { body: { topic } } = await request
        .post('/api/topics')
        .expect(201)
        .send(testReq)
      expect(topic).toEqual(
        expect.objectContaining({
          slug: 'hailstorms',
          description: 'sleet'
          })
      )
    });
    it('responds with 400 if a field is missing on request', async () => {
      testReq = {
        slug: 'butter'
      }
      const { body: { msg } } = await request
        .post('/api/topics')
        .expect(400)
        .send(testReq)
      expect(msg).toBe('Bad request - missing field(s)');
    });
  });
});

describe('Articles', () => {
  describe('GET /api/articles', () => {
    it('responds with an array of article objects', async () => {
      const { body: { articles } } = await request
      .get('/api/articles?limit=99')
      .expect(200)
      expect(articles).toBeInstanceOf(Array);
      expect(articles.length).toBeGreaterThan(0)
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
      const { body: { articles } } = await request
      .get('/api/articles')
      expect(articles).toBeSortedBy('created_at', { descending: true })
    });
    it('sorts by all other columns', async () => {
      const cols = [
        'author',
        'title',
        'article_id',
        'topic',
        'created_at',
        'votes',
        'comment_count',
      ].map((col) => {
        return request
          .get(`/api/articles?sort_by=${col}`)
          .expect(200)
          .then(({ body: { articles } }) => {
            expect(articles).toBeSortedBy(col, { descending: true });
          });
      });
      await Promise.all(cols)
    });
    it('sorts ascending when given as order', async () => {
      const { body: { articles } } = await request
      .get('/api/articles?order=asc&limit=15')
      expect(articles).toBeSortedBy('created_at', { descending: false })
    });
    it('error 400 given sort col not in table', async () => {
      const { body: { msg } } = await request
      .get('/api/articles?sort_by=not_a_col')
      .expect(400)
      .send()
      expect(msg).toBe('Bad request - invalid sort')
    });
    it('error 400 given sort order not asc or desc', async () => {
      const { body: { msg } } = await request
      .get('/api/articles?order=not_an_order')
      .expect(400)
      .send()
      expect(msg).toBe('Bad request - invalid sort')
    });
    it('queries by author', async () => {
      const { body: { articles } } = await request
      .get('/api/articles?author=butter_bridge')
      .expect(200)
      articles.forEach((article) => {
          expect(article.author).toBe('butter_bridge')
        });
    });
    it('queries by topic', async () => {
      const { body: { articles } } = await request
      .get('/api/articles?topic=mitch')
      .expect(200)
      articles.forEach((article) => {
          expect(article.topic).toBe('mitch')
        });
    });
    it('given existent topic with no linked articles, returns an empty array', async () => {
      const { body: { articles } } = await request
      .get('/api/articles?topic=paper')
      .expect(200)
      expect(articles).toEqual([])
    });
    it('given existent author with no linked articles, returns an empty array', async () => {
      const { body: { articles } } = await request
      .get('/api/articles?author=lurker')
      .expect(200)
      expect(articles).toEqual([])
    });
    it('given well-formed but non-existent topic, responds with 404', async () => {
      const { body: { msg } } = await request
      .get('/api/articles?topic=tennis')
      .expect(404)
      expect(msg).toBe('Resource not found')
    });
    it('should return maximum 10 results by default', async () => {
      const { body: { articles } } = await request.get('/api/articles')
      .expect(200)
        expect(articles).toHaveLength(10)
    });
    it('should allow a custom limit', async () => {
      const { body: { articles } } = await request.get('/api/articles?limit=5')
      .expect(200)
        expect(articles).toHaveLength(5)
    });
    it('requesting page 2 should skip the first n results where n is limit', async () => {
      const { body: { articles } } = await request
        .get('/api/articles?sort_by=article_id&order=asc&page=2&limit=2')
        expect(articles[0].article_id).toBe(3)
    });
    it('requesting page 3 should skip the first n results where n is limit * 2', async () => {
      const { body: { articles } } = await request
        .get('/api/articles?sort_by=article_id&order=asc&page=3&limit=2')
        .expect(200)
        expect(articles[0].article_id).toBe(5)
    })
    it('finds an article matching entire title', async() => {
      const { body: { articles } } = await request
      .get('/api/articles?title=UNCOVERED: catspiracy to bring down democracy')
      .expect(200)
      expect(articles[0]).toEqual(
        expect.objectContaining({
        title: 'UNCOVERED: catspiracy to bring down democracy'
      })
    );
    });
    it('finds an article case insensitively', async() => {
      const { body: { articles } } = await request
      .get('/api/articles?title=UNCOVERED: CATspiracy to bring down democracy')
      .expect(200)
      expect(articles[0].title).toBe('UNCOVERED: catspiracy to bring down democracy')
    });
    it('finds multiple articles by substring', async () => {
      const { body: { articles } } = await request
      .get('/api/articles?title=cat')
      .expect(200)
      expect(articles.length).toBeGreaterThan(0)
      articles.forEach(article => {
        expect(article.title).toContain('cat')
      })
    });
  });

  describe('POST /api/articles', () => {
    it('should add an article and respond with added article', async () => {
      testReq = {
        author: 'butter_bridge', 
        title: 'buttermilk',
        body: 'some content',
        topic: 'cats'
      }
      const { body: { article } } = await request
        .post('/api/articles')
        .expect(201)
        .send(testReq)
      expect(article).toEqual(
        expect.objectContaining({
          article_id: expect.any(Number),
          title: 'buttermilk',
          topic: 'cats',
          created_at: expect.any(String),
          votes: expect.any(Number)
          })
      )
    });
    it('responds with 400 if a field is missing on request', async () => {
      testReq = {
        author: 'butter_bridge', 
        title: 'buttermilk',
        topic: 'cats'
      }
      const { body: { msg } } = await request
        .post('/api/articles')
        .expect(400)
        .send(testReq)
      expect(msg).toBe('Bad request - missing field(s)');
    });
    it('responds with 400 if a non-existent topic', async () => {
      testReq = {
        author: 'butter_bridge', 
        title: 'buttermilk',
        body: 'some content',
        topic: 'table tennis'
      }
      const { body: { msg } } = await request
        .post('/api/articles')
        .expect(400)
        .send(testReq)
      expect(msg).toBe('Bad request');
    });
    it('responds with 400 if a non-existent author', async () => {
      testReq = {
        author: 'turgenev', 
        title: 'buttermilk',
        body: 'some content',
        topic: 'cats'
      }
      const { body: { msg } } = await request
        .post('/api/articles')
        .expect(400)
        .send(testReq)
      expect(msg).toBe('Bad request');
    });
  });

  describe('GET /api/articles/new', () => {
    it('responds with articles created in last 10 minutes', async () => {
      testReq = {
        author: 'butter_bridge', 
        title: 'new article',
        body: 'some content',
        topic: 'cats'
      }
      testReq2 = {
        author: 'butter_bridge', 
        title: 'another new article',
        body: 'some content',
        topic: 'cats'
      }
      await request
        .post('/api/articles/')
        .expect(201)
        .send(testReq)
      await request
        .post('/api/articles/')
        .expect(201)
        .send(testReq2)
      const { body: { articles } } = await request
        .get('/api/articles/new')
        .expect(200)
      expect(articles).toHaveLength(2)
      const currentTime = new Date
      articles.forEach(article => {
        const createdTime = new Date(article.created_at)
        expect(currentTime - createdTime).toBeGreaterThanOrEqual(0)
        expect(currentTime - createdTime).toBeLessThanOrEqual(600000)
      })
    });
  });
});

describe('Articles / by ID', () => {
  describe('GET api/articles/:article_id', () => {
    it('status 200 - returns an object with the relevant article', async () => {
      const { body: { article } } = await request
        .get('/api/articles/1')
        .expect(200)
        expect(article.article_id).toBe(1)
        expect(article).toEqual(
            expect.objectContaining({
            article_id: 1,
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
  
    it('calculates comment count', async () => {
      let res1 = request
        .get('/api/articles/1')
      let res2 = request
        .get("/api/articles/1/comments?limit=15")
      const [article, comments] = await Promise.all([res1, res2])
      expect(article.body.comment_count).toBe(comments.body.length)
    })
    it('works with articles without comments', async () => {
      let { body: { article: { comment_count } } } = await request
      .get('/api/articles/8')
      .expect(200)
    expect(comment_count).toBe(0)
    });
    it('status 404, well-formed but non-existent article ID', async () => {
      const { body: { msg } } = await request
        .get("/api/articles/899")
        .expect(404)
        expect(msg).toBe('Resource not found')
    });
    it('status 400, malformed id', async () => {
      const { body: { msg } } = await request
      .get("/api/articles/albania")
      .expect(400)
      expect(msg).toBe('Bad request - invalid data type')
    });
  })
  
  describe('PATCH /api/articles/:article_id', () => {
    it('increments an articles vote, responds with article', async () => {
      const { body: { article } } = await request
      .patch('/api/articles/2')
      .expect(200)
      .send({ inc_votes: 1 })
        expect(article).toEqual(
            expect.objectContaining({ votes: 1 })
        )
    });  
    it('decrements an articles vote, responds with article', async () => {
      const { body: { article } } = await request
      .patch('/api/articles/1')
      .expect(200)
      .send({ inc_votes: -1 })
        expect(article).toEqual(
            expect.objectContaining({ votes: 99 })
        )
    });  
    it('edits an article body, responds with article', async () => {
      const { body: { article } } = await request
      .patch('/api/articles/1')
      .expect(200)
      .send({ body: 'new_text' })
        expect(article).toEqual(
            expect.objectContaining({ body: 'new_text' })
        )
    });  
    it('rejects with 404 given non-existent ID', async () => {
      const { body: { msg } } = await request
      .patch('/api/articles/200')
      .expect(404)
      .send({ inc_votes: 1, body: 'new_text' })
        expect(msg).toBe('Resource not found')
    });  
    it('rejects with 400 given request without inc_vote or body', async () => {
      const { body: { msg } } = await request
      .patch('/api/articles/2')
      .expect(400)
      .send({})
        expect(msg).toBe('Bad request - missing field(s)')
    });  
    it('rejects with 400 given inc_vote of 0', async () => {
      const { body: { msg } } = await request
      .patch('/api/articles/2')
      .expect(400)
      .send({ inc_votes: 0})
        expect(msg).toBe('Bad request - invalid vote')
    });  
    it('rejects with 400 given inc_vote not 1 or -1', async () => {
      const { body: { msg } } = await request
      .patch('/api/articles/2')
      .expect(400)
      .send({ inc_votes: 9})
        expect(msg).toBe('Bad request - invalid vote')
    });  
    it('rejects with 400 given invalid data type for inc_votes', async () => {
      const { body: { msg } } = await request
      .patch('/api/articles/2')
      .expect(400)
      .send({ inc_votes: 'Leeds' })
        expect(msg).toBe('Bad request - invalid vote')
    }); 
    it('prevents voting twice', async () => {
      await request
      .patch('/api/articles/2')
      .expect(200)
      .send({ inc_votes: 1 })
      const { body: { msg } } = await request
      .patch('/api/articles/2')
      .expect(400)
      .send({ inc_votes: 1})
        expect(msg).toBe('Bad request')
    });
  });
  
  describe('DELETE /api/articles/:article_id', () => {
    it('deletes an article by id param, status 204', async () => {
      await request
        .delete('/api/articles/3')
        .expect(204)
    });
    it('cascade deletes associated comments', async () => {
      await request
      .get('/api/articles/3/comments')
      .expect(200)
      await request
      .delete('/api/articles/3')
      .expect(204)
      await request
      .get('/api/articles/3/comments')
      .expect(404)
    });
    it('non-existent article_id, 404', async () => {
      const { body: { msg } } = await request
        .delete('/api/articles/399')
        .expect(404)
      expect(msg).toBe('Resource not found')
    });  
    it('malformed article id, 400', async () => {
      const { body: { msg } } = await request
        .delete('/api/articles/goodbye')
        .expect(400)
      expect(msg).toBe('Bad request - invalid data type')
    });  
  });
});

describe('Articles / by ID / comments', () => {
  describe('GET /api/articles/:article_id/comments', () => {
    it('responds with all commment objects relating to the article_id parameter', async () => {
      const { body: { comments }} = await request
      .get("/api/articles/1/comments")
      .expect(200)
      expect(comments.length).toBeGreaterThan(0)
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
    it('non-existent article ID gives 404', async () => {
      const { body: { msg } } = await request
      .get('/api/articles/1000/comments')
      .expect(404)
      expect(msg).toBe('Resource not found')
    });
    it('existent article ID with no comments gives 200 and empty array', async () => {
      const { body: { comments } } = await request
      .get('/api/articles/2/comments')
      .expect(200)
      expect(comments).toEqual([])
    });
    it('400 - malformed article ID', async () => {
      const { body: { msg } } = await request
      .get('/api/articles/beetroot/comments')
      .expect(400)
      expect(msg).toBe('Bad request - invalid data type')
    });
    it('should return maximum 10 results by default', async () => {
      const { body: { comments } } = await request
        .get('/api/articles/1/comments')
        expect(comments).toHaveLength(10)
    });
    it('should allow a custom limit', async () => {
      const { body: { comments } } = await request
        .get('/api/articles/1/comments?limit=5')
        expect(comments).toHaveLength(5)
    });
    it('requesting page 2 should skip the first n results where n is limit', async () => {
      const { body: { comments } } = await request
        .get('/api/articles/1/comments?limit=2&page=2')
        expect(comments[0].comment_id).toBe(4)
    });
    it('requesting page 3 should skip the first n results where n is limit * 2', async () => {
      const { body: { comments } } = await request
        .get('/api/articles/1/comments?limit=2&page=3')
        expect(comments[0].comment_id).toBe(6)
    })
  });
  
  describe('POST /api/articles/:article_id/comments', () => {
    it('take a request with username and body and respond with the created comment', async () => {
      const testPost = {username: "icellusedkars", body: "here is my interesting post"}
      const { body: { comment } } = await request
        .post('/api/articles/3/comments')
        .expect(201)
        .send(testPost)
      expect(comment).toEqual(
        expect.objectContaining({
        comment_id: expect.any(Number),
        author: 'icellusedkars',
        article_id: 3,
        created_at: expect.any(String),
        body: 'here is my interesting post'
        })
     );
    });
    it('responds with 400 if a field is missing on request', async () => {
      const testPost = {username: "icellusedkars"}
      const { body: { msg } } = await request
        .post('/api/articles/4/comments')
        .expect(400)
        .send(testPost)
      expect(msg).toBe('Bad request - missing field(s)');
    });
    it('responds with 404 if a non-existent username', async () => {
      const testPost = {username: "not_user", body: "here is my interesting post"}
      const { body: { msg } } = await request
        .post('/api/articles/4/comments')
        .expect(404)
        .send(testPost)
      expect(msg).toBe('Resource not found');
    });
    it('status 400, malformed article_id param', async () => {
      const testPost = {username: "icellusedkars", body: "here is my interesting post"}
      const { body: { msg } } = await request
      .post('/api/articles/not_an_id/comments')
      .expect(400)
      .send(testPost)
    expect(msg).toBe('Bad request - invalid data type')
    });
    it('status 404, non-existent article_id', async () => {
      const testPost = {username: "icellusedkars", body: "here is my interesting post"}
      const { body: { msg } } = await request
      .post('/api/articles/9999/comments')
      .expect(404)
      .send(testPost)
    expect(msg).toBe('Resource not found')
    });
    it('ignores unnecessary properties on request', async() => {
      const testPost = {
        username: "icellusedkars", 
        body: "here is my interesting post",
        extra_col: 'extra value'  
      }
      const { body: { comment } } = await request
        .post('/api/articles/3/comments')
        .expect(201)
        .send(testPost)
      expect(comment).toEqual(
        expect.objectContaining({
        comment_id: expect.any(Number),
        author: 'icellusedkars',
        article_id: 3,
        created_at: expect.any(String),
        body: 'here is my interesting post'
        }))
    });
  });
});

describe('Comments', () => {
  describe('PATCH /api/comments/:comment_id', () => {
    it('increments a comments votes by given amount, responds with comment', async () => {
      const { body: { comment } } = await request
      .patch('/api/comments/2').expect(200)
      .send({ inc_votes: 1 })
        expect(comment).toEqual(
            expect.objectContaining({ votes: 15 })
        )
    });  
    it('decrements a comments votes by given amount, responds with comment', async () => {
      const { body: { comment } } = await request
      .patch('/api/comments/2').expect(200)
      .send({ inc_votes: -1 })
        expect(comment).toEqual(
            expect.objectContaining({ votes: 13 })
        )
    });  
    it('edits a comment body, responds with comment', async () => {
      const { body: { comment } } = await request
      .patch('/api/comments/2').expect(200)
      .send({ body: 'newtext' })
        expect(comment).toEqual(
            expect.objectContaining({ body: 'newtext' })
        )
    });  
    it('rejects with 404 given non-existent ID', async () => {
      const { body: { msg } } = await request
      .patch('/api/comments/200').expect(404)
      .send({ inc_votes: 1 })
        expect(msg).toBe('Resource not found')
    });  
    it('rejects with 400 given request without inc_vote or body', async () => {
      const { body: { msg } } = await request
      .patch('/api/comments/2').expect(400)
      .send({})
        expect(msg).toBe('Bad request - missing field(s)')
    });  
    it('rejects with 400 given inc_vote of 0', async () => {
      const { body: { msg } } = await request
      .patch('/api/comments/1').expect(400)
      .send({ inc_votes: 0 })
        expect(msg).toBe('Bad request - invalid vote')
    });  
    it('rejects with 400 given invalid data type on inc vote', async () => {
      const { body: { msg } } = await request
      .patch('/api/comments/2').expect(400)
      .send({ inc_votes: 'Leeds' })
        expect(msg).toBe('Bad request - invalid data type')
    }); 
  });
  describe('DELETE /api/comments/:comment_id', () => {
    it('deletes a comment by id param, status 204', async () => {
      await request
        .delete('/api/comments/3')
        .expect(204)
    });  
    it('non-existent comment_id, 404', async () => {
      const { body: { msg } } = await request
        .delete('/api/comments/399')
        .expect(404)
      expect(msg).toBe('Resource not found')
    });  
    it('malformed comment id, 400', async () => {
      const { body: { msg } } = await request
        .delete('/api/comments/goodbye')
        .expect(400)
      expect(msg).toBe('Bad request - invalid data type')
    });  
  });
  describe('GET /api/comments/new', () => {
    it('responds with comments created in last 10 minutes', async () => {
      testReq = {
        username: 'butter_bridge', 
        body: 'new comment',
      }
      testReq2 = {
        username: 'butter_bridge', 
        body: 'another new comment',
      }
      await request
        .post('/api/articles/1/comments')
        .expect(201)
        .send(testReq)
      await request
        .post('/api/articles/1/comments')
        .expect(201)
        .send(testReq2)
      const { body: { comments } } = await request
        .get('/api/comments/new')
        .expect(200)
      expect(comments).toHaveLength(2)
      const currentTime = new Date
      comments.forEach(comment => {
        const createdTime = new Date(comment.created_at)
        expect(currentTime - createdTime).toBeGreaterThanOrEqual(0)
        expect(currentTime - createdTime).toBeLessThanOrEqual(600000)
      })
    });
  });
});

describe('Users + Users / by ID ', () => {
  describe('GET /api/users', () => {
    it('should respond with an array of all users', async () => {
      const { body: { users }} = await request
      .get("/api/users")
      .expect(200)
      expect(users).toBeInstanceOf(Array);
      expect(users.length).toBeGreaterThan(0)
      users.forEach((user) => {
        expect(user).toMatchObject({
          name: expect.any(String),
          avatar_url: expect.any(String),
          username: expect.any(String),
        });
      });
    });
  });
  describe('GET /api/users/:username', () => {
    it('responds with relevant user object', async () => {
      const { body: { user } } = await request
      .get('/api/users/rogersop')
      .expect(200)
      expect(user.username).toBe('rogersop')
      expect(user).toEqual(
          expect.objectContaining({
          username: 'rogersop',
          avatar_url: expect.any(String),
          name: expect.any(String),
          })
      );
    });
    it('non-existent username, 404', async () => {
      const { body: { msg } } = await request
        .get('/api/users/not_user_here')
        .expect(404)
      expect(msg).toBe('Resource not found')
    });  
  });
  describe('PATCH /api/users/:username', () => {
    it('updates username, responds with user object', async () => {
      const { body: { user } } = await request
      .patch('/api/users/rogersop').expect(200)
      .send({ username: 'my_new_username' })
        expect(user).toEqual(
            expect.objectContaining({ username: 'my_new_username' })
        )
    });
    it('updates name, responds with user object', async () => {
      const { body: { user } } = await request
      .patch('/api/users/rogersop').expect(200)
      .send({ name: 'my_new_name' })
        expect(user).toEqual(
            expect.objectContaining({ name: 'my_new_name' })
        )
    });
    it('updates avatar_url, responds with user object', async () => {
      const { body: { user } } = await request
      .patch('/api/users/rogersop').expect(200)
      .send({ username: 'http://my.new.avatar' })
        expect(user).toEqual(
            expect.objectContaining({ username: 'http://my.new.avatar' })
        )
    });
    it('rejects with 404 given non-existent username', async () => {
      const { body: { msg } } = await request
      .patch('/api/users/not_a_user').expect(404)
      .send({ 
        username: 'my_new_username',
        name: 'New Name',
        avatar_url: 'new.url'
       })
        expect(msg).toBe('Resource not found')
    }); 
    it('rejects with 400 given request without username name, or avatar url', async () => {
      const { body: { msg } } = await request
      .patch('/api/users/rogersop').expect(400)
      .send({})
        expect(msg).toBe('Bad request - missing field(s)')
    });
    it('cascade updates author FKs on comments and articles', async () => {
      await request
        .patch('/api/users/butter_bridge').expect(200)
        .send({ username: 'my_new_username' })
      const res1 = await request
        .get('/api/articles/1')
      const res2 = await request
        .get('/api/articles/1/comments')
      expect(res1.body.article).toEqual(
        expect.objectContaining({ author: 'my_new_username' })
      )
      expect(res2.body.comments[0]).toEqual(
        expect.objectContaining({ author: 'my_new_username' })
      )
    });
  });
  describe('GET /api/users/:username/likes', () => {
    it('should respond with an array of all articles upvoted', async () => {
      await request
        .patch('/api/articles/2')
        .expect(200)
        .send({ inc_votes: 1 })
      await request
        .patch('/api/articles/4')
        .expect(200)
        .send({ inc_votes: 1 })
      const { body: { likes } } = await request
        .get('/api/users/test_user/likes')
        .expect(200)
      expect(likes).toHaveLength(2)
      expect(likes[0].article_id).toBe(2)
      expect(likes[1].article_id).toBe(4)
    });
    it('should respond with an array of all articles upvoted', async () => {
      await request
        .patch('/api/articles/2')
        .expect(200)
        .send({ inc_votes: 1 })
      await request
        .patch('/api/articles/4')
        .expect(200)
        .send({ inc_votes: 1 })
      const { body: { likes } } = await request
        .get('/api/users/test_user/likes')
        .expect(200)
      expect(likes).toHaveLength(2)
      expect(likes[0].article_id).toBe(2)
      expect(likes[1].article_id).toBe(4)
    });
    it('should ignore downvotes', async () => {
      await request
        .patch('/api/articles/2')
        .expect(200)
        .send({ inc_votes: 1 })
      await request
        .patch('/api/articles/4')
        .expect(200)
        .send({ inc_votes: -1 })
      const { body: { likes } } = await request
        .get('/api/users/test_user/likes')
        .expect(200)
      expect(likes).toHaveLength(1)
      expect(likes[0].article_id).toBe(2)
    });
    it('empty array if no likes', async () => {
      const { body: { likes } } = await request
        .get('/api/users/test_user/likes')
        .expect(200)
      expect(likes).toEqual([])
    });
    it('should ', async () => {
      const { body: { msg } } = await request
        .get('/api/users/not_a_user/likes')
        .expect(404)
      expect(msg).toBe('Resource not found')
    });
  });
});

describe('Users / signup / login / logout / authentication', () => {
  describe('POST /api/users/signup', () => {
    it('should add a user and respond with added user', async () => {
      const testReq = { 
        username: 'sonic_hedgehog',
        name: 'Joe Warburton',
        avatar_url: 'http://img.url',
        password: 'pizza'
      }
      const { body: { user } } = await request
      .post('/api/users/signup')
      .expect(201)
      .send(testReq)
    expect(user).toEqual(
      expect.objectContaining({
        username: 'sonic_hedgehog',
        avatar_url: 'http://img.url',
        name: 'Joe Warburton',
        })
      )
    });
    it('should detect a taken username', async () => {
      const testReq = { 
        username: 'sonic_hedgehog',
        name: 'Joe Warburton',
        avatar_url: 'http://img.url',
        password: 'pizza'
      }
      await request
      .post('/api/users/signup')
      .expect(201)
      .send(testReq)
      const testReq2 = {
        username: 'sonic_hedgehog',
        name: 'JW',
        avatar_url: 'http://img2.url',
        password: 'calzone'
      }
      const { body: { msg } } = await request 
      .post('/api/users/signup')
      .expect(400)
      .send(testReq2)
    expect(msg).toBe('Username is taken')
    });
    it('missing fields on request, 400', async () => {
      const testReq = {
        username: 'sonic_hedgehog',
        avatar_url: 'http://img2.url',
        password: 'calzone'
      }
      const { body: { msg } } = await request 
      .post('/api/users/signup')
      .expect(400)
      .send(testReq)
    expect(msg).toBe('Bad request - missing field(s)')
    });
  });
  describe('POST /api/users/login', () => {
    it('should log in a user with correct password', async () => {
    const testUser = { 
        username: 'logic1000',
        name: 'Susanne Kraft',
        avatar_url: 'http://img.url',
        password: 'octopus'
      }
      const { body: { user: newUser }} = await request
        .post('/api/users/signup')
        .send(testUser)
      const testLogin = {
        username: 'logic1000',
        password: 'octopus',
      }
      const loggedIn = await request
        .post('/api/users/login')
        .send(testLogin)
        .expect(200)
      expect(loggedIn.body).toEqual(
        expect.objectContaining({ accessToken: expect.any(String) }))
    })
    it('should refuse login with an incorrect password', async () => {
    const testUser = { 
        username: 'logic1000',
        name: 'Susanne Kraft',
        avatar_url: 'http://img.url',
        password: 'octopus'
      }
      await request
        .post('/api/users/signup')
        .send(testUser)
      const testLogin = {
        username: 'logic1000',
        password: 'squid',
      }
      const loggedIn = await request
        .post('/api/users/login')
        .send(testLogin)
        .expect(400)
      expect(loggedIn.body.msg).toBe('Incorrect password')
    });
    it('should refuse login with an non-existent username', async () => {
    const testUser = { 
        username: 'logic1000',
        name: 'Susanne Kraft',
        avatar_url: 'http://img.url',
        password: 'octopus'
      }
      const { body: { user: newUser }} = await request
        .post('/api/users/signup')
        .send(testUser)
      const testLogin = {
        username: 'logic100',
        password: 'squid',
        salt: newUser.salt
      }
      const loggedIn = await request
        .post('/api/users/login')
        .send(testLogin)
        .expect(400)
      expect(loggedIn.body.msg).toBe('User not found')
    });
    it('missing fields on request, 400', async () => {
      const testReq = {
        password: 'calzone'
      }
      const { body: { msg } } = await request 
      .post('/api/users/login')
      .expect(400)
      .send(testReq)
    expect(msg).toBe('Bad request - missing field(s)')
    });
  });
  describe('auth middleware', () => {
    it('responds with 401 - Unauthorised when JWT not in header', async () => {
      const { body: { msg }} = await request
        .get('/api/articles')
        .set('Authorization', 'not a token')
        .expect(401)
      expect(msg).toBe('Unauthorised')
    });
  });
});

describe('Misc', () => {
  describe('GET /api/', () => {
    it('should serve up an object with keys describing endpoints', async () => {
      const { body: { endpoints } } = await request
      .get("/api/")
      .expect(200)
      expect(endpoints).toEqual(
        expect.objectContaining({
        'GET /api': expect.any(Object)
        }))
    });
  });
  describe('GET /not-a-route', () => {
    it('status 404, relevant message', async () => {
      const { body: { msg } } = await request
        .get("/not_a_route")
        .expect(404)
        expect(msg).toBe('Route not found')
    });
  });
});

