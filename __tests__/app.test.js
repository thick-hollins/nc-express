const db = require("../db/connection.js");
const request = require("supertest");
const testData = require("../db/data/test-data/index.js");
const seed = require("../db/seeds/seed.js");
const app = require("../app.js");

beforeEach(() => seed(testData));
afterAll(() => db.end());

describe('Topics', () => {
  describe("GET /api/topics", () => {
    it("status 200 - returns an object with an array of topic objects on a key of topics", async () => {
      const { body: { topics }} = await request(app)
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
      const { body: { topic } } = await request(app)
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
      const { body: { msg } } = await request(app)
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
      const { body: { articles } } = await request(app)
      .get('/api/articles?limit=15')
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
      .get('/api/articles?order=asc&limit=15')
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
      .expect(200)
      articles.forEach((article) => {
          expect(article.author).toBe('butter_bridge')
        });
    });
    it('queries by topic', async () => {
      const { body: { articles } } = await request(app)
      .get('/api/articles?topic=mitch')
      .expect(200)
      articles.forEach((article) => {
          expect(article.topic).toBe('mitch')
        });
    });
    it('given existant topic with no linked articles, returns an empty array', async () => {
      const { body: { articles } } = await request(app)
      .get('/api/articles?topic=paper')
      .expect(200)
      expect(articles).toEqual([])
    });
    it('given existant author with no linked articles, returns an empty array', async () => {
      const { body: { articles } } = await request(app)
      .get('/api/articles?author=lurker')
      .expect(200)
      expect(articles).toEqual([])
    });
    it('given well-formed but non-existant topic, responds with 404', async () => {
      const { body: { msg } } = await request(app)
      .get('/api/articles?topic=tennis')
      .expect(404)
      expect(msg).toBe('Resource not found')
    });
    it('should return maximum 10 results by default', async () => {
      const { body: { articles } } = await request(app).get('/api/articles')
      .expect(200)
        expect(articles).toHaveLength(10)
    });
    it('should allow a custom limit', async () => {
      const { body: { articles } } = await request(app).get('/api/articles?limit=5')
      .expect(200)
        expect(articles).toHaveLength(5)
    });
    it('requesting page 2 should skip the first n results where n is limit', async () => {
      const { body: { articles } } = await request(app)
        .get('/api/articles?sort_by=article_id&order=asc&page=2&limit=2')
        expect(articles[0].article_id).toBe(3)
    });
    it('requesting page 3 should skip the first n results where n is limit * 2', async () => {
      const { body: { articles } } = await request(app)
        .get('/api/articles?sort_by=article_id&order=asc&page=3&limit=2')
        .expect(200)
        expect(articles[0].article_id).toBe(5)
    })
  });
  
  describe('POST /api/articles', () => {
    it('should add an article and respond with added article', async () => {
      testReq = {
        author: 'butter_bridge', 
        title: 'buttermilk',
        body: 'some content',
        topic: 'cats'
      }
      const { body: { article } } = await request(app)
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
      const { body: { msg } } = await request(app)
        .post('/api/articles')
        .expect(400)
        .send(testReq)
      expect(msg).toBe('Bad request - missing field(s)');
    });
    it('responds with 400 if a non-existant topic', async () => {
      testReq = {
        author: 'butter_bridge', 
        title: 'buttermilk',
        body: 'some content',
        topic: 'table tennis'
      }
      const { body: { msg } } = await request(app)
        .post('/api/articles')
        .expect(400)
        .send(testReq)
      expect(msg).toBe('Bad request');
    });
    it('responds with 400 if a non-existant author', async () => {
      testReq = {
        author: 'turgenev', 
        title: 'buttermilk',
        body: 'some content',
        topic: 'cats'
      }
      const { body: { msg } } = await request(app)
        .post('/api/articles')
        .expect(400)
        .send(testReq)
      expect(msg).toBe('Bad request');
    });
  });
});

describe('Articles / by ID', () => {
  describe('GET api/articles/:article_id', () => {
    it('status 200 - returns an object with the relevant article', async () => {
      const { body: { article } } = await request(app)
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
      let res1 = request(app)
        .get('/api/articles/1')
      let res2 = request(app)
        .get("/api/articles/1/comments?limit=15")
      const [article, comments] = await Promise.all([res1, res2])
      expect(article.body.comment_count).toBe(comments.body.length)
    })
    it('works with articles without comments', async () => {
      let { body: { article: { comment_count } } } = await request(app)
      .get('/api/articles/8')
      .expect(200)
    expect(comment_count).toBe(0)
    });
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
      .patch('/api/articles/2')
      .expect(200)
      .send({ inc_votes: 1 })
        expect(article).toEqual(
            expect.objectContaining({ votes: 1 })
        )
    });  
    it('increments an articles votes by given amount, responds with article', async () => {
      const { body: { article } } = await request(app)
      .patch('/api/articles/1')
      .expect(200)
      .send({ inc_votes: -1 })
        expect(article).toEqual(
            expect.objectContaining({ votes: 99 })
        )
    });  
    it('rejects with 404 given non-existant ID', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/articles/200')
      .expect(404)
      .send({ inc_votes: 1 })
        expect(msg).toBe('Resource not found')
    });  
    it('rejects with 400 given request without inc_vote', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/articles/2')
      .expect(400)
      .send({})
        expect(msg).toBe('Bad request - invalid vote')
    });  
    it('rejects with 400 given inc_vote of 0', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/articles/2')
      .expect(400)
      .send({ inc_vote: 0})
        expect(msg).toBe('Bad request - invalid vote')
    });  
    it('rejects with 400 given invalid data type', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/articles/2')
      .expect(400)
      .send({ inc_votes: 'Leeds' })
        expect(msg).toBe('Bad request - invalid data type')
    }); 
  });
  
  describe('DELETE /api/articles/:article_id', () => {
    it('deletes an article by id param, status 204', async () => {
      await request(app)
        .delete('/api/articles/3')
        .expect(204)
    });
    it('cascade deletes associated comments', async () => {
      await request(app)
      .get('/api/articles/3/comments')
      .expect(200)
      await request(app)
      .delete('/api/articles/3')
      .expect(204)
      await request(app)
      .get('/api/articles/3/comments')
      .expect(404)
    });
    it('non-existant article_id, 404', async () => {
      const { body: { msg } } = await request(app)
        .delete('/api/articles/399')
        .expect(404)
      expect(msg).toBe('Resource not found')
    });  
    it('malformed article id, 400', async () => {
      const { body: { msg } } = await request(app)
        .delete('/api/articles/goodbye')
        .expect(400)
      expect(msg).toBe('Bad request - invalid data type')
    });  
  });
});

describe('Articles / by ID / comments', () => {
  describe('GET /api/articles/:article_id/comments', () => {
    it('responds with all commment objects relating to the article_id parameter', async () => {
      const { body: { comments }} = await request(app)
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
    it('should return maximum 10 results by default', async () => {
      const { body: { comments } } = await request(app)
        .get('/api/articles/1/comments')
        expect(comments).toHaveLength(10)
    });
    it('should allow a custom limit', async () => {
      const { body: { comments } } = await request(app)
        .get('/api/articles/1/comments?limit=5')
        expect(comments).toHaveLength(5)
    });
    it('requesting page 2 should skip the first n results where n is limit', async () => {
      const { body: { comments } } = await request(app)
        .get('/api/articles/1/comments?limit=2&page=2')
        expect(comments[0].comment_id).toBe(4)
    });
    it('requesting page 3 should skip the first n results where n is limit * 2', async () => {
      const { body: { comments } } = await request(app)
        .get('/api/articles/1/comments?limit=2&page=3')
        expect(comments[0].comment_id).toBe(6)
    })
  });
  
  describe('POST /api/articles/:article_id/comments', () => {
    it('take a request with username and body and respond with the created comment', async () => {
      const testPost = {username: "icellusedkars", body: "here is my interesting post"}
      const { body: { comment } } = await request(app)
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
      const { body: { msg } } = await request(app)
        .post('/api/articles/4/comments')
        .expect(400)
        .send(testPost)
      expect(msg).toBe('Bad request - missing field(s)');
    });
    it('responds with 404 if a non-existant username', async () => {
      const testPost = {username: "not_user", body: "here is my interesting post"}
      const { body: { msg } } = await request(app)
        .post('/api/articles/4/comments')
        .expect(404)
        .send(testPost)
      expect(msg).toBe('Resource not found');
    });
    it('status 400, malformed article_id param', async () => {
      const testPost = {username: "icellusedkars", body: "here is my interesting post"}
      const { body: { msg } } = await request(app)
      .post('/api/articles/not_an_id/comments')
      .expect(400)
      .send(testPost)
    expect(msg).toBe('Bad request - invalid data type')
    });
    it('status 404, non-existant article_id', async () => {
      const testPost = {username: "icellusedkars", body: "here is my interesting post"}
      const { body: { msg } } = await request(app)
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
      const { body: { comment } } = await request(app)
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

describe('Comments / by ID', () => {
  describe('PATCH /api/comments/:comment_id', () => {
    it('increments a comments votes by given amount, responds with comment', async () => {
      const { body: { comment } } = await request(app)
      .patch('/api/comments/2').expect(200)
      .send({ inc_votes: 1 })
        expect(comment).toEqual(
            expect.objectContaining({ votes: 15 })
        )
    });  
    it('rejects with 404 given non-existant ID', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/comments/200').expect(404)
      .send({ inc_votes: 1 })
        expect(msg).toBe('Resource not found')
    });  
    it('rejects with 400 given request without inc_vote', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/comments/2').expect(400)
      .send({})
        expect(msg).toBe('Bad request - invalid vote')
    });  
    it('rejects with 400 given inc_vote of 0', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/comments/1').expect(400)
      .send({ inc_votes: 0 })
        expect(msg).toBe('Bad request - invalid vote')
    });  
    it('rejects with 400 given invalid data type', async () => {
      const { body: { msg } } = await request(app)
      .patch('/api/comments/2').expect(400)
      .send({ inc_votes: 'Leeds' })
        expect(msg).toBe('Bad request - invalid data type')
    }); 
  });
  describe('DELETE /api/comments/:comment_id', () => {
    it('deletes a comment by id param, status 204', async () => {
      await request(app)
        .delete('/api/comments/3')
        .expect(204)
    });  
    it('non-existant comment_id, 404', async () => {
      const { body: { msg } } = await request(app)
        .delete('/api/comments/399')
        .expect(404)
      expect(msg).toBe('Resource not found')
    });  
    it('malformed comment id, 400', async () => {
      const { body: { msg } } = await request(app)
        .delete('/api/comments/goodbye')
        .expect(400)
      expect(msg).toBe('Bad request - invalid data type')
    });  
  });
});

describe('Users + Users / by ID ', () => {
  describe('GET /api/users', () => {
    it('should respond with an array of all users', async () => {
      const { body: { users }} = await request(app)
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
      const { body: { user } } = await request(app)
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
    it('non-existant username, 404', async () => {
      const { body: { msg } } = await request(app)
        .get('/api/users/not_user_here')
        .expect(404)
      expect(msg).toBe('Resource not found')
    });  
  });
});

describe('Users / signup / login / logout', () => {
  describe('POST /api/users/signup', () => {
    it('should add a user and respond with added user', async () => {
      testReq = { 
        username: 'sonic_hedgehog',
        name: 'Joe Warburton',
        avatar_url: 'http://img.url',
        password: 'pizza'
      }
      const { body: { user } } = await request(app)
      .post('/api/users/signup')
      .expect(201)
      .send(testReq)
    expect(user).toEqual(
      expect.objectContaining({
        username: 'sonic_hedgehog',
        avatar_url: 'http://img.url',
        name: 'Joe Warburton',
        hash: expect.any(String)
        })
      )
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
      const { body: { user: newUser }} = await request(app)
        .post('/api/users/signup')
        .send(testUser)
      const testLogin = {
        username: 'logic1000',
        password: 'octopus',
        salt: newUser.salt
      }
      const loggedIn = await request(app)
        .post('/api/users/login')
        .send(testLogin)
        .expect(201)
      expect(loggedIn.body)
    });
    it('should refuse login with an incorrect password', async () => {
    const testUser = { 
        username: 'logic1000',
        name: 'Susanne Kraft',
        avatar_url: 'http://img.url',
        password: 'octopus'
      }
      const { body: { user: newUser }} = await request(app)
        .post('/api/users/signup')
        .send(testUser)
      const testLogin = {
        username: 'logic1000',
        password: 'squid',
        salt: newUser.salt
      }
      const loggedIn = await request(app)
        .post('/api/users/login')
        .send(testLogin)
        .expect(400)
      expect(loggedIn.body.msg).toBe('Incorrect password')
    });
    it('should refuse login with an non-existant username', async () => {
    const testUser = { 
        username: 'logic1000',
        name: 'Susanne Kraft',
        avatar_url: 'http://img.url',
        password: 'octopus'
      }
      const { body: { user: newUser }} = await request(app)
        .post('/api/users/signup')
        .send(testUser)
      const testLogin = {
        username: 'logic100',
        password: 'squid',
        salt: newUser.salt
      }
      const loggedIn = await request(app)
        .post('/api/users/login')
        .send(testLogin)
        .expect(400)
      expect(loggedIn.body.msg).toBe('User not found')
    });
  });
});

describe('Misc', () => {
  describe('GET /api/', () => {
    it('should serve up an object with keys describing endpoints', async () => {
      const { body: { endpoints } } = await request(app)
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
      const { body: {msg} } = await request(app)
        .get("/not_a_route")
        .expect(404)
        expect(msg).toBe('Route not found')
    });
  });
});

