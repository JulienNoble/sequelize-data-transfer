const Sequelize = require('sequelize');
const co = require('co');
const fs = require('fs');
const path = require('path');

function* initDb(model) {
  let { modelsFolder } = model;
  let db = {};

  const sequelize = new Sequelize(
    model.database,
    model.username,
    model.password,
    model,
  );

  fs
    .readdirSync(modelsFolder)
    .filter(file => {
      return file.indexOf('.') !== 0;
    })
    .forEach(file => {
      const mod = sequelize.import(path.join(modelsFolder, file));
      db[mod.name] = mod;
    });

  sequelize.db = db;
  yield sequelize.authenticate();
  yield sequelize.sync();
  return sequelize;
}

function mkTransferArray(sql) {
  return Object.keys(sql.db).map(model => {
    return {
      from: model,
      to: model,
      transfer: old => old,
    };
  });
}

// sequelize errors
function logSequelizeErrors(err, logError) {
  if (err.errors)
    err.errors.map(error =>
      logError('===> "', error.path, '"', error.type, 'error :', error.message),
    );
}

function* work(options) {
  let {
    oldDb,
    newDb,
    transferConfig,
    where,
    bulkLimit,
    logFn,
    errorFn,
  } = options;
  let log = logFn || console.debug;
  let logError = errorFn || console.error;

  let t1 = new Date().getTime();
  let sq1 = yield initDb(oldDb);
  let sq2 = yield initDb(newDb);
  let isClone = !!transferConfig.clone;
  let array = isClone ? mkTransferArray(sq2) : transferConfig.array;

  for (let i = 0, len = array.length; i < len; i++) {
    let conf = array[i];
    let { from, to, transfer } = conf;

    try {
      let rows;
      let formattedWhere = where
        ? where.reduce((query, opt) => {
            let column = Object.keys(opt)[0];
            if (sq1.db[from].rawAttributes[column])
              return { ...query, [column]: opt[column] };
            return query;
          }, {})
        : null;
      rows = yield sq1.db[from].findAll({
        ...transferConfig.queryOptions,
        where: formattedWhere,
      });

      log('start: transfer old db model:', from, 'to new db model:', to);
      if (formattedWhere && Object.keys(formattedWhere).length > 0)
        log('filtered model:', from, 'with', JSON.stringify(formattedWhere));
      log('old db', from, 'has', rows.length, 'data');

      yield sq2.transaction(transaction => {
        let promise = Promise.resolve();
        if (transferConfig.queryOptions.raw) {
          // by default 10000 records at a time to prevent max_allowed_packet exceptions
          // configurable for each table or for all
          let limit = bulkLimit[to] || bulkLimit.default || 10000;
          for (let j = 0; j < rows.length; j += limit) {
            promise = promise
              .then(() => {
                const limitedRows = rows.slice(j, j + limit);
                return sq2.db[to].bulkCreate(limitedRows, {
                  transaction,
                });
              })
              .catch(err => {
                logError(
                  'failed adding bulk items',
                  j,
                  'to',
                  j + limit,
                  'to model:',
                  to,
                  '->',
                  err.message,
                );
                logSequelizeErrors(err, logError);
              });
          }
        } else {
          for (let j = 0, len1 = rows.length; j < len1; j++) {
            let item = rows[j].get({ plain: true });
            let tar = transfer(item);
            promise = promise
              .then(() => sq2.db[to].create(tar, { transaction }))
              .catch(err => {
                logError(
                  'failed adding item',
                  j,
                  'to model:',
                  to,
                  '->',
                  err.message,
                );
                logSequelizeErrors(err, logError);
              });
          }
        }
        return promise;
      });
      log('done: transfer old db model:', from, 'to new db model:', to);
    } catch (err) {
      logError('failed copying model:', to, '->', err.message);
    }
  }

  let t2 = new Date().getTime();
  log('all done :');
  log('cost time :', (t2 - t1) / 1000, 's');

  return Promise.resolve();
}

exports.initDb = co.wrap(initDb);

exports.transfer = options => {
  return co(work(options));
};
