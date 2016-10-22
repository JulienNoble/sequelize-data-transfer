# sequelize-data-transfer
[![Build Status](https://travis-ci.org/zxdong262/sequelize-data-transfer.svg?branch=master)](https://travis-ci.org/zxdong262/sequelize-data-transfer)

- transfer `sequelize` db data from one db to another db, with different data model.
- designed only for `sequelize.import` user.

## use
```javascript

const transfer = require('sequelize-data-transfer').transfer
let path = require('path')

//old data define
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
      timestamps: false
    },
    modelsFolder: path.resolve('./old-db-models')
  }
  
//new data define
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
    timestamps: false
  },
  modelsFolder: path.resolve('./new-db-models')
}

//config
let transferConfig = [{
  from: 'OldUser', //old db Model Name
  to: 'User', //new db Model Name
  transfer: old => {
    return {
      id: old.id,
      name: old.user_name
    }
  }
}]

//now do the transfer
transfer({oldDb, newDb, transferConfig})
.then(() => {
  console.log('done')
})
.catch(e => {
  console.log(e.stack)
})

//done
```
## License
MIT
  
  
