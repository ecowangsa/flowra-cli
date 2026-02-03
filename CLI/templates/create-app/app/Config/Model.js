const Service = require('./Service');

class Model extends Service {
  constructor(connectionName = 'default') {
    super(connectionName);
    this.setTable(null);
    this.setPrimaryKey('id');
    this.setAllowedFields([]);
    this.setTimestamps(false);
    this.setSoftDelete(false);
  }
}

module.exports = Model;
