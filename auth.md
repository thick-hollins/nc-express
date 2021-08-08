# Authorisation
## Intro
Today we'll see how we can add authorisation to our api in order to secure our data. To do this we will create a db with two tables, users and secrets about those users.
**N.B: We will never store plain text passwords but we'll start like this so we can see what's happening.**
There are a number of different ways to add authorisation, we will be using an implementation of JSON Web Tokens (JWT).
## JWT Flow
- The client sends a secure post request to the server with their login information.
- The server validates this information.
- The server then generates a unique token that the client can use to make subsequent requests with.
- This token is sent to client.
- This token is stored client-side and is sent as part of any new requests to the api.
- When the server receives the new request the token is verified that it originates from the server and is authorised.
## JSON Web Tokens
Check out the [JWT website](https://jwt.io/) for more information.
​
JWT's are made up of three parts. A header, payload and signature.
​
**Header:** contains meta information about the token, including the token type (JWT) and the algorithm used to encode. eg HS256.
​
**Payload:** information about the client using the token, e.g. username, issue time, expiry time etc.
​
**Signature:** This is how the token is certified to be valid. The signature is made by combining 3 pieces of information:
1. Base64 encoded Header
2. Base64 encoded Payload
3. A Secret key know only to the server. (e.g. client_secret) (This may be base64 encoded as well but optional)
   N.B. this secret may be generated differently depending on the algorithm. E.g RS256 uses a public key as well as a private (secret) key. The principle is the same however.
   These 3 pieces of information are joined by `.`s and then hashed using the algorithm in the header. This is how the signature is made.
   This means that the client can no longer make any changes to the token as they are missing the secret used to create the signature and the sheer number of permutations make it impossibly difficult to brute force.
   Show how a single change in the token results in the signature being invalid.
   When the client provides a token it is verified by the server to guarantee it hasn't been tampered with.
# Express
## POST /login
Let's set up this flow with an express server. First of all we need to make a route to obtain a token.
```js
app.post('/login', (req, res, next) => {
  const { username, password } = req.body;
  db.select('*')
    .from('users')
    .where('username', '=', username)
    .then(([user]) => {
      if (!user || password !== user.password)
        next({ status: 401, msg: 'invalid username or password' });
      else {
        // correct login info...
      }
    });
});
```
We check the username exists and the password matches. If so we can issue a token. To sign the token we use our secret which we will keep in the config.
N.B: Best practice is to use another randomly generated hash here.
​
config.js
```js
const NODE_ENV = process.env.NODE_ENV || 'development';
​
const config = {
  development: {
    JWT_SECRET: 'secret key'
  }
};
​
module.exports = config[NODE_ENV];
```
We can now sign our token with the secret and payload. Then send it back to our client,
docs: [https://www.npmjs.com/package/jsonwebtoken](https://www.npmjs.com/package/jsonwebtoken)
`jwt.sign(payload, secretOrPrivateKey, [options, callback])`
Default algorithm is HS256.
```js
    else {
    const token = jwt.sign(
        { user: user.username, iat: Date.now() },
        JWT_SECRET
    );
    res.send({ token });
    }
```
Now when we make another request we include this token in the headers.
It is common to accept different forms of authentication. It is convention to use the syntax '<type> <credentials>' so we will do the same when sending our token.
We send an Authorization header of `BEARER <token>`
We now need to add some protected routes. We can add a middleware function that validates the token:
```js
app.use((req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization.split(' ')[1];
    jwt.verify(token, JWT_SECRET, (err, res) => {
        // console.log success and failure here
    });
  };
})
```
Make a new request with the Authorization header and show it coming in on the `req.headers`.
If the token is verified we can allow continue to our routers, if not we can skip to our error handlers.
```js
app.use((req, res, next) => {
  const { authorization } = req.headers;
  const token = authorization.split(' ')[1];
  jwt.verify(token, JWT_SECRET, (err, res) => {
    if (err) next({ status: 401, msg: 'Unauthorised' });
    else next();
  });
});
```
Now all of our roots can only be accessed by providing a valid token. Show The 401 response if not provided.
These two functions can now be extracted to keep our app simple.
​
## Testing
As always let's test this route and make sure it works. Add some tests for the `/api/login` route.
```js
const { expect } = require('chai');
const app = require('../app');
const request = require('supertest')(app);
const connection = require('../db');
​
describe('/api', () => {
  beforeEach(() => {
    return connection.migrate
      .rollback()
      .then(() => connection.migrate.latest())
      .then(() => connection.seed.run());
  });
  after(() => connection.destroy());
  describe('/login', () => {
    it('POST responds with an access token given correct username and password', () =>
      request
        .post('/api/login')
        .send({ username: 'mitch', password: 'secure123' })
        .expect(200)
        .then(({ body }) => {
          expect(body).to.have.ownProperty('token');
        }));
    it('POST responds with status 401 for an incorrect password', () =>
      request
        .post('/api/login')
        .send({ username: 'mitch', password: 'wrong-password' })
        .expect(401)
        .then(({ body: { msg } }) => {
          expect(msg).to.equal('invalid username or password');
        }));
    it('POST responds with status 401 for an incorrect username', () =>
      request
        .post('/api/login')
        .send({ username: 'paul', password: 'secure123' })
        .expect(401)
        .then(({ body: { msg } }) => {
          expect(msg).to.equal('invalid username or password');
        }));
  });
});
```
Great, now we can see that our route is working. But we have a problem with testing our other routes. What will happen now if we try and test a route. It wil 401! When we test our endpoints we need to provide a valid token for our server.
Let's go get this token for each test. Add it to the `beforeEach`.
```js
let validToken;
beforeEach(() => {
  return connection.migrate
    .rollback()
    .then(() => connection.migrate.latest())
    .then(() => connection.seed.run())
    .then(() =>
      request
        .post('/api/login')
        .expect(200)
        .send({ username: 'mitch', password: 'secure123' })
    )
    .then(({ body: { token } }) => {
      validToken = token;
    });
});
```
To set this header on to a request we can put the valid token in scope and update it each time. Now when we make the request include it as a header using set and see the tests pass.
Note: we still need to expect(200) in the beforeEach in order to throw an exception if the hook fails. Otherwise it will hang silently.
```js
it('Responds with an array of secrets', () =>
  request
    .get('/api/secrets')
    .set('Authorization', `BEARER ${validToken}`)
    .expect(200)
    .then(({ body: { secrets } }) => {
      expect(secrets).to.be.an('Array');
      expect(secrets[0]).to.have.all.keys(
        'secret_id',
        'secret_text',
        'user_id'
      );
    }));
```
### DRY
We have a lot of tests so we could repeat this in every test... and it would work. But what's the problem with this? It's not DRY! Let's solve this problem. Rather than adding this line every time. Let's just add it to every request at the start. We can use an npm library called superagent-defaults to do this.
N.B: superagent is the request library that supertest is built on.
```js
const defaults = require('superagent-defaults');
const request = defaults(require('supertest')(app));
```
This allows us to set default request behaviour before using a request method. Let's add this to the beforeEach.
Don't return the request.set() This will hand for some strange reason, not worked out why yet.
```js
  .then(({ body: { token } }) => {
      request.set('Authorization', `BEARER ${token}`)
    }
  );
```
Now we can remove the validToken variable and our tests still run as they did before. Hooray!
N.B: if we want to test the 401 response we can overwrite the Authorization header at any point.
```js
describe('/secrets', () => {
  it('Responds with an array of secrets', () =>
    request
      .get('/api/secrets')
      .expect(200)
      .then(({ body: { secrets } }) => {
        expect(secrets).to.be.an('Array');
        expect(secrets[0]).to.have.all.keys(
          'secret_id',
          'secret_text',
          'user_id'
        );
      }));
  it('GET responds with 401 if no token provided', () =>
    request
      .get('/api/secrets')
      .set('Authorization', ``)
      .expect(401)
      .then(({ body: { msg } }) => {
        expect(msg).to.equal('unauthorised');
      }));
});
```
## Passwords
### Hashing
In this example we've used plain text passwords so we can see what they are. In practice we will never store these passwords as plain text as if they are leaked the account will be compromised. To avoid this we will store a hashed version of the password. Then when a user submits their password we will hash what they sent (as plain text) and then check if they match.
`password = hash(plainPassword)`
​
This way we never know what they stored password actually is. But we can verify it's correctness and protecting us in case of a leak.
Storing a hashed password is better, however if leaked the hash can be reversed.
Let's make this a little harder.
### Salting
To prevent this we can _salt_ the password before hashing it. Salting it adding a random string of bytes to the password before hashing. Making it significantly harder to decode.
`encryptedPassword = hash(salt + plainPassword)`
We can store the salt on the server so undoing the hash becomes significantly harder.
This is better but computers are really fast and can still brute force it. And once it has been done once, the salt is revealed and can be used for each password.
### Bcrypt
To solve this problem we will use a package called `bcrypt`. Bcrypt will do this process with for us with some added security features. It can auto-generate large salts to make the decryption harder. It will also repeat this process several times to make it harder to crack. This is called the saltRounds. When we are seeding we will store the hashes from bcrypt, rather than the plain text.
Do this in the format Users util.
```js
const bcrypt = require('bcrypt');
​
exports.formatUsers = rawUsers => {
  return rawUsers.map(user => ({
    ...user,
    password: bcrypt.hashSync(user.password, 10)
  }));
};
```
​
Here we are using a syncMethod for ease. In general we want async methods, but to keep it simple we will use this for now. Feel free to replace this with the asynchronous `bcrypt.hash` method. :)
Decrypting a bcrypt hash is sloooooww. How slow depends on the number of salt rounds used to create is The difficulty of breaking these hashes is exponential. So as processing power increases. If we are decoding on a computer that is twice as powerful then we could just increase the number of salt rounds to counteract it.
Here's a comparison of how many hashes you can decrypt a second based on the salt rounds taken to create it.
rounds=8 : ~40 hashes/sec
rounds=9 : ~20 hashes/sec
rounds=10: ~10 hashes/sec
rounds=11: ~5 hashes/sec
rounds=12: 2-3 hashes/sec
rounds=13: ~1 sec/hash
rounds=14: ~1.5 sec/hash
rounds=15: ~3 sec/hash
rounds=25: ~1 hour/hash
rounds=31: 2-3 days/hash
Let's add this comparison to our sendToken function as check if the provided password is correct.
```js
exports.sendToken = (req, res, next) => {
  const { username, password } = req.body;
  return db
    .select('*')
    .from('users')
    .where({ username })
    .then(([user]) => {
      return Promise.all([bcrypt.compare(password, user.password), user]);
    })
    .then(([passwordOk, user]) => {
      if (user && passwordOk) {
        const token = jwt.sign(
          { user: user.username, iat: Date.now() },
          JWT_SECRET
        );
        res.send({ token });
      } else {
        next({ status: 401, msg: 'invalid username or password' });
      }
    });
};
```
Notice here that we are using the async method compare. This is the one that is slow. If we used a sync version here our server would hang every time we got a log in attempt. This is obviously not tenable.
## Resources
[How to store a password](https://codahale.com/how-to-safely-store-a-password/)
## Additional
There's loads we can add to the tokens to make this more sophisticated:
- Expiry times,
- Refreshing an expired token upon request
- Adding scopes to have different levels of access to our api (admin / user/ trial etc)
- Using the `req.user` to add endpoints relating to the logged in user. e.g. /api/me/articles for articles posted by a user
This is how you can set up your own auth flow. You can also use a provider such as facebook, google, github or a dedicated provider (Auth0) that will handle this for you.
This changes the flow but let's the provider handle the security side, and we just redirect to them to authenticate.