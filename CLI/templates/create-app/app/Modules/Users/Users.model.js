const Model = require('../../Config/Model');

class UsersModel extends Model {
  constructor(connection = 'default') {
    super(connection);
    this.setTable('users');
    this.setPrimaryKey('id');
    this.setAllowedFields(['id', 'username', 'fullname', 'email', 'password']);
    this.setTimestamps(true);
    this.setSoftDelete(false);
  }
}

module.exports = UsersModel;
