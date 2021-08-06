# REST API: nc-express 

A server running this app allows users to post articles, comment on articles, and up- and down-vote articles and comments.

## Hosted project

  https://nc-express.herokuapp.com/api

## Installation

Clone this app to a local directory by running

    git clone https://github.com/thick-hollins/nc-express.git

To install its dependencies run 

    npm install

Install [PostgreSQL](https://www.postgresql.org/) locally. To initialise the PSQL database, create a `setup.sql` file in the `db` directory in the following format, replacing `test_database_name` and `development_database_name` with your chosen names for each

```
DROP DATABASE IF EXISTS test_database_name;
DROP DATABASE IF EXISTS development_database_name;

CREATE DATABASE test_database_name;
CREATE DATABASE development_database_name;
```

The following script will then create the database

    npm run setup-dbs

To provide PSQL and the testing package the name of your database, you must create a `.env.test` file containing `PGDATABASE=test_database_name` and a `.env.devlopment` file conmtaining `PGDATABASE=development_database_name`

The development database is seeded by running 

    npm run seed

The test suite is run with

    npm run test

## Global dependencies

* `node.js v14.17.1`
* `PostgreSQL v12.7`