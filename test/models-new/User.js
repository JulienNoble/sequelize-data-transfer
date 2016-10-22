
exports.default = (sequelize, dataTypes) => {
  const User = sequelize.define('User',
    {
      id: {
        type: dataTypes.STRING(24),
        primaryKey: true
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
