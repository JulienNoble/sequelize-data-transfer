# sequelize-data-transfer

Based on
[zxdong262's original repo](https://github.com/zxdong262/sequelize-data-transfer),
adds bulk and global conditional cloning.

This was motivated by the fact we use this package internally to fast clone huge
dbs for testing, development and utilities. In terms of data volume, we're
talking the equivalent of 300MB+ flat sql dumps. The original package would
insert records one at a time, so as soon as you would have more than 2000
entries, the operation would take ages. Hence the need to make bulk inserts and
filter the data globally if there are some global foreign patterns, like cloning
data only for a specific customer for example.

The key points are :

* transfer `sequelize` db data from one db to another db, with different data
  model.
* designed only for `sequelize.import` user.
* clone all or part of your data
* clone fast

## use

```javascript
const { transfer } = require('sequelize-data-transfer');
let path = require('path');

// old data define
let oldDb = {
  dialect: 'postgres',
  host: 'localhost',
  database: 'dbname1',
  username: 'username1',
  password: 'password1',
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
  port: 5432,
  define: {
    charset: 'utf8',
    timestamps: false,
  },
  modelsFolder: path.resolve(__dirname, './old-db-models'),
};

// new data define
let newDb = {
  dialect: 'postgres',
  host: 'localhost',
  database: 'dbname2',
  username: 'username2',
  password: 'password2',
  pool: {
    max: 5,
    min: 0,
    idle: 10000,
  },
  port: 5432,
  define: {
    charset: 'utf8',
    timestamps: false,
  },
  modelsFolder: path.resolve(__dirname, './new-db-models'),
};

// config
let transferConfig = {
  clone: true, // if true, clones the entire db, else uses the array property
  array: [
    {
      from: 'OldUser', //old db Model Name
      to: 'User', //new db Model Name
      transfer: old => {
        return {
          id: old.id,
          name: old.user_name,
        };
      },
    },
  ],
  // sequelize options passed when getting rows from old db
  // you can pass any sequelize option, include, where
  // if raw is true, the inserts will be in bulk
  // if false, the inserts will be one row at a time
  queryOptions: { raw: true },
};

// global conditions applied to getting rows from old db if applicable
// each array represents one column and the search pattern
// the pattern respects Sequelize's operators, so you can use Op.*
// the query is built based on what columns the current model has
// if a model does not have a column, the condition is ignored
// if only one column is present, only this one will be added to
// model condition
let where = [{ userId: 42 }, { customerId: 13 }];

// if queryOptions.raw is true, transfer will insert in bulk
// by default, bulk inserts are divided in bulks of 10000 rows at a time
// to prevent max_allowed_packet exceptions, you can limit globally or
// specifically how much rows go into a bulk division
let bulkLimit = {
  default: 5000, // applies to all models and replaces default 10000
  User: 10, // applies only to model named User
};

// you can add custom log and error functions
// if ommited, will default to console.debug
// and console.error
let logFn = (...args) => {
  console.log('Transfer:', ...args);
};
let errorFn = (...args) => {
  console.error('ERROR:', ...args);
};

// now do the transfer
transfer({ oldDb, newDb, transferConfig, where, bulkLimit, logFn, errorFn })
  .then(() => {
    console.log('done');
  })
  .catch(e => {
    console.log(e.stack);
  });

//done
```

## Misc

The exported API was built to be used with `async/await` and ES6 generators. It
requires a nodejs version which supports native promises or you need to check
out projects like [bluebird](http://bluebirdjs.com/docs/getting-started.html) to
add support.

You can import `initDb` to quickly get a sequelize instance to use, for instance
to execute side operations on db before cloning it. We use it to prepare our
clone db on test environments, which includes dropping the data, cloning it with
conditions, and returning a sequelize instance to use in our tests.

```javascript
const { initDb, transfer } = require('sequelize-data-transfer');

const testDb= { /* data define */ }
const testDbInstance = await initDb(testDb);
await testDbInstance.drop();

// setup your transfer
await transfer({ /* transfer options */ });
```

## Changelog

### 16/05/2018

* added bulk insert and query options
* added global conditions
* added custom log and error functions
* added externally callable `initDb`
* prettified base code with semicolons and comma rules

## License

MIT
