exports.default = (sequelize, dataTypes) => {
  const User = sequelize.define('User',
    {
      id: {
        type: dataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      username: {
        type: dataTypes.STRING(50)
      }
    }, {
      tableName: 'user'
    }
  )
  return User
}