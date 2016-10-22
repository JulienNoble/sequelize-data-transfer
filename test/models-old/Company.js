exports.default = (sequelize, dataTypes) => {
  const Company = sequelize.define('Company',
    {
      id: {
        type: dataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
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