const chai = require('chai')
const expect = chai.expect
const pkg = require('../package.json')
const resolve = require('path').resolve
const should = chai.should()
const path = require('path')

const gid = require('shortid').generate
const co = require('co')
const { transfer, initDb } = require('..')

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
      timestamps: true
    },
    modelsFolder: path.resolve(__dirname, './models-old')
  }
  
//new data define
let newDb = {
  dialect: 'postgres',
  host: 'localhost',
  database: 'dbname2',
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
    timestamps: true
  },
  modelsFolder: path.resolve(__dirname, './models-new')
}

//config
let transferConfig = [{
  from: 'User', //old db Model Name
  to: 'User', //new db Model Name
  transfer: old => {
    let id = gid()
    return {
      id,
      username: old.username
    }
  }
}, {
  from: 'Company', //old db Model Name
  to: 'Company', //new db Model Name
  transfer: old => {
    let id = gid()
    return {
      id,
      name: old.name
    }
  }
}]

describe(pkg.name, function() {
  let sql2, sql
  it('it should work', function(done) {

    //init data
    co(function*() {
      sql = yield initDb(oldDb)
      sql2 = yield initDb(newDb)
      yield sql.db.User.destroy({
        where: {}
      })
      yield sql.db.Company.destroy({
        where: {}
      })
      yield sql2.db.User.destroy({
        where: {}
      })
      yield sql2.db.Company.destroy({
        where: {}
      })
      yield sql.db.User.bulkCreate([{
        username: 'x1'
      }, {
        username: 'x2'
      }])
      yield sql.db.Company.bulkCreate([{
        name: 'c1'
      }, {
        name: 'c2'
      }])
      return Promise.resolve()
    })
    .then(() => {
      //now do the transfer
      return transfer({oldDb, newDb, transferConfig})
    })
    .then(() => sql2.db.User.findAll())
    .then(res => {
      let all = res.map(r => r.get({ plain: true }))
      let count = all.length
      expect(count).to.equal(2)
      expect(all[0].username).to.equal('x1')
      expect(all[1].username).to.equal('x2')
      return sql2.db.Company.findAll()
    })
    .then(res => {
      let all = res.map(r => r.get({ plain: true }))
      let count = all.length
      expect(count).to.equal(2)
      expect(all[0].name).to.equal('c1')
      expect(all[1].name).to.equal('c2')
      done()
    }) 
    .catch(e => console.log(e.stack))

  })
  
})


