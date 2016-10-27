
const Sequelize = require('sequelize')
const co = require('co')
const fs = require('fs')
const path = require('path')

function* initDb(model) {

  let { modelsFolder } = model
  let db = {}

  const sequelize = new Sequelize(
    model.database,
    model.username,
    model.password,
    model
  )

  yield sequelize.authenticate()
  yield sequelize.sync()

  fs
    .readdirSync(modelsFolder)
    .filter(file => {
      return (file.indexOf('.') !== 0)
    })
    .forEach(file => {
      const mod = sequelize.import(path.join(modelsFolder, file))
      db[mod.name] = mod
    })

  Object.keys(db).forEach(modelName => {
    if ('associate' in db[modelName].options) {
      db[modelName].options.associate(db)
    }
  })

  sequelize.db = db
  yield sequelize.authenticate()
  yield sequelize.sync()
  return sequelize
}

function mkTransferArray(sql) {
  return Object.keys(sql.db).map(model => {
    return {
      from: model,
      to: model,
      transfer: old => old
    }
  })
}

function* work({oldDb, newDb, transferConfig}) {
  let t1 = new Date().getTime()
  let sq1 = yield initDb(oldDb)
  let sq2 = yield initDb(newDb)
  let isClone = !!transferConfig.clone
  let array = isClone ? mkTransferArray(sq2) : transferConfig.array
  for(let i = 0, len = array.length;i < len;i ++) {

    let conf = array[i]
    let {from, to, transfer} = conf
    let rows = yield sq1.db[from].findAll()
    console.log('start:trasnfer old db model:', from, 'to', 'new db model:', to)
    console.log('old db', from, 'has', rows.length, 'data')

    for(let j = 0, len1 = rows.length;j < len1;j ++) {
      let item = rows[j].get({ plain: true })
      let tar = transfer(item)
      yield sq2.db[to].create(tar)
    }

    console.log('done:trasnfer old db model:', from, 'to', 'new db model:', to)
  }



  let t2 = new Date().getTime()
  console.log('all done:')
  console.log('cost time:', (t2 - t1) / 1000, 's')

  return Promise.resolve()
}

exports.initDb = initDb

exports.transfer = ({oldDb, newDb, transferConfig}) => {
  
  return co(work({oldDb, newDb, transferConfig}))

}