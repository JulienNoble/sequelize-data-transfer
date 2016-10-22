exports.default = (sequelize, dataTypes) => {
  const Company = sequelize.define('Company',
    {
      id: {
        type: dataTypes.STRING(24),
        primaryKey: true
      },
      name: {
        type: dataTypes.STRING(50)
      }
    }, {
      tableName: 'company'
    }
  )
  return Company
}